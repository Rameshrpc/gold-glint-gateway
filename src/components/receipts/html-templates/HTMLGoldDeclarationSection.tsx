import React from 'react';
import { formatCurrency, formatDate } from '@/lib/printUtils';

interface GoldSummary {
  totalItems: number;
  totalWeight: number;
  totalValue: number;
}

interface HTMLGoldDeclarationSectionProps {
  customer: {
    name: string;
    address?: string;
    phone: string;
  };
  goldSummary: GoldSummary;
  loanNumber: string;
  loanDate: string;
  place?: string;
  paperSize?: 'a4' | 'thermal';
}

const declarationPoints = [
  {
    key: 'ownership',
    en: 'I declare that I am the rightful owner of all the gold ornaments pledged.',
    ta: 'அடமானம் வைக்கப்பட்ட அனைத்து தங்க நகைகளுக்கும் நான் உரிமையாளர் என்று அறிவிக்கிறேன்.',
  },
  {
    key: 'legal',
    en: 'The pledged gold is free from any legal disputes, liens, or encumbrances.',
    ta: 'அடமானம் வைக்கப்பட்ட தங்கம் எந்தவொரு சட்ட தகராறுகள், பிணையங்கள் அல்லது சுமைகளிலிருந்து விடுபட்டது.',
  },
  {
    key: 'not_stolen',
    en: 'The gold is not stolen, counterfeit, or obtained through illegal means.',
    ta: 'தங்கம் திருடப்படவில்லை, போலியானது அல்ல, அல்லது சட்டவிரோத வழிகளில் பெறப்படவில்லை.',
  },
  {
    key: 'liable',
    en: 'I understand that I am liable for any false declarations made.',
    ta: 'தவறான அறிவிப்புகளுக்கு நான் பொறுப்பு என்பதை புரிந்துகொள்கிறேன்.',
  },
  {
    key: 'auction',
    en: 'I understand that failure to repay the loan may result in auction of the pledged gold.',
    ta: 'கடனை திருப்பிச் செலுத்தத் தவறினால் அடமானம் வைக்கப்பட்ட தங்கம் ஏலம் விடப்படும் என்பதை புரிந்துகொள்கிறேன்.',
  },
];

export const HTMLGoldDeclarationSection: React.FC<HTMLGoldDeclarationSectionProps> = ({
  customer,
  goldSummary,
  loanNumber,
  loanDate,
  place = '',
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === 'thermal';

  return (
    <div className={`print-section ${isThermal ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: "'Catamaran', sans-serif" }}>
      {/* Header */}
      <div className="section-title">
        DECLARATION OF GOLD OWNERSHIP / தங்க உரிமை அறிவிப்பு
      </div>

      {/* Customer Info */}
      <div className="border p-2 mb-4">
        <div className="font-semibold mb-1">Declarant Details / அறிவிப்பாளர் விவரங்கள்</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div><span className="font-semibold">Name / பெயர்:</span> {customer.name}</div>
          <div><span className="font-semibold">Phone / தொலைபேசி:</span> {customer.phone}</div>
          {customer.address && (
            <div className="col-span-2"><span className="font-semibold">Address / முகவரி:</span> {customer.address}</div>
          )}
        </div>
      </div>

      {/* Declaration Points */}
      <div className="mb-4">
        <div className="font-semibold mb-2">Declaration / அறிவிப்பு</div>
        <div className="space-y-2">
          {declarationPoints.map((point, index) => (
            <div key={point.key} className="text-xs border-l-2 border-gray-400 pl-2">
              <div>{index + 1}. {point.en}</div>
              <div className="text-gray-600">{point.ta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gold Summary */}
      <div className="border p-2 mb-4">
        <div className="font-semibold mb-1">Summary of Pledged Gold / அடமான தங்கத்தின் சுருக்கம்</div>
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          <div>
            <div className="font-bold text-lg">{goldSummary.totalItems}</div>
            <div>Items / பொருட்கள்</div>
          </div>
          <div>
            <div className="font-bold text-lg">{goldSummary.totalWeight.toFixed(2)}g</div>
            <div>Total Weight / மொத்த எடை</div>
          </div>
          <div>
            <div className="font-bold text-lg">{formatCurrency(goldSummary.totalValue)}</div>
            <div>Total Value / மொத்த மதிப்பு</div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="border border-red-500 bg-red-50 p-2 mb-4 text-xs">
        <div className="font-bold text-red-600">⚠️ WARNING / எச்சரிக்கை</div>
        <div>False declaration is a punishable offense under Indian law.</div>
        <div className="text-gray-600">தவறான அறிவிப்பு இந்திய சட்டத்தின் கீழ் தண்டனைக்குரிய குற்றமாகும்.</div>
      </div>

      {/* Place and Date */}
      <div className="flex justify-between mb-4 text-xs">
        <div><span className="font-semibold">Place / இடம்:</span> {place || '_______________'}</div>
        <div><span className="font-semibold">Date / தேதி:</span> {formatDate(loanDate)}</div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="signature-line">
          Customer Signature / வாடிக்கையாளர் கையொப்பம்
        </div>
        <div className="signature-line">
          Witness Signature / சாட்சி கையொப்பம்
        </div>
      </div>
    </div>
  );
};
