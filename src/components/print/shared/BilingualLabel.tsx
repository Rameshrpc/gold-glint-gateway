import React from 'react';

interface BilingualLabelProps {
  english: string;
  tamil: string;
  inline?: boolean;
  className?: string;
}

export default function BilingualLabel({ 
  english, 
  tamil, 
  inline = false,
  className = '' 
}: BilingualLabelProps) {
  if (inline) {
    return (
      <span className={`bilingual-inline ${className}`}>
        <span className="english">{english}</span>
        <span className="tamil text-gray-600"> / {tamil}</span>
      </span>
    );
  }

  return (
    <div className={`bilingual-label ${className}`}>
      <span className="english text-[10px]">{english}</span>
      <span className="tamil text-[9px] text-gray-600" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
        {tamil}
      </span>
    </div>
  );
}
