import React from 'react';

interface BilingualLabelProps {
  tamil: string;
  english: string;
  className?: string;
  inline?: boolean;
}

export const BilingualLabel: React.FC<BilingualLabelProps> = ({ 
  tamil, 
  english, 
  className = '',
  inline = false
}) => {
  if (inline) {
    return (
      <span className={`bilingual-inline ${className}`}>
        <span className="text-tamil">{tamil}</span>
        {' / '}
        <span className="text-english">{english}</span>
      </span>
    );
  }

  return (
    <div className={`bilingual-label ${className}`}>
      <div className="text-tamil text-[11px] leading-tight">{tamil}</div>
      <div className="text-english text-[12px] leading-tight">{english}</div>
    </div>
  );
};
