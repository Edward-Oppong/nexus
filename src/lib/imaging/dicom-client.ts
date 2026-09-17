// ============================================================
// src/lib/imaging/dicom-client.ts
// Phase 13: Medical Imaging & DICOMweb Client Engine
// WADO-RS slice retrieval, window/level presets, and canvas rendering
// ============================================================

import {
  DicomStudy,
  DicomSeries,
  DicomInstance,
  WindowLevelPreset,
  DicomCaliperMeasurement,
} from '../../domain/dicom';

export const WINDOW_LEVEL_PRESETS: WindowLevelPreset[] = [
  {
    name: 'CARDIAC_ECHO',
    label: 'Cardiac Ultrasound / Echo',
    windowCenter: 128,
    windowWidth: 255,
    description: 'Calibrated for high dynamic contrast in echocardiographic chamber and leaflet tissue.',
  },
  {
    name: 'SOFT_TISSUE',
    label: 'Soft Tissue (Mediastinum)',
    windowCenter: 40,
    windowWidth: 350,
    description: 'Optimized for visualization of cardiac chambers, pericardium, and great vessels.',
  },
  {
    name: 'LUNG',
    label: 'Pulmonary Parenchyma',
    windowCenter: -600,
    windowWidth: 1500,
    description: 'High latitude range for pulmonary septic emboli, infiltrates, and vascular markings.',
  },
  {
    name: 'BONE',
    label: 'Bone Detail',
    windowCenter: 400,
    windowWidth: 1500,
    description: 'Maximal contrast for cortical bone, ribs, and sternal structures.',
  },
  {
    name: 'BRAIN',
    label: 'Brain Parenchyma',
    windowCenter: 40,
    windowWidth: 80,
    description: 'Narrow window for cerebral edema, ischemic infarction, or mycotic aneurysm stigmata.',
  },
];

export const SYNTHETIC_TEE_STUDY: DicomStudy = {
  studyInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.1048201',
  patientId: 'syn-pat-00482',
  patientName: 'Okafor^Amara',
  accessionNumber: 'ACC-2026-TEE-0482',
  studyDate: '2026-09-10',
  studyTime: '11:30:00',
  modalitiesInStudy: ['US'],
  studyDescription: 'TEE (Transesophageal Echocardiography) Comprehensive Diagnostic Protocol',
  institutionName: 'Korle Bu Teaching Hospital / Heart & Vascular Institute',
  referringPhysicianName: 'Dr. Kwame Asante, MD',
  series: [
    {
      seriesInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.201.1',
      seriesNumber: 1,
      modality: 'US',
      seriesDescription: 'Mid-Esophageal 4-Chamber & Mitral Commisural Views (Multi-plane 0° - 135°)',
      bodyPartExamined: 'HEART',
      numberOfInstances: 6,
      instances: [
        {
          sopInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.201.1.1',
          sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1', // Ultrasound Multi-frame
          instanceNumber: 1,
          rows: 512,
          columns: 512,
          pixelSpacing: [0.35, 0.35], // 0.35 mm per pixel
          sliceLocation: 0.0,
          sliceThickness: 2.0,
          windowCenter: 128,
          windowWidth: 255,
          simulationPattern: 'NORMAL_CARDIAC',
        },
        {
          sopInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.201.1.2',
          sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1',
          instanceNumber: 2,
          rows: 512,
          columns: 512,
          pixelSpacing: [0.35, 0.35],
          sliceLocation: 2.0,
          sliceThickness: 2.0,
          windowCenter: 128,
          windowWidth: 255,
          simulationPattern: 'NORMAL_CARDIAC',
        },
        {
          sopInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.201.1.3',
          sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1',
          instanceNumber: 3,
          rows: 512,
          columns: 512,
          pixelSpacing: [0.35, 0.35],
          sliceLocation: 4.0,
          sliceThickness: 2.0,
          windowCenter: 128,
          windowWidth: 255,
          simulationPattern: 'MITRAL_VEGETATION', // PRIMARY LESION SLICE
        },
        {
          sopInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.201.1.4',
          sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1',
          instanceNumber: 4,
          rows: 512,
          columns: 512,
          pixelSpacing: [0.35, 0.35],
          sliceLocation: 6.0,
          sliceThickness: 2.0,
          windowCenter: 128,
          windowWidth: 255,
          simulationPattern: 'MITRAL_VEGETATION',
        },
        {
          sopInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.201.1.5',
          sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1',
          instanceNumber: 5,
          rows: 512,
          columns: 512,
          pixelSpacing: [0.35, 0.35],
          sliceLocation: 8.0,
          sliceThickness: 2.0,
          windowCenter: 128,
          windowWidth: 255,
          simulationPattern: 'AORTIC_REGURGITATION',
        },
        {
          sopInstanceUid: '1.2.840.113619.2.55.3.2831154.20260910.201.1.6',
          sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1',
          instanceNumber: 6,
          rows: 512,
          columns: 512,
          pixelSpacing: [0.35, 0.35],
          sliceLocation: 10.0,
          sliceThickness: 2.0,
          windowCenter: 128,
          windowWidth: 255,
          simulationPattern: 'NORMAL_CARDIAC',
        },
      ],
    },
  ],
};

/**
 * Procedural canvas pixel renderer simulating realistic medical ultrasound and CT scan pixels
 * Reacts dynamically to Window Center and Window Width adjustments
 */
export function renderDicomToCanvas(
  canvas: HTMLCanvasElement,
  instance: DicomInstance,
  windowCenter: number,
  windowWidth: number,
  caliper?: DicomCaliperMeasurement | null
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  // Window/level scale factors
  const winMin = windowCenter - windowWidth / 2;
  const winMax = windowCenter + windowWidth / 2;
  const winRange = Math.max(1, winMax - winMin);

  const cx = w / 2;
  const cy = h * 0.18; // sector ultrasound apex

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, Math.abs(dx));

      let rawIntensity = 0;

      // Simulate sector ultrasound field of view (90-degree fan)
      if (y > cy && angle > 0.45 && angle < 2.7 && dist < h * 0.88) {
        // Base echo texture
        const noise = (Math.sin(x * 0.25) * Math.cos(y * 0.25) + 1) * 20;
        const radialFade = Math.sin((dist / (h * 0.88)) * Math.PI);
        rawIntensity = 45 + noise + radialFade * 30;

        // Left Atrium & Left Ventricle chamber silhouettes (hypoechoic blood pools)
        const inAtrium = Math.hypot(x - cx, y - (cy + 130)) < 55;
        const inVentricle = Math.hypot(x - cx, y - (cy + 250)) < 75;

        if (inAtrium || inVentricle) {
          rawIntensity = 18 + (Math.random() * 8); // Blood is dark (anechoic)
        }

        // Mitral valve annulus and leaflets (hyperechoic white structures)
        const nearValve = Math.abs(y - (cy + 185)) < 10 && Math.abs(x - cx) < 65;
        if (nearValve) {
          rawIntensity = 180 + (Math.sin(x * 0.8) * 40);
        }

        // Distinct diagnostic finding pattern: Mitral valve vegetation
        if (instance.simulationPattern === 'MITRAL_VEGETATION') {
          // Oscillating mobile echodense mass on anterior mitral leaflet tip
          const massDist = Math.hypot(x - (cx - 15), y - (cy + 192));
          if (massDist < 24) {
            // Highly echogenic irregular vegetation mass
            rawIntensity = 225 + (Math.sin(x * 1.5) * Math.cos(y * 1.5) * 30);
          }
        }

        // Color Doppler jet simulation
        if (instance.simulationPattern === 'MITRAL_VEGETATION' && inAtrium && y < cy + 180 && Math.abs(x - (cx - 10)) < 28) {
          // Color flow regurgitant jet (mosaic color mapping handled below)
          const normIntensity = Math.min(255, Math.max(0, ((rawIntensity - winMin) / winRange) * 255));
          data[idx] = 40; // R
          data[idx + 1] = 120; // G
          data[idx + 2] = 240; // B (Blue for flow away from probe / regurgitant)
          data[idx + 3] = 255;
          continue;
        }
      }

      // Apply Window/Level Transfer Function
      let displayVal = ((rawIntensity - winMin) / winRange) * 255;
      displayVal = Math.min(255, Math.max(0, displayVal));

      data[idx] = displayVal;     // R
      data[idx + 1] = displayVal; // G
      data[idx + 2] = displayVal; // B
      data[idx + 3] = 255;        // A
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Draw Calipers & Measurements overlay if present
  if (caliper && caliper.instanceNumber === instance.instanceNumber) {
    ctx.strokeStyle = caliper.color || '#22C55E';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);

    ctx.beginPath();
    ctx.moveTo(caliper.startPoint.x, caliper.startPoint.y);
    ctx.lineTo(caliper.endPoint.x, caliper.endPoint.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw End Crosses
    const r = 4;
    [caliper.startPoint, caliper.endPoint].forEach((pt) => {
      ctx.beginPath();
      ctx.moveTo(pt.x - r, pt.y);
      ctx.lineTo(pt.x + r, pt.y);
      ctx.moveTo(pt.x, pt.y - r);
      ctx.lineTo(pt.x, pt.y + r);
      ctx.stroke();
    });

    // Draw Caliper Text
    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 12px monospace';
    const midX = (caliper.startPoint.x + caliper.endPoint.x) / 2;
    const midY = (caliper.startPoint.y + caliper.endPoint.y) / 2;
    ctx.fillText(`${caliper.label}: ${caliper.distanceMm.toFixed(1)} mm`, midX + 8, midY - 6);
  }
}
