import React, { useState, useMemo } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { useDrawer } from '../../../app/providers/DrawerContext';
import { usePersona } from '../../../app/providers/PersonaContext';
import { Plus, CheckCircle2, Clock, XCircle, ChevronRight, Filter } from 'lucide-react';
import { ClinicalFinding } from '../../../domain/finding';

export const FindingsTab: React.FC = () => {
  const { activeCase } = useCase();
  const { openFindingDrawer } = useDrawer();
  const { currentPersona } = usePersona();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<'symptom' | 'sign' | 'history' | 'examination' | 'observation'>('symptom');
  const [newDescription, setNewDescription] = useState('');
  const [newSource, setNewSource] = useState<'Clinical observation' | 'Patient narrative'>('Clinical observation');
  // Local findings prepended by the clinician during this session (no backend yet)
  const [localFindings, setLocalFindings] = useState<ClinicalFinding[]>([]);

  const allFindings: ClinicalFinding[] = [...localFindings, ...(activeCase?.findings ?? [])];

  // Derive unique categories that actually exist in the data so filters are never empty
  const presentCategories = useMemo(() => {
    const cats = new Set(allFindings.map((f) => (f.category ?? 'other').toLowerCase()));
    return Array.from(cats).sort();
  }, [allFindings]);

  const filteredFindings = useMemo(() => {
    if (filterCategory === 'all') return allFindings;
    return allFindings.filter((f: ClinicalFinding) =>
      (f.category ?? '').toLowerCase() === filterCategory.toLowerCase()
    );
  }, [allFindings, filterCategory]);

  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newFinding: ClinicalFinding = {
      id: `f-${Date.now()}`,
      label: newLabel.trim(),
      category: newCategory as any,
      sourceDisplay: newSource,
      statusDisplay: 'Documented',
      description: newDescription.trim() || undefined,
      provenance: {
        sourceContext: 'Bedside clinician entry',
        recordedBy: currentPersona.name,
        recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provenanceType: 'Human-entered',
        verificationStatus: 'Verified',
      },
    };

    setLocalFindings((prev) => [newFinding, ...prev]);
    setNewLabel('');
    setNewDescription('');
    setIsAddOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Clinical Findings & Observations
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
            Structured discrete findings with explicit provenance tracking. Click any item to inspect metadata.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentPersona.allowedActions.canAddFindings && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="btn btn-sm btn-primary"
            >
              <Plus size={13} /> Add Clinical Finding
            </button>
          )}
        </div>
      </div>

      {/* Add Finding Modal (Section 22) */}
      {isAddOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-medium)',
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Add Clinical Finding
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Direct clinical entry. Provenance is automatically set to <strong>HUMAN_ENTERED</strong>.
            </p>

            <form onSubmit={handleAddFinding} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                >
                  <option value="symptom">Symptom (Patient-reported)</option>
                  <option value="sign">Sign (Physical examination)</option>
                  <option value="history">Medical History</option>
                  <option value="examination">Clinical Examination</option>
                  <option value="observation">Measurement / Observation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Finding Concept / Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Progressive exertional dyspnoea with nocturnal cough"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px', boxSizing: 'border-box', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Clinical Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or qualitative findings..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px', boxSizing: 'border-box', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Source Attribution
                </label>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="source"
                      checked={newSource === 'Clinical observation'}
                      onChange={() => setNewSource('Clinical observation')}
                    />
                    Clinical observation
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="source"
                      checked={newSource === 'Patient narrative'}
                      onChange={() => setNewSource('Patient narrative')}
                    />
                    Patient report
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Chips — derived from actual categories in the data */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['all', ...presentCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              border: 'none',
              background: filterCategory === cat ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: filterCategory === cat ? 'var(--accent-contrast)' : 'var(--text-secondary)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: filterCategory === cat ? 'var(--accent-primary)' : 'var(--border-subtle)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: filterCategory === cat ? 700 : 500,
              textTransform: 'capitalize',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Findings Table */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table className="clinical-table">
          <thead>
            <tr>
              <th>Finding / Clinical Concept</th>
              <th>Category</th>
              <th>Source</th>
              <th>Provenance Type</th>
              <th>Verification Status</th>
              <th style={{ textAlign: 'right' }}>Provenance Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredFindings.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {filterCategory === 'all'
                    ? 'No clinical findings recorded yet. Use “+ Add Clinical Finding” or add observations during intake.'
                    : `No findings in the “${filterCategory}” category yet.`}
                </td>
              </tr>
            ) : filteredFindings.map((f) => {
              const { verificationStatus, provenanceType, extractionModel } = f.provenance;
              return (
                <tr
                  key={f.id}
                  onClick={() => openFindingDrawer(f)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {f.label}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {f.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {f.sourceDisplay}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        background: provenanceType === 'AI-extracted' ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                        color: provenanceType === 'AI-extracted' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      {provenanceType}
                    </span>
                  </td>
                  <td>
                    {verificationStatus === 'Verified' ? (
                      <span className="badge badge-verified" style={{ gap: '3px' }}>
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    ) : verificationStatus === 'Rejected' ? (
                      <span className="badge badge-safety" style={{ gap: '3px' }}>
                        <XCircle size={11} /> Rejected
                      </span>
                    ) : (
                      <span className="badge badge-review" style={{ gap: '3px' }}>
                        <Clock size={11} /> Unverified
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFindingDrawer(f);
                      }}
                      className="btn btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      Inspect <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
