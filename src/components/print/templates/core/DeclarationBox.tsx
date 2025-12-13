import React from 'react';
import { cn } from '@/lib/utils';

interface DeclarationBoxProps {
  title?: string;
  titleTamil?: string;
  content: string;
  contentTamil?: string;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  checkboxLabelTamil?: string;
  variant?: 'default' | 'warning' | 'success' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-50 border-gray-300',
  warning: 'bg-amber-50 border-amber-300',
  success: 'bg-green-50 border-green-300',
  info: 'bg-blue-50 border-blue-300'
};

export const DeclarationBox: React.FC<DeclarationBoxProps> = ({
  title = 'Declaration',
  titleTamil = 'உறுதிமொழி',
  content,
  contentTamil,
  showCheckbox = false,
  checkboxLabel,
  checkboxLabelTamil,
  variant = 'default',
  className
}) => {
  return (
    <div className={cn("declaration-box", variantStyles[variant], className)}>
      {/* Title */}
      <div className="bilingual-text mb-3">
        <span className="text-sm font-semibold text-gray-900 text-english">{title}</span>
        <span className="text-xs font-medium text-gray-700 text-tamil">{titleTamil}</span>
      </div>
      
      {/* Content */}
      <div className="bilingual-text text-xs leading-relaxed">
        <p className="text-english text-gray-800 mb-2">{content}</p>
        {contentTamil && (
          <p className="text-tamil text-gray-600">{contentTamil}</p>
        )}
      </div>
      
      {/* Checkbox */}
      {showCheckbox && checkboxLabel && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 border border-gray-400 flex-shrink-0 mt-0.5" />
            <div className="bilingual-text text-xs">
              <span className="text-english">{checkboxLabel}</span>
              {checkboxLabelTamil && (
                <span className="text-tamil text-gray-600 block">{checkboxLabelTamil}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeclarationBox;