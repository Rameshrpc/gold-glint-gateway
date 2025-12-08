import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/printUtils';

interface GoldItem {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
  image_url?: string;
}

interface HTMLJewelImagesSectionProps {
  loanNumber: string;
  loanDate: string;
  goldItems: GoldItem[];
  captureTimestamp?: string;
  appraiserName?: string;
  appraiserSheetUrl?: string;
  paperSize?: 'a4' | 'thermal';
}

export const HTMLJewelImagesSection: React.FC<HTMLJewelImagesSectionProps> = ({
  loanNumber,
  loanDate,
  goldItems,
  captureTimestamp,
  appraiserName,
  appraiserSheetUrl,
  paperSize = 'a4',
}) => {
  const totalItems = goldItems.length;
  const totalWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
  const isThermal = paperSize === 'thermal';

  return (
    <div className={`print-section ${isThermal ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: "'Catamaran', sans-serif" }}>
      {/* Header */}
      <div className="section-title">
        PLEDGED GOLD ORNAMENTS / அடமானம் வைக்கப்பட்ட தங்க நகைகள்
      </div>

      {/* Loan Info */}
      <div className="flex justify-between mb-4 text-xs border-b pb-2">
        <div><span className="font-semibold">Loan No / கடன் எண்:</span> {loanNumber}</div>
        <div><span className="font-semibold">Date / தேதி:</span> {formatDate(loanDate)}</div>
        {captureTimestamp && (
          <div><span className="font-semibold">Captured / படமெடுத்த:</span> {formatDateTime(captureTimestamp)}</div>
        )}
      </div>

      {/* Gold Items Grid */}
      <div className={`grid ${isThermal ? 'grid-cols-2' : 'grid-cols-3'} gap-4 mb-4`}>
        {goldItems.map((item, index) => (
          <div key={index} className="border p-2 avoid-break">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={`Item ${index + 1}`}
                className="w-full mb-2"
                style={{ height: isThermal ? '60px' : '100px', objectFit: 'cover' }}
              />
            ) : (
              <div 
                className="w-full mb-2 bg-gray-200 flex items-center justify-center text-gray-500"
                style={{ height: isThermal ? '60px' : '100px' }}
              >
                No Image
              </div>
            )}
            <div className="text-xs">
              <div className="font-semibold">{index + 1}. {item.item_type}</div>
              {item.description && <div className="text-gray-600">{item.description}</div>}
              <div>Wt: {item.net_weight_grams.toFixed(2)}g | {item.purity}</div>
              <div className="font-semibold">{formatCurrency(item.appraised_value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Appraiser Sheet */}
      {appraiserSheetUrl && (
        <div className="mb-4 avoid-break">
          <div className="font-semibold mb-1">Appraiser Sheet / மதிப்பீட்டாளர் தாள்</div>
          <img 
            src={appraiserSheetUrl} 
            alt="Appraiser Sheet"
            className="w-full border"
            style={{ maxHeight: isThermal ? '150px' : '250px', objectFit: 'contain' }}
          />
          {appraiserName && (
            <div className="text-xs mt-1">Appraised by / மதிப்பிட்டவர்: {appraiserName}</div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="border p-2 mt-4">
        <div className="font-semibold mb-1">Summary / சுருக்கம்</div>
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="font-bold text-lg">{totalItems}</div>
            <div>Items / பொருட்கள்</div>
          </div>
          <div>
            <div className="font-bold text-lg">{totalWeight.toFixed(2)}g</div>
            <div>Total Weight / மொத்த எடை</div>
          </div>
          <div>
            <div className="font-bold text-lg">{formatCurrency(totalValue)}</div>
            <div>Total Value / மொத்த மதிப்பு</div>
          </div>
        </div>
      </div>

      {/* Verification */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="signature-line">
          Verified by / சரிபார்த்தவர்
        </div>
        <div className="signature-line">
          Customer Acknowledgment / வாடிக்கையாளர் ஒப்புகை
        </div>
      </div>
    </div>
  );
};
