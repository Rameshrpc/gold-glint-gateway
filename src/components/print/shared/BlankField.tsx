import React from 'react';

interface BlankFieldProps {
  label?: string;
  tamilLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  value?: string;
  className?: string;
}

export default function BlankField({ 
  label, 
  tamilLabel,
  size = 'md',
  value,
  className = '' 
}: BlankFieldProps) {
  const widthClass = size === 'sm' ? 'min-w-[80px]' : size === 'lg' ? 'min-w-[200px]' : 'min-w-[120px]';

  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      {(label || tamilLabel) && (
        <span className="text-[10px]">
          {label}
          {tamilLabel && <span className="text-gray-600"> / {tamilLabel}</span>}:
        </span>
      )}
      <span className={`blank-field ${widthClass} ${value ? 'font-medium' : ''}`}>
        {value || '\u00A0'}
      </span>
    </span>
  );
}
