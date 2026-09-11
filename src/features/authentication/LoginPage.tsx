// ============================================================
// src/features/authentication/LoginPage.tsx
// Section 6C.13: Clean, focused clinical workstation sign-in.
// No marketing fluff. Direct access with synthetic demo presets.
// ============================================================

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Shield, KeyRound, AlertTriangle, ArrowRight, Stethoscope } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('dr.sarah.chen@nexus-hospital.demo');
  const [password, setPassword] = useState('demo-password');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const { error } = await signIn(email, password);
    if (error) {
      setErrorMsg(error.message);
    } else if (onSuccess) {
      onSuccess();
    }
  };

  const handleQuickPersona = async (demoEmail: string) => {
    setEmail(demoEmail);
    const { error } = await signIn(demoEmail, 'demo-password');
    if (!error && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0f18',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
    }}>
      {/* Demo Warning Header */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '9999px',
        backgroundColor: 'rgba(234, 179, 8, 0.12)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        color: '#facc15',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: '28px',
      }}>
        <AlertTriangle size={14} />
        Demo Environment · Synthetic Clinical Data Only
      </div>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#111927',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '36px 32px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}>
            <Stethoscope size={20} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.06em', color: '#f8fafc' }}>
            NEXUS
          </span>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          margin: '0 0 28px 0',
          lineHeight: '1.5',
        }}>
          Clinical intelligence for better-informed decisions
        </p>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#f87171',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Professional Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '11px',
              borderRadius: '6px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign in to Workstation
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <a
            href="#forgot"
            onClick={(e) => { e.preventDefault(); alert('In the demo environment, use any of the preset personas below.'); }}
            style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}
          >
            Forgot password?
          </a>
        </div>

        {/* Quick Demo Personas */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Quick Demo Sign-In
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickPersona('dr.sarah.chen@nexus-hospital.demo')}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <strong>Dr. Sarah Chen</strong>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Clinician · Lead</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPersona('prof.marcus.vance@nexus-hospital.demo')}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <strong>Prof. M. Vance</strong>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Reviewer · Consultant</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPersona('nurse.elena.rostova@nexus-hospital.demo')}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <strong>Elena Rostova, RN</strong>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Triage Nurse</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPersona('admin@nexus-hospital.demo')}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <strong>Administrator</strong>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Org Admin (Non-Clinical)</div>
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Shield size={14} />
        PostgreSQL Row Level Security (RLS) Enforced · Zero Implicit Trust
      </div>
    </div>
  );
};
