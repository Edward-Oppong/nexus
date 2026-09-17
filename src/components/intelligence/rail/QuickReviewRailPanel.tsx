// ============================================================
// src/components/intelligence/rail/QuickReviewRailPanel.tsx
// Core Rail Function 5: "In-Rail Review Queue"
// Directly adjudicate AI-extracted findings without leaving the case
// Accept / Edit / Reject with instant provenance audit trail
// ============================================================

import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { CheckCircle2, XCircle, FileEdit, ArrowRight } from 'lucide-react';

export const QuickReviewRailPanel: React.FC = () => {
  const { activeCase, updateFindingStatus, setActiveCaseSubTab } = useCase();
  const { findings } = activeCase;

  const unreviewedFindings = findings.filter(
    (f) => f.provenance.verificationStatus === 'Unverified'
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');

  if (unreviewedFindings.length === 0) {
    return (
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '12px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', marginBottom: '4px' }}>
          Review Queue
        </div>
        <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} />
          All AI candidate findings verified
        </div>
      </section>
    );
  }

  const currentItem = unreviewedFindings[0];

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#0F172A',
          }}
        >
          Review Required ({unreviewedFindings.length})
        </span>
        <button
          onClick={() => setActiveCaseSubTab('findings')}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '10px',
            fontWeight: 600,
            color: '#2563EB',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          Manage All <ArrowRight size={10} />
        </button>
      </div>

      <div
        style={{
          padding: '8px 10px',
          borderRadius: '5px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#B45309',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            AI-EXTRACTED CANDIDATE
          </span>
          <span style={{ fontSize: '10px', color: '#78350F' }}>
            {currentItem.provenance.sourceContext || 'Clinical Record'}
          </span>
        </div>

        {editingId === currentItem.id ? (
          <div>
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '3px',
                border: '1px solid #3B82F6',
              }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingId(null)}
                style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid #CBD5E1', background: '#FFF' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateFindingStatus(currentItem.id, 'Verified');
                  setEditingId(null);
                }}
                style={{ fontSize: '10px', padding: '2px 6px', background: '#0284C7', color: '#FFF', border: 'none' }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
            "{currentItem.label}"
          </div>
        )}

        {/* Action Buttons: Accept / Edit / Reject */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <button
            onClick={() => updateFindingStatus(currentItem.id, 'Verified')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #10B981',
              background: '#FFFFFF',
              color: '#059669',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <CheckCircle2 size={11} /> Accept
          </button>
          <button
            onClick={() => {
              setEditingId(currentItem.id);
              setEditedText(currentItem.label);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #3B82F6',
              background: '#FFFFFF',
              color: '#1D4ED8',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <FileEdit size={11} /> Edit
          </button>
          <button
            onClick={() => updateFindingStatus(currentItem.id, 'Rejected', 'Clinician rejected AI finding')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #EF4444',
              background: '#FFFFFF',
              color: '#DC2626',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <XCircle size={11} /> Reject
          </button>
        </div>
      </div>
    </section>
  );
};
