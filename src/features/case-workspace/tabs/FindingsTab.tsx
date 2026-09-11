import React, { useState } from 'react';
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
  const filteredFindings = filterCategory === 'all'
    ? allFindings
    : allFindings.filter((f: ClinicalFinding) =>
        f.category === filterCategory ||
        f.category === filterCategory.toUpperCase()
      );

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
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Clinical Findings & Observations
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', marginBottom: 0 }}>
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
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E2E8F0',
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Add Clinical Finding
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
              Direct clinical entry. Provenance is automatically set to <strong>HUMAN_ENTERED</strong>.
            </p>

            <form onSubmit={handleAddFinding} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
                >
                  <option value="symptom">Symptom (Patient-reported)</option>
                  <option value="sign">Sign (Physical examination)</option>
                  <option value="history">Medical History</option>
                  <option value="examination">Clinical Examination</option>
                  <option value="observation">Measurement / Observation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                  Finding Concept / Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Progressive exertional dyspnoea with nocturnal cough"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                  Clinical Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or qualitative findings..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                  Source Attribution
                </label>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#334155' }}>
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
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', background: '#0284C7', color: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {['all', 'symptom', 'sign', 'vital', 'history'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              border: 'none',
              background: filterCategory === cat ? '#0F172A' : '#FFFFFF',
              color: filterCategory === cat ? '#FFFFFF' : '#475569',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: filterCategory === cat ? '#0F172A' : '#E2E8F0',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: filterCategory === cat ? 600 : 500,
              textTransform: 'capitalize',
              cursor: 'pointer',
            }}
          >
            {cat === 'all' ? 'All categories' : cat}
          </button>
        ))}
      </div>

      {/* Findings Table */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
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
            {filteredFindings.map((f) => {
              const { verificationStatus, provenanceType, extractionModel } = f.provenance;
              return (
                <tr
                  key={f.id}
                  onClick={() => openFindingDrawer(f)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>
                    {f.label}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: '#64748B',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {f.category}
                    </span>
                  </td>
                  <td style={{ color: '#334155' }}>
                    {f.sourceDisplay}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        background: provenanceType === 'AI-extracted' ? '#0F172A' : '#F1F5F9',
                        color: provenanceType === 'AI-extracted' ? '#38BDF8' : '#334155',
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
