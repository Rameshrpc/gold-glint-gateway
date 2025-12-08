import React from 'react';
import { HTMLReceiptSection } from './HTMLReceiptSection';
import { HTMLJewelImagesSection } from './HTMLJewelImagesSection';
import { HTMLKYCDocumentsSection } from './HTMLKYCDocumentsSection';
import { HTMLGoldDeclarationSection } from './HTMLGoldDeclarationSection';
import { HTMLTermsConditionsSection } from './HTMLTermsConditionsSection';

interface GoldItem {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  market_rate_per_gram: number;
  appraised_value: number;
  image_url?: string;
}

interface RebateSchedule {
  days: number;
  percentage: number;
}

interface TermItem {
  en: string;
  ta: string;
}

export interface TamilNaduPawnbrokerHTMLTemplateProps {
  company: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    license?: string;
  };
  loan: {
    loanNumber: string;
    loanDate: string;
    maturityDate: string;
    principalAmount: number;
    interestRate: number;
    tenure: number;
    processingFee?: number;
    advanceInterest?: number;
    netDisbursed: number;
  };
  customer: {
    name: string;
    customerId: string;
    address?: string;
    phone: string;
    aadhaar?: string;
    photoUrl?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    panCardUrl?: string;
  };
  goldItems: GoldItem[];
  rebateSchedule?: RebateSchedule[];
  jewelPhotoCaptureTimestamp?: string;
  appraiserName?: string;
  appraiserSheetUrl?: string;
  customTerms?: TermItem[];
  logoUrl?: string;
  place?: string;
  paperSize?: 'a4' | 'thermal';
}

export const TamilNaduPawnbrokerHTMLTemplate: React.FC<TamilNaduPawnbrokerHTMLTemplateProps> = ({
  company,
  loan,
  customer,
  goldItems,
  rebateSchedule,
  jewelPhotoCaptureTimestamp,
  appraiserName,
  appraiserSheetUrl,
  customTerms,
  logoUrl,
  place,
  paperSize = 'a4',
}) => {
  const goldSummary = {
    totalItems: goldItems.length,
    totalWeight: goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0),
    totalValue: goldItems.reduce((sum, item) => sum + item.appraised_value, 0),
  };

  const isThermal = paperSize === 'thermal';
  const containerClass = isThermal ? 'print-preview-thermal' : 'print-preview-a4';

  return (
    <div 
      className={`print-preview ${containerClass}`}
      style={{ fontFamily: "'Catamaran', sans-serif", backgroundColor: 'white', color: 'black' }}
    >
      {/* Customer Copy */}
      <HTMLReceiptSection
        copyType="customer"
        company={company}
        loan={loan}
        customer={customer}
        goldItems={goldItems}
        rebateSchedule={rebateSchedule}
        logoUrl={logoUrl}
        paperSize={paperSize}
      />

      {!isThermal && <div className="page-break" />}
      {isThermal && <hr className="my-4 border-dashed border-gray-400" />}

      {/* Office Copy */}
      <HTMLReceiptSection
        copyType="office"
        company={company}
        loan={loan}
        customer={customer}
        goldItems={goldItems}
        rebateSchedule={rebateSchedule}
        logoUrl={logoUrl}
        paperSize={paperSize}
      />

      {!isThermal && <div className="page-break" />}
      {isThermal && <hr className="my-4 border-dashed border-gray-400" />}

      {/* Jewel Images Section */}
      <HTMLJewelImagesSection
        loanNumber={loan.loanNumber}
        loanDate={loan.loanDate}
        goldItems={goldItems}
        captureTimestamp={jewelPhotoCaptureTimestamp}
        appraiserName={appraiserName}
        appraiserSheetUrl={appraiserSheetUrl}
        paperSize={paperSize}
      />

      {!isThermal && <div className="page-break" />}
      {isThermal && <hr className="my-4 border-dashed border-gray-400" />}

      {/* KYC Documents Section */}
      <HTMLKYCDocumentsSection
        customer={customer}
        loanNumber={loan.loanNumber}
        paperSize={paperSize}
      />

      {!isThermal && <div className="page-break" />}
      {isThermal && <hr className="my-4 border-dashed border-gray-400" />}

      {/* Gold Declaration Section */}
      <HTMLGoldDeclarationSection
        customer={customer}
        goldSummary={goldSummary}
        loanNumber={loan.loanNumber}
        loanDate={loan.loanDate}
        place={place}
        paperSize={paperSize}
      />

      {!isThermal && <div className="page-break" />}
      {isThermal && <hr className="my-4 border-dashed border-gray-400" />}

      {/* Terms & Conditions Section */}
      <HTMLTermsConditionsSection
        customTerms={customTerms}
        paperSize={paperSize}
      />

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t text-xs text-gray-500">
        <div>--- END OF RECEIPT / ரசீதின் முடிவு ---</div>
      </div>
    </div>
  );
};
