// ============================================================
// src/components/clinical/DicomViewerModal.tsx
// Phase 13: Interactive Medical Imaging & DICOMweb PACS Viewer
// Multi-slice ultrasound/CT canvas rendering, window/level presets, and calipers
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Ruler,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sun,
  Activity,
  Check,
} from 'lucide-react';
import {
  DicomStudy,
  DicomInstance,
  WindowLevelPreset,
  DicomCaliperMeasurement,
} from '../../domain/dicom';
import {
  SYNTHETIC_TEE_STUDY,
  WINDOW_LEVEL_PRESETS,
  renderDicomToCanvas,
} from '../../lib/imaging/dicom-client';

interface DicomViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudy?: DicomStudy;
}

export const DicomViewerModal: React.FC<DicomViewerModalProps> = ({
  isOpen,
  onClose,
  initialStudy = SYNTHETIC_TEE_STUDY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const series = initialStudy.series[0];
  const [currentSliceIndex, setCurrentSliceIndex] = useState<number>(2); // Default to Mitral Vegetation slice (slice #3)
  const currentInstance: DicomInstance = series.instances[currentSliceIndex] || series.instances[0];

  const [activePreset, setActivePreset] = useState<string>('CARDIAC_ECHO');
  const [windowCenter, setWindowCenter] = useState<number>(128);
  const [windowWidth, setWindowWidth] = useState<number>(255);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showCaliper, setShowCaliper] = useState<boolean>(true);

  // Active caliper measurement on vegetation (slice #3 & #4)
  const activeCaliper: DicomCaliperMeasurement | null = showCaliper
    ? {
        id: 'cal-01',
        instanceNumber: 3,
        startPoint: { x: 238, y: 198 },
        endPoint: { x: 258, y: 226 },
        distanceMm: 11.4,
        label: 'Vegetation Length',
        color: '#22C55E',
      }
    : null;

  // Apply preset
  const handleSelectPreset = (preset: WindowLevelPreset) => {
    setActivePreset(preset.name);
    setWindowCenter(preset.windowCenter);
    setWindowWidth(preset.windowWidth);
  };

  // Re-render canvas whenever slice, W/L, or caliper toggles
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    renderDicomToCanvas(
      canvasRef.current,
      currentInstance,
      windowCenter,
      windowWidth,
      activeCaliper
    );
  }, [isOpen, currentSliceIndex, windowCenter, windowWidth, showCaliper]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DICOM Medical Imaging Viewer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '980px',
          maxWidth: '96vw',
          height: '740px',
          maxHeight: '92vh',
          backgroundColor: '#0F172A',
          borderRadius: '8px',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#F8FAFC',
        }}
      >
        {/* ── DICOM Top Header Bar ─────────────────────────────── */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={18} style={{ color: '#38BDF8' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                {initialStudy.studyDescription}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                {initialStudy.patientName} · {initialStudy.patientId} · Modality: {series.modality} · Accession: {initialStudy.accessionNumber}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-xs btn-outline"
            style={{ color: '#94A3B8', borderColor: '#475569', padding: '6px' }}
            title="Close Viewer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Main Viewport Layout ──────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Canvas Viewport Area */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#000000',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* DICOM On-Screen Metadata HUD Overlays */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#38BDF8',
                lineHeight: 1.4,
                pointerEvents: 'none',
              }}
            >
              <div>{initialStudy.institutionName}</div>
              <div>Ref: {initialStudy.referringPhysicianName}</div>
              <div>Series: {series.seriesNumber} / Instance: {currentInstance.instanceNumber}</div>
              <div>Slice Pos: {currentInstance.sliceLocation?.toFixed(1)} mm</div>
            </div>

            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#38BDF8',
                textAlign: 'right',
                lineHeight: 1.4,
                pointerEvents: 'none',
              }}
            >
              <div>Window Center: {windowCenter}</div>
              <div>Window Width: {windowWidth}</div>
              <div>Matrix: {currentInstance.rows} x {currentInstance.columns}</div>
              <div>Pixel Spacing: {currentInstance.pixelSpacing[0]} mm</div>
            </div>

            {/* Canvas with dynamic zoom transform */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                style={{
                  width: '512px',
                  height: '512px',
                  display: 'block',
                  borderRadius: '2px',
                  backgroundColor: '#000000',
                }}
              />
            </div>

            {/* Primary Finding Alert Overlay on Slice 3 & 4 */}
            {currentInstance.simulationPattern === 'MITRAL_VEGETATION' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid #22C55E',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  color: '#4ADE80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                <span>Diagnostic Stigmata: Anterior Mitral Leaflet Vegetation (11.4 mm x 5.8 mm mobile mass)</span>
              </div>
            )}
          </div>

          {/* Right Control Sidebar */}
          <div
            style={{
              width: '260px',
              backgroundColor: '#1E293B',
              borderLeft: '1px solid #334155',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
            }}
          >
            {/* Slice Scrubber */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>
                  Slice Navigation
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>
                  {currentSliceIndex + 1} of {series.numberOfInstances}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  disabled={currentSliceIndex === 0}
                  onClick={() => setCurrentSliceIndex((prev) => Math.max(0, prev - 1))}
                  className="btn btn-xs btn-outline"
                  style={{ color: '#E2E8F0', borderColor: '#475569' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <input
                  type="range"
                  min={0}
                  max={series.numberOfInstances - 1}
                  value={currentSliceIndex}
                  onChange={(e) => setCurrentSliceIndex(parseInt(e.target.value, 10))}
                  style={{ flex: 1, accentColor: '#38BDF8', cursor: 'pointer' }}
                />
                <button
                  disabled={currentSliceIndex === series.numberOfInstances - 1}
                  onClick={() => setCurrentSliceIndex((prev) => Math.min(series.numberOfInstances - 1, prev + 1))}
                  className="btn btn-xs btn-outline"
                  style={{ color: '#E2E8F0', borderColor: '#475569' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Window / Level Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '8px' }}>
                Window / Level Presets
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {WINDOW_LEVEL_PRESETS.map((preset) => {
                  const isSelected = activePreset === preset.name;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        background: isSelected ? '#0F172A' : '#334155',
                        border: `1px solid ${isSelected ? '#38BDF8' : '#475569'}`,
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: isSelected ? '#38BDF8' : '#CBD5E1',
                        fontSize: '11px',
                        fontWeight: 600,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Window & Level Sliders */}
            <div style={{ background: '#0F172A', padding: '12px', borderRadius: '4px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '8px' }}>
                Manual Contrast Calibration
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginBottom: '2px' }}>
                    <span>Window Center (WC)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{windowCenter}</span>
                  </div>
                  <input
                    type="range"
                    min={-1000}
                    max={1000}
                    value={windowCenter}
                    onChange={(e) => {
                      setWindowCenter(parseInt(e.target.value, 10));
                      setActivePreset('CUSTOM');
                    }}
                    style={{ width: '100%', accentColor: '#38BDF8' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginBottom: '2px' }}>
                    <span>Window Width (WW)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{windowWidth}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3000}
                    value={windowWidth}
                    onChange={(e) => {
                      setWindowWidth(parseInt(e.target.value, 10));
                      setActivePreset('CUSTOM');
                    }}
                    style={{ width: '100%', accentColor: '#38BDF8' }}
                  />
                </div>
              </div>
            </div>

            {/* Tools (Zoom & Caliper) */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: '8px' }}>
                Measurement & Tools
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => setShowCaliper(!showCaliper)}
                  className={`btn btn-xs ${showCaliper ? 'btn-primary' : 'btn-outline'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Ruler size={13} /> {showCaliper ? 'Caliper On' : 'Caliper Off'}
                </button>

                <button
                  onClick={() => setZoom((z) => (z === 1.0 ? 1.4 : 1.0))}
                  className="btn btn-xs btn-outline"
                  style={{ color: '#E2E8F0', borderColor: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  {zoom > 1.0 ? <ZoomOut size={13} /> : <ZoomIn size={13} />} {zoom > 1.0 ? '1.0x Zoom' : '1.4x Zoom'}
                </button>
              </div>
            </div>

            {/* Clinical finding confirmation banner */}
            <div style={{ marginTop: 'auto', background: '#0F172A', border: '1px solid #1E3A8A', borderRadius: '4px', padding: '10px 12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#60A5FA', marginBottom: '2px' }}>
                Diagnostic Implication
              </div>
              <div style={{ fontSize: '11px', color: '#BFDBFE', lineHeight: 1.3 }}>
                Demonstrates positive Modified Duke major echocardiographic criteria (vegetation &gt; 10 mm on mitral leaflet).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
