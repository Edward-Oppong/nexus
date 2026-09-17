// ============================================================
// src/features/authentication/LoginPage.tsx
// Professional Clinical System Authentication Entry
// Clean institutional login with account-driven role resolution
// ============================================================

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Institution / System Header ────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '6px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            ⬡
          </div>
          <span
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#0F172A',
            }}
          >
            NEXUS
          </span>
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748B',
            letterSpacing: '0.02em',
          }}
        >
          Clinical Intelligence Workstation
        </div>
      </div>

      {/* ── Main Authentication Box ────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
          padding: '36px 32px',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0F172A',
            margin: '0 0 6px 0',
            textAlign: 'left',
          }}
        >
          Sign in to your workspace
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#64748B',
            margin: '0 0 24px 0',
            lineHeight: 1.4,
          }}
        >
          Enter your institutional credentials to authenticate your session.
        </p>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '20px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '12px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="clinical-email-input"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Email
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
                padding: '10px 12px',
                borderRadius: '6px',
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0284C7';
                e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#CBD5E1';
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
                  color: '#334155',
                }}
              >
                Password
              </label>
              <span
                style={{
                  fontSize: '12px',
                  color: '#0284C7',
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
                  padding: '10px 38px 10px 12px',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0284C7';
                  e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1';
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
                  color: '#94A3B8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating || loading}
            style={{
              marginTop: '8px',
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #0F172A',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isAuthenticating || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isAuthenticating) e.currentTarget.style.backgroundColor = '#1E293B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0F172A';
            }}
          >
            {isAuthenticating || loading ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {/* Subtle separator for test accounts */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            Demo Accounts (Click to load)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('dr.sarah.chen@nexus-hospital.demo', 'NexusDemo2026!')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '5px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.12s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            >
              Dr. Sarah Chen (Clinician)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@nexus-hospital.demo', 'NexusAdmin2026!')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '5px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.12s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            >
              System Admin (Org Admin)
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer Trust Note ──────────────────────────────────── */}
      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        <Lock size={13} color="#64748B" />
        <span>Secure clinical environment · Organization RLS & audit logging active</span>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
