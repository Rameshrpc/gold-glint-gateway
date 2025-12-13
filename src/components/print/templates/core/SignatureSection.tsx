import React from 'react';
import { cn } from '@/lib/utils';

interface SignatureBox {
  label: string;
  labelTamil?: string;
  name?: string;
  designation?: string;
  designationTamil?: string;
  date?: string;
}

interface SignatureSectionProps {
  signatures: SignatureBox[];
  columns?: 2 | 3 | 4;
  showDate?: boolean;
  className?: string;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({
  signatures,
  columns = 2,
  showDate = false,
  className
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className={cn("mt-8 pt-4", className)}>
      <div className={cn("grid gap-8", gridCols[columns])}>
        {signatures.map((sig, index) => (
          <div key={index} className="text-center">
            {/* Signature Space */}
            <div className="h-16 border-b border-gray-400 mb-2" />
            
            {/* Name if provided */}
            {sig.name && (
              <div className="font-medium text-sm">{sig.name}</div>
            )}
            
            {/* Designation */}
            {sig.designation && (
              <div className="text-xs text-gray-600">
                {sig.designation}
                {sig.designationTamil && (
                  <span className="text-tamil block">{sig.designationTamil}</span>
                )}
              </div>
            )}
            
            {/* Label */}
            <div className="bilingual-text mt-1">
              <span className="text-xs font-medium text-english">{sig.label}</span>
              {sig.labelTamil && (
                <span className="text-xs text-gray-500 text-tamil block">{sig.labelTamil}</span>
              )}
            </div>
            
            {/* Date */}
            {showDate && sig.date && (
              <div className="text-xs text-gray-500 mt-1">
                Date: {sig.date}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignatureSection;