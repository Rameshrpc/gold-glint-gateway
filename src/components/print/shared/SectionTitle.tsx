import React from 'react';
import { BilingualLabel } from './BilingualLabel';

interface SectionTitleProps {
  tamil: string;
  english: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  tamil, 
  english, 
  className = '' 
}) => {
  return (
    <div className={`section-title border-b border-black pb-1 mb-3 ${className}`}>
      <div className="text-tamil text-[11px] font-semibold">{tamil}</div>
      <div className="text-english text-[12px] font-semibold">{english}</div>
    </div>
  );
};
