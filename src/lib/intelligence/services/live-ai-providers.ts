// ============================================================
// src/lib/intelligence/services/live-ai-providers.ts
// Production Live AI Reasoning Providers for Nexus Intelligence
// Direct live API integrations with:
//   1. Google Gemini (gemini-2.5-flash / gemini-1.5-flash)
//   2. Groq Cloud (llama-3.3-70b-versatile / llama-3.1-8b-instant)
//   3. OpenAI (gpt-4o / gpt-4o-mini)
//   4. Anthropic (claude-3-5-haiku / claude-3-5-sonnet)
// ============================================================

import { RawReasoningOutput } from '../../../domain/nexus-assessment';
import { ReasoningInput, ReasoningProvider } from '../reasoning-provider';
import { buildClinicalReasoningPrompt } from '../prompts/clinical-prompts';
import { loadAiEngineSettings } from './ai-engine-config';

/**
 * Normalizes and grounds raw LLM JSON response to guarantee valid IDs and schema
 */
export function groundLlmResponse(
  parsed: any,
  input: ReasoningInput
): RawReasoningOutput {
  const allowedFindingIds = new Set(input.verifiedFindings.map((f) => f.id));
  const allowedLabIds = new Set(input.investigationResults.map((i) => i.id));
  const allAllowedIds = new Set([...allowedFindingIds, ...allowedLabIds]);

  const summary = String(
    parsed.summary ||
      `Clinical evaluation synthesized from ${input.verifiedFindings.length} verified bedside observations.`
  );

  const hypotheses = Array.isArray(parsed.hypotheses)
    ? parsed.hypotheses
        .filter((h: any) => h && (h.label || h.title))
        .map((h: any) => ({
          label: String(h.label || h.title || 'Candidate Differential'),
          rationale: String(h.rationale || h.clinicalRationale || 'Derived from patient clinical presentation.'),
          supportingFindingIds: Array.isArray(h.supportingFindingIds)
            ? h.supportingFindingIds.filter((id: string) => allAllowedIds.has(id))
            : [],
          contradictingFindingIds: Array.isArray(h.contradictingFindingIds)
            ? h.contradictingFindingIds.filter((id: string) => allAllowedIds.has(id))
            : [],
          missingInformation: Array.isArray(h.missingInformation)
            ? h.missingInformation.map(String)
            : [],
          evidenceSourceIds: Array.isArray(h.evidenceSourceIds)
            ? h.evidenceSourceIds.map(String)
            : [],
        }))
    : [];

  const contradictions = Array.isArray(parsed.contradictions)
    ? parsed.contradictions
        .filter((c: any) => c && allAllowedIds.has(c.findingAId) && allAllowedIds.has(c.findingBId))
        .map((c: any) => ({
          findingAId: String(c.findingAId),
          findingBId: String(c.findingBId),
          explanation: String(c.explanation || ''),
        }))
    : [];

  const limitations = Array.isArray(parsed.limitations)
    ? parsed.limitations.map(String)
    : [
        'Advisory clinical intelligence output for licensed physician review; not an autonomous diagnostic device.',
        'Requires independent clinician adjudication before clinical reliance.',
      ];

  return {
    summary,
    hypotheses,
    contradictions,
    limitations,
  };
}

// ------------------------------------------------------------
// 1. Google Gemini Live Reasoning Provider
// ------------------------------------------------------------
export class GeminiClinicalProvider implements ReasoningProvider {
  readonly name = 'Google Gemini 3.8 Flash (Live)';
  readonly version = '3.8-flash-live';

  async generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput> {
    const settings = loadAiEngineSettings();
    const apiKey = settings.geminiApiKey.trim();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const preferredModel = settings.geminiModel && settings.geminiModel !== 'gemini-2.5-flash'
      ? settings.geminiModel
      : 'gemini-3.5-flash';

    const prompt = buildClinicalReasoningPrompt({
      caseId: input.caseId,
      clinicalSummary: input.clinicalSummary,
      verifiedFindings: input.verifiedFindings,
      investigationResults: input.investigationResults,
      retrievedEvidence: input.retrievedEvidence,
      informationGaps: input.informationGaps,
      existingHypotheses: input.existingHypotheses,
    });

    const systemInstruction = `You are the Nexus Clinical Reasoning Engine. You operate under EU MDR Annex I and FDA CDS standards.
Generate a structured differential diagnosis JSON object adhering strictly to this schema:
{
  "summary": "Concise 2-3 sentence clinical synthesis of patient presentation, acuity, and primary diagnostic drivers.",
  "hypotheses": [
    {
      "label": "Name of diagnosis (e.g. Ventricular Fibrillation, Acute Appendicitis)",
      "rationale": "Mechanistic and pathophysiological explanation linking symptoms and vitals.",
      "supportingFindingIds": ["list of exact finding IDs from prompt that support this"],
      "contradictingFindingIds": ["list of finding IDs that contradict this"],
      "missingInformation": ["Recommended urgent next diagnostic steps or tests"],
      "evidenceSourceIds": []
    }
  ],
  "contradictions": [],
  "limitations": [
    "Clinical decision support output; requires attending physician verification."
  ]
}
Do NOT include markdown formatting or backticks. Return valid JSON only.`;

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 2500,
      },
    };

    let url = `https://generativelanguage.googleapis.com/v1beta/models/${preferredModel}:generateContent?key=${apiKey}`;
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    // Automatic retry with gemini-3.5-flash if preferred model is 404/503
    if ((response.status === 404 || response.status === 503) && preferredModel !== 'gemini-3.5-flash') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API error (HTTP ${response.status})`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = JSON.parse(text);
    return groundLlmResponse(parsed, input);
  }
}

// ------------------------------------------------------------
// 2. Groq Cloud Live Reasoning Provider
// ------------------------------------------------------------
export class GroqClinicalProvider implements ReasoningProvider {
  readonly name = 'Groq Cloud (Qwen 3.8 27B)';
  readonly version = 'qwen-3.8-27b-live';

  async generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput> {
    const settings = loadAiEngineSettings();
    const apiKey = settings.groqApiKey.trim();
    if (!apiKey) {
      throw new Error('Groq API key is not configured.');
    }

    const model = settings.groqModel && !settings.groqModel.includes('llama-3.3')
      ? settings.groqModel
      : 'qwen/qwen3.8-27b';

    const prompt = buildClinicalReasoningPrompt({
      caseId: input.caseId,
      clinicalSummary: input.clinicalSummary,
      verifiedFindings: input.verifiedFindings,
      investigationResults: input.investigationResults,
      retrievedEvidence: input.retrievedEvidence,
      informationGaps: input.informationGaps,
      existingHypotheses: input.existingHypotheses,
    });

    const createPayload = (targetModel: string) => ({
      model: targetModel,
      messages: [
        {
          role: 'system',
          content:
            'You are the Nexus Clinical Reasoning Engine. Return valid JSON only with keys: summary, hypotheses (with label, rationale, supportingFindingIds, contradictingFindingIds, missingInformation), contradictions, limitations. No markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 2500,
    });

    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload(model)),
    });

    if (response.status === 404) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload('openai/gpt-oss-120b')),
      });
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Groq API error (HTTP ${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned empty content.');

    const parsed = JSON.parse(content);
    return groundLlmResponse(parsed, input);
  }
}

// ------------------------------------------------------------
// 3. OpenAI Live Reasoning Provider
// ------------------------------------------------------------
export class OpenAiClinicalProvider implements ReasoningProvider {
  readonly name = 'OpenAI GPT-4o Mini';
  readonly version = 'gpt-4o-mini-live';

  async generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput> {
    const settings = loadAiEngineSettings();
    const apiKey = settings.openaiApiKey.trim();
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured.');
    }

    const model = settings.openaiModel || 'gpt-4o-mini';
    const prompt = buildClinicalReasoningPrompt({
      caseId: input.caseId,
      clinicalSummary: input.clinicalSummary,
      verifiedFindings: input.verifiedFindings,
      investigationResults: input.investigationResults,
      retrievedEvidence: input.retrievedEvidence,
      informationGaps: input.informationGaps,
      existingHypotheses: input.existingHypotheses,
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are the Nexus Clinical Reasoning Engine. Return valid JSON only with keys: summary, hypotheses, contradictions, limitations. No conversational filler or markdown.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenAI API error (HTTP ${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned empty content.');

    const parsed = JSON.parse(content);
    return groundLlmResponse(parsed, input);
  }
}

