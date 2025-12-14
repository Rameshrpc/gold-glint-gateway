import React from 'react';

interface BilingualTextProps {
  english: string;
  tamil: string;
  className?: string;
  tamilFirst?: boolean;
}

export default function BilingualText({ 
  english, 
  tamil, 
  className = '',
  tamilFirst = true 
}: BilingualTextProps) {
  return (
    <div className={`terms-item ${className}`}>
      {tamilFirst ? (
        <>
          <p className="tamil text-[9px] font-semibold" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            {tamil}
          </p>
          <p className="english text-[8px] italic text-gray-700 mt-0.5">
            ({english})
          </p>
        </>
      ) : (
        <>
          <p className="english text-[9px]">{english}</p>
          <p className="tamil text-[8px] text-gray-600 mt-0.5" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            {tamil}
          </p>
        </>
      )}
    </div>
  );
}
