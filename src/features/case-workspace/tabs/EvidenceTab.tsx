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

export const EvidenceTab: React.FC = () => {
  const { openEvidenceDrawer } = useDrawer();
  const { activeCase } = useCase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedHypothesis, setSelectedHypothesis] = useState<string>('ALL');

  // Evidence is sourced from Supabase via the case context.
  // Until the evidence table is populated, this will be empty — showing the empty state below.
  const enrichedEvidence = useMemo(() => {
    // No local mock evidence. Return empty; real evidence will come from Supabase.
    return [] as Array<EvidenceItem & {
      tier: AuthorityTier;
      linkedHypotheses: typeof activeCase.hypotheses;
    }>;
  }, [activeCase.hypotheses]);

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
