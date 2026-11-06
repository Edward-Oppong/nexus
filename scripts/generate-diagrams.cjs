const { createCanvas } = require('@napi-rs/canvas');
const { writeFileSync } = require('fs');
const { join } = require('path');

const OUT_DIR = 'c:/Users/user/Desktop/nexus/docs/assets';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGRAM 1: SYSTEM ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────
function generateArchitectureDiagram() {
  const width = 1600;
  const height = 980;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#080D1A';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid lines
  ctx.strokeStyle = '#131F37';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Header Title Banner
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, 40, 30, width - 80, 80, 10);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('NEXUS CLINICAL WORKSTATION — SYSTEM ARCHITECTURE', 65, 72);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px sans-serif';
  ctx.fillText('Autonomous Evidence-Grounded CDS · Dual-Engine Architecture · Deterministic Safety Guardrails', 65, 96);

  // 4 Main Architecture Tiers
  const tiers = [
    {
      title: 'TIER 1: CLINICAL PRESENTATION & WORKSTATION SHELL (REACT 19 + VITE)',
      color: '#38BDF8',
      x: 40,
      y: 135,
      w: width - 80,
      h: 155,
      components: [
        { name: 'Global Nav & HUD', sub: 'Station Status · Theme Mode · Persona Context', x: 65, y: 180, w: 340, h: 85 },
        { name: 'Persistent Case Header', sub: 'Telemetry Vitals Chip Preview · Fast Triage · Action Bar', x: 430, y: 180, w: 360, h: 85 },
        { name: '3-Zone Clinical Workspace', sub: '12 Deep Specialty Tabs (Findings, Decision, Rules, Timeline)', x: 815, y: 180, w: 380, h: 85 },
        { name: 'Nexus Intelligence Rail', sub: '6 Real-Time Advisory Panels · Collapsible Flight Deck', x: 1220, y: 180, w: 315, h: 85 },
      ]
    },
    {
      title: 'TIER 2: CLINICAL REASONING ORCHESTRATION & REASONING ENGINE',
      color: '#818CF8',
      x: 40,
      y: 315,
      w: width - 80,
      h: 165,
      components: [
        { name: 'Case Assessment Orchestrator', sub: 'Synthesizes Findings, Gaps & Safety State', x: 65, y: 360, w: 340, h: 95 },
        { name: 'Multi-LLM Hybrid Cascade', sub: 'Primary: Gemini 3.5 · Groq Llama/Qwen · HF BioMistral', x: 430, y: 360, w: 360, h: 95 },
        { name: 'Deterministic Rule Engine', sub: '18 Non-Negotiable System Rules · Zero Automation Bias', x: 815, y: 360, w: 380, h: 95 },
        { name: 'Contradiction Detector', sub: 'Cross-Finding Conflicts · Vitals vs Labs Inconsistencies', x: 1220, y: 360, w: 315, h: 95 },
      ]
    },
    {
      title: 'TIER 3: EVIDENCE HARVESTING, LITERATURE RETRIEVAL & FHIR INGESTION',
      color: '#34D399',
      x: 40,
      y: 505,
      w: width - 80,
      h: 165,
      components: [
        { name: 'Live PubMed / Europe PMC API', sub: 'Real-Time Medical Literature Search & PMID Citations', x: 65, y: 550, w: 340, h: 95 },
        { name: 'OCR & Document Reconstruction', sub: 'Multi-Modal Ingestion · Image/PDF Extraction · Provenance', x: 430, y: 550, w: 360, h: 95 },
        { name: 'FHIR R4 Interoperability', sub: 'Resource Bundling · Patient, Observation, DiagnosticReport', x: 815, y: 550, w: 380, h: 95 },
        { name: 'Clinical Knowledge Bases', sub: 'Local Guidelines (ATS/IDSA, ESC, Sepsis-3, Wells Score)', x: 1220, y: 550, w: 315, h: 95 },
      ]
    },
    {
      title: 'TIER 4: SAFETY GUARDRAILS, AUDIT TRAILS & PERSISTENCE LAYER',
      color: '#F87171',
      x: 40,
      y: 695,
      w: width - 80,
      h: 165,
      components: [
        { name: 'Safety Guardrails Engine', sub: 'Blocking CDS Interrupts · Drug-Drug & Anaphylaxis Alerts', x: 65, y: 740, w: 340, h: 95 },
        { name: 'Adversarial Isolation Shield', sub: 'Cross-Case Contamination & Negation Leak Prevention', x: 430, y: 740, w: 360, h: 95 },
        { name: 'Real-Time Collaboration', sub: 'Conflict-Free State Sync · Presence Indicators', x: 815, y: 740, w: 380, h: 95 },
        { name: 'IndexedDB & LocalStore Audit Log', sub: 'Offline-First Sync Engine · Immutable Action Timeline', x: 1220, y: 740, w: 315, h: 95 },
      ]
    }
  ];

  tiers.forEach((tier) => {
    // Outer Box
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, tier.x, tier.y, tier.w, tier.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tier Label
    ctx.fillStyle = tier.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(tier.title, tier.x + 20, tier.y + 26);

    // Component cards
    tier.components.forEach((c) => {
      ctx.fillStyle = '#182234';
      roundRect(ctx, c.x, c.y, c.w, c.h, 6);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top colored indicator line
      ctx.fillStyle = tier.color;
      roundRect(ctx, c.x, c.y, c.w, 3, 2);
      ctx.fill();

      // Card Title
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(c.name, c.x + 14, c.y + 30);

      // Card Subtitle
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px sans-serif';
      ctx.fillText(c.sub, c.x + 14, c.y + 55);
    });
  });

  // Footer metadata
  ctx.fillStyle = '#64748B';
  ctx.font = '12px sans-serif';
  ctx.fillText('NEXUS CLINICAL ARCHITECTURE v0.5.0 · PRODUCTION RUNTIME VERIFIED · 100% ADVERSARIAL PASS RATE', 45, 915);
  ctx.fillText('DESIGN SYSTEM: HIGH-CONTRAST CLINICAL TOKENS (LIGHT/DARK/SYSTEM)', width - 530, 915);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(OUT_DIR, 'nexus-system-architecture.png'), buffer);
  console.log('Saved: nexus-system-architecture.png');
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGRAM 2: CLINICAL DECISION-MAKING WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────
function generateWorkflowDiagram() {
  const width = 1600;
  const height = 980;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#080D1A';
  ctx.fillRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = '#131F37';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Header Title Banner
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, 40, 30, width - 80, 80, 10);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('NEXUS CLINICAL DECISION-MAKING WORKFLOW', 65, 72);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px sans-serif';
  ctx.fillText('End-to-End Physician Flight Deck Workflow from Case Intake to Formally Authorized Clinical Decision', 65, 96);

  // Workflow Stages (Horizontal sequence)
  const steps = [
    {
      num: '01',
      title: 'PATIENT INTAKE & TRIAGE',
      color: '#38BDF8',
      x: 40,
      y: 140,
      w: 280,
      h: 680,
      items: [
        { label: 'Patient Identification', desc: 'Secure synthetic identifier, encounter # & demographic validation' },
        { label: 'Vital Signs Telemetry', desc: 'Real-time telemetry intake (HR, BP, SpO2, Temp, RR) with ESI acuity' },
        { label: 'Chief Complaint & HPI', desc: 'Narrative intake recorded with chronological symptom onset tracking' },
        { label: 'Allergy & Med Screening', desc: 'Immediate baseline check against known anaphylactic contraindications' },
      ]
    },
    {
      num: '02',
      title: 'FINDINGS & RECONSTRUCTION',
      color: '#818CF8',
      x: 350,
      y: 140,
      w: 280,
      h: 680,
      items: [
        { label: 'Document & OCR Upload', desc: 'Multi-page clinical reports, laboratory printouts & imaging scans' },
        { label: 'Discrete Fact Extraction', desc: 'AI extracts candidate symptoms, physical signs & abnormal values' },
        { label: 'Provenance Audit Trail', desc: 'Source document anchor, timestamp, model ID & clinician verification' },
        { label: 'In-Rail Quick Review Queue', desc: 'Single-click Accept / Edit / Reject directly within the rail' },
      ]
    },
    {
      num: '03',
      title: 'INTELLIGENCE & REASONING',
      color: '#FBBF24',
      x: 660,
      y: 140,
      w: 280,
      h: 680,
      items: [
        { label: 'Differential Generation', desc: 'Multi-LLM cascade generates grounded candidate diagnoses' },
        { label: '3-Way Grounding Check', desc: 'Strict verification: each hypothesis mapped to supporting/opposing findings' },
        { label: 'Live PubMed Retrieval', desc: 'Queries Europe PMC / PubMed for live peer-reviewed evidence & PMIDs' },
        { label: 'Contradiction Detection', desc: 'Automated flags for physiological discrepancies & medication conflicts' },
      ]
    },
    {
      num: '04',
      title: 'CDS RULES & SAFETY INTERRUPT',
      color: '#F87171',
      x: 970,
      y: 140,
      w: 280,
      h: 680,
      items: [
        { label: '18 Non-Negotiable Rules', desc: 'Deterministic medical logic: Wells, PERC, CURB-65, Sepsis-3 gates' },
        { label: 'Adversarial Validation', desc: 'Cross-case isolation filter prevents phantom data bleed' },
        { label: 'Hard Blocking Interrupts', desc: 'SAFETY_CRITICAL concerns halt authorization until resolved' },
        { label: 'Formal Resolution Modal', desc: 'Mandatory clinical justification entered before decision override' },
      ]
    },
    {
      num: '05',
      title: 'DECISION & AUDIT TRAIL',
      color: '#34D399',
      x: 1280,
      y: 140,
      w: 280,
      h: 680,
      items: [
        { label: 'Candidate Adjudication', desc: 'Clinician explicitly accepts or excludes differential candidates' },
        { label: 'Formal Decision Note', desc: 'Primary diagnosis, rationale, diagnostic plan & consultation orders' },
        { label: 'Immutable Audit Seal', desc: 'Authorizing clinician identity, role, timestamp & SHA signature' },
        { label: 'Chronological Timeline', desc: 'Human vs Autonomous AI event distinction preserved permanently' },
      ]
    }
  ];

  steps.forEach((step, idx) => {
    // Stage container
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, step.x, step.y, step.w, step.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stage Top Color Stripe
    ctx.fillStyle = step.color;
    roundRect(ctx, step.x, step.y, step.w, 4, 2);
    ctx.fill();

    // Stage Number
    ctx.fillStyle = step.color;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(step.num, step.x + 20, step.y + 36);

    // Stage Title
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(step.title, step.x + 55, step.y + 34);

    // Items inside stage
    step.items.forEach((item, iIdx) => {
      const itemY = step.y + 65 + iIdx * 148;
      ctx.fillStyle = '#182234';
      roundRect(ctx, step.x + 14, itemY, step.w - 28, 134, 6);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Step bullet
      ctx.fillStyle = step.color;
      ctx.beginPath();
      ctx.arc(step.x + 30, itemY + 28, 5, 0, Math.PI * 2);
      ctx.fill();

      // Item label
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(item.label, step.x + 44, itemY + 32);

      // Item description
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px sans-serif';
      
      // Wrap description text
      const words = item.desc.split(' ');
      let line = '';
      let lineY = itemY + 58;
      for (const w of words) {
        const testLine = line + w + ' ';
        if (ctx.measureText(testLine).width > step.w - 56) {
          ctx.fillText(line, step.x + 24, lineY);
          line = w + ' ';
          lineY += 18;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, step.x + 24, lineY);
    });

    // Connecting Arrow (if not last step)
    if (idx < steps.length - 1) {
      const arrowX = step.x + step.w + 6;
      const arrowY = step.y + step.h / 2;
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - 10);
      ctx.lineTo(arrowX + 18, arrowY);
      ctx.lineTo(arrowX, arrowY + 10);
      ctx.closePath();
      ctx.fill();
    }
  });

  // Footer metadata
  ctx.fillStyle = '#64748B';
  ctx.font = '12px sans-serif';
  ctx.fillText('NEXUS CLINICAL WORKFLOW v0.5.0 · CLINICIAN-IN-THE-LOOP CONTROL MODEL · ZERO AUTOMATION BIAS', 45, 870);
  ctx.fillText('FHIR R4 COMPATIBLE · PROVENANCE TRACKED AT OBSERVATION LEVEL', width - 530, 870);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(OUT_DIR, 'nexus-clinical-workflow.png'), buffer);
  console.log('Saved: nexus-clinical-workflow.png');
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGRAM 3: WORKSTATION UI FLIGHT DECK LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
function generateWorkstationLayoutDiagram() {
  const width = 1600;
  const height = 980;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#080D1A';
  ctx.fillRect(0, 0, width, height);

  // Header Title Banner
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, 40, 30, width - 80, 80, 10);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('NEXUS WORKSTATION UI — 3-ZONE CLINICAL FLIGHT DECK LAYOUT', 65, 72);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px sans-serif';
  ctx.fillText('Information Architecture, Layout Zones, Persistent Header & Intelligence Rail Specifications', 65, 96);

  // 3-Zone Blueprint Frame
  const frameX = 40;
  const frameY = 135;
  const frameW = width - 80;
  const frameH = 750;

  // Outer Workspace Window
  ctx.fillStyle = '#0B1120';
  roundRect(ctx, frameX, frameY, frameW, frameH, 8);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  // Zone 1: Navigation Sidebar (Left)
  const navW = 220;
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, frameX, frameY, navW, frameH, 8);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  // Zone 1 Header
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('ZONE 1: GLOBAL NAV', frameX + 20, frameY + 36);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px sans-serif';
  ctx.fillText('Width: 220px (or 64px collapsed)', frameX + 20, frameY + 56);

  const navItems = [
    '• Station HUD / Overview',
    '• Patient Case Registry',
    '• Review Queue (14 Pending)',
    '• AI Governance & Audit',
    '• Regulatory Compliance',
    '• System Settings & LLMs',
    '──────────────',
    'Active Persona: Dr. Marcus',
    'Role: Attending Physician',
    '──────────────',
    'Theme Mode: Light/Dark/Auto',
    'Offline Sync: Operational',
  ];
  navItems.forEach((text, i) => {
    ctx.fillStyle = text.startsWith('•') ? '#F8FAFC' : text.startsWith('──') ? '#334155' : '#38BDF8';
    ctx.font = text.startsWith('Active') ? 'bold 11px sans-serif' : '11px sans-serif';
    ctx.fillText(text, frameX + 20, frameY + 95 + i * 28);
  });

  // Zone 2: Main Active Case Workspace (Center)
  const mainX = frameX + navW + 12;
  const mainW = frameW - navW - 360 - 24;
  
  // Persistent Case Header (Top of Zone 2)
  const headerH = 130;
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, mainX, frameY, mainW, headerH, 6);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('PERSISTENT CASE HEADER (ZONE 2 TOP)', mainX + 20, frameY + 32);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('CASE #48102 — SARAH J. CHEN, 24F', mainX + 20, frameY + 62);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.fillText('CC: Right lower quadrant abdominal pain with low-grade fever · ESI Acuity Level 2 (Urgent)', mainX + 20, headerH + frameY - 45);

  // Vitals Pill Strip
  const vitalsText = 'HR: 104 bpm (High)  |  BP: 118/76 mmHg  |  SpO2: 99%  |  Temp: 38.2°C (Fever)  |  RR: 18/min';
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(vitalsText, mainX + 20, headerH + frameY - 20);

  // Case Subtab Bar
  const tabY = frameY + headerH + 10;
  const tabH = 40;
  ctx.fillStyle = '#182234';
  roundRect(ctx, mainX, tabY, mainW, tabH, 4);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  const tabs = ['Summary', 'Findings (11)', 'Decision', 'Investigations (4)', 'Reasoning', 'Rules (18)', 'Timeline', 'Safety (1)'];
  tabs.forEach((tab, i) => {
    ctx.fillStyle = i === 1 ? '#38BDF8' : '#94A3B8';
    ctx.font = i === 1 ? 'bold 11px sans-serif' : '11px sans-serif';
    ctx.fillText(tab, mainX + 16 + i * 105, tabY + 25);
  });

  // Active Tab View Canvas (Center)
  const viewY = tabY + tabH + 10;
  const viewH = frameH - headerH - tabH - 30;
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, mainX, viewY, mainW, viewH, 6);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('ACTIVE TAB VIEW: CLINICAL FINDINGS & OBSERVATIONS TABLE', mainX + 20, viewY + 35);

  // Mock table rows
  const mockFindings = [
    { name: 'Right lower quadrant abdominal tenderness with localized guarding', cat: 'SIGN', prov: 'HUMAN_ENTERED', stat: 'VERIFIED' },
    { name: 'Low-grade fever 38.2°C documented on presentation', cat: 'VITAL', prov: 'HUMAN_ENTERED', stat: 'VERIFIED' },
    { name: 'Leukocytosis: WBC 14.8 x10^9/L with neutrophil predominance (82%)', cat: 'LAB', prov: 'AI_EXTRACTED', stat: 'VERIFIED' },
    { name: 'Ultrasound: 8.2mm non-compressible blind-ending tubular structure', cat: 'IMAGING', prov: 'AI_EXTRACTED', stat: 'VERIFIED' },
    { name: 'Denies chest pain, dyspnoea, urinary urgency, or vaginal discharge', cat: 'HISTORY', prov: 'HUMAN_ENTERED', stat: 'VERIFIED' },
    { name: 'Prior appendectomy reported in family narrative (Disputed by US)', cat: 'HISTORY', prov: 'AI_EXTRACTED', stat: 'REJECTED' },
  ];

  mockFindings.forEach((f, idx) => {
    const rowY = viewY + 65 + idx * 56;
    ctx.fillStyle = idx % 2 === 0 ? '#182234' : '#141D2E';
    roundRect(ctx, mainX + 16, rowY, mainW - 32, 48, 4);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '12px sans-serif';
    ctx.fillText(f.name, mainX + 28, rowY + 28);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '10px monospace';
    ctx.fillText(f.cat, mainX + mainW - 270, rowY + 28);

    ctx.fillStyle = f.stat === 'VERIFIED' ? '#34D399' : '#F87171';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(f.stat, mainX + mainW - 130, rowY + 28);
  });

  // Zone 3: Nexus Intelligence Rail (Right)
  const railX = mainX + mainW + 12;
  const railW = 345;
  ctx.fillStyle = '#0F172A';
  roundRect(ctx, railX, frameY, railW, frameH, 8);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.stroke();

  ctx.fillStyle = '#818CF8';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('ZONE 3: INTELLIGENCE RAIL', railX + 20, frameY + 36);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px sans-serif';
  ctx.fillText('6 Core Functions · Flight Deck Co-Pilot', railX + 20, frameY + 56);

  const railPanels = [
    { title: '1. NEXUS ASSESSMENT', detail: 'High-confidence differential: Acute Appendicitis (0.94) vs Mesenteric Adenitis (0.42)', color: '#34D399' },
    { title: '2. CANDIDATE HYPOTHESES', detail: 'Primary consideration supported by 5 verified findings; 0 contradictions', color: '#38BDF8' },
    { title: '3. LIVE EVIDENCE CITATIONS', detail: '3 peer-reviewed PubMed citations linked (PMID: 32810534, 31735742)', color: '#818CF8' },
    { title: '4. UNCERTAINTY & GAPS', detail: 'State: CONDITIONED ON PENDING. Urine beta-hCG test pending result', color: '#FBBF24' },
    { title: '5. IN-RAIL REVIEW QUEUE', detail: 'All AI-extracted findings audited and approved by attending', color: '#34D399' },
    { title: '6. ASK NEXUS CO-PILOT', detail: 'Case-contextual synthesis: Gemini 3.5 / Groq live grounding chat', color: '#38BDF8' },
  ];

  railPanels.forEach((p, idx) => {
    const pY = frameY + 80 + idx * 105;
    ctx.fillStyle = '#182234';
    roundRect(ctx, railX + 16, pY, railW - 32, 95, 6);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.fillStyle = p.color;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(p.title, railX + 28, pY + 26);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '11px sans-serif';
    const words = p.detail.split(' ');
    let line = '';
    let lineY = pY + 48;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > railW - 65) {
        ctx.fillText(line, railX + 28, lineY);
        line = w + ' ';
        lineY += 16;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, railX + 28, lineY);
  });

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(OUT_DIR, 'nexus-workstation-layout.png'), buffer);
  console.log('Saved: nexus-workstation-layout.png');
}

generateArchitectureDiagram();
generateWorkflowDiagram();
generateWorkstationLayoutDiagram();
