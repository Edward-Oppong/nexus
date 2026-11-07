// ============================================================
// src/features/authentication/LoginPage.tsx
// Professional Clinical System Authentication Entry
// Split 2-Panel Layout: Auth Form on Left & High-Fidelity
// Clinical Flight Deck Imagery & Value Showcase on the Right
// ============================================================

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  ShieldCheck,
  Activity,
  FileCheck2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('dr.sarah.chen@nexus-hospital.demo');
  const [password, setPassword] = useState('NexusDemo2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Quick fill helper for synthetic demo accounts
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsAuthenticating(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please verify your institutional credentials.'
            : error.message
        );
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMsg(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 480px) 1fr',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* ── LEFT PANEL: AUTHENTICATION FORM ────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 48px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          boxSizing: 'border-box',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Top Header: Brand & Theme Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-contrast)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                fontWeight: 800,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              ⬡
            </div>
            <div>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--text-primary)',
                }}
              >
                NEXUS
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginTop: '-2px',
                }}
              >
                Clinical Intelligence
              </span>
            </div>
          </div>

          <div style={{ width: '130px' }}>
            <ThemeToggle />
          </div>
        </div>

        {/* Central Auth Container */}
        <div style={{ maxWidth: '380px', width: '100%', margin: 'auto 0' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Sign in to your workstation
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Enter your institutional credentials to authenticate your clinical session.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '6px',
                marginBottom: '20px',
                backgroundColor: 'var(--danger-subtle)',
                border: '1px solid var(--danger-border)',
                color: 'var(--status-danger)',
                fontSize: '12px',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="clinical-email-input"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Institutional Email
              </label>
              <input
                id="clinical-email-input"
                type="email"
                required
                placeholder="clinician@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="clinical-password-input"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Password
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setErrorMsg('Institutional password resets are managed by your hospital IT directory service.')
                  }
                >
                  Forgot password?
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="clinical-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="•••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 13px',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-medium)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || loading}
              style={{
                marginTop: '10px',
                padding: '12px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-contrast)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isAuthenticating || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isAuthenticating) e.currentTarget.style.filter = 'brightness(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {isAuthenticating || loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <span>Authenticate & Access Workspace</span>
              )}
            </button>
          </form>

          {/* Quick-Fill Demo Personas */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Instant Demo Accounts</span>
              <span style={{ fontSize: '10px', color: 'var(--status-success)' }}>1-Click Load</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('dr.sarah.chen@nexus-hospital.demo', 'NexusDemo2026!')}
                style={{
                  padding: '9px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
              >
                <span>Dr. Sarah Chen</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>Attending Clinician</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@nexus-hospital.demo', 'NexusAdmin2026!')}
                style={{
                  padding: '9px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
              >
                <span>System Admin</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>Org Admin / CCIO</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Audit Assurance */}
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <Lock size={13} color="var(--status-success)" />
          <span>RLS & Cryptographic Audit Trails Active · EU MDR MDCG 2020-1 Compliant</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: HERO VISUAL SHOWCASE & CLINICAL FLIGHT DECK ── */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 64px',
          backgroundColor: '#070C18',
          color: '#F8FAFC',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(rgba(7, 12, 24, 0.75), rgba(7, 12, 24, 0.88)), url('/landing-clinician.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Subtle cyan-slate accent glow overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.35) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(129, 140, 248, 0.25) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Badges */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(56, 189, 248, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#38BDF8',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles size={12} />
            <span>Dual-Engine AI Reasoning</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(52, 211, 153, 0.16)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#34D399',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ShieldCheck size={12} />
            <span>100% Adversarial Tested</span>
          </div>
        </div>

        {/* Hero Value Statement */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', marginTop: '40px', marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
          >
            Evidence-grounded diagnostic intelligence for modern clinicians.
          </h2>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#CBD5E1',
              marginBottom: '32px',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            Nexus pairs multi-model clinical synthesis with deterministic CDS safety guardrails. Zero hallucinated findings, 100% provenance verification, and real-time PubMed literature grounding.
          </p>

          {/* Interactive Workstation Preview Graphic Card */}
          <div
            style={{
              borderRadius: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              backdropFilter: 'blur(16px)',
              padding: '22px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#38BDF8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                  Live Active Case Flight Deck
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(52, 211, 153, 0.2)',
                  color: '#34D399',
                  fontWeight: 700,
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                }}
              >
                18 RULES ACTIVE
              </span>
            </div>

            {/* Simulated Case Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: 'rgba(24, 34, 52, 0.85)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.7)' }}>
                <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Verified Findings
                </span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8' }}>14 Discrete</span>
              </div>
              <div style={{ backgroundColor: 'rgba(24, 34, 52, 0.85)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.7)' }}>
                <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Leading Differential
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#34D399' }}>Acute Appendicitis</span>
              </div>
              <div style={{ backgroundColor: 'rgba(24, 34, 52, 0.85)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.7)' }}>
                <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Literature Grounding
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FBBF24' }}>3 PubMed PMIDs</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#CBD5E1' }}>
              <CheckCircle2 size={13} color="#34D399" />
              <span>Full compliance with EU MDR MDCG 2020-1 clinician-in-the-loop mandate</span>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges Bar */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            color: '#CBD5E1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={16} color="#38BDF8" />
            <span>FHIR R4 Document Export</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#34D399" />
            <span>Zero Unverified AI Output</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#FBBF24" />
            <span>Real-Time Vital Telemetry</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
