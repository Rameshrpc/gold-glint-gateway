import React from 'react';
import { cn } from '@/lib/utils';

export type WatermarkType = 'original' | 'duplicate' | 'draft' | 'cancelled' | 'sample' | 'custom';

interface WatermarkOverlayProps {
  type?: WatermarkType;
  customText?: string;
  opacity?: number;
  className?: string;
}

const watermarkConfig: Record<WatermarkType, { text: string; tamilText: string; colorClass: string }> = {
  original: { text: 'ORIGINAL', tamilText: 'அசல்', colorClass: 'text-green-600' },
  duplicate: { text: 'DUPLICATE', tamilText: 'நகல்', colorClass: 'text-blue-600' },
  draft: { text: 'DRAFT', tamilText: 'வரைவு', colorClass: 'text-amber-600' },
  cancelled: { text: 'CANCELLED', tamilText: 'ரத்து செய்யப்பட்டது', colorClass: 'text-red-600' },
  sample: { text: 'SAMPLE', tamilText: 'மாதிரி', colorClass: 'text-purple-600' },
  custom: { text: '', tamilText: '', colorClass: 'text-gray-600' }
};

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  type = 'original',
  customText,
  opacity = 0.08,
  className
}) => {
  const config = watermarkConfig[type];
  const displayText = type === 'custom' ? customText : config.text;
  const displayTamilText = type === 'custom' ? '' : config.tamilText;

  if (!displayText) return null;

  return (
    <div 
      className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden",
        className
      )}
    >
      <div 
        className={cn(
          "transform -rotate-45 whitespace-nowrap text-center",
          config.colorClass
        )}
        style={{ opacity }}
      >
        <div className="text-7xl font-bold tracking-widest text-english">
          {displayText}
        </div>
        {displayTamilText && (
          <div className="text-3xl font-semibold mt-2 text-tamil">
            {displayTamilText}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatermarkOverlay;