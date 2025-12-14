import React from 'react';
import BilingualLabel from './BilingualLabel';

interface SectionTitleProps {
  english: string;
  tamil: string;
  className?: string;
}

export default function SectionTitle({ english, tamil, className = '' }: SectionTitleProps) {
  return (
    <div className={`print-section-title ${className}`}>
      <BilingualLabel english={english} tamil={tamil} inline />
    </div>
  );
}
