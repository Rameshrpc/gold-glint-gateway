import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, InfoGrid, AmountSummary, SignatureSection } from '../core';

interface InterestPaymentReceiptProps {
  data: {
    receiptNumber: string;
    paymentDate: string;
    loanNumber: string;
    customer: { name: string; nameTamil?: string; code: string; phone: string };
    periodFrom: string;
    periodTo: string;
    daysCovered: number;
    principal: number;
    interestRate: number;
    interestAmount: number;
    penaltyAmount?: number;
    totalPaid: number;
    paymentMode: string;
    reference?: string;
    nextDueDate: string;
    cumulativeInterestYTD?: number;
    branch: { name: string; nameTamil?: string };
    company: { name: string; nameTamil?: string; address?: string; phone?: string; logoUrl?: string };
  };
  watermark?: 'original' | 'duplicate';
}

export const InterestPaymentReceipt: React.FC<InterestPaymentReceiptProps> = ({ data, watermark = 'original' }) => {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatCurrency = (a: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);

  return (
    <PrintWrapper watermark={watermark} id="interest-payment-receipt">
      <BilingualHeader
        companyName={data.company.name}
        companyNameTamil={data.company.nameTamil}
        address={data.company.address}
        logoUrl={data.company.logoUrl}
        branchName={data.branch.name}
        branchNameTamil={data.branch.nameTamil}
        documentTitle="Interest Payment Receipt"
        documentTitleTamil="வட்டி செலுத்துதல் ரசீது"
        documentNumber={data.receiptNumber}
        documentDate={formatDate(data.paymentDate)}
      />
      <div className="my-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
        <div className="text-sm text-green-700">Amount Paid / செலுத்தப்பட்ட தொகை</div>
        <div className="text-3xl font-bold text-green-900">{formatCurrency(data.totalPaid)}</div>
      </div>
      <InfoGrid title="Loan Details" titleTamil="கடன் விவரங்கள்" columns={3} items={[
        { label: 'Loan Number', labelTamil: 'கடன் எண்', value: data.loanNumber, highlight: true },
        { label: 'Customer', labelTamil: 'வாடிக்கையாளர்', value: data.customer.name },
        { label: 'Principal', labelTamil: 'அசல்', value: formatCurrency(data.principal) },
      ]} />
      <InfoGrid title="Interest Period" titleTamil="வட்டி காலம்" columns={4} items={[
        { label: 'From', labelTamil: 'இருந்து', value: formatDate(data.periodFrom) },
        { label: 'To', labelTamil: 'வரை', value: formatDate(data.periodTo) },
        { label: 'Days', labelTamil: 'நாட்கள்', value: data.daysCovered.toString() },
        { label: 'Rate', labelTamil: 'விகிதம்', value: `${data.interestRate}% p.m.` },
      ]} />
      <AmountSummary title="Payment Details" titleTamil="கட்டண விவரங்கள்" lines={[
        { label: 'Interest Amount', labelTamil: 'வட்டி தொகை', amount: data.interestAmount },
        ...(data.penaltyAmount ? [{ label: 'Penalty', labelTamil: 'அபராதம்', amount: data.penaltyAmount }] : []),
        { label: 'Total Paid', labelTamil: 'மொத்தம் செலுத்தப்பட்டது', amount: data.totalPaid, isTotal: true },
      ]} />
      <div className="text-xs mt-2"><strong>Payment Mode:</strong> {data.paymentMode} {data.reference && `| Ref: ${data.reference}`}</div>
      <div className="text-xs mt-1"><strong>Next Due Date:</strong> {formatDate(data.nextDueDate)}</div>
      <SignatureSection signatures={[
        { label: 'Customer', labelTamil: 'வாடிக்கையாளர்' },
        { label: 'Cashier', labelTamil: 'காசாளர்' },
      ]} />
      <BilingualFooter footerText="Thank you for your payment" footerTextTamil="உங்கள் கட்டணத்திற்கு நன்றி" companyName={data.company.name} printDate={new Date().toLocaleDateString('en-IN')} />
    </PrintWrapper>
  );
};

export default InterestPaymentReceipt;