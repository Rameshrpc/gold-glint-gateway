import React from 'react';
import { formatCurrency, formatDate } from '@/lib/printUtils';

interface GoldItem {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  market_rate_per_gram: number;
  appraised_value: number;
}

interface RebateSchedule {
  days: number;
  percentage: number;
}

interface HTMLReceiptSectionProps {
  copyType: 'customer' | 'office';
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
    address?: string;
    phone: string;
    aadhaar?: string;
  };
  goldItems: GoldItem[];
  rebateSchedule?: RebateSchedule[];
  logoUrl?: string;
  paperSize?: 'a4' | 'thermal';
}

export const HTMLReceiptSection: React.FC<HTMLReceiptSectionProps> = ({
  copyType,
  company,
  loan,
  customer,
  goldItems,
  rebateSchedule,
  logoUrl,
  paperSize = 'a4',
}) => {
  const totalWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
  const isThermal = paperSize === 'thermal';

  return (
    <div className={`print-section ${isThermal ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: "'Catamaran', sans-serif" }}>
      {/* Header */}
      <div className="section-title">
        {copyType === 'customer' ? 'CUSTOMER COPY / வாடிக்கையாளர் நகல்' : 'OFFICE COPY / அலுவலக நகல்'}
      </div>

      {/* Company Header */}
      <div className="text-center mb-4 border-b pb-2">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="mx-auto mb-2" style={{ maxHeight: '50px' }} />
        )}
        <div className="font-bold text-lg">{company.name}</div>
        <div className="text-xs">{company.address}</div>
        <div className="text-xs">Phone: {company.phone} {company.email && `| Email: ${company.email}`}</div>
        {company.license && <div className="text-xs">License: {company.license}</div>}
      </div>

      {/* Loan Details */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div><span className="font-semibold">Loan No / கடன் எண்:</span> {loan.loanNumber}</div>
        <div><span className="font-semibold">Date / தேதி:</span> {formatDate(loan.loanDate)}</div>
        <div><span className="font-semibold">Maturity / முதிர்வு:</span> {formatDate(loan.maturityDate)}</div>
        <div><span className="font-semibold">Tenure / காலம்:</span> {loan.tenure} days</div>
      </div>

      {/* Customer Details */}
      <div className="border p-2 mb-4">
        <div className="font-semibold mb-1">Customer Details / வாடிக்கையாளர் விவரங்கள்</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div><span className="font-semibold">Name / பெயர்:</span> {customer.name}</div>
          <div><span className="font-semibold">Phone / தொலைபேசி:</span> {customer.phone}</div>
          {customer.address && <div className="col-span-2"><span className="font-semibold">Address / முகவரி:</span> {customer.address}</div>}
        </div>
      </div>

      {/* Gold Items Table */}
      <div className="mb-4">
        <div className="font-semibold mb-1">Pledged Gold Items / அடமானம் வைக்கப்பட்ட தங்க பொருட்கள்</div>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item / பொருள்</th>
              <th>Gross Wt</th>
              <th>Net Wt</th>
              <th>Purity</th>
              <th>Value / மதிப்பு</th>
            </tr>
          </thead>
          <tbody>
            {goldItems.map((item, index) => (
              <tr key={index}>
                <td className="text-center">{index + 1}</td>
                <td>{item.item_type}{item.description && ` - ${item.description}`}</td>
                <td className="text-right">{item.gross_weight_grams.toFixed(2)}g</td>
                <td className="text-right">{item.net_weight_grams.toFixed(2)}g</td>
                <td className="text-center">{item.purity}</td>
                <td className="text-right">{formatCurrency(item.appraised_value)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={3} className="text-right">Total / மொத்தம்:</td>
              <td className="text-right">{totalWeight.toFixed(2)}g</td>
              <td></td>
              <td className="text-right">{formatCurrency(totalValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="border p-2 mb-4">
        <div className="font-semibold mb-1">Loan Summary / கடன் சுருக்கம்</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>Principal Amount / அசல் தொகை:</div>
          <div className="text-right font-semibold">{formatCurrency(loan.principalAmount)}</div>
          <div>Interest Rate / வட்டி விகிதம்:</div>
          <div className="text-right">{loan.interestRate}% p.m.</div>
          {loan.processingFee && loan.processingFee > 0 && (
            <>
              <div>Processing Fee / செயலாக்க கட்டணம்:</div>
              <div className="text-right">{formatCurrency(loan.processingFee)}</div>
            </>
          )}
          {loan.advanceInterest && loan.advanceInterest > 0 && (
            <>
              <div>Advance Interest / முன்கூட்டியே வட்டி:</div>
              <div className="text-right">{formatCurrency(loan.advanceInterest)}</div>
            </>
          )}
          <div className="font-bold border-t pt-1">Net Disbursed / நிகர வழங்கியது:</div>
          <div className="text-right font-bold border-t pt-1">{formatCurrency(loan.netDisbursed)}</div>
        </div>
      </div>

      {/* Rebate Schedule */}
      {rebateSchedule && rebateSchedule.length > 0 && (
        <div className="mb-4">
          <div className="font-semibold mb-1">Rebate Schedule / தள்ளுபடி அட்டவணை</div>
          <div className="grid grid-cols-4 gap-1 text-xs border p-2">
            {rebateSchedule.map((rebate, index) => (
              <div key={index} className="text-center">
                <div className="font-semibold">{rebate.days} days</div>
                <div>{rebate.percentage}% rebate</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="signature-line">
          Customer Signature / வாடிக்கையாளர் கையொப்பம்
        </div>
        <div className="signature-line">
          Authorized Signatory / அங்கீகரிக்கப்பட்ட கையொப்பமிடுபவர்
        </div>
      </div>
    </div>
  );
};
