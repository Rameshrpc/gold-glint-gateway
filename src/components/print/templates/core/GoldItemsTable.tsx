import React from 'react';
import { cn } from '@/lib/utils';

interface GoldItem {
  id: string;
  serialNumber?: string;
  itemType: string;
  itemTypeTamil?: string;
  description?: string;
  descriptionTamil?: string;
  grossWeight: number;
  stoneWeight?: number;
  netWeight: number;
  purity: string;
  purityPercentage: number;
  marketRate: number;
  marketValue?: number;
  appraisedValue: number;
  imageUrl?: string;
}

interface GoldItemsTableProps {
  items: GoldItem[];
  showImages?: boolean;
  showSerials?: boolean;
  showMarketValue?: boolean;
  compact?: boolean;
  className?: string;
}

export const GoldItemsTable: React.FC<GoldItemsTableProps> = ({
  items = [],
  showImages = false,
  showSerials = true,
  showMarketValue = false,
  compact = false,
  className
}) => {
  // Defensive: ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];
  
  const totalGrossWeight = safeItems.reduce((sum, item) => sum + (item?.grossWeight || 0), 0);
  const totalNetWeight = safeItems.reduce((sum, item) => sum + (item?.netWeight || 0), 0);
  const totalAppraisedValue = safeItems.reduce((sum, item) => sum + (item?.appraisedValue || 0), 0);
  const totalMarketValue = safeItems.reduce((sum, item) => sum + (item?.marketValue || 0), 0);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatWeight = (weight: number) => {
    return weight.toFixed(3);
  };

  return (
    <div className={cn("my-4", className)}>
      <div className="bilingual-text mb-2">
        <span className="text-sm font-semibold text-english">Gold Items / Pledged Articles</span>
        <span className="text-xs text-gray-600 text-tamil">தங்க பொருட்கள் / அடகு பொருட்கள்</span>
      </div>
      
      <table className={cn("print-table", compact && "print-table-compact")}>
        <thead>
          <tr className="bg-gray-100">
            <th className="w-8 text-center">S.No</th>
            {showSerials && <th>Serial</th>}
            {showImages && <th className="w-16">Image</th>}
            <th>
              <div className="bilingual-text">
                <span className="text-english">Item Type</span>
                <span className="text-tamil text-xs">பொருள் வகை</span>
              </div>
            </th>
            <th className="text-right">
              <div className="bilingual-text">
                <span className="text-english">Gross Wt (g)</span>
                <span className="text-tamil text-xs">மொத்த எடை</span>
              </div>
            </th>
            <th className="text-right">
              <div className="bilingual-text">
                <span className="text-english">Net Wt (g)</span>
                <span className="text-tamil text-xs">நிகர எடை</span>
              </div>
            </th>
            <th className="text-center">
              <div className="bilingual-text">
                <span className="text-english">Purity</span>
                <span className="text-tamil text-xs">தூய்மை</span>
              </div>
            </th>
            <th className="text-right">
              <div className="bilingual-text">
                <span className="text-english">Rate/g</span>
                <span className="text-tamil text-xs">விலை/கி</span>
              </div>
            </th>
            {showMarketValue && (
              <th className="text-right">
                <div className="bilingual-text">
                  <span className="text-english">Market Value</span>
                  <span className="text-tamil text-xs">சந்தை மதிப்பு</span>
                </div>
              </th>
            )}
            <th className="text-right">
              <div className="bilingual-text">
                <span className="text-english">Appraised Value</span>
                <span className="text-tamil text-xs">மதிப்பீடு</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {safeItems.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center text-gray-500 py-4">No gold items</td>
            </tr>
          ) : (
            safeItems.map((item, index) => (
              <tr key={item?.id || index}>
                <td className="text-center">{index + 1}</td>
                {showSerials && <td className="font-mono text-xs">{item?.serialNumber || '-'}</td>}
                {showImages && (
                  <td>
                    {item?.imageUrl ? (
                      <img src={item.imageUrl} alt={item?.itemType || 'Gold'} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                        N/A
                      </div>
                    )}
                  </td>
                )}
                <td>
                  <div className="bilingual-text">
                    <span className="text-english">{item?.itemType || 'Gold Item'}</span>
                    {item?.itemTypeTamil && (
                      <span className="text-tamil text-xs text-gray-500">{item.itemTypeTamil}</span>
                    )}
                    {item?.description && (
                      <span className="text-xs text-gray-500 block">{item.description}</span>
                    )}
                  </div>
                </td>
                <td className="text-right font-mono">{formatWeight(item?.grossWeight || 0)}</td>
                <td className="text-right font-mono">{formatWeight(item?.netWeight || 0)}</td>
                <td className="text-center">
                  <span className="text-xs">{item?.purity || '-'}</span>
                  <span className="text-xs text-gray-500 block">({item?.purityPercentage || 0}%)</span>
                </td>
                <td className="text-right font-mono text-xs">{formatCurrency(item?.marketRate || 0)}</td>
                {showMarketValue && (
                  <td className="text-right font-mono">{formatCurrency(item?.marketValue || 0)}</td>
                )}
                <td className="text-right font-mono font-semibold">{formatCurrency(item?.appraisedValue || 0)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td colSpan={showSerials && showImages ? 4 : showSerials || showImages ? 3 : 2} className="text-right">
              <div className="bilingual-text">
                <span className="text-english">Total</span>
                <span className="text-tamil text-xs">மொத்தம்</span>
              </div>
            </td>
            <td className="text-right font-mono">{formatWeight(totalGrossWeight)}</td>
            <td className="text-right font-mono">{formatWeight(totalNetWeight)}</td>
            <td></td>
            <td></td>
            {showMarketValue && (
              <td className="text-right font-mono">{formatCurrency(totalMarketValue)}</td>
            )}
            <td className="text-right font-mono text-base">{formatCurrency(totalAppraisedValue)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div className="text-xs text-gray-500 mt-1 text-tamil">
        மொத்த தங்க எடை: {formatWeight(totalNetWeight)} கிராம் | மொத்த மதிப்பு: {formatCurrency(totalAppraisedValue)}
      </div>
    </div>
  );
};

export default GoldItemsTable;