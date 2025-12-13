import React from 'react';
import { BilingualLabel } from './BilingualLabel';
import { BlankField } from './BlankField';

interface PrintFooterProps {
  showDate?: boolean;
}

export const PrintFooter: React.FC<PrintFooterProps> = ({ showDate = true }) => {
  return (
    <div className="print-footer-section border-t border-black pt-3 mt-6">
      <div className="grid grid-cols-4 gap-4 text-[10px]">
        <div>
          <BilingualLabel tamil="கிளை" english="Branch" />
          <BlankField width="100%" />
        </div>
        <div>
          <BilingualLabel tamil="தயார் செய்தவர்" english="Prepared by" />
          <BlankField width="100%" />
        </div>
        <div>
          <BilingualLabel tamil="சரிபார்த்தவர்" english="Checked by" />
          <BlankField width="100%" />
        </div>
        {showDate && (
          <div>
            <BilingualLabel tamil="தேதி" english="Date" />
            <BlankField width="100%" />
          </div>
        )}
      </div>
    </div>
  );
};
