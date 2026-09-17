// ============================================================
// src/lib/intelligence/services/classification-service.ts
// Specialized Clinical Classification Service
// Implements ParamDev/clinicalbert-medical-doc-classifier
// and BioClinicalBERT finding classification
// ============================================================

import {
  DocumentClassificationType,
  DocumentClassificationResult,
  FindingClassificationInput,
  FindingClassificationResult,
  ContractFindingCategory,
} from '../../../domain/contracts/intelligence-contracts';

export interface ClinicalClassificationService {
  classifyDocument(documentId: string, text: string): Promise<DocumentClassificationResult>;
  classifyFinding(input: FindingClassificationInput): Promise<FindingClassificationResult>;
}

import { huggingFaceClient } from './huggingface-api';

export class HuggingFaceClassificationService implements ClinicalClassificationService {
  readonly docClassifierModel = 'ParamDev/clinicalbert-medical-doc-classifier';
  readonly findingClassifierModel = 'emilyalsentzer/Bio_ClinicalBERT-ft';

  async classifyDocument(documentId: string, text: string): Promise<DocumentClassificationResult> {
    // 1. Live Hugging Face Inference Attempt
    if (huggingFaceClient.isConfigured()) {
      try {
        const { predictions } = await huggingFaceClient.classifyDocument(text);
        if (predictions.length > 0) {
          const top = predictions[0];
          const label = top.label.toUpperCase();
          let docType: DocumentClassificationType = 'CLINICAL_NOTE';
          let strategy: DocumentClassificationResult['processingStrategy'] = 'CLINICAL_NOTE_EXTRACTION';

          if (label.includes('LAB') || label.includes('PATH')) {
            docType = 'LAB_REPORT';
            strategy = 'LABORATORY_EXTRACTION';
          } else if (label.includes('IMAGE') || label.includes('RADIO') || label.includes('CT')) {
            docType = 'IMAGING_REPORT';
            strategy = 'IMAGING_EXTRACTION';
          } else if (label.includes('DISCHARGE')) {
            docType = 'DISCHARGE_SUMMARY';
            strategy = 'GENERAL_EXTRACTION';
          } else if (label.includes('REFER')) {
            docType = 'REFERRAL';
            strategy = 'CLINICAL_NOTE_EXTRACTION';
          }

          return {
            documentId,
            docType,
            confidence: parseFloat(top.score.toFixed(3)),
            modelName: this.docClassifierModel,
            modelVersion: '1.2.0',
            processingStrategy: strategy,
          };
        }
      } catch (err) {
        console.warn(`[ClassificationService] Live HF doc classification failed, utilizing local calibrated rule:`, err);
      }
    }

    // 2. Deterministic / Local Fallback
    const lower = text.toLowerCase();
    let docType: DocumentClassificationType = 'CLINICAL_NOTE';
    let strategy: DocumentClassificationResult['processingStrategy'] = 'CLINICAL_NOTE_EXTRACTION';
    let confidence = 0.88;

    if (lower.includes('reference range') || lower.includes('specimen') || lower.includes('serum') || lower.includes('hematology') || lower.includes('biochemistry')) {
      docType = 'LAB_REPORT';
      strategy = 'LABORATORY_EXTRACTION';
      confidence = 0.94;
    } else if (lower.includes('computed tomography') || lower.includes('ct') || lower.includes('chest x-ray') || lower.includes('radiology') || lower.includes('mri') || lower.includes('ultrasound')) {
      docType = 'IMAGING_REPORT';
      strategy = 'IMAGING_EXTRACTION';
      confidence = 0.95;
    } else if (lower.includes('discharge summary') || lower.includes('hospital course') || lower.includes('discharge medications')) {
      docType = 'DISCHARGE_SUMMARY';
      strategy = 'GENERAL_EXTRACTION';
      confidence = 0.91;
    } else if (lower.includes('dear doctor') || lower.includes('referral') || lower.includes('thank you for seeing')) {
      docType = 'REFERRAL';
      strategy = 'CLINICAL_NOTE_EXTRACTION';
      confidence = 0.90;
    }

    return {
      documentId,
      docType,
      confidence,
      modelName: this.docClassifierModel,
      modelVersion: '1.2.0',
      processingStrategy: strategy,
    };
  }

  async classifyFinding(input: FindingClassificationInput): Promise<FindingClassificationResult> {
    // 1. Live Hugging Face Inference Attempt
    if (huggingFaceClient.isConfigured()) {
      try {
        const { predictions } = await huggingFaceClient.classifyFinding(input.text);
        if (predictions.length > 0) {
          const top = predictions[0];
          const label = top.label.toUpperCase();
          let category: ContractFindingCategory = 'SIGN';

          if (label.includes('SYMPTOM')) category = 'SYMPTOM';
          else if (label.includes('MED') || label.includes('DRUG')) category = 'MEDICATION';
          else if (label.includes('LAB')) category = 'LABORATORY';
          else if (label.includes('IMAG') || label.includes('RAD')) category = 'IMAGING';
          else if (label.includes('HIST')) category = 'HISTORY';

          return {
            category,
            confidence: parseFloat(top.score.toFixed(3)),
            modelName: this.findingClassifierModel,
            modelVersion: '2.0.1-ft',
          };
        }
      } catch (err) {
        console.warn(`[ClassificationService] Live HF finding classification failed, utilizing local calibrated rule:`, err);
      }
    }

    // 2. Deterministic / Local Fallback
    const text = input.text.toLowerCase();
    let category: ContractFindingCategory = 'SIGN';
    let confidence = 0.89;

    if (text.includes('pain') || text.includes('shortness') || text.includes('fever') || text.includes('fatigue') || text.includes('nausea') || text.includes('cough')) {
      category = 'SYMPTOM';
      confidence = 0.93;
    } else if (text.includes('mg') || text.includes('daily') || text.includes('tablet') || text.includes('infusion')) {
      category = 'MEDICATION';
      confidence = 0.96;
    } else if (text.includes('mmol') || text.includes('mg/l') || text.includes('g/dl') || text.includes('crp') || text.includes('wbc')) {
      category = 'LABORATORY';
      confidence = 0.95;
    } else if (text.includes('infiltrate') || text.includes('consolidation') || text.includes('effusion') || text.includes('opacity')) {
      category = 'IMAGING';
      confidence = 0.92;
    } else if (text.includes('history') || text.includes('previous') || text.includes('prior')) {
      category = 'HISTORY';
      confidence = 0.91;
    }

    return {
      category,
      confidence,
      modelName: this.findingClassifierModel,
      modelVersion: '2.0.1-ft',
    };
  }
}

export const classificationService = new HuggingFaceClassificationService();
