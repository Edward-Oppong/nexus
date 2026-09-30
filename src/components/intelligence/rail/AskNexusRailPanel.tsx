// ============================================================
// src/components/intelligence/rail/AskNexusRailPanel.tsx
// Core Rail Function 6: "Ask Nexus" (Contextual Case Interrogation)
// Grounded case interaction — secondary to clinical workspace
// Uses Mistral-7B via HF if configured, otherwise deterministic.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { Sparkles, Send, RefreshCw } from 'lucide-react';
import { huggingFaceClient } from '../../../lib/intelligence/services/huggingface-api';

const SUGGESTED_PROMPTS = [
  'Why is the top hypothesis considered?',
  'What investigations are missing?',
  'Any clinical contradictions?',
  'Summarize the key findings',
];

export const AskNexusRailPanel: React.FC = () => {
  const { activeCase, nexusAssessment } = useCase();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAsk = async (userQuery: string) => {
    const trimmed = (userQuery || query).trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setIsAnswering(true);
    setResponse(null);

    // ── 1. Mistral / HuggingFace synthesis (when token configured) ─
    if (huggingFaceClient.isConfigured()) {
      try {
        const topFindings = (activeCase.findings || [])
          .filter((f) => f.provenance.verificationStatus !== 'Rejected')
          .slice(0, 6)
          .map((f) => f.label)
          .join(', ');

        const topHyps = (activeCase.hypotheses || [])
          .slice(0, 3)
          .map((h, i) => `H${i + 1}: ${h.title}`)
          .join('; ');

        const nexusSummary = nexusAssessment?.summary
          ? `Nexus Assessment Summary: ${nexusAssessment.summary.slice(0, 300)}`
          : '';

        const prompt = `You are a clinical decision-support AI. Answer concisely in 2–3 sentences.
Case: ${activeCase.chiefComplaint || 'Clinical case under review'}.
Verified findings: ${topFindings || 'Not yet recorded'}.
Candidate diagnoses: ${topHyps || 'Not yet generated'}.
${nexusSummary}
Clinical question: ${trimmed}
Answer:`;

        const { text } = await huggingFaceClient.generateClinicalSynthesis(prompt);
        if (text && text.trim().length > 10) {
          setResponse(text.trim());
          setIsAnswering(false);
          return;
        }
      } catch (err) {
        console.warn('[AskNexus] Live HF synthesis failed, using grounded fallback:', err);
      }
    }

    // ── 2. Grounded deterministic case-aware answer generator ─
    await new Promise((r) => setTimeout(r, 200)); // UX micro-delay
    const q = trimmed.toLowerCase();
    let ans = '';

    if (q.includes('why') || q.includes('hypothesis') || q.includes('consider') || q.includes('top')) {
      const topHyp = nexusAssessment
        ? nexusAssessment.nexusFindings.find((f) => f.findingType === 'SUPPORT')
        : null;
      const caseHyp = activeCase.hypotheses?.[0];

      if (topHyp) {
        const match = topHyp.content.match(/^([^:]+):/);
        const label = match ? match[1] : topHyp.content.slice(0, 50);
        const detail = match ? topHyp.content.slice(match[0].length).trim().slice(0, 150) : '';
        ans = `Nexus identifies "${label}" as the primary clinical consideration. ${detail}${detail ? '...' : ''} Supported by ${(topHyp.findingIds?.length || 0)} verified finding(s) in this case.`;
      } else if (caseHyp) {
        ans = `"${caseHyp.title}" is the leading hypothesis, supported by ${caseHyp.supportingFindingIds?.length || 0} verified findings and contradicted by ${caseHyp.contradictingFindingIds?.length || 0} finding(s). Run Nexus Analysis for a full grounded assessment.`;
      } else {
        ans = 'No candidate diagnoses have been generated yet. Run Nexus Analysis to generate grounded differential hypotheses from the verified findings.';
      }
    } else if (q.includes('missing') || q.includes('pending') || q.includes('gap') || q.includes('investigation')) {
      const gaps = activeCase.informationGaps;
      const pending = activeCase.investigations.filter((i) => i.status !== 'COMPLETED' && i.status !== 'Result available');
      const missingFindings = nexusAssessment?.nexusFindings.filter((f) => f.findingType === 'MISSING_INFORMATION') || [];

      if (missingFindings.length > 0) {
        ans = `Nexus identified ${missingFindings.length} critical investigation(s): ${missingFindings.slice(0, 3).map((f) => f.content).join('; ')}.`;
      } else if (gaps.length > 0) {
        ans = `${gaps.length} clinical information gap(s) identified. Priority gaps include: ${gaps.slice(0, 2).map((g) => g.testName || g.whyItMatters).join(', ')}. ${pending.length > 0 ? `${pending.length} test(s) currently pending results.` : ''}`;
      } else {
        ans = `${pending.length > 0 ? `${pending.length} investigation(s) are currently awaiting results. No specific clinical gaps flagged by Nexus.` : 'No pending investigations or information gaps identified for this case.'}`;
      }
    } else if (q.includes('contradict') || q.includes('conflict') || q.includes('tension')) {
      const contras = nexusAssessment?.contradictions || [];
      if (contras.length > 0) {
        ans = `Nexus detected ${contras.length} clinical contradiction(s): ${contras.slice(0, 2).map((c) => c.explanation.slice(0, 80)).join(' | ')}. These require clinician adjudication.`;
      } else {
        ans = 'No clinical contradictions have been detected by Nexus for this case. Run the analysis engine to perform a full contradiction check across vitals, labs, and findings.';
      }
    } else if (q.includes('evidence') || q.includes('guideline') || q.includes('paper') || q.includes('pubmed')) {
      const evSources = nexusAssessment?.evidenceSources || [];
      ans = evSources.length > 0
        ? `Nexus retrieved ${evSources.length} peer-reviewed evidence source(s) from PubMed/Europe PMC and local clinical guidelines. Navigate to the Evidence tab to inspect citations.`
        : `Clinical evidence for this case includes local Tier-1 guidelines (ATS/IDSA, ESC) plus live PubMed retrieval. Navigate to the Evidence tab to view all sources.`;
    } else if (q.includes('summary') || q.includes('summari') || q.includes('overview') || q.includes('finding')) {
      const findings = activeCase.findings.filter((f) => f.provenance.verificationStatus !== 'Rejected');
      const safetyCount = activeCase.safetyIssues.length;
      ans = `Case has ${findings.length} active verified finding(s) and ${safetyCount} safety alert(s).` +
        (nexusAssessment
          ? ` Nexus Assessment: ${nexusAssessment.summary?.slice(0, 180) || 'Assessment complete — review the Reasoning tab for full detail.'}...`
          : ' Run Nexus Analysis for a full clinical summary.');
    } else if (q.includes('safety') || q.includes('alert') || q.includes('critical')) {
      const safetyIssues = activeCase.safetyIssues;
      if (safetyIssues.length > 0) {
        ans = `${safetyIssues.length} active safety alert(s): ${safetyIssues.slice(0, 2).map((s) => s.description).join(' | ')}. Review the Safety tab for full details and required actions.`;
      } else {
        ans = 'No active safety alerts have been flagged for this case at this time.';
      }
    } else {
      const findings = activeCase.findings.filter((f) => f.provenance.verificationStatus !== 'Rejected');
      ans = `Case ${activeCase.overview?.id || 'under review'} has ${findings.length} active finding(s), ${activeCase.hypotheses.length} candidate hypothesis(es), and ${activeCase.safetyIssues.length} safety alert(s).` +
        (nexusAssessment ? ' Nexus assessment has been generated — review the Reasoning tab for the full report.' : ' Run Nexus Analysis for grounded differential diagnosis.');
    }

    setResponse(ans);
    setIsAnswering(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(query);
  };

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#0F172A',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <Sparkles size={12} color="#0284C7" />
          Ask Nexus
        </div>
        {response && (
          <button
            type="button"
            onClick={() => { setResponse(null); setQuery(''); inputRef.current?.focus(); }}
            title="Clear and ask again"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '2px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={11} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '4px' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Why is top hypothesis considered?"
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            border: '1px solid #CBD5E1',
            outline: 'none',
            color: '#0F172A',
          }}
        />
        <button
          type="submit"
          disabled={isAnswering || !query.trim()}
          style={{
            background: isAnswering || !query.trim() ? '#E2E8F0' : '#0F172A',
            color: isAnswering || !query.trim() ? '#94A3B8' : '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 10px',
            cursor: isAnswering || !query.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={11} />
        </button>
      </form>

      {/* Suggested Case Prompts */}
      {!response && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleAsk(prompt)}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#64748B',
                cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Answering indicator */}
      {isAnswering && (
        <div
          style={{
            padding: '7px 9px',
            borderRadius: '4px',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            fontSize: '11px',
            color: '#0369A1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: '2px solid #0284C7',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
          Querying case context…
        </div>
      )}

      {/* Grounded response display */}
      {response && !isAnswering && (
        <div
          style={{
            marginTop: '2px',
            padding: '8px 10px',
            borderRadius: '5px',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            fontSize: '11px',
            color: '#0369A1',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '9px', color: '#0284C7', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            NEXUS GROUNDED RESPONSE
          </div>
          {response}
        </div>
      )}
    </section>
  );
};
