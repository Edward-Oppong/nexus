import React from 'react';
import { ContradictionVisual } from '../visuals/ContradictionVisual';
import { AlertTriangle } from 'lucide-react';

export const ContradictionSection: React.FC = () => {
  return (
    <section className="nexus-narrative-section" id="section-contradictions">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label nexus-section-label--neutral">
          <AlertTriangle size={13} />
          <span>SECTION 10 · SAFETY & INFORMATION GAPS</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          Surfacing contradictions and missing information.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          When intake notes conflict with pharmacy history, or when diagnostic criteria lack vital laboratory serologies, Nexus explicitly illuminates the gap rather than smoothing over it.
        </p>
      </div>

      {/* Interactive Contradiction and Missing Information Visual */}
      <ContradictionVisual />
    </section>
  );
};
