import React from 'react';
import { BilingualLabel } from './BilingualLabel';

interface SignatureBlockProps {
  title: { tamil: string; english: string };
  showThumbBox?: boolean;
  showNameField?: boolean;
  showDateField?: boolean;
  width?: string;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({
  title,
  showThumbBox = false,
  showNameField = true,
  showDateField = true,
  width = '180px'
}) => {
  return (
    <div className="signature-block" style={{ width }}>
      {/* Signature line */}
      <div className="h-16 border-b border-black mb-1" />
      
      {/* Title */}
      <div className="text-center mb-2">
        <BilingualLabel tamil={title.tamil} english={title.english} />
      </div>

      {/* Thumb impression box */}
      {showThumbBox && (
        <div className="flex justify-center mb-2">
          <div className="w-12 h-16 border border-black flex items-center justify-center">
            <div className="text-[8px] text-center">
              <div className="text-tamil">கட்டைவிரல்</div>
              <div className="text-english">Thumb</div>
            </div>
          </div>
        </div>
      )}

      {/* Name field */}
      {showNameField && (
        <div className="mb-1">
          <div className="text-[9px]">
            <BilingualLabel tamil="பெயர்" english="Name" inline />
          </div>
          <div className="border-b border-black h-4" />
        </div>
      )}

      {/* Date field */}
      {showDateField && (
        <div>
          <div className="text-[9px]">
            <BilingualLabel tamil="தேதி" english="Date" inline />
          </div>
          <div className="border-b border-black h-4" />
        </div>
      )}
    </div>
  );
};
