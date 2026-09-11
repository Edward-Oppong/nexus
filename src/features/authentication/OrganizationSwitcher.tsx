// ============================================================
// src/features/authentication/OrganizationSwitcher.tsx
// Section 6C.15: Organization Multi-Tenancy Switcher
// Switches active organization context across all queries and views.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, DEMO_ORGANIZATIONS } from './AuthProvider';
import { Building2, ChevronDown, Check } from 'lucide-react';

export const OrganizationSwitcher: React.FC = () => {
  const { activeOrganization, switchOrganization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#e2e8f0',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="Switch Organization Tenant"
      >
        <Building2 size={14} style={{ color: '#38bdf8' }} />
        <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeOrganization?.name || 'Select Organization'}
        </span>
        <ChevronDown size={12} style={{ color: '#94a3b8' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '260px',
            backgroundColor: '#111927',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            overflow: 'hidden',
            padding: '4px',
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748b',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '4px',
            }}
          >
            Assigned Organizations
          </div>

          {DEMO_ORGANIZATIONS.map((org) => {
            const isSelected = org.id === activeOrganization?.id;
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => {
                  switchOrganization(org.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'transparent',
                  border: 'none',
                  color: isSelected ? '#38bdf8' : '#cbd5e1',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease',
                }}
              >
                <div>
                  <div style={{ fontWeight: isSelected ? 700 : 500 }}>{org.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{org.organizationType} · {org.countryCode}</div>
                </div>
                {isSelected && <Check size={14} style={{ color: '#38bdf8' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
