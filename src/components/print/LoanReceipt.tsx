import { formatCurrency, formatDate } from '@/lib/print';

interface GoldItem {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
}

interface LoanReceiptProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
  };
  loan: {
    number: string;
    date: string;
    maturityDate: string;
    tenureDays: number;
    interestRate: number;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
    address?: string;
  };
  goldItems: GoldItem[];
  calculation: {
    totalAppraisedValue: number;
    principalAmount: number;
    advanceInterest: number;
    processingFee: number;
    documentCharges: number;
    netDisbursed: number;
  };
  copyType?: 'customer' | 'office';
}

export function LoanReceipt({
  company,
  loan,
  customer,
  goldItems,
  calculation,
  copyType = 'customer',
}: LoanReceiptProps) {
  const totalWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);

  return (
    <div className="text-sm">
      {/* Copy Type Badge */}
      <div className="copy-type">
        {copyType === 'customer' ? 'CUSTOMER COPY / வாடிக்கையாளர் நகல்' : 'OFFICE COPY / அலுவலக நகல்'}
      </div>

      {/* Header */}
      <div className="receipt-header">
        <h1 className="text-xl font-bold">{company.name}</h1>
        {company.address && <p className="text-xs mt-1">{company.address}</p>}
        {company.phone && <p className="text-xs">Phone: {company.phone}</p>}
      </div>

      {/* Receipt Title */}
      <div className="receipt-title">
        GOLD LOAN RECEIPT / தங்கக் கடன் ரசீது
      </div>

      {/* Loan & Customer Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="info-row">
            <span className="info-label">Loan Number / கடன் எண்:</span>
            <span className="info-value">{loan.number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Loan Date / கடன் தேதி:</span>
            <span className="info-value">{formatDate(loan.date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Maturity / முதிர்வு:</span>
            <span className="info-value">{formatDate(loan.maturityDate)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Tenure / காலம்:</span>
            <span className="info-value">{loan.tenureDays} days</span>
          </div>
        </div>
        <div>
          <div className="info-row">
            <span className="info-label">Customer / வாடிக்கையாளர்:</span>
            <span className="info-value">{customer.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Customer ID:</span>
            <span className="info-value">{customer.code}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone / தொலைபேசி:</span>
            <span className="info-value">{customer.phone}</span>
          </div>
          {customer.address && (
            <div className="info-row">
              <span className="info-label">Address / முகவரி:</span>
              <span className="info-value text-xs">{customer.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gold Items Table */}
      <div className="receipt-title text-xs">
        PLEDGED GOLD ITEMS / அடகு பொருட்கள்
      </div>
      <table className="mb-4">
        <thead>
          <tr>
            <th className="text-xs">#</th>
            <th className="text-xs">Item / பொருள்</th>
            <th className="text-xs text-right">Gross Wt (g)</th>
            <th className="text-xs text-right">Net Wt (g)</th>
            <th className="text-xs text-center">Purity</th>
            <th className="text-xs text-right">Value (₹)</th>
          </tr>
        </thead>
        <tbody>
          {goldItems.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.item_type}</td>
              <td className="text-right">{item.gross_weight_grams.toFixed(2)}</td>
              <td className="text-right">{item.net_weight_grams.toFixed(2)}</td>
              <td className="text-center">{item.purity.toUpperCase()}</td>
              <td className="text-right">{formatCurrency(item.appraised_value)}</td>
            </tr>
          ))}
          <tr className="font-semibold" style={{ background: '#f5f5f5' }}>
            <td colSpan={2}>Total / மொத்தம்</td>
            <td className="text-right">{totalWeight.toFixed(2)}g</td>
            <td colSpan={2}></td>
            <td className="text-right">{formatCurrency(calculation.totalAppraisedValue)}</td>
          </tr>
        </tbody>
      </table>

      {/* Financial Summary */}
      <div className="receipt-title text-xs">
        DISBURSEMENT DETAILS / வழங்கல் விவரங்கள்
      </div>
      <div className="border rounded p-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span>Principal Amount / அசல் தொகை:</span>
            <span className="font-semibold">{formatCurrency(calculation.principalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Interest Rate / வட்டி விகிதம்:</span>
            <span className="font-semibold">{loan.interestRate}% p.a.</span>
          </div>
          <div className="flex justify-between">
            <span>(-) Advance Interest / முன்கூட்டி வட்டி:</span>
            <span className="font-semibold text-red-600">- {formatCurrency(calculation.advanceInterest)}</span>
          </div>
          <div className="flex justify-between">
            <span>(-) Processing Fee / செயலாக்க கட்டணம்:</span>
            <span className="font-semibold text-red-600">- {formatCurrency(calculation.processingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>(-) Document Charges / ஆவண கட்டணம்:</span>
            <span className="font-semibold text-red-600">- {formatCurrency(calculation.documentCharges)}</span>
          </div>
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between text-lg font-bold" style={{ background: '#e8f5e9', margin: '-12px', marginTop: '12px', padding: '12px' }}>
          <span>NET DISBURSED / நிகர வழங்கல்:</span>
          <span className="text-green-700">{formatCurrency(calculation.netDisbursed)}</span>
        </div>
      </div>

      {/* Declaration */}
      <div className="text-xs p-2 border rounded mb-4" style={{ background: '#fff9c4' }}>
        <p className="font-semibold mb-1">Declaration / உறுதிமொழி:</p>
        <p className="tamil">
          I hereby declare that the gold items pledged are my own property and are free from any encumbrances. 
          I agree to the terms and conditions of this loan.
        </p>
        <p className="tamil mt-1">
          அடகு வைக்கப்பட்ட தங்கப் பொருட்கள் என் சொந்த சொத்து என்றும், எந்தவிதமான சுமைகளும் இல்லை என்றும் உறுதியளிக்கிறேன்.
        </p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-6">
        <div>
          <div className="signature-line">
            Customer Signature / வாடிக்கையாளர் கையொப்பம்
          </div>
        </div>
        <div>
          <div className="signature-line">
            Authorized Signature / அங்கீகரிக்கப்பட்ட கையொப்பம்
          </div>
        </div>
      </div>
    </div>
  );
}
