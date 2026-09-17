// ============================================================
// src/domain/dicom.ts
// Phase 13: Medical Imaging & DICOMweb Pure Domain Models
// WADO-RS / QIDO-RS, Series, Instances, Window/Level, and Calipers
// Pure TypeScript — zero external dependencies
// ============================================================

export type DicomModality = 'CT' | 'MR' | 'US' | 'XA' | 'CR' | 'DX';

export interface WindowLevelPreset {
  name: string;
  label: string;
  windowCenter: number;
  windowWidth: number;
  description: string;
}

export interface DicomInstance {
  sopInstanceUid: string;
  sopClassUid: string;
  instanceNumber: number;
  rows: number;
  columns: number;
  pixelSpacing: [number, number]; // [row spacing, col spacing] in mm
  sliceLocation?: number;
  sliceThickness?: number;
  windowCenter: number;
  windowWidth: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;
  frameUrl?: string;
  simulationPattern: 'MITRAL_VEGETATION' | 'AORTIC_REGURGITATION' | 'PULMONARY_CONSOLIDATION' | 'NORMAL_CARDIAC';
}

export interface DicomSeries {
  seriesInstanceUid: string;
  seriesNumber: number;
  modality: DicomModality;
  seriesDescription: string;
  bodyPartExamined: string;
  instances: DicomInstance[];
  numberOfInstances: number;
}

export interface DicomStudy {
  studyInstanceUid: string;
  patientId: string;
  patientName: string;
  accessionNumber: string;
  studyDate: string;
  studyTime: string;
  modalitiesInStudy: DicomModality[];
  studyDescription: string;
  institutionName: string;
  referringPhysicianName: string;
  series: DicomSeries[];
}

export interface DicomCaliperMeasurement {
  id: string;
  instanceNumber: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  distanceMm: number;
  label: string;
  color?: string;
}
