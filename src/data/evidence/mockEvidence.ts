import { EvidenceItem } from '../../domain/evidence';

// Evidence is retrieved live from PubMed/Europe PMC via evidence-service.ts.
// No static mock items are stored here — all evidence is case-specific and
// dynamically ranked at analysis time via MedCPT + live PubMed retrieval.
export const MOCK_EVIDENCE_ITEMS: EvidenceItem[] = [];
