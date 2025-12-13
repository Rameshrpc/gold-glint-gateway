import React from 'react';
import { cn } from '@/lib/utils';

interface InfoItem {
  label: string;
  labelTamil?: string;
  value: string | number | React.ReactNode;
  valueTamil?: string;
  highlight?: boolean;
  fullWidth?: boolean;
}

interface InfoGridProps {
  items: InfoItem[];
  columns?: 2 | 3 | 4;
  title?: string;
  titleTamil?: string;
  compact?: boolean;
  className?: string;
}

export const InfoGrid: React.FC<InfoGridProps> = ({
  items,
  columns = 2,
  title,
  titleTamil,
  compact = false,
  className
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className={cn("my-4", className)}>
      {title && (
        <div className="bilingual-text mb-2 pb-1 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900 text-english">{title}</span>
          {titleTamil && (
            <span className="text-xs text-gray-600 text-tamil">{titleTamil}</span>
          )}
        </div>
      )}
      
      <div className={cn("grid gap-x-4", compact ? "gap-y-1" : "gap-y-2", gridCols[columns])}>
        {items.map((item, index) => (
          <div 
            key={index} 
            className={cn(
              "flex flex-col",
              item.fullWidth && "col-span-full",
              item.highlight && "bg-amber-50 p-2 rounded border border-amber-200"
            )}
          >
            <div className="bilingual-text">
              <span className={cn(
                "text-english",
                compact ? "text-xs" : "text-xs",
                "text-gray-600"
              )}>
                {item.label}
              </span>
              {item.labelTamil && (
                <span className="text-tamil text-xs text-gray-500"> / {item.labelTamil}</span>
              )}
            </div>
            <div className={cn(
              "font-medium",
              compact ? "text-sm" : "text-sm",
              item.highlight ? "text-amber-800" : "text-gray-900"
            )}>
              {item.value}
              {item.valueTamil && (
                <span className="text-tamil text-xs text-gray-600 ml-2">({item.valueTamil})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoGrid;