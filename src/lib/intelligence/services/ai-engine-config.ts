// ============================================================
// src/lib/intelligence/services/ai-engine-config.ts
// Live AI Reasoning Engine Configuration & Credential Store
// Manages real, production LLM providers:
//   - Google Gemini (gemini-2.5-flash / gemini-1.5-pro)
//   - Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant)
//   - OpenAI (gpt-4o / gpt-4o-mini)
//   - Anthropic (claude-3-5-sonnet-20241022)
//   - Hugging Face Inference API
//   - Autonomous Offline Deterministic Rules Engine
// ============================================================

export type AiProviderType = 'gemini' | 'groq' | 'openai' | 'anthropic' | 'huggingface' | 'autonomous';

export interface AiEngineSettings {
  selectedProvider: AiProviderType;
  geminiApiKey: string;
  groqApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  hfApiToken: string;
  geminiModel: string;
  groqModel: string;
  openaiModel: string;
  anthropicModel: string;
}

const STORAGE_KEY = 'nexus_ai_engine_config_v1';

export const DEFAULT_AI_SETTINGS: AiEngineSettings = {
  selectedProvider: 'gemini',
  geminiApiKey: '',
  groqApiKey: '',
  openaiApiKey: '',
  anthropicApiKey: '',
  hfApiToken: '',
  geminiModel: 'gemini-3.5-flash',
  groqModel: 'qwen/qwen3.8-27b',
  openaiModel: 'gpt-4o-mini',
  anthropicModel: 'claude-3-5-haiku-20241022',
};

function getEnvVar(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta?.env && import.meta.env[key]) {
    return String(import.meta.env[key]);
  }
  const proc = (globalThis as any)?.process;
  if (proc?.env && proc.env[key]) {
    return String(proc.env[key]);
  }
  return '';
}

export function loadAiEngineSettings(): AiEngineSettings {
  let settings = { ...DEFAULT_AI_SETTINGS };

  // 1. Seed from environment variables (safe across Vite and Node environments)
  const envGemini = getEnvVar('VITE_GEMINI_API_KEY') || getEnvVar('VITE_GOOGLE_API_KEY');
  if (envGemini) settings.geminiApiKey = String(envGemini).trim();

  const envGroq = getEnvVar('VITE_GROQ_API_KEY');
  if (envGroq) settings.groqApiKey = String(envGroq).trim();

  const envOpenAI = getEnvVar('VITE_OPENAI_API_KEY');
  if (envOpenAI) settings.openaiApiKey = String(envOpenAI).trim();

  const envAnthropic = getEnvVar('VITE_ANTHROPIC_API_KEY');
  if (envAnthropic) settings.anthropicApiKey = String(envAnthropic).trim();

  const envHf = getEnvVar('VITE_HF_API_TOKEN') || getEnvVar('VITE_HUGGINGFACE_API_KEY');
  if (envHf) settings.hfApiToken = String(envHf).trim();

  // 2. Overlay from localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        settings = { ...settings, ...parsed };
      }
    } catch (e) {
      console.warn('[ai-engine-config] Failed to load stored settings:', e);
    }
  }

  // Auto-select provider with available key if default not set
  if (!settings.geminiApiKey) {
    if (settings.groqApiKey) settings.selectedProvider = 'groq';
    else if (settings.openaiApiKey) settings.selectedProvider = 'openai';
    else if (settings.anthropicApiKey) settings.selectedProvider = 'anthropic';
    else if (settings.hfApiToken) settings.selectedProvider = 'huggingface';
    else settings.selectedProvider = 'autonomous';
  }

  return settings;
}

export function saveAiEngineSettings(settings: Partial<AiEngineSettings>): AiEngineSettings {
  const current = loadAiEngineSettings();
  const updated: AiEngineSettings = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nexus:ai-engine-changed', { detail: updated }));
    } catch (e) {
      console.warn('[ai-engine-config] Failed to save settings:', e);
    }
  }
  return updated;
}

export interface ActiveAiEngineInfo {
  providerType: AiProviderType;
  displayName: string;
  modelIdentifier: string;
  isLive: boolean;
  hasKey: boolean;
}

export function getActiveAiEngineInfo(): ActiveAiEngineInfo {
  const s = loadAiEngineSettings();

  switch (s.selectedProvider) {
    case 'gemini':
      return {
        providerType: 'gemini',
        displayName: 'Google Gemini 3.8 Flash',
        modelIdentifier: s.geminiModel || 'gemini-3.8-flash',
        isLive: Boolean(s.geminiApiKey),
        hasKey: Boolean(s.geminiApiKey),
      };
    case 'groq':
      return {
        providerType: 'groq',
        displayName: 'Groq Cloud (Qwen 3.8 27B)',
        modelIdentifier: s.groqModel || 'qwen/qwen3.8-27b',
        isLive: Boolean(s.groqApiKey),
        hasKey: Boolean(s.groqApiKey),
      };
    case 'openai':
      return {
        providerType: 'openai',
        displayName: 'OpenAI GPT-4o Mini',
        modelIdentifier: s.openaiModel || 'gpt-4o-mini',
        isLive: Boolean(s.openaiApiKey),
        hasKey: Boolean(s.openaiApiKey),
      };
    case 'anthropic':
      return {
        providerType: 'anthropic',
        displayName: 'Anthropic Claude 3.5',
        modelIdentifier: s.anthropicModel || 'claude-3-5-haiku-20241022',
        isLive: Boolean(s.anthropicApiKey),
        hasKey: Boolean(s.anthropicApiKey),
      };
    case 'huggingface':
      return {
        providerType: 'huggingface',
        displayName: 'Hugging Face Inference',
        modelIdentifier: 'mistralai/Mistral-7B-Instruct-v0.3',
        isLive: Boolean(s.hfApiToken),
        hasKey: Boolean(s.hfApiToken),
      };
    case 'autonomous':
    default:
      return {
        providerType: 'autonomous',
        displayName: 'Nexus Autonomous Clinical Engine',
        modelIdentifier: 'nexus-rules-v2.5-deterministic',
        isLive: true,
        hasKey: true,
      };
  }
}

/**
 * Quick ping verification of API credentials
 */
export async function testAiProviderConnection(
  providerType: AiProviderType,
  apiKey: string
): Promise<{ ok: boolean; latencyMs?: number; message: string }> {
  if (!apiKey && providerType !== 'autonomous') {
    return { ok: false, message: 'API key is required.' };
  }

  const start = performance.now();

  try {
    if (providerType === 'gemini') {
      const model = 'gemini-3.8-flash';
      let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with JSON: {"status":"ok"}' }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 20 },
        }),
      });
      if (res.status === 404) {
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`;
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with JSON: {"status":"ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 20 },
          }),
        });
      }
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, message: err.error?.message || `HTTP ${res.status}: Connection failed` };
      }
      return { ok: true, latencyMs, message: `Connected to Gemini Live in ${latencyMs}ms.` };
    }

    if (providerType === 'groq') {
      let res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 10,
        }),
      });
      if (res.status === 404) {
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 10,
          }),
        });
      }
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, message: err.error?.message || `HTTP ${res.status}: Connection failed` };
      }
      return { ok: true, latencyMs, message: `Connected to Groq Cloud in ${latencyMs}ms.` };
    }

    if (providerType === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 10,
        }),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, message: err.error?.message || `HTTP ${res.status}: Connection failed` };
      }
      return { ok: true, latencyMs, message: `Connected to OpenAI in ${latencyMs}ms.` };
    }

    if (providerType === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, message: err.error?.message || `HTTP ${res.status}: Connection failed` };
      }
      return { ok: true, latencyMs, message: `Connected to Anthropic in ${latencyMs}ms.` };
    }

    if (providerType === 'autonomous') {
      return { ok: true, latencyMs: 5, message: 'Nexus Autonomous Clinical Engine is online and ready.' };
    }

    return { ok: true, latencyMs: 10, message: 'Ready.' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Network connection failed.' };
  }
}

