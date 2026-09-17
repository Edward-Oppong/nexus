import React from 'react';
import { CaseOrbitVisual } from '../visuals/CaseOrbitVisual';
import { Layers, AlertCircle } from 'lucide-react';

export const FragmentationSection: React.FC = () => {
  return (
    <section className="nexus-narrative-section" id="section-fragmentation">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label nexus-section-label--neutral">
          <Layers size={13} />
          <span>SECTION 03 · THE CHALLENGE</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          The problem isn't a lack of information.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          It is knowing what matters, what conflicts, what is missing, and what deserves attention.
        </p>
      </div>

      {/* Spatial Visual showing fragmented data drifting outward */}
      <CaseOrbitVisual mode="fragmented" interactive={false} />
    </section>
  );
};
