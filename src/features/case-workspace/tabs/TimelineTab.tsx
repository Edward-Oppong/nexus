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
              background: '#0F172A',
              color: '#38BDF8',
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
              background: '#EFF6FF',
              color: '#1E40AF',
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
              background: '#F0FDF4',
              color: '#15803D',
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
              background: '#FAF5FF',
              color: '#6B21A8',
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
          color: '#64748B',
          background: '#F1F5F9',
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
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
          Case Chronological Audit Trail
        </h2>
        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Comprehensive event timeline with explicit separation between human clinical actions and simulated machine inferences.
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
            background: '#E2E8F0',
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
                  background: evt.isNexusSimulated ? '#0F172A' : '#FFFFFF',
                  border: `2px solid ${evt.isNexusSimulated ? '#38BDF8' : '#0F172A'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: evt.isNexusSimulated ? '#38BDF8' : '#0F172A',
                }}
              >
                {evt.isNexusSimulated ? '⬡' : '•'}
              </div>

              {/* Event Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${evt.isNexusSimulated ? '#CBD5E1' : '#E2E8F0'}`,
                  borderRadius: '6px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      {evt.time}
                    </span>
                    {getActorBadge(evt.actor)}
                    {getEventBadge(evt.eventType)}
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      by <strong>{evt.actorName}</strong>
                    </span>
                  </div>

                  {evt.modelIdentifier && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: '#64748B',
                      }}
                    >
                      Model: {evt.modelIdentifier}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                  {evt.title}
                </div>

                <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
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
