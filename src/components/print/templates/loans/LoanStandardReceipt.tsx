import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, GoldItemsTable, InfoGrid, AmountSummary, DeclarationBox, SignatureSection } from '../core';
import { WatermarkType } from '../core/WatermarkOverlay';

export interface LoanData {
  loanNumber: string;
  loanDate: string;
  maturityDate: string;
  customer: {
    name: string;
    nameTamil?: string;
    code: string;
    phone: string;
    address?: string;
    addressTamil?: string;
  };
  scheme: {
    name: string;
    interestRate: number;
    tenure: number;
  };
  principal: number;
  processingFee: number;
  documentCharges: number;
  advanceInterest: number;
  netDisbursed: number;
  disbursementMode: string;
  goldItems: Array<{
    id: string;
    serialNumber?: string;
    itemType: string;
    itemTypeTamil?: string;
    grossWeight: number;
    stoneWeight?: number;
    netWeight: number;
    purity: string;
    purityPercentage: number;
    marketRate: number;
    appraisedValue: number;
  }>;
  branch: {
    name: string;
    nameTamil?: string;
    address?: string;
    phone?: string;
  };
  company: {
    name: string;
    nameTamil?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
}

interface LoanStandardReceiptProps {
  data: LoanData;
  watermark?: WatermarkType;
}

export const LoanStandardReceipt: React.FC<LoanStandardReceiptProps> = ({ data, watermark = 'original' }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <PrintWrapper watermark={watermark} id="loan-standard-receipt">
      <BilingualHeader
        companyName={data.company.name}
        companyNameTamil={data.company.nameTamil}
        address={data.company.address}
        phone={data.company.phone}
        email={data.company.email}
        logoUrl={data.company.logoUrl}
        branchName={data.branch.name}
        branchNameTamil={data.branch.nameTamil}
        documentTitle="Gold Loan Receipt"
        documentTitleTamil="தங்க கடன் ரசீது"
        documentNumber={data.loanNumber}
        documentDate={formatDate(data.loanDate)}
      />

      {/* Customer Details */}
      <InfoGrid
        title="Borrower Details"
        titleTamil="கடன் பெறுபவர் விவரங்கள்"
        columns={2}
        items={[
          { label: 'Customer Name', labelTamil: 'வாடிக்கையாளர் பெயர்', value: data.customer.name, valueTamil: data.customer.nameTamil },
          { label: 'Customer Code', labelTamil: 'வாடிக்கையாளர் குறியீடு', value: data.customer.code },
          { label: 'Phone Number', labelTamil: 'தொலைபேசி எண்', value: data.customer.phone },
          { label: 'Address', labelTamil: 'முகவரி', value: data.customer.address || '-', fullWidth: true },
        ]}
      />

      {/* Loan Details */}
      <InfoGrid
        title="Loan Details"
        titleTamil="கடன் விவரங்கள்"
        columns={3}
        items={[
          { label: 'Loan Number', labelTamil: 'கடன் எண்', value: data.loanNumber, highlight: true },
          { label: 'Loan Date', labelTamil: 'கடன் தேதி', value: formatDate(data.loanDate) },
          { label: 'Maturity Date', labelTamil: 'முதிர்வு தேதி', value: formatDate(data.maturityDate) },
          { label: 'Scheme', labelTamil: 'திட்டம்', value: data.scheme.name },
          { label: 'Interest Rate', labelTamil: 'வட்டி விகிதம்', value: `${data.scheme.interestRate}% p.m.` },
          { label: 'Tenure', labelTamil: 'கால அளவு', value: `${data.scheme.tenure} days` },
        ]}
      />

      {/* Gold Items */}
      <GoldItemsTable items={data.goldItems} showSerials />

      {/* Amount Summary */}
      <AmountSummary
        title="Disbursement Summary"
        titleTamil="வழங்கல் சுருக்கம்"
        lines={[
          { label: 'Principal Amount', labelTamil: 'அசல் தொகை', amount: data.principal },
          { label: 'Processing Fee', labelTamil: 'செயலாக்க கட்டணம்', amount: data.processingFee, isDeduction: true },
          { label: 'Document Charges', labelTamil: 'ஆவண கட்டணங்கள்', amount: data.documentCharges, isDeduction: true },
          { label: 'Advance Interest', labelTamil: 'முன்கூட்டி வட்டி', amount: data.advanceInterest, isDeduction: true },
          { label: 'Net Disbursed Amount', labelTamil: 'நிகர வழங்கப்பட்ட தொகை', amount: data.netDisbursed, isTotal: true },
        ]}
      />

      <div className="text-xs text-gray-600 mt-2">
        <span className="font-medium text-english">Payment Mode: </span>{data.disbursementMode}
        <span className="text-tamil ml-2">(கட்டண முறை)</span>
      </div>

      {/* Declaration */}
      <DeclarationBox
        title="Declaration"
        titleTamil="உறுதிமொழி"
        content="I hereby acknowledge that I have received the loan amount mentioned above and have pledged the gold items listed. I agree to repay the principal along with interest as per the scheme terms. I understand that failure to repay may result in auction of the pledged items."
        contentTamil="மேலே குறிப்பிட்ட கடன் தொகையை நான் பெற்றுக்கொண்டேன் என்றும், பட்டியலிடப்பட்ட தங்க பொருட்களை அடமானம் வைத்துள்ளேன் என்றும் இதன்மூலம் ஒப்புக்கொள்கிறேன். திட்ட விதிமுறைகளின்படி அசல் மற்றும் வட்டியை திருப்பிச் செலுத்த ஒப்புக்கொள்கிறேன். திருப்பிச் செலுத்தத் தவறினால் அடமானப் பொருட்கள் ஏலம் விடப்படலாம் என்பதை புரிந்துகொள்கிறேன்."
        showCheckbox
        checkboxLabel="I have read and agree to the terms and conditions"
        checkboxLabelTamil="நிபந்தனைகளை படித்து ஒப்புக்கொள்கிறேன்"
      />

      {/* Signatures */}
      <SignatureSection
        signatures={[
          { label: 'Customer Signature', labelTamil: 'வாடிக்கையாளர் கையொப்பம்' },
          { label: 'Authorized Signatory', labelTamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
        ]}
      />

      <BilingualFooter
        footerText="This is a computer generated receipt"
        footerTextTamil="இது கணினியால் உருவாக்கப்பட்ட ரசீது"
        companyName={data.company.name}
        printDate={new Date().toLocaleDateString('en-IN')}
      />
    </PrintWrapper>
  );
};

export default LoanStandardReceipt;