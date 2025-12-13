import React from 'react';
import { cn } from '@/lib/utils';

interface AmountLine {
  label: string;
  labelTamil?: string;
  amount: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isDeduction?: boolean;
  isHighlight?: boolean;
}

interface AmountSummaryProps {
  lines: AmountLine[];
  title?: string;
  titleTamil?: string;
  showCurrency?: boolean;
  className?: string;
}

export const AmountSummary: React.FC<AmountSummaryProps> = ({
  lines,
  title,
  titleTamil,
  showCurrency = true,
  className
}) => {
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
    return showCurrency ? `₹ ${formatted}` : formatted;
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(Math.abs(num));
    
    const convertLessThanThousand = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
    };
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remaining = Math.floor(num % 1000);
    
    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remaining) result += convertLessThanThousand(remaining);
    
    return result.trim() + ' Rupees Only';
  };

  const totalLine = lines.find(l => l.isTotal);
  const totalAmount = totalLine?.amount || 0;

  return (
    <div className={cn("my-4 border border-gray-300 rounded", className)}>
      {title && (
        <div className="bilingual-text bg-gray-100 px-3 py-2 border-b border-gray-300">
          <span className="text-sm font-semibold text-gray-900 text-english">{title}</span>
          {titleTamil && (
            <span className="text-xs text-gray-600 text-tamil ml-2">{titleTamil}</span>
          )}
        </div>
      )}
      
      <div className="p-3">
        {lines.map((line, index) => (
          <div 
            key={index} 
            className={cn(
              "flex justify-between items-center",
              line.isTotal && "border-t-2 border-gray-400 pt-2 mt-2",
              line.isSubtotal && "border-t border-gray-200 pt-1 mt-1",
              line.isHighlight && "bg-amber-50 -mx-3 px-3 py-1"
            )}
          >
            <div className="bilingual-text">
              <span className={cn(
                "text-english",
                line.isTotal ? "text-sm font-bold" : "text-xs",
                line.isSubtotal && "font-medium"
              )}>
                {line.label}
              </span>
              {line.labelTamil && (
                <span className={cn(
                  "text-tamil ml-1",
                  line.isTotal ? "text-xs font-semibold" : "text-xs text-gray-500"
                )}>
                  ({line.labelTamil})
                </span>
              )}
            </div>
            <div className={cn(
              "font-mono text-right",
              line.isTotal ? "text-base font-bold" : "text-sm",
              line.isSubtotal && "font-semibold",
              line.isDeduction && "text-red-600",
              line.isHighlight && "text-amber-800"
            )}>
              {line.isDeduction && line.amount > 0 && '(-)'}
              {formatCurrency(line.amount)}
            </div>
          </div>
        ))}
        
        {/* Amount in words */}
        {totalLine && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <span className="font-medium text-english">Amount in words: </span>
              <span className="italic">{numberToWords(Math.round(totalAmount))}</span>
            </div>
            <div className="text-xs text-gray-500 text-tamil mt-1">
              தொகை வார்த்தைகளில்: ரூபாய் {Math.round(totalAmount).toLocaleString('en-IN')} மட்டும்
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmountSummary;