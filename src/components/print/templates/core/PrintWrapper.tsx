import React from 'react';
import { cn } from '@/lib/utils';
import WatermarkOverlay, { WatermarkType } from './WatermarkOverlay';

export type PaperSize = 'a4' | 'a6' | 'thermal';

interface PrintWrapperProps {
  children: React.ReactNode;
  paperSize?: PaperSize;
  watermark?: WatermarkType;
  customWatermark?: string;
  watermarkOpacity?: number;
  className?: string;
  id?: string;
}

const paperSizeClasses: Record<PaperSize, string> = {
  a4: 'print-preview-a4',
  a6: 'print-preview-a6',
  thermal: 'print-preview-thermal'
};

export const PrintWrapper: React.FC<PrintWrapperProps> = ({
  children,
  paperSize = 'a4',
  watermark,
  customWatermark,
  watermarkOpacity = 0.08,
  className,
  id = 'print-content'
}) => {
  return (
    <div 
      id={id}
      className={cn(
        "print-preview relative bg-white text-black",
        paperSizeClasses[paperSize],
        className
      )}
    >
      {/* Watermark */}
      {watermark && (
        <WatermarkOverlay 
          type={watermark} 
          customText={customWatermark}
          opacity={watermarkOpacity}
        />
      )}
      
      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

export default PrintWrapper;