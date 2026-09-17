import React from 'react';
import { EcosystemVisual } from '../visuals/EcosystemVisual';
import { Share2 } from 'lucide-react';

export const EcosystemSection: React.FC = () => {
  return (
    <section className="nexus-narrative-section" id="section-ecosystem">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label">
          <Share2 size={13} />
          <span>SECTION 13 · HEALTHCARE INTEROPERABILITY</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          Built to work with the clinical environment around it.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          Nexus operates as a contextual reasoning layer on top of existing healthcare infrastructure—ingesting FHIR R4, DICOMweb PACS imaging, HL7 v2 hospital feeds, and IHE XDS document registries without proprietary vendor lock-in.
        </p>
      </div>

      {/* Primary Ecosystem Visual */}
      <EcosystemVisual />
    </section>
  );
};
