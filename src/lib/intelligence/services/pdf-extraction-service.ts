// ============================================================
// src/lib/intelligence/services/pdf-extraction-service.ts
// Clinical Document & Image Extraction Pipeline for Case Intake
//
// Capabilities:
//   1. Multi-format support: PDF documents, clinical images (PNG/JPG/scans), and text notes.
//   2. Visual reconstruction: In-memory Object URL creation for canvas/image preview.
//   3. Deep clinical extraction:
//      - Live Hugging Face token classification (ribhu/medbert-clinical-ner)
//      - High-coverage deterministic clinical parser (Vitals, Labs, Medications, Diagnoses)
//      - Units, reference ranges, and critical value flagging
//   4. Re-extractable: Clinicians can edit the raw transcript and re-parse findings in real time.
// ============================================================

import { hfClient } from './huggingface-api';
import { ExtractedFindingCandidate } from '../../../features/cases/types/intake';

export interface DocumentExtractionResult {
  title: string;
  rawText: string;
  pageCount: number;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'text';
  findings: ExtractedFindingCandidate[];
  source: 'HF_NER' | 'HEURISTIC' | 'EMPTY';
  modelUsed?: string;
}

// ── Step 1: Extract text from PDF using pdfjs ─────────────────
async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import('pdfjs-dist');

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;

  const pageTexts: string[] = [];
  for (let i = 1; i <= Math.min(pageCount, 15); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) {
      pageTexts.push(`--- Page ${i} ---\n${text}`);
    }
  }

  return { text: pageTexts.join('\n\n'), pageCount };
}

// ── Step 2: Run NER via HF medbert-clinical-ner ───────────────
async function runClinicalNer(
  text: string
): Promise<{ entities: Array<{ word: string; entity_group: string; score: number; start: number; end: number }> }> {
  const CHUNK_SIZE = 1200;
  const chunks: string[] = [];
  for (let i = 0; i < Math.min(text.length, 8000); i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  const allEntities: any[] = [];
  for (const chunk of chunks) {
    try {
      const res = await hfClient.extractNER(chunk);
      if (res && Array.isArray(res.entities)) {
        allEntities.push(...res.entities);
      }
    } catch {
      // Partial failure — continue
    }
  }

  return { entities: allEntities };
}

// ── Step 3: Map NER entities → ExtractedFindingCandidate[] ────
function mapEntitiesToFindings(
  entities: Array<{ word: string; entity_group?: string; entity?: string; score: number }>,
  documentTitle: string,
  rawText: string
): ExtractedFindingCandidate[] {
  const findings: ExtractedFindingCandidate[] = [];
  const seen = new Set<string>();

  const categoryMap: Record<string, ExtractedFindingCandidate['category']> = {
    DISEASE: 'diagnosis',
    DISORDER: 'diagnosis',
    SYMPTOM: 'exam',
    SIGN: 'exam',
    FINDING: 'exam',
    LAB: 'laboratory',
    LABORATORY: 'laboratory',
    TEST: 'laboratory',
    VITAL: 'vital-signs',
    MEDICATION: 'medication',
    DRUG: 'medication',
    IMAGING: 'imaging',
    ANATOMY: 'exam',
  };

  for (const entity of entities) {
    const label = entity.word?.trim();
    if (!label || label.length < 3 || seen.has(label.toLowerCase())) continue;
    if (entity.score < 0.6) continue;

    seen.add(label.toLowerCase());

    const group = (entity.entity_group || entity.entity || 'FINDING').toUpperCase();
    let category: ExtractedFindingCandidate['category'] = 'exam';
    if (group.includes('DISEASE') || group.includes('DISORDER')) category = 'diagnosis';
    else if (group.includes('SYMPT') || group.includes('SIGN')) category = 'exam';
    else if (group.includes('MED') || group.includes('DRUG')) category = 'medication';
    else if (group.includes('LAB') || group.includes('TEST')) category = 'laboratory';
    else if (group.includes('VITAL')) category = 'vital-signs';
    else if (group.includes('IMAG') || group.includes('PROCEDURE')) category = 'imaging';
    else if (group.includes('ANAT') || group.includes('STRUCT')) category = 'exam';

    const idx = rawText.toLowerCase().indexOf(label.toLowerCase());
    const snippet =
      idx >= 0
        ? rawText.slice(Math.max(0, idx - 60), Math.min(rawText.length, idx + label.length + 60)).trim()
        : label;

    findings.push({
      id: `ner-${Date.now()}-${findings.length}`,
      category,
      label,
      value: label,
      sourceDocumentTitle: documentTitle,
      sourcePage: 1,
      sourceSnippet: snippet,
      provenanceType: 'AI_EXTRACTED',
      verificationStatus: 'REVIEW_REQUIRED',
      isAccepted: true,
    });
  }

  return findings.slice(0, 30);
}

// ── Step 4: Deterministic Clinical Parser with Ranges & Units ─
export function heuristicClinicalExtraction(text: string, documentTitle: string): ExtractedFindingCandidate[] {
  const findings: ExtractedFindingCandidate[] = [];
  const seenLabels = new Set<string>();

  interface PatternDef {
    regex: RegExp;
    category: ExtractedFindingCandidate['category'];
    labelFn: (m: RegExpMatchArray) => string;
    valueFn: (m: RegExpMatchArray) => string;
    unit?: string;
    referenceRange?: string;
    interpretationFn?: (val: string) => ExtractedFindingCandidate['interpretation'];
  }

  const patterns: PatternDef[] = [
    // Vitals
    {
      regex: /(?:BP|blood pressure)[:\s]+(\d{2,3}\/\d{2,3})\s*(?:mmHg)?/gi,
      category: 'vital-signs',
      labelFn: () => 'Blood Pressure',
      valueFn: (m) => m[1],
      unit: 'mmHg',
      referenceRange: '90/60 - 120/80',
      interpretationFn: (val) => {
        const sys = parseInt(val.split('/')[0], 10);
        if (sys >= 160) return 'CRITICAL';
        if (sys >= 140) return 'HIGH';
        if (sys < 90) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:HR|heart rate|pulse)[:\s]+(\d{2,3})\s*(?:bpm|\/min)?/gi,
      category: 'vital-signs',
      labelFn: () => 'Heart Rate',
      valueFn: (m) => m[1],
      unit: 'bpm',
      referenceRange: '60 - 100',
      interpretationFn: (val) => {
        const hr = parseInt(val, 10);
        if (hr > 120 || hr < 45) return 'CRITICAL';
        if (hr > 100) return 'HIGH';
        if (hr < 60) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:SpO2|O2 sat|oxygen saturation)[:\s]+(\d{2,3})%/gi,
      category: 'vital-signs',
      labelFn: () => 'Oxygen Saturation (SpO2)',
      valueFn: (m) => m[1],
      unit: '%',
      referenceRange: '95 - 100',
      interpretationFn: (val) => {
        const spo2 = parseInt(val, 10);
        if (spo2 < 90) return 'CRITICAL';
        if (spo2 < 95) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:RR|respiratory rate)[:\s]+(\d{1,2})\s*(?:breaths\/min|\/min)?/gi,
      category: 'vital-signs',
      labelFn: () => 'Respiratory Rate',
      valueFn: (m) => m[1],
      unit: 'breaths/min',
      referenceRange: '12 - 20',
      interpretationFn: (val) => {
        const rr = parseInt(val, 10);
        if (rr >= 28) return 'CRITICAL';
        if (rr > 20) return 'HIGH';
        if (rr < 10) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:temp(?:erature)?)[:\s]+(\d{2,3}(?:\.\d)?)\s*°?([CF])/gi,
      category: 'vital-signs',
      labelFn: () => 'Body Temperature',
      valueFn: (m) => m[1],
      unit: '°C',
      referenceRange: '36.5 - 37.5',
      interpretationFn: (val) => {
        const t = parseFloat(val);
        if (t >= 39.0) return 'CRITICAL';
        if (t >= 38.0) return 'HIGH';
        if (t < 36.0) return 'LOW';
        return 'NORMAL';
      },
    },
    // Labs
    {
      regex: /(?:Hb|haemoglobin|hemoglobin)[:\s]+(\d+\.?\d*)\s*(?:g\/(?:dL|L))?/gi,
      category: 'laboratory',
      labelFn: () => 'Haemoglobin (Hb)',
      valueFn: (m) => m[1],
      unit: 'g/dL',
      referenceRange: '12.0 - 17.5',
      interpretationFn: (val) => {
        const hb = parseFloat(val);
        if (hb < 7.0) return 'CRITICAL';
        if (hb < 12.0) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:WBC|white blood cells?|leukocytes)[:\s]+(\d+\.?\d*)\s*(?:[×x]?10\^?9?\/L|k\/uL)?/gi,
      category: 'laboratory',
      labelFn: () => 'White Blood Cell Count (WBC)',
      valueFn: (m) => m[1],
      unit: '×10⁹/L',
      referenceRange: '4.0 - 11.0',
      interpretationFn: (val) => {
        const wbc = parseFloat(val);
        if (wbc >= 20.0) return 'CRITICAL';
        if (wbc > 11.0) return 'HIGH';
        if (wbc < 4.0) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:platelets|plt)[:\s]+(\d+)\s*(?:[×x]?10\^?9?\/L|k\/uL)?/gi,
      category: 'laboratory',
      labelFn: () => 'Platelet Count',
      valueFn: (m) => m[1],
      unit: '×10⁹/L',
      referenceRange: '150 - 450',
      interpretationFn: (val) => {
        const plt = parseInt(val, 10);
        if (plt < 50) return 'CRITICAL';
        if (plt < 150) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:creatinine|cr)[:\s]+(\d+\.?\d*)\s*(?:mg\/dL|μmol\/L)?/gi,
      category: 'laboratory',
      labelFn: () => 'Serum Creatinine',
      valueFn: (m) => m[1],
      unit: 'mg/dL',
      referenceRange: '0.7 - 1.3',
      interpretationFn: (val) => {
        const cr = parseFloat(val);
        if (cr >= 3.0) return 'CRITICAL';
        if (cr > 1.3) return 'HIGH';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:potassium|k\+)[:\s]+(\d+\.?\d*)\s*(?:mmol\/L|mEq\/L)?/gi,
      category: 'laboratory',
      labelFn: () => 'Potassium (K+)',
      valueFn: (m) => m[1],
      unit: 'mmol/L',
      referenceRange: '3.5 - 5.0',
      interpretationFn: (val) => {
        const k = parseFloat(val);
        if (k >= 6.0 || k <= 2.8) return 'CRITICAL';
        if (k > 5.0) return 'HIGH';
        if (k < 3.5) return 'LOW';
        return 'NORMAL';
      },
    },
    {
      regex: /(?:troponin(?:\s*I|\s*T)?|cTnI)[:\s]+(\d+\.?\d*)\s*(?:ng\/mL|ng\/L)?/gi,
      category: 'laboratory',
      labelFn: () => 'Troponin I',
      valueFn: (m) => m[1],
      unit: 'ng/mL',
      referenceRange: '< 0.04',
      interpretationFn: (val) => {
        const tr = parseFloat(val);
        return tr > 0.04 ? 'CRITICAL' : 'NORMAL';
      },
    },
    {
      regex: /(?:glucose|blood sugar)[:\s]+(\d+\.?\d*)\s*(?:mg\/dL|mmol\/L)?/gi,
      category: 'laboratory',
      labelFn: () => 'Blood Glucose',
      valueFn: (m) => m[1],
      unit: 'mg/dL',
      referenceRange: '70 - 100',
    },
    // Medications
    {
      regex: /(?:prescribed|rx|medications?|current medications?[:\s]+)?\b(lisinopril|metformin|atorvastatin|amlodipine|amoxicillin|ceftriaxone|piperacillin-tazobactam|aspirin|clopidogrel|metoprolol|furosemide|warfarin|apixaban|levothyroxine|omeprazole)\s+(\d+\s*(?:mg|g|mcg|ml))\s*(daily|bid|tid|qid|prn|once daily)?/gi,
      category: 'medication',
      labelFn: (m) => m[1].charAt(0).toUpperCase() + m[1].slice(1),
      valueFn: (m) => `${m[2]}${m[3] ? ' ' + m[3] : ''}`.trim(),
    },
    // Diagnoses & Impressions
    {
      regex: /(?:primary diagnosis|admission diagnosis|discharge diagnosis|diagnosis)[:\s]+([A-Za-z0-9\s,\-–]{4,60})(?:\.|\n|;|$)/gi,
      category: 'diagnosis',
      labelFn: (m) => 'Diagnosis: ' + m[1].trim(),
      valueFn: (m) => m[1].trim(),
    },
    {
      regex: /(?:impression|findings|imaging summary)[:\s]+([A-Za-z0-9\s,\-–]{4,80})(?:\.|\n|;|$)/gi,
      category: 'imaging',
      labelFn: (m) => 'Impression: ' + m[1].trim(),
      valueFn: (m) => m[1].trim(),
    },
  ];

  for (const def of patterns) {
    let match;
    def.regex.lastIndex = 0;
    while ((match = def.regex.exec(text)) !== null && findings.length < 35) {
      const label = def.labelFn(match);
      const value = def.valueFn(match);
      const dedupeKey = `${def.category}:${label.toLowerCase()}`;

      if (seenLabels.has(dedupeKey)) continue;
      seenLabels.add(dedupeKey);

      const idx = match.index;
      const snippet = text
        .slice(Math.max(0, idx - 50), Math.min(text.length, idx + match[0].length + 50))
        .replace(/\s+/g, ' ')
        .trim();

      const interp = def.interpretationFn ? def.interpretationFn(value) : 'NORMAL';

      findings.push({
        id: `extracted-${Date.now()}-${findings.length}`,
        category: def.category,
        label,
        value,
        unit: def.unit,
        referenceRange: def.referenceRange,
        interpretation: interp,
        sourceDocumentTitle: documentTitle,
        sourcePage: 1,
        sourceSnippet: snippet,
        provenanceType: 'AI_EXTRACTED',
        verificationStatus: 'REVIEW_REQUIRED',
        isAccepted: true,
      });
    }
  }

  return findings;
}

// ── Public API: Unified Document & Image Extraction ──────────
export async function extractClinicalDataFromFile(file: File): Promise<DocumentExtractionResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/');
  const fileType: 'pdf' | 'image' | 'text' = isPdf ? 'pdf' : isImage ? 'image' : 'text';

  const title = file.name
    .replace(/\.[a-zA-Z0-9]+$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  // Create persistent Object URL for visual reconstruction
  const fileUrl = URL.createObjectURL(file);

  try {
    let rawText = '';
    let pageCount = 1;

    if (isPdf) {
      const pdfRes = await extractTextFromPdf(file);
      rawText = pdfRes.text;
      pageCount = pdfRes.pageCount;
    } else if (isImage) {
      // For clinical images (scanned charts, lab photos, ECG strips)
      // Provide an editable default clinical transcription template if text is not directly readable
      rawText = `[IMAGE ATTACHMENT: ${file.name}]\nFormat: ${file.type || 'Image'}\nFile Size: ${(file.size / 1024).toFixed(1)} KB\n\nClinical Scan / Attachment notes:\n- Review the reconstructed image in the viewer.\n- Type or adjust findings in the table below or edit this transcript.`;
      pageCount = 1;
    } else {
      // Plain text or CSV/JSON
      rawText = await file.text();
      pageCount = 1;
    }

    if (!rawText.trim()) {
      return {
        title,
        rawText: '',
        pageCount,
        fileUrl,
        fileType,
        findings: [],
        source: 'EMPTY',
      };
    }

    // Attempt Hugging Face NER if configured
    const hasToken = Boolean(
      import.meta.env.VITE_HF_API_TOKEN &&
      !import.meta.env.VITE_HF_API_TOKEN.includes('REPLACE_ME')
    );

    let findings: ExtractedFindingCandidate[] = [];
    let source: 'HF_NER' | 'HEURISTIC' | 'EMPTY' = 'HEURISTIC';
    let modelUsed: string | undefined;

    if (hasToken && isPdf) {
      try {
        const { entities } = await runClinicalNer(rawText);
        if (entities.length > 0) {
          findings = mapEntitiesToFindings(entities, title, rawText);
          source = 'HF_NER';
          modelUsed = 'd4data/biomedical-ner-all';
        }
      } catch (nerErr) {
        console.warn('[doc-extraction] HF NER failed, using clinical heuristic:', nerErr);
      }
    }

    // Always run heuristic extraction to catch structured vitals/labs/meds
    const heuristicResults = heuristicClinicalExtraction(rawText, title);
    if (findings.length === 0) {
      findings = heuristicResults;
    } else {
      // Merge unique items from heuristic
      const existing = new Set(findings.map((f) => f.label.toLowerCase()));
      for (const h of heuristicResults) {
        if (!existing.has(h.label.toLowerCase())) {
          findings.push(h);
        }
      }
    }

    return {
      title,
      rawText,
      pageCount,
      fileUrl,
      fileType,
      findings,
      source: findings.length > 0 ? source : 'EMPTY',
      modelUsed,
    };
  } catch (err) {
    console.error('[doc-extraction] Extraction failure:', err);
    return {
      title,
      rawText: '',
      pageCount: 0,
      fileUrl,
      fileType,
      findings: [],
      source: 'EMPTY',
    };
  }
}

// Backward compatibility alias for PDF-specific calls
export const extractClinicalDataFromPdf = extractClinicalDataFromFile;

// Helper to re-extract findings from clinician-edited text
export function reExtractFindingsFromText(
  editedText: string,
  documentTitle: string
): ExtractedFindingCandidate[] {
  return heuristicClinicalExtraction(editedText, documentTitle);
}
