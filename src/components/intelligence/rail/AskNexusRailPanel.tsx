// ============================================================
// src/components/intelligence/rail/AskNexusRailPanel.tsx
// Core Rail Function 6: "Ask Nexus" (Contextual Case Interrogation)
// Grounded case interaction — secondary to clinical workspace
// ============================================================

import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { Sparkles, Send } from 'lucide-react';

export const AskNexusRailPanel: React.FC = () => {
  const { activeCase } = useCase();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAnswering(true);
    // Grounded deterministic / case-aware answer generator
    setTimeout(() => {
      const q = query.toLowerCase();
      let ans = '';

      if (q.includes('why') || q.includes('hypothesis') || q.includes('consider')) {
        const topHyp = activeCase.hypotheses[0];
        ans = `"${topHyp.title}" is considered based on ${topHyp.supportingFindingIds.length} verified findings. It is contradicted by ${topHyp.contradictingFindingIds.length} finding(s).`;
      } else if (q.includes('evidence') || q.includes('guideline') || q.includes('paper')) {
        ans = `Retrieved evidence includes clinical guidelines regarding Case ${activeCase.overview.id}. All retrieved sources are indexed in the Evidence Library.`;
      } else if (q.includes('missing') || q.includes('pending') || q.includes('gap')) {
        ans = `${activeCase.informationGaps.length} information gaps identified, including: ${activeCase.informationGaps.map((g) => g.testName || g.whyItMatters).slice(0, 2).join(', ')}.`;
      } else {
        ans = `Grounded assessment for Case ${activeCase.overview.id}: Patient has ${activeCase.findings.length} findings and ${activeCase.safetyIssues.length} safety alerts recorded.`;
      }

      setResponse(ans);
      setIsAnswering(false);
    }, 450);
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
          gap: '6px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#0F172A',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <Sparkles size={12} color="#0284C7" />
        Ask Nexus About This Case
      </div>

      <form onSubmit={handleAsk} style={{ display: 'flex', gap: '4px' }}>
        <input
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
          <button
            type="button"
            onClick={() => setQuery('Why is top hypothesis considered?')}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            Why this hypothesis?
          </button>
          <button
            type="button"
            onClick={() => setQuery('What information is missing?')}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            Missing information?
          </button>
        </div>
      )}

      {/* Grounded response display */}
      {response && (
        <div
          style={{
            marginTop: '4px',
            padding: '8px',
            borderRadius: '4px',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            fontSize: '11px',
            color: '#0369A1',
            lineHeight: 1.4,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: 700, fontSize: '10px', color: '#0284C7' }}>NEXUS GROUNDED RESPONSE</span>
            <button
              onClick={() => {
                setResponse(null);
                setQuery('');
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: '10px',
                padding: 0,
              }}
            >
              Clear
            </button>
          </div>
          {response}
        </div>
      )}
    </section>
  );
};
