// ============================================================
// src/features/cases/services/pdf-export-service.ts
// Clinical Case Report & Nexus AI Intelligence PDF Exporter
// Generates an official, printable clinical dossier containing:
//   - Input Data: Demographics, Presentation, PMHx, Vitals, Labs, Meds, Allergies
//   - Results: ESI Triage Stratification, AI Differential Hypotheses,
//     Safety Alerts, Resuscitation Directives, and Recommendations.
// ============================================================

import { FullSyntheticCase } from '../../../data/cases/mockCasesData';
import { NexusAssessment } from '../../../domain/nexus-assessment';
import { EsiTriageEvaluation, evaluateEsiTriage } from './clinical-knowledge';

export interface CasePdfExportData {
  fullCase: FullSyntheticCase;
  assessment?: NexusAssessment | null;
  esiEvaluation?: EsiTriageEvaluation | null;
  clinicianName?: string;
  organizationName?: string;
}

export function generateCaseReportHtml({
  fullCase,
  assessment,
  esiEvaluation,
  clinicianName = 'Attending Clinician',
  organizationName = 'Nexus Acute Health System',
}: CasePdfExportData): string {
  const patient = fullCase.overview.patient;
  const now = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Calculate ESI triage if not passed
  const esi =
    esiEvaluation ||
    evaluateEsiTriage({
      presentation: {
        title: fullCase.chiefComplaint,
        historyOfPresentIllness: fullCase.historyOfPresentIllness,
        pastMedicalHistory: fullCase.pastMedicalHistory.join('\n'),
      },
      observations: fullCase.findings.map((f) => ({
        display: f.label,
        value: f.description || '',
      })),
      patientDemographics: {
        ageYears: patient.age,
        administrativeSex:
          patient.gender === 'Female' ? 'FEMALE' : patient.gender === 'Male' ? 'MALE' : 'OTHER',
      },
    });

  const activeAssessment = assessment || fullCase.nexusAssessment;

  // Build HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Nexus Clinical Report — ${patient.syntheticIdentifier} (${fullCase.overview.id})</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 16mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: var(--text-primary);
      background: var(--bg-surface);
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid var(--accent-primary);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-title {
      font-size: 18pt;
      font-weight: 800;
      color: var(--accent-primary);
      letter-spacing: -0.02em;
      margin: 0;
    }
    .header-sub {
      font-size: 9pt;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-esi1 { background-color: var(--status-danger); color: var(--bg-surface); }
    .badge-esi2 { background-color: #EA580C; color: var(--bg-surface); }
    .badge-esi3 { background-color: #EAB308; color: #000000; }
    .badge-esi4 { background-color: var(--accent-primary); color: var(--bg-surface); }
    .badge-esi5 { background-color: var(--status-success); color: var(--bg-surface); }
    .badge-urgent { background-color: var(--danger-subtle); color: var(--status-danger); border: 1px solid var(--danger-border); }
    .badge-supported { background-color: var(--success-subtle); color: var(--status-success); border: 1px solid var(--success-border); }
    .badge-uncertain { background-color: var(--warning-subtle); color: var(--status-warning); border: 1px solid var(--warning-border); }
    .badge-contradicted { background-color: var(--danger-subtle); color: var(--status-danger); border: 1px solid var(--danger-border); }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-medium);
      padding-bottom: 4px;
      margin: 18px 0 8px 0;
    }
    .info-grid {
      display: table;
      width: 100%;
      margin-bottom: 12px;
    }
    .info-row {
      display: table-row;
    }
    .info-cell {
      display: table-cell;
      padding: 3px 8px 3px 0;
      font-size: 10pt;
    }
    .info-label {
      font-weight: 600;
      color: var(--text-secondary);
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9.5pt;
    }
    table.data-table th {
      background-color: var(--bg-subtle);
      color: var(--text-secondary);
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid var(--border-subtle);
    }
    table.data-table td {
      padding: 6px 8px;
      border: 1px solid var(--border-subtle);
      vertical-align: top;
    }
    .alert-box {
      padding: 10px 12px;
      border-radius: 6px;
      margin: 8px 0;
      font-size: 9.5pt;
    }
    .alert-danger {
      background-color: var(--danger-subtle);
      border: 1px solid var(--danger-border);
      color: var(--status-danger);
    }
    .alert-warning {
      background-color: var(--warning-subtle);
      border: 1px solid var(--status-warning);
      color: var(--status-warning);
    }
    .alert-esi {
      background-color: var(--bg-subtle);
      border: 2px solid ${esi.badgeColor};
      border-left-width: 6px;
    }
    .page-break {
      page-break-before: always;
    }
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid var(--border-subtle);
      font-size: 8pt;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- Top Banner / Hospital Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top;">
        <h1 class="header-title">${organizationName}</h1>
        <div class="header-sub">Nexus Clinical Intelligence Platform · Comprehensive Case Dossier</div>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <div style="font-size: 11pt; font-weight: 700; color: var(--text-primary);">CASE: ${fullCase.overview.id}</div>
        <div style="font-size: 8.5pt; color: var(--text-muted);">Generated: ${now}</div>
        <div style="font-size: 8.5pt; color: var(--text-muted);">Clinician: ${clinicianName}</div>
      </td>
    </tr>
  </table>

  <!-- Patient & Encounter Demographics -->
  <div class="section-title">1. Patient Identification & Encounter Profile</div>
  <table class="info-grid">
    <tr class="info-row">
      <td class="info-cell"><span class="info-label">Patient Name:</span> <strong>${patient.syntheticIdentifier}</strong></td>
      <td class="info-cell"><span class="info-label">Age / Sex:</span> ${patient.age} years · ${patient.gender}</td>
      <td class="info-cell"><span class="info-label">Encounter:</span> ${patient.encounterNumber} (${patient.encounterType})</td>
    </tr>
    <tr class="info-row">
      <td class="info-cell"><span class="info-label">Triage Priority:</span> <span class="badge badge-urgent">${fullCase.overview.priority.toUpperCase()}</span></td>
      <td class="info-cell"><span class="info-label">Clinical State:</span> ${fullCase.overview.state}</td>
      <td class="info-cell"><span class="info-label">Documented Allergies:</span> ${patient.allergies.length > 0 ? patient.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ') : 'None documented (NKDA)'}</td>
    </tr>
  </table>

  <!-- Presentation & Clinical History -->
  <div class="section-title">2. Clinical Presentation & Intake History</div>
  <div style="margin-bottom: 8px;">
    <strong>Chief Complaint / Presenting Problem:</strong><br />
    <div style="padding: 6px 10px; background: var(--bg-subtle); border-left: 3px solid var(--accent-primary); margin-top: 4px; font-weight: 600;">
      ${fullCase.chiefComplaint || 'None documented'}
    </div>
  </div>

  ${fullCase.historyOfPresentIllness ? `
  <div style="margin-bottom: 8px;">
    <strong>History of Present Illness (HPI):</strong><br />
    <div style="padding: 6px 10px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: 4px; margin-top: 4px; font-size: 9.5pt;">
      ${fullCase.historyOfPresentIllness}
    </div>
  </div>
  ` : ''}

  <div class="info-grid">
    <div class="info-row">
      <div class="info-cell" style="width: 50%;">
        <strong>Past Medical History:</strong><br />
        ${fullCase.pastMedicalHistory.length > 0
          ? `<ul style="margin: 4px 0 0 16px; padding: 0; font-size: 9.5pt;">${fullCase.pastMedicalHistory.map((pmh) => `<li>${pmh}</li>`).join('')}</ul>`
          : '<span style="font-size: 9.5pt; color: var(--text-muted);">None documented</span>'}
      </div>
      <div class="info-cell" style="width: 50%;">
        <strong>Active Pharmacotherapy:</strong><br />
        ${patient.medications.length > 0
          ? `<ul style="margin: 4px 0 0 16px; padding: 0; font-size: 9.5pt;">${patient.medications.map((m) => `<li>${m.name} ${m.dosage || ''} ${m.frequency || ''}</li>`).join('')}</ul>`
          : '<span style="font-size: 9.5pt; color: var(--text-muted);">No medications on file</span>'}
      </div>
    </div>
  </div>

  <!-- Bedside Vital Signs & Observations -->
  <div class="section-title">3. Bedside Vital Signs & Recorded Observations</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30%;">Observation / Parameter</th>
        <th style="width: 25%;">Measured Value</th>
        <th style="width: 20%;">Clinical Interpretation</th>
        <th style="width: 25%;">Recorded By / Source</th>
      </tr>
    </thead>
    <tbody>
      ${fullCase.findings.map((f) => `
        <tr>
          <td><strong>${f.label}</strong></td>
          <td>${f.description || 'Present'}</td>
          <td>
            <span style="font-weight: 700; color: ${f.description?.includes('CRITICAL') || f.statusDisplay?.includes('CRITICAL') ? 'var(--status-danger)' : f.description?.includes('HIGH') ? '#EA580C' : 'var(--text-primary)'};">
              ${f.statusDisplay || f.status || 'Recorded'}
            </span>
          </td>
          <td style="color: var(--text-muted); font-size: 8.5pt;">${f.provenance.recordedBy || 'Clinical Entry'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Emergency Severity Index (ESI) Stratification -->
  <div class="section-title">4. Emergency Severity Index (ESI) Triage Stratification</div>
  <div class="alert-box alert-esi">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <span style="font-size: 11pt; font-weight: 800; color: var(--text-primary);">
        TRIAGE CLASSIFICATION: <span class="badge badge-esi${esi.level}">${esi.levelName}</span>
      </span>
      <span style="font-size: 9pt; font-weight: 700; color: var(--text-secondary);">
        Anticipated Resources: ${esi.anticipatedResources}
      </span>
    </div>
    <div style="font-size: 9.5pt; margin-bottom: 6px;">
      <strong>Rationale:</strong> ${esi.rationale}
    </div>
    ${esi.isLifeSavingRequired ? `
      <div style="font-size: 9.5pt; font-weight: 700; color: var(--status-danger); margin-bottom: 4px;">
        ⚠️ IMMEDIATE LIFE-SAVING INTERVENTION REQUIRED (ACLS/PALS Resuscitation Bay Protocol)
      </div>
    ` : ''}
    ${esi.dangerZoneTriggered ? `
      <div style="font-size: 9.5pt; font-weight: 700; color: #EA580C; margin-bottom: 4px;">
        ⚠️ DANGER ZONE VITAL SIGN BREACH — Upgraded to ESI 2 Emergent Status
      </div>
    ` : ''}
    <div style="margin-top: 6px;">
      <strong style="font-size: 9pt; text-transform: uppercase; color: var(--text-secondary);">Recommended Priority Actions:</strong>
      <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 9pt;">
        ${esi.recommendedActions.map((act) => `<li>${act}</li>`).join('')}
      </ul>
    </div>
  </div>

  <!-- Nexus AI Differential Diagnosis & Assessment -->
  <div class="section-title">5. Differential Diagnosis & AI Clinical Assessment</div>
  ${activeAssessment?.summary ? `
    <div style="padding: 8px 12px; background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 6px; margin-bottom: 10px; font-size: 9.5pt;">
      <strong>Executive Synthesis:</strong> ${activeAssessment.summary}
    </div>
  ` : ''}

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35%;">Candidate Diagnostic Hypothesis</th>
        <th style="width: 15%;">Status</th>
        <th style="width: 50%;">Clinical Evidence & Mechanistic Rationale</th>
      </tr>
    </thead>
    <tbody>
      ${(fullCase.hypotheses || []).map((h) => {
        const title = (h as any).label || (h as any).title;
        const status = (h as any).status || 'Uncertain';
        const rationale = (h as any).rationale || (h as any).nexusAssessment || (h as any).statusDetail || '';
        const badgeClass = status === 'Supported' ? 'badge-supported' : status === 'Contradicted' ? 'badge-contradicted' : 'badge-uncertain';
        return `
          <tr>
            <td><strong>${title}</strong></td>
            <td><span class="badge ${badgeClass}">${status}</span></td>
            <td style="font-size: 9pt;">${rationale}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Clinical Safety Alerts & Drug Concerns -->
  <div class="section-title">6. Deterministic Safety Checks & Contraindications</div>
  ${fullCase.safetyIssues.length > 0 ? `
    ${fullCase.safetyIssues.map((s) => `
      <div class="alert-box ${s.severity === 'High' ? 'alert-danger' : 'alert-warning'}">
        <strong>[${s.severity.toUpperCase()} HAZARD] ${s.title}:</strong> ${s.details}<br />
        <span style="font-weight: 600;">Required Action:</span> ${s.recommendedStep}
      </div>
    `).join('')}
  ` : `
    <div style="padding: 8px 12px; background: var(--success-subtle); border: 1px solid var(--success-border); border-radius: 6px; font-size: 9pt; color: var(--status-success);">
      ✓ No acute drug-allergy contraindications or critical threshold conflicts detected.
    </div>
  `}

  <!-- Actionable Recommendations & Missing Information -->
  <div class="section-title">7. Actionable Diagnostic Gaps & Resuscitation Steps</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 45%;">Recommended Clinical Step / Test</th>
        <th style="width: 20%;">Category / Priority</th>
        <th style="width: 35%;">Clinical Objective</th>
      </tr>
    </thead>
    <tbody>
      ${(activeAssessment?.recommendations && activeAssessment.recommendations.length > 0
        ? activeAssessment.recommendations.map((r) => ({
            name: r.content,
            cat: r.category,
            why: r.rationale || 'Decision support milestone',
          }))
        : fullCase.informationGaps.map((g) => ({
            name: g.testName,
            cat: g.priority,
            why: g.whyItMatters,
          }))
      ).map((item) => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td><span class="badge ${item.cat === 'SAFETY' || item.cat === 'HIGH PRIORITY' ? 'badge-urgent' : 'badge-uncertain'}">${item.cat}</span></td>
          <td style="font-size: 9pt;">${item.why}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Attending Sign-Off & Legal Disclaimers -->
  <div style="margin-top: 30px; border-top: 2px solid var(--text-primary); padding-top: 12px;">
    <table style="width: 100%; font-size: 9pt;">
      <tr>
        <td style="width: 60%; vertical-align: top;">
          <strong>Attending Clinician Review & Attestation:</strong><br />
          <p style="font-size: 8pt; color: var(--text-muted); margin: 4px 0 16px 0; max-width: 420px;">
            I confirm that I have personally evaluated this patient presentation, reviewed the AI-assisted differential diagnosis and safety alerts, and assume full medical-legal responsibility for all diagnostic and therapeutic decisions.
          </p>
          <div style="border-bottom: 1px solid var(--text-secondary); width: 280px; height: 28px;"></div>
          <div style="font-size: 8.5pt; color: var(--text-secondary); margin-top: 4px;">Clinician Signature & Date Stamp</div>
        </td>
        <td style="width: 40%; vertical-align: top; text-align: right;">
          <div style="font-size: 8pt; color: var(--text-muted);">
            <strong>MDCG 2020-1 / EU MDR 2017/745</strong><br />
            Nexus AI Decision Support System v3.2<br />
            Non-autonomous Clinical Co-Pilot<br />
            Case Audit Hash: ${fullCase.overview.id.slice(0, 16)}
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <span>${organizationName} · Confidential Medical Record</span>
    <span>Page 1 of 1 · Generated via Nexus Workstation</span>
  </div>

</body>
</html>`;
}

/**
 * Triggers the browser's native print-to-PDF dialog with medical print layout.
 */
export function exportCaseToPdf(data: CasePdfExportData): void {
  const html = generateCaseReportHtml(data);
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Please allow pop-ups for this site to export the clinical PDF report.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Give resources time to paint, then trigger print
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

/**
 * Downloads a standalone, self-contained HTML medical dossier that can be
 * saved or converted to PDF offline.
 */
export function downloadCaseReportHtml(data: CasePdfExportData): void {
  const html = generateCaseReportHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Nexus-Case-Report-${data.fullCase.overview.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

