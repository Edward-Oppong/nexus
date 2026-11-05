import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  AiProviderType,
  AiEngineSettings,
  loadAiEngineSettings,
  saveAiEngineSettings,
  testAiProviderConnection,
} from '../../lib/intelligence/services/ai-engine-config';

interface AiEngineConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (settings: AiEngineSettings) => void;
}

export const AiEngineConfigModal: React.FC<AiEngineConfigModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<AiEngineSettings>(loadAiEngineSettings());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadAiEngineSettings());
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentKey =
    settings.selectedProvider === 'gemini'
      ? settings.geminiApiKey
      : settings.selectedProvider === 'groq'
      ? settings.groqApiKey
      : settings.selectedProvider === 'openai'
      ? settings.openaiApiKey
      : settings.selectedProvider === 'anthropic'
      ? settings.anthropicApiKey
      : settings.selectedProvider === 'huggingface'
      ? settings.hfApiToken
      : '';

  const handleKeyChange = (val: string) => {
    const trimmed = val.trim();
    if (settings.selectedProvider === 'gemini') {
      setSettings((prev) => ({ ...prev, geminiApiKey: trimmed }));
    } else if (settings.selectedProvider === 'groq') {
      setSettings((prev) => ({ ...prev, groqApiKey: trimmed }));
    } else if (settings.selectedProvider === 'openai') {
      setSettings((prev) => ({ ...prev, openaiApiKey: trimmed }));
    } else if (settings.selectedProvider === 'anthropic') {
      setSettings((prev) => ({ ...prev, anthropicApiKey: trimmed }));
    } else if (settings.selectedProvider === 'huggingface') {
      setSettings((prev) => ({ ...prev, hfApiToken: trimmed }));
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testAiProviderConnection(settings.selectedProvider, currentKey);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const updated = saveAiEngineSettings(settings);
    setSaveSuccess(true);
    if (onSettingsSaved) onSettingsSaved(updated);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Nexus Live AI Reasoning Engine
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>
                Connect real-time clinical LLMs for zero-simulation diagnostic synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Provider Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              Select Active AI Reasoning Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'gemini', label: 'Google Gemini', sub: '3.8 Flash (Live Cloud)', tag: 'Recommended' },
                { id: 'groq', label: 'Groq Cloud', sub: 'Qwen 3.8 27B (Live)', tag: 'Ultra-Fast' },
                { id: 'openai', label: 'OpenAI', sub: 'GPT-4o Mini', tag: 'Standard' },
                { id: 'anthropic', label: 'Anthropic', sub: 'Claude 3.5 Haiku', tag: 'Advanced' },
                { id: 'huggingface', label: 'Hugging Face', sub: 'Mistral-7B / Pro', tag: 'Serverless' },
                { id: 'autonomous', label: 'Autonomous Rules', sub: 'Offline Deterministic', tag: 'Offline' },
              ].map((p) => {
                const isSelected = settings.selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, selectedProvider: p.id as AiProviderType }));
                      setTestResult(null);
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? '#0284C7' : '#E2E8F0'}`,
                      background: isSelected ? '#F0F9FF' : '#F8FAFC',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#0284C7' : '#1E293B' }}>
                        {p.label}
                      </span>
                      {isSelected && <CheckCircle2 size={13} color="#0284C7" />}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          {settings.selectedProvider !== 'autonomous' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={13} color="#0284C7" />
                  {settings.selectedProvider === 'gemini'
                    ? 'Google Gemini API Key'
                    : settings.selectedProvider === 'groq'
                    ? 'Groq Cloud API Key'
                    : settings.selectedProvider === 'openai'
                    ? 'OpenAI API Key'
                    : settings.selectedProvider === 'anthropic'
                    ? 'Anthropic API Key'
                    : 'Hugging Face User Access Token'}
                </label>

                {/* Direct link to get key */}
                {settings.selectedProvider === 'gemini' && (
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Get Free Key <ExternalLink size={10} />
                  </a>
                )}
                {settings.selectedProvider === 'groq' && (
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Get Free Groq Key <ExternalLink size={10} />
                  </a>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={currentKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder={
                    settings.selectedProvider === 'gemini'
                      ? 'AIzaSy...'
                      : settings.selectedProvider === 'groq'
                      ? 'gsk_...'
                      : settings.selectedProvider === 'openai'
                      ? 'sk-...'
                      : 'hf_...'
                  }
                  style={{
                    width: '100%',
                    padding: '9px 40px 9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748B' }}>
                Stored locally in your browser and used strictly for direct HTTPS calls to {settings.selectedProvider.toUpperCase()} API. Never shared with third parties.
              </p>
            </div>
          )}

          {/* Test Status Banner */}
          {testResult && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: testResult.ok ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${testResult.ok ? '#6EE7B7' : '#FCA5A5'}`,
                color: testResult.ok ? '#065F46' : '#991B1B',
              }}
            >
              {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span style={{ fontWeight: 600 }}>{testResult.message}</span>
            </div>
          )}

          {/* Autonomous Mode Note */}
          {settings.selectedProvider === 'autonomous' && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                color: '#334155',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
            >
              <Cpu size={16} color="#0F766E" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#0F172A' }}>Nexus Autonomous Clinical Engine</strong>
                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B', lineHeight: 1.4 }}>
                  Runs high-acuity ESI 1–5 triage stratification, vital danger zones, and 18 deterministic clinical safety boundary checks without external cloud dependencies.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {settings.selectedProvider !== 'autonomous' ? (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !currentKey}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: 600,
                cursor: testing || !currentKey ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: !currentKey ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: saveSuccess ? '#059669' : '#0284C7',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.15s ease',
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={14} /> Saved & Active!
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Save & Activate Engine
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

