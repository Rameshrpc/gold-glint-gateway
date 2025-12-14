import React from 'react';
import BilingualLabel from './BilingualLabel';

interface SignatureBlockProps {
  english: string;
  tamil: string;
  showDate?: boolean;
  className?: string;
}

export default function SignatureBlock({ 
  english, 
  tamil, 
  showDate = false,
  className = '' 
}: SignatureBlockProps) {
  return (
    <div className={`signature-block ${className}`}>
      <div className="signature-line">
        <BilingualLabel english={english} tamil={tamil} />
      </div>
      {showDate && (
        <div className="text-[8px] text-gray-500 mt-1">
          Date / தேதி: _______________
        </div>
      )}
    </div>
  );
}
