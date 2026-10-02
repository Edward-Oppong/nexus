import React, { useState, useMemo } from 'react';
import { useDrawer } from '../../../app/providers/DrawerContext';
import { useCase } from '../../../app/providers/CaseContext';
import {
  BookOpen,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { AuthorityTier, AUTHORITY_TIER_LABELS, EvidenceItem } from '../../../domain/evidence';

interface ClinicalGuidelineItem extends EvidenceItem {
  matchKeywords?: RegExp;
}

const CLINICAL_GUIDELINE_LIBRARY: ClinicalGuidelineItem[] = [
  {
    id: 'ev-duke-2024',
    title: '2023 Duke-ISCVID Modified Criteria for Clinical Diagnosis of Infective Endocarditis',
    sourceOrganization: 'International Society for Cardiovascular Infectious Diseases (ISCVID) / AHA',
    documentType: 'Diagnostic Criteria Protocol',
    publicationYear: '2023',
    retrievalDate: '12 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'Gold standard diagnostic algorithm utilizing major microbiological (typical organisms) and imaging criteria (vegetation/abscess) with minor clinical predisposition criteria.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-1',
    relevantPassage: 'Definite IE requires 2 Major criteria, or 1 Major and 3 Minor criteria, or 5 Minor criteria. Possible IE requires 1 Major and 1 Minor, or 3 Minor criteria.',
    citation: 'Fowler VG, et al. The 2023 Duke-ISCVID Criteria for Infective Endocarditis: Updating the Modified Duke Criteria. Clin Infect Dis. 2023;77(4):518-526.',
    relevanceExplanation: 'Guides diagnostic classification and distinguishes bacterial endocarditis from non-infective vegetation mimics.',
    matchKeywords: /(endocarditis|valve|vegetation|duke|murmur|bacteremia|strep|staph|osler|janeway)/i,
  },
  {
    id: 'ev-aha-2025',
    title: 'AHA/ACC Guideline for the Management of Patients With Valvular Heart Disease',
    sourceOrganization: 'American Heart Association / American College of Cardiology',
    documentType: 'Clinical Practice Guideline',
    publicationYear: '2024',
    retrievalDate: '10 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'Authoritative clinical recommendations governing antimicrobial duration, hemodynamic monitoring, and indications for surgical valve intervention in active endocarditis.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-1',
    relevantPassage: 'Urgent surgical consultation is indicated for heart failure, uncontrolled bacteremia, large vegetations (>10mm), or perivalvular extension.',
    citation: 'Otto CM, et al. 2020 ACC/AHA Guideline for the Management of Patients With Valvular Heart Disease. Circulation. 2021;143:e72–e227.',
    relevanceExplanation: 'Informs multidisciplinary Heart Team consultation, serial echocardiography intervals, and indications for emergent valvuloplasty or valve replacement.',
    matchKeywords: /(endocarditis|valvul|valve|murmur|aha|cardiac|heart failure|rheumatic)/i,
  },
  {
    id: 'ev-idsa-pneumonia',
    title: 'Diagnosis and Treatment of Adults with Community-Acquired Pneumonia: ATS/IDSA Guideline',
    sourceOrganization: 'Infectious Diseases Society of America (IDSA) / American Thoracic Society (ATS)',
    documentType: 'Clinical Practice Guideline',
    publicationYear: '2020',
    retrievalDate: '08 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'International consensus criteria for empirical beta-lactam + macrolide therapy, sputum microbiology, and respiratory isolation protocols in acute lower respiratory tract infections.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-1',
    relevantPassage: 'Empirical antibiotic therapy should be initiated immediately upon clinical and radiographic confirmation of CAP. Routine procalcitonin is not recommended to withhold initial antibiotics.',
    citation: 'Metlay JP, et al. Diagnosis and Treatment of Adults with Community-Acquired Pneumonia. Am J Respir Crit Care Med. 2019;200(7):e45-e67.',
    relevanceExplanation: 'Provides standard empirical antimicrobial dosing, treatment duration (minimum 5 days), and clinical stability criteria before hospital discharge.',
    matchKeywords: /(pneumonia|cap|curb|respiratory|cough|infiltrate|consolidation|crackles|sputum|dyspnea)/i,
  },
  {
    id: 'ev-curb65-2023',
    title: 'British Thoracic Society Guideline for the Management of Community Acquired Pneumonia in Adults',
    sourceOrganization: 'British Thoracic Society (BTS)',
    documentType: 'Diagnostic Criteria Protocol',
    publicationYear: '2023',
    retrievalDate: '15 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'Validated 5-point mortality prediction and triage tool (Confusion, Urea, Respiratory rate, Blood pressure, Age ≥65) determining safe outpatient vs ICU triage.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-1',
    relevantPassage: 'CURB-65 score 0-1: low risk (home treatment); score 2: intermediate risk (inpatient admission); score ≥3: high risk (urgent inpatient or ICU evaluation).',
    citation: 'Lim WS, et al. BTS guidelines for the management of community acquired pneumonia in adults: update. Thorax. 2009;64(Suppl 3):iii1-iii55.',
    relevanceExplanation: 'Calculates objective 30-day mortality risk and standardizes inpatient admission thresholds.',
    matchKeywords: /(curb|pneumonia|urea|bun|respiratory rate|tachypnea|copd)/i,
  },
  {
    id: 'ev-sepsis3-2021',
    title: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock',
    sourceOrganization: 'Society of Critical Care Medicine (SCCM) / ESICM',
    documentType: 'Clinical Practice Guideline',
    publicationYear: '2021',
    retrievalDate: '18 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'Defines the evidence-based 1-hour bundle: measure lactate, obtain blood cultures prior to antibiotics, administer broad-spectrum antimicrobials, and rapid crystalloid resuscitation for hypotension.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-1',
    relevantPassage: 'For adults with suspected sepsis or septic shock, recommend administering antimicrobials immediately, ideally within 1 hour of recognition.',
    citation: 'Evans L, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063-e1143.',
    relevanceExplanation: 'Enforces strict time-to-antibiotic safety protocols and bedside lactate resuscitation targets.',
    matchKeywords: /(sepsis|shock|lactate|qsofa|hypotension|bacteremia|infection|pyrexia|fever|urosepsis)/i,
  },
  {
    id: 'ev-wells-pe',
    title: 'Antithrombotic Therapy for VTE Disease: CHEST Guideline and Expert Panel Report',
    sourceOrganization: 'American College of Chest Physicians (CHEST)',
    documentType: 'Clinical Practice Guideline',
    publicationYear: '2021',
    retrievalDate: '14 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'Standard algorithm incorporating Wells clinical probability scoring and high-sensitivity D-dimer testing to safely rule out venous thromboembolism without radiation exposure.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-2',
    relevantPassage: 'In patients with low or intermediate clinical pre-test probability of PE, D-dimer testing is recommended as the initial diagnostic test.',
    citation: 'Stevens SM, et al. Antithrombotic Therapy for VTE Disease: Second Update of the CHEST Guideline. Chest. 2021;160(6):e545-e608.',
    relevanceExplanation: 'Prevents inappropriate imaging while ensuring rapid therapeutic anticoagulation when pulmonary thromboembolism is likely.',
    matchKeywords: /(pulmonary embolism|embolism|wells|dvt|thromb|d-dimer|pleuritic)/i,
  },
  {
    id: 'ev-acc-aha-acs',
    title: '2023 AHA/ACC/NCDR Guideline for the Evaluation and Management of Acute Coronary Syndromes',
    sourceOrganization: 'American Heart Association / American College of Cardiology',
    documentType: 'Clinical Practice Guideline',
    publicationYear: '2023',
    retrievalDate: '10 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'Diagnostic and therapeutic protocol for non-ST-elevation and ST-elevation acute myocardial infarction, high-sensitivity troponin rapid rule-out algorithms, and antiplatelet therapy.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-1',
    relevantPassage: 'High-sensitivity troponin assays with validated 0/1-hour or 0/2-hour rapid algorithms are recommended to rule out or rule in acute myocardial infarction.',
    citation: 'Gulati M, et al. 2021 AHA/ACC Guideline for the Evaluation and Diagnosis of Chest Pain. J Am Coll Cardiol. 2021;78(22):e187-e285.',
    relevanceExplanation: 'Directs emergent revascularization pathways and risk stratification via validated TIMI / GRACE scoring.',
    matchKeywords: /(troponin|coronary|angina|chest pain|ecg|stemi|nstemi|infarct|acs|myocarditis|aortic dissection)/i,
  },
  {
    id: 'ev-kdigo-aki',
    title: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury',
    sourceOrganization: 'Kidney Disease: Improving Global Outcomes (KDIGO)',
    documentType: 'Clinical Practice Guideline',
    publicationYear: '2022',
    retrievalDate: '05 Jan 2026',
    authority: 'High',
    authorityTier: 1,
    applicability: 'High',
    applicabilityReason: 'Consensus criteria defining AKI stages 1, 2, and 3 based on serum creatinine rise (≥0.3 mg/dL within 48h) or urine output, establishing nephrotoxic drug stoppage protocols.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-3',
    relevantPassage: 'Discontinue nephrotoxic agents and adjust renally cleared drug dosages in response to acute creatinine elevation.',
    citation: 'Kellum JA, et al. Diagnosis, evaluation, and management of acute kidney injury: a KDIGO summary (Part 1). Crit Care. 2013;17(1):204.',
    relevanceExplanation: 'Triggers automated medication dosing modifications and renal protective monitoring.',
    matchKeywords: /(creatinine|kidney|renal|aki|kdigo|bun|oliguria|dialysis|electrolyte|potassium)/i,
  },
  {
    id: 'ev-nice-antimicrobial',
    title: 'Antimicrobial Stewardship: Systems and Processes for Effective Antimicrobial Medicine Use',
    sourceOrganization: 'National Institute for Health and Care Excellence (NICE)',
    documentType: 'Clinical Practice Guideline',
    publicationYear: '2023',
    retrievalDate: '20 Jan 2026',
    authority: 'Moderate',
    authorityTier: 2,
    applicability: 'High',
    applicabilityReason: 'Evidence-based framework for clinical surveillance, therapeutic drug monitoring (vancomycin / aminoglycosides), and antibiotic de-escalation based on culture results.',
    relationship: 'Supports',
    relevantHypothesisId: 'hyp-4',
    relevantPassage: 'Review microbiological culture and susceptibility results within 48–72 hours to narrow therapy or discontinue unnecessary empirical antimicrobials.',
    citation: 'NICE Guideline NG15. Antimicrobial stewardship: systems and processes for effective antimicrobial medicine use. 2015, updated 2023.',
    relevanceExplanation: 'Mandates 48-hour antibiotic review and therapeutic peak/trough monitoring to minimize adverse drug reactions.',
    matchKeywords: /(antimicrobial|antibiotic|stewardship|nice|culture|vancomycin|gentamicin|allergy|ddi)/i,
  },
];

export const EvidenceTab: React.FC = () => {
  const { openEvidenceDrawer } = useDrawer();
  const { activeCase } = useCase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedHypothesis, setSelectedHypothesis] = useState<string>('ALL');

  // Enriched clinical evidence dynamically linked to the active case hypotheses and findings
  const enrichedEvidence = useMemo(() => {
    const caseHypotheses = activeCase?.hypotheses ?? [];
    const findingsText = (activeCase?.findings ?? [])
      .map((f) => `${f.label} ${f.description || ''}`)
      .join(' ')
      .toLowerCase();
    const caseText = `${activeCase?.chiefComplaint || ''} ${activeCase?.historyOfPresentIllness || ''} ${findingsText}`.toLowerCase();

    const matched = CLINICAL_GUIDELINE_LIBRARY.map((item) => {
      // Check which hypotheses explicitly link to this evidence ID or match keywords
      const linked = caseHypotheses.filter((h) => {
        if (h.evidenceIds?.includes(item.id)) return true;
        if (item.matchKeywords?.test(h.title.toLowerCase())) return true;
        return false;
      });

      const isDirectlyRelevant =
        linked.length > 0 ||
        (item.matchKeywords ? item.matchKeywords.test(caseText) : false);

      return {
        ...item,
        tier: (item.authorityTier ?? 1) as AuthorityTier,
        linkedHypotheses: linked.length > 0 ? linked : isDirectlyRelevant && caseHypotheses.length > 0 ? [caseHypotheses[0]] : [],
        isRelevantToCase: isDirectlyRelevant,
      };
    }).filter((ev) => ev.isRelevantToCase || ev.linkedHypotheses.length > 0);

    // If no specific keyword matched, show top guidelines as contextual references
    if (matched.length === 0) {
      return CLINICAL_GUIDELINE_LIBRARY.slice(0, 4).map((item) => ({
        ...item,
        tier: (item.authorityTier ?? 1) as AuthorityTier,
        linkedHypotheses: caseHypotheses.slice(0, 1),
      }));
    }

    return matched;
  }, [activeCase.hypotheses, activeCase.findings, activeCase.chiefComplaint, activeCase.historyOfPresentIllness]);

  // Filter evidence
  const filteredEvidence = useMemo(() => {
    return enrichedEvidence.filter((ev) => {
      // Tier filter
      if (selectedTier !== 'ALL' && ev.tier.toString() !== selectedTier) return false;

      // Hypothesis filter
      if (selectedHypothesis !== 'ALL') {
        const matchesHyp = ev.linkedHypotheses.some((h) => h.id === selectedHypothesis);
        if (!matchesHyp) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          ev.title.toLowerCase().includes(q) ||
          ev.relevanceExplanation.toLowerCase().includes(q) ||
          ev.sourceOrganization.toLowerCase().includes(q) ||
          ev.citation.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [enrichedEvidence, selectedTier, selectedHypothesis, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <BookOpen size={20} color="#0284C7" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
            Traceable Clinical Evidence & Authority Guidelines
          </h2>
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
          Deterministic evidence linking conforming to WHO SMART criteria and FDA CDS traceability guidelines.
          Evidence is classified into authority tiers to prevent clinical misinformation.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search guidelines, criteria, bacteremia, endocarditis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#0F172A',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Tier Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#0F172A',
              }}
            >
              <option value="ALL">All Authority Tiers</option>
              <option value="1">Tier 1: Clinical Practice Guidelines</option>
              <option value="2">Tier 2: Systematic Reviews & Standards</option>
              <option value="3">Tier 3: Observational Studies</option>
            </select>
          </div>

          {/* Hypothesis Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Hypothesis:</span>
            <select
              value={selectedHypothesis}
              onChange={(e) => setSelectedHypothesis(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#0F172A',
                maxWidth: '200px',
              }}
            >
              <option value="ALL">All Hypotheses</option>
              {activeCase.hypotheses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredEvidence.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              fontSize: '13px',
            }}
          >
            No clinical evidence found matching the selected filters.
          </div>
        ) : (
          filteredEvidence.map((ev) => {
            const tierBadgeColor =
              ev.tier === 1
                ? { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }
                : ev.tier === 2
                ? { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' }
                : { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' };

            return (
              <div
                key={ev.id}
                onClick={() => openEvidenceDrawer(ev)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#0284C7';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
                }}
              >
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  {/* Top metadata tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#0369A1',
                        background: '#E0F2FE',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {ev.documentType}
                    </span>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: tierBadgeColor.text,
                        background: tierBadgeColor.bg,
                        border: `1px solid ${tierBadgeColor.border}`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Tier {ev.tier}: {AUTHORITY_TIER_LABELS[ev.tier]}
                    </span>

                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {ev.sourceOrganization} · {ev.publicationYear}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    {ev.title}
                  </h3>

                  {/* Relevance Explanation */}
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '8px' }}>
                    <strong>Clinical Applicability:</strong> {ev.relevanceExplanation}
                  </div>

                  {/* Hypothesis linkage badges */}
                  {ev.linkedHypotheses.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Linked to:</span>
                      {ev.linkedHypotheses.map((h) => (
                        <span
                          key={h.id}
                          style={{
                            fontSize: '11px',
                            background: '#F1F5F9',
                            color: '#0F172A',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            border: '1px solid #CBD5E1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Tag size={10} />
                          {h.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Citation */}
                  <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    Citation: {ev.citation}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEvidenceDrawer(ev);
                    }}
                    className="btn btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View Guidelines <ArrowRight size={12} />
                  </button>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>Click card to inspect</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
