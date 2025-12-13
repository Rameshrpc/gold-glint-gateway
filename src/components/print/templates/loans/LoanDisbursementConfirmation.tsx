import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, InfoGrid, AmountSummary, SignatureSection } from '../core';
import { WatermarkType } from '../core/WatermarkOverlay';

interface DisbursementData {
  loanNumber: string;
  loanDate: string;
  customer: {
    name: string;
    nameTamil?: string;
    code: string;
    phone: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  principal: number;
  processingFee: number;
  documentCharges: number;
  advanceInterest: number;
  netDisbursed: number;
  disbursementMode: 'cash' | 'neft' | 'rtgs' | 'cheque' | 'upi';
  transactionReference?: string;
  transactionDate: string;
  transactionTime?: string;
  branch: {
    name: string;
    nameTamil?: string;
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

interface LoanDisbursementConfirmationProps {
  data: DisbursementData;
  watermark?: WatermarkType;
}

export const LoanDisbursementConfirmation: React.FC<LoanDisbursementConfirmationProps> = ({ data, watermark = 'original' }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    const date = formatDate(dateStr);
    return timeStr ? `${date} at ${timeStr}` : date;
  };

  const getDisbursementModeLabel = (mode: string) => {
    const labels: Record<string, { en: string; ta: string }> = {
      cash: { en: 'Cash', ta: 'ரொக்கம்' },
      neft: { en: 'NEFT Transfer', ta: 'NEFT பரிமாற்றம்' },
      rtgs: { en: 'RTGS Transfer', ta: 'RTGS பரிமாற்றம்' },
      cheque: { en: 'Cheque', ta: 'காசோலை' },
      upi: { en: 'UPI Transfer', ta: 'UPI பரிமாற்றம்' },
    };
    return labels[mode] || { en: mode, ta: mode };
  };

  const modeLabel = getDisbursementModeLabel(data.disbursementMode);

  return (
    <PrintWrapper watermark={watermark} id="loan-disbursement-confirmation">
      <BilingualHeader
        companyName={data.company.name}
        companyNameTamil={data.company.nameTamil}
        address={data.company.address}
        phone={data.company.phone}
        email={data.company.email}
        logoUrl={data.company.logoUrl}
        branchName={data.branch.name}
        branchNameTamil={data.branch.nameTamil}
        documentTitle="Disbursement Confirmation"
        documentTitleTamil="வழங்கல் உறுதிப்படுத்தல்"
        documentNumber={data.loanNumber}
        documentDate={formatDate(data.transactionDate)}
      />

      {/* Transaction Highlight */}
      <div className="my-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
        <div className="bilingual-text">
          <span className="text-lg font-bold text-green-800 text-english">AMOUNT DISBURSED</span>
          <span className="text-sm text-green-700 text-tamil block">வழங்கப்பட்ட தொகை</span>
        </div>
        <div className="text-3xl font-bold text-green-900 mt-2">
          ₹ {data.netDisbursed.toLocaleString('en-IN')}
        </div>
        <div className="text-sm text-green-700 mt-1">
          ({modeLabel.en} / {modeLabel.ta})
        </div>
      </div>

      {/* Customer Details */}
      <InfoGrid
        title="Beneficiary Details"
        titleTamil="பயனாளி விவரங்கள்"
        columns={2}
        items={[
          { label: 'Customer Name', labelTamil: 'வாடிக்கையாளர் பெயர்', value: data.customer.name },
          { label: 'Customer Code', labelTamil: 'வாடிக்கையாளர் குறியீடு', value: data.customer.code },
          { label: 'Phone Number', labelTamil: 'தொலைபேசி எண்', value: data.customer.phone },
          { label: 'Loan Number', labelTamil: 'கடன் எண்', value: data.loanNumber },
        ]}
      />

      {/* Bank Details (if bank transfer) */}
      {['neft', 'rtgs', 'upi'].includes(data.disbursementMode) && data.customer.bankName && (
        <InfoGrid
          title="Bank Transfer Details"
          titleTamil="வங்கி பரிமாற்ற விவரங்கள்"
          columns={2}
          items={[
            { label: 'Bank Name', labelTamil: 'வங்கி பெயர்', value: data.customer.bankName },
            { label: 'Account Number', labelTamil: 'கணக்கு எண்', value: data.customer.accountNumber || '-' },
            { label: 'IFSC Code', labelTamil: 'IFSC குறியீடு', value: data.customer.ifscCode || '-' },
            { label: 'Transaction Reference', labelTamil: 'பரிவர்த்தனை குறிப்பு', value: data.transactionReference || '-' },
          ]}
        />
      )}

      {/* Transaction Details */}
      <InfoGrid
        title="Transaction Details"
        titleTamil="பரிவர்த்தனை விவரங்கள்"
        columns={3}
        items={[
          { label: 'Payment Mode', labelTamil: 'கட்டண முறை', value: modeLabel.en },
          { label: 'Transaction Date', labelTamil: 'பரிவர்த்தனை தேதி', value: formatDateTime(data.transactionDate, data.transactionTime) },
          { label: 'Reference No.', labelTamil: 'குறிப்பு எண்', value: data.transactionReference || 'N/A' },
        ]}
      />

      {/* Amount Breakdown */}
      <AmountSummary
        title="Amount Breakdown"
        titleTamil="தொகை விவரம்"
        lines={[
          { label: 'Loan Principal', labelTamil: 'கடன் அசல்', amount: data.principal },
          { label: 'Processing Fee', labelTamil: 'செயலாக்க கட்டணம்', amount: data.processingFee, isDeduction: true },
          { label: 'Document Charges', labelTamil: 'ஆவண கட்டணங்கள்', amount: data.documentCharges, isDeduction: true },
          { label: 'Advance Interest', labelTamil: 'முன்கூட்டி வட்டி', amount: data.advanceInterest, isDeduction: true },
          { label: 'Net Amount Disbursed', labelTamil: 'நிகர வழங்கப்பட்ட தொகை', amount: data.netDisbursed, isTotal: true },
        ]}
      />

      {/* Confirmation Note */}
      <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <div className="bilingual-text">
          <p className="text-english text-blue-800">
            This confirms that the above amount has been successfully disbursed to the customer through the specified payment mode.
          </p>
          <p className="text-tamil text-blue-700 mt-1">
            மேற்கூறிய தொகை குறிப்பிட்ட கட்டண முறை மூலம் வாடிக்கையாளருக்கு வெற்றிகரமாக வழங்கப்பட்டது என்பதை இது உறுதிப்படுத்துகிறது.
          </p>
        </div>
      </div>

      {/* Signatures */}
      <SignatureSection
        columns={2}
        signatures={[
          { label: 'Customer Acknowledgement', labelTamil: 'வாடிக்கையாளர் ஒப்புகை' },
          { label: 'Disbursing Officer', labelTamil: 'வழங்கும் அதிகாரி' },
        ]}
        showDate
      />

      <BilingualFooter
        footerText="Please retain this document for your records"
        footerTextTamil="உங்கள் பதிவுகளுக்கு இந்த ஆவணத்தை வைத்திருக்கவும்"
        companyName={data.company.name}
        printDate={new Date().toLocaleDateString('en-IN')}
      />
    </PrintWrapper>
  );
};

export default LoanDisbursementConfirmation;