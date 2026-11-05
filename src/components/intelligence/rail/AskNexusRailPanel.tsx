// ============================================================
// src/components/intelligence/rail/AskNexusRailPanel.tsx
// Core Rail Function 6: "Ask Nexus" (Contextual Case Interrogation)
// Priority path: Gemini → Groq → HuggingFace → Deterministic
// ============================================================

import React, { useState, useRef } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { Sparkles, Send, RefreshCw } from 'lucide-react';
import { huggingFaceClient } from '../../../lib/intelligence/services/huggingface-api';
import { loadAiEngineSettings } from '../../../lib/intelligence/services/ai-engine-config';

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
  const [answerSource, setAnswerSource] = useState<'live' | 'hf' | 'grounded' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAsk = async (userQuery: string) => {
    const trimmed = (userQuery || query).trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setIsAnswering(true);
    setResponse(null);
    setAnswerSource(null);

    // ── Build shared case context snippet ───────────────────────────────
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
      ? `Nexus Assessment: ${nexusAssessment.summary.slice(0, 250)}`
      : '';

    const contextPrompt = `You are a clinical decision-support AI embedded in the Nexus clinical workstation. Answer the physician's question concisely in 2–3 sentences based strictly on the case data provided. Do not add information not present in the case.

CASE CONTEXT:
Chief Complaint: ${activeCase.chiefComplaint || 'Under review'}
Verified Findings: ${topFindings || 'None yet recorded'}
Candidate Diagnoses: ${topHyps || 'None generated yet'}
${nexusSummary}

PHYSICIAN QUESTION: ${trimmed}

ANSWER (2–3 sentences, clinical tone, no disclaimers):`;

    // ── 1. Live Gemini (primary) ─────────────────────────────────────────
    try {
      const settings = loadAiEngineSettings();
      if (settings.geminiApiKey) {
        const model = settings.geminiModel || 'gemini-3.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.geminiApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 320 },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text && text.length > 15) {
            setResponse(text);
            setAnswerSource('live');
            setIsAnswering(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('[AskNexus] Gemini synthesis failed:', err);
    }

    // ── 2. Live Groq (secondary) ─────────────────────────────────────────
    try {
      const settings = loadAiEngineSettings();
      if (settings.groqApiKey) {
        const model = settings.groqModel || 'qwen/qwen3.8-27b';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.groqApiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: contextPrompt }],
            temperature: 0.2,
            max_tokens: 320,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text && text.length > 15) {
            setResponse(text);
            setAnswerSource('live');
            setIsAnswering(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('[AskNexus] Groq synthesis failed:', err);
    }

    // ── 3. HuggingFace (tertiary) ─────────────────────────────────────────
    if (huggingFaceClient.isConfigured()) {
      try {
        const hfPrompt = `You are a clinical decision-support AI. Answer concisely in 2–3 sentences.
Case: ${activeCase.chiefComplaint || 'Clinical case under review'}.
Verified findings: ${topFindings || 'Not yet recorded'}.
Candidate diagnoses: ${topHyps || 'Not yet generated'}.
${nexusSummary}
Clinical question: ${trimmed}
Answer:`;
        const { text } = await huggingFaceClient.generateClinicalSynthesis(hfPrompt);
        if (text && text.trim().length > 10) {
          setResponse(text.trim());
          setAnswerSource('hf');
          setIsAnswering(false);
          return;
        }
      } catch (err) {
        console.warn('[AskNexus] HF synthesis failed, using grounded fallback:', err);
      }
    }

    // ── 4. Grounded deterministic case-aware answer generator ─────────────
    await new Promise((r) => setTimeout(r, 150));
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
      const pending = activeCase.investigations.filter(
        (i) => i.status !== 'COMPLETED' && i.status !== 'Result available'
      );
      const missingFindings =
        nexusAssessment?.nexusFindings.filter((f) => f.findingType === 'MISSING_INFORMATION') || [];

      if (missingFindings.length > 0) {
        ans = `Nexus identified ${missingFindings.length} critical investigation(s): ${missingFindings
          .slice(0, 3)
          .map((f) => f.content)
          .join('; ')}.`;
      } else if (gaps.length > 0) {
        ans = `${gaps.length} clinical information gap(s) identified. Priority gaps include: ${gaps
          .slice(0, 2)
          .map((g) => g.testName || g.whyItMatters)
          .join(', ')}. ${pending.length > 0 ? `${pending.length} test(s) currently pending results.` : ''}`;
      } else {
        ans = pending.length > 0
          ? `${pending.length} investigation(s) are currently awaiting results. No specific clinical gaps flagged by Nexus.`
          : 'No pending investigations or information gaps identified for this case.';
      }
    } else if (q.includes('contradict') || q.includes('conflict') || q.includes('tension')) {
      const contras = nexusAssessment?.contradictions || [];
      if (contras.length > 0) {
        ans = `Nexus detected ${contras.length} clinical contradiction(s): ${contras
          .slice(0, 2)
          .map((c) => c.explanation.slice(0, 80))
          .join(' | ')}. These require clinician adjudication.`;
      } else {
        ans =
          'No clinical contradictions have been detected by Nexus for this case. Run the analysis engine to perform a full contradiction check across vitals, labs, and findings.';
      }
    } else if (
      q.includes('evidence') ||
      q.includes('guideline') ||
      q.includes('paper') ||
      q.includes('pubmed')
    ) {
      const evSources = nexusAssessment?.evidenceSources || [];
      ans =
        evSources.length > 0
          ? `Nexus retrieved ${evSources.length} peer-reviewed evidence source(s) from PubMed/Europe PMC and local clinical guidelines. Navigate to the Evidence tab to inspect citations.`
          : `Clinical evidence for this case includes local Tier-1 guidelines (ATS/IDSA, ESC) plus live PubMed retrieval. Navigate to the Evidence tab to view all sources.`;
    } else if (
      q.includes('summary') ||
      q.includes('summari') ||
      q.includes('overview') ||
      q.includes('finding')
    ) {
      const findings = activeCase.findings.filter(
        (f) => f.provenance.verificationStatus !== 'Rejected'
      );
      const safetyCount = activeCase.safetyIssues.length;
      ans =
        `Case has ${findings.length} active verified finding(s) and ${safetyCount} safety alert(s).` +
        (nexusAssessment
          ? ` Nexus Assessment: ${
              nexusAssessment.summary?.slice(0, 180) ||
              'Assessment complete — review the Reasoning tab for full detail.'
            }...`
          : ' Run Nexus Analysis for a full clinical summary.');
    } else if (q.includes('safety') || q.includes('alert') || q.includes('critical')) {
      const safetyIssues = activeCase.safetyIssues;
      if (safetyIssues.length > 0) {
        ans = `${safetyIssues.length} active safety alert(s): ${safetyIssues
          .slice(0, 2)
          .map((s) => s.details || s.title)
          .join(' | ')}. Review the Safety tab for full details and required actions.`;
      } else {
        ans = 'No active safety alerts have been flagged for this case at this time.';
      }
    } else {
      const findings = activeCase.findings.filter(
        (f) => f.provenance.verificationStatus !== 'Rejected'
      );
      ans =
        `Case ${activeCase.overview?.id || 'under review'} has ${findings.length} active finding(s), ` +
        `${activeCase.hypotheses.length} candidate hypothesis(es), and ` +
        `${activeCase.safetyIssues.length} safety alert(s).` +
        (nexusAssessment
          ? ' Nexus assessment has been generated — review the Reasoning tab for the full report.'
          : ' Run Nexus Analysis for grounded differential diagnosis.');
    }

    setResponse(ans);
    setAnswerSource('grounded');
    setIsAnswering(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(query);
  };

  const sourceLabel: Record<string, string> = {
    live: 'NEXUS LIVE AI RESPONSE',
    hf: 'NEXUS AI RESPONSE (HF)',
    grounded: 'NEXUS GROUNDED RESPONSE',
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
      {/* Header */}
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
            onClick={() => {
              setResponse(null);
              setQuery('');
              setAnswerSource(null);
              inputRef.current?.focus();
            }}
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

      {/* Input form */}
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

      {/* Suggested prompts */}
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

      {/* Loading indicator */}
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
          Querying live clinical AI…
        </div>
      )}

      {/* Response display */}
      {response && !isAnswering && (
        <div
          style={{
            marginTop: '2px',
            padding: '8px 10px',
            borderRadius: '5px',
            background: answerSource === 'live' ? '#F0FDF4' : '#F0F9FF',
            border: `1px solid ${answerSource === 'live' ? '#BBF7D0' : '#BAE6FD'}`,
            fontSize: '11px',
            color: answerSource === 'live' ? '#14532D' : '#0369A1',
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '9px',
              color: answerSource === 'live' ? '#16A34A' : '#0284C7',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            {sourceLabel[answerSource ?? 'grounded']}
          </div>
          {response}
        </div>
      )}
    </section>
  );
};
