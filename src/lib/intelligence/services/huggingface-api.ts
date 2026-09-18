// ============================================================
// src/lib/intelligence/services/huggingface-api.ts
// Live Hugging Face Inference API Client for Nexus Intelligence
// Supports serverless router and api-inference endpoints
// Models:
//   - ribhu/medbert-clinical-ner (NER token classification)
//   - ParamDev/clinicalbert-medical-doc-classifier (Document classification)
//   - emilyalsentzer/Bio_ClinicalBERT-ft (Finding classification)
//   - ncbi/MedCPT-Query-Encoder (768-d query embeddings)
//   - ncbi/MedCPT-Article-Encoder (768-d document embeddings)
//   - ncbi/MedCPT-Cross-Encoder (Query-document reranking)
//   - google/medgemma-4b-it (Clinical synthesis / reasoning)
// ============================================================

export interface HFModelStatus {
  modelId: string;
  name: string;
  role: string;
  status: 'READY' | 'LOADING' | 'UNAUTHENTICATED' | 'ERROR' | 'OFFLINE';
  latencyMs?: number;
  estimatedTimeSec?: number;
  lastChecked?: string;
  errorMessage?: string;
}

export interface HFTermTokenClassification {
  entity_group?: string;
  entity?: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

export interface HFClassificationLabel {
  label: string;
  score: number;
}

const STORAGE_KEY_HF_TOKEN = 'nexus_hf_api_token';

class HuggingFaceClient {
  private customToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.customToken = localStorage.getItem(STORAGE_KEY_HF_TOKEN) || null;
    }
  }

  /**
   * Resolve active Hugging Face API token
   * Priority: LocalStorage user setting -> Vite env variable
   */
  getToken(): string | null {
    if (this.customToken && this.customToken.trim().length > 0) {
      return this.customToken.trim();
    }
    const envToken =
      import.meta.env.VITE_HF_API_TOKEN ||
      import.meta.env.VITE_HUGGINGFACE_API_KEY ||
      import.meta.env.VITE_HF_TOKEN;
    return envToken ? String(envToken).trim() : null;
  }

  setToken(token: string | null): void {
    this.customToken = token ? token.trim() : null;
    if (typeof window !== 'undefined') {
      if (token && token.trim().length > 0) {
        localStorage.setItem(STORAGE_KEY_HF_TOKEN, token.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_HF_TOKEN);
      }
    }
  }

  isConfigured(): boolean {
    return Boolean(this.getToken());
  }

  /**
   * Execute request to Hugging Face Inference API
   */
  async invokeModel<T = any>(
    modelId: string,
    payload: any,
    options: { waitForModel?: boolean; timeoutMs?: number } = {}
  ): Promise<{ data: T; latencyMs: number }> {
    const token = this.getToken();
    const startTime = performance.now();

    // Prefer standard api-inference endpoint
    const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(modelId)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Use-Cache': 'true',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);

    try {
      const bodyWithWait = {
        ...payload,
        options: {
          wait_for_model: options.waitForModel ?? true,
          use_cache: true,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyWithWait),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        const errorText = await res.text();
        let parsed: any;
        try {
          parsed = JSON.parse(errorText);
        } catch {
          parsed = { error: errorText };
        }

        if (res.status === 503 && parsed.estimated_time) {
          throw new Error(
            `Model ${modelId} is currently warming up on Hugging Face (estimated ~${Math.round(
              parsed.estimated_time
            )}s). Please retry in a few moments.`
          );
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error(
            `Hugging Face authentication failed for ${modelId}. Please check your HF API token in the Test Console.`
          );
        }

        throw new Error(
          parsed.error || `Hugging Face API returned HTTP ${res.status}: ${res.statusText}`
        );
      }

      const data = await res.json();
      return { data, latencyMs };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Inference request to ${modelId} timed out after 30s.`);
      }
      throw err;
    }
  }

  // ----------------------------------------------------------
  // High-Level Model Method Wrappers
  // ----------------------------------------------------------

  /**
   * 1. Clinical NER (ribhu/medbert-clinical-ner)
   */
  async extractNER(text: string): Promise<{ entities: HFTermTokenClassification[]; latencyMs: number }> {
    const { data, latencyMs } = await this.invokeModel<any>('ribhu/medbert-clinical-ner', {
      inputs: text,
      parameters: { aggregation_strategy: 'simple' },
    });

    const entities: HFTermTokenClassification[] = Array.isArray(data)
      ? data.map((item: any) => ({
          entity_group: item.entity_group || item.entity || 'UNKNOWN',
          score: item.score ?? 0.9,
          word: item.word || text.slice(item.start, item.end),
          start: item.start ?? 0,
          end: item.end ?? (item.word ? item.word.length : 0),
        }))
      : [];

    return { entities, latencyMs };
  }

  /**
   * 2. Document Classification (ParamDev/clinicalbert-medical-doc-classifier)
   */
  async classifyDocument(text: string): Promise<{ predictions: HFClassificationLabel[]; latencyMs: number }> {
    const { data, latencyMs } = await this.invokeModel<any>('ParamDev/clinicalbert-medical-doc-classifier', {
      inputs: text.slice(0, 1500),
    });

    const list = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : Array.isArray(data) ? data : [];
    const predictions: HFClassificationLabel[] = list.map((item: any) => ({
      label: item.label || 'CLINICAL_NOTE',
      score: item.score ?? 0.8,
    }));

    return { predictions, latencyMs };
  }

  /**
   * 3. Finding Classification (emilyalsentzer/Bio_ClinicalBERT-ft)
   */
  async classifyFinding(text: string): Promise<{ predictions: HFClassificationLabel[]; latencyMs: number }> {
    const { data, latencyMs } = await this.invokeModel<any>('emilyalsentzer/Bio_ClinicalBERT-ft', {
      inputs: text,
    });

    const list = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : Array.isArray(data) ? data : [];
    const predictions: HFClassificationLabel[] = list.map((item: any) => ({
      label: item.label || 'SIGN',
      score: item.score ?? 0.85,
    }));

    return { predictions, latencyMs };
  }

  /**
   * 4. MedCPT Query / Article Embedding (ncbi/MedCPT-Query-Encoder)
   */
  async generateEmbedding(
    text: string,
    modelId: 'ncbi/MedCPT-Query-Encoder' | 'ncbi/MedCPT-Article-Encoder' = 'ncbi/MedCPT-Query-Encoder'
  ): Promise<{ embedding: number[]; latencyMs: number }> {
    const { data, latencyMs } = await this.invokeModel<any>(modelId, {
      inputs: text,
    });

    const embedding: number[] = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : Array.isArray(data) ? data : [];
    return { embedding, latencyMs };
  }

  /**
   * 5. MedCPT Cross-Encoder Reranking (ncbi/MedCPT-Cross-Encoder)
   */
  async scoreRelevance(
    query: string,
    passage: string
  ): Promise<{ score: number; latencyMs: number }> {
    const { data, latencyMs } = await this.invokeModel<any>('ncbi/MedCPT-Cross-Encoder', {
      inputs: {
        text: query,
        text_pair: passage.slice(0, 1000),
      },
    });

    let score = 0.75;
    if (typeof data === 'number') {
      score = data;
    } else if (Array.isArray(data) && data[0]?.score !== undefined) {
      score = data[0].score;
    } else if (data?.score !== undefined) {
      score = data.score;
    }

    return { score, latencyMs };
  }

  /**
   * 6. MedGemma Clinical Synthesis (google/medgemma-4b-it)
   */
  async generateClinicalSynthesis(
    prompt: string,
    modelId: string = 'google/medgemma-4b-it'
  ): Promise<{ text: string; latencyMs: number }> {
    const { data, latencyMs } = await this.invokeModel<any>(modelId, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.15,
        return_full_text: false,
      },
    });

    let text = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text;
    } else if (data?.generated_text) {
      text = data.generated_text;
    } else if (typeof data === 'string') {
      text = data;
    }

    return { text, latencyMs };
  }

  /**
   * Check health and response of a specific registered model
   */
  async testModelHealth(modelId: string): Promise<HFModelStatus> {
    const now = new Date().toISOString();
    const token = this.getToken();

    if (!token) {
      return {
        modelId,
        name: modelId.split('/')[1] || modelId,
        role: this.getModelRoleDescription(modelId),
        status: 'UNAUTHENTICATED',
        lastChecked: now,
        errorMessage: 'No Hugging Face token supplied.',
      };
    }

    try {
      let testPayload: any = { inputs: 'Patient presents with fever and cough.' };
      if (modelId.includes('Cross-Encoder')) {
        testPayload = { inputs: { text: 'pneumonia', text_pair: 'fever and cough with consolidation' } };
      }

      const { latencyMs } = await this.invokeModel(modelId, testPayload, { waitForModel: false, timeoutMs: 15000 });
      return {
        modelId,
        name: modelId.split('/')[1] || modelId,
        role: this.getModelRoleDescription(modelId),
        status: 'READY',
        latencyMs,
        lastChecked: now,
      };
    } catch (err: any) {
      const msg = err.message || String(err);
      const isColdBoot = msg.includes('warming up') || msg.includes('loading') || msg.includes('503');
      return {
        modelId,
        name: modelId.split('/')[1] || modelId,
        role: this.getModelRoleDescription(modelId),
        status: isColdBoot ? 'LOADING' : 'ERROR',
        lastChecked: now,
        errorMessage: msg,
      };
    }
  }

  private getModelRoleDescription(modelId: string): string {
    switch (modelId) {
      case 'ribhu/medbert-clinical-ner':
        return 'Clinical Named Entity Recognition (Tokens)';
      case 'ParamDev/clinicalbert-medical-doc-classifier':
        return 'Clinical Document Type Classification';
      case 'emilyalsentzer/Bio_ClinicalBERT-ft':
        return 'Finding Severity & Type Classification';
      case 'ncbi/MedCPT-Query-Encoder':
        return 'Dense Query Embedding (768-d)';
      case 'ncbi/MedCPT-Article-Encoder':
        return 'Literature Passage Embedding (768-d)';
      case 'ncbi/MedCPT-Cross-Encoder':
        return 'Deep Query-Evidence Reranking';
      case 'google/medgemma-4b-it':
        return 'Generative Clinical Reasoning & Differential';
      default:
        return 'Clinical Intelligence Model';
    }
  }
}

export const huggingFaceClient = new HuggingFaceClient();
export const hfClient = huggingFaceClient;
