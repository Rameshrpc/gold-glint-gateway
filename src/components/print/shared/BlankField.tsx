import React from 'react';
import { BilingualLabel } from './BilingualLabel';

interface BlankFieldProps {
  label?: { tamil: string; english: string };
  width?: string;
  height?: string;
  className?: string;
  inline?: boolean;
}

export const BlankField: React.FC<BlankFieldProps> = ({ 
  label, 
  width = '150px',
  height = '20px',
  className = '',
  inline = false
}) => {
  if (inline && label) {
    return (
      <span className={`inline-flex items-baseline gap-1 ${className}`}>
        <BilingualLabel tamil={label.tamil} english={label.english} inline />
        <span 
          className="blank-field-inline border-b border-black" 
          style={{ width, display: 'inline-block', minHeight: height }}
        />
      </span>
    );
  }

  return (
    <div className={`blank-field-container ${className}`}>
      {label && (
        <BilingualLabel tamil={label.tamil} english={label.english} className="mb-1" />
      )}
      <div 
        className="blank-field border-b border-black" 
        style={{ width, minHeight: height }}
      />
    </div>
  );
};
