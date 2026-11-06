import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { TimelineActor, TimelineEventType } from '../../../domain/timeline';

export const TimelineTab: React.FC = () => {
  const { activeCase } = useCase();
  const { timeline } = activeCase;

  const getActorBadge = (actor: TimelineActor) => {
    switch (actor) {
      case 'NEXUS':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-medium)',
              padding: '2px 6px',
              borderRadius: '3px',
              letterSpacing: '0.04em',
            }}
          >
            ⬡ NEXUS AI
          </span>
        );
      case 'CLINICIAN':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-medium)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
          >
            CLINICIAN
          </span>
        );
      case 'NURSE':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              background: 'var(--success-subtle)',
              color: 'var(--status-success)',
              border: '1px solid var(--success-border)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
          >
            NURSE
          </span>
        );
      case 'LAB':
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-medium)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
          >
            LABORATORY
          </span>
        );
      default:
        return <span className="badge badge-neutral">{actor}</span>;
    }
  };

  const getEventBadge = (type: TimelineEventType) => {
    return (
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          padding: '1px 5px',
          borderRadius: '2px',
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Case Chronological Audit Trail
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Comprehensive event timeline with explicit audit separation between human clinical actions and autonomous AI clinical reasoning events.
        </p>
      </div>

      {/* Timeline Stream */}
      <div style={{ position: 'relative', paddingLeft: '32px' }}>
        {/* Continuous vertical line */}
        <div
          style={{
            position: 'absolute',
            left: '11px',
            top: '8px',
            bottom: '16px',
            width: '2px',
            background: 'var(--border-subtle)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {timeline.map((evt) => (
            <div key={evt.id} style={{ position: 'relative' }}>
              {/* Event node dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '-32px',
                  top: '4px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: evt.isNexusSimulated ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  border: `2px solid ${evt.isNexusSimulated ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: evt.isNexusSimulated ? 'var(--accent-primary)' : 'var(--text-primary)',
                }}
              >
                {evt.isNexusSimulated ? '⬡' : '•'}
              </div>

              {/* Event Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${evt.isNexusSimulated ? 'var(--border-medium)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {evt.time}
                    </span>
                    {getActorBadge(evt.actor)}
                    {getEventBadge(evt.eventType)}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      by <strong>{evt.actorName}</strong>
                    </span>
                  </div>

                  {evt.modelIdentifier && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Model: {evt.modelIdentifier}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {evt.title}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {evt.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
