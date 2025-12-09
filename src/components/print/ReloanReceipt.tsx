import { formatCurrency, formatDate } from '@/lib/print';

interface ReloanReceiptProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
  };
  oldLoan: {
    number: string;
    date: string;
    principal: number;
    settlementAmount: number;
  };
  newLoan: {
    number: string;
    date: string;
    maturityDate: string;
    tenureDays: number;
    principal: number;
    advanceInterest: number;
    processingFee: number;
    documentCharges: number;
    netDisbursed: number;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  netSettlement: {
    direction: 'to_customer' | 'from_customer';
    amount: number;
  };
}

export function ReloanReceipt({
  company,
  oldLoan,
  newLoan,
  customer,
  netSettlement,
}: ReloanReceiptProps) {
  return (
    <div className="text-sm">
      {/* Header */}
      <div className="receipt-header">
        <h1 className="text-xl font-bold">{company.name}</h1>
        {company.address && <p className="text-xs mt-1">{company.address}</p>}
        {company.phone && <p className="text-xs">Phone: {company.phone}</p>}
      </div>

      {/* Receipt Title */}
      <div className="receipt-title">
        RELOAN / RENEWAL RECEIPT / மறுகடன் ரசீது
      </div>

      {/* Customer Info */}
      <div className="border rounded p-3 mb-4" style={{ background: '#f5f5f5' }}>
        <div className="font-semibold mb-2">Customer / வாடிக்கையாளர்:</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="info-value">{customer.name}</span>
          </div>
          <div>
            <span className="info-label">ID:</span>
            <span className="info-value ml-2">{customer.code}</span>
          </div>
          <div>
            <span className="info-label">Phone:</span>
            <span className="info-value ml-2">{customer.phone}</span>
          </div>
        </div>
      </div>

      {/* Old Loan Settlement */}
      <div className="receipt-title text-xs" style={{ background: '#ffebee' }}>
        OLD LOAN SETTLEMENT / பழைய கடன் தீர்வு
      </div>
      <div className="border rounded mb-4">
        <table>
          <tbody>
            <tr>
              <td className="font-medium">Old Loan Number</td>
              <td className="text-right font-semibold">{oldLoan.number}</td>
            </tr>
            <tr>
              <td className="font-medium">Loan Date</td>
              <td className="text-right">{formatDate(oldLoan.date)}</td>
            </tr>
            <tr>
              <td className="font-medium">Original Principal</td>
              <td className="text-right">{formatCurrency(oldLoan.principal)}</td>
            </tr>
            <tr style={{ background: '#ffcdd2' }}>
              <td className="font-bold">Total Settlement Amount</td>
              <td className="text-right font-bold">{formatCurrency(oldLoan.settlementAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* New Loan Details */}
      <div className="receipt-title text-xs" style={{ background: '#e8f5e9' }}>
        NEW LOAN DETAILS / புதிய கடன் விவரங்கள்
      </div>
      <div className="border rounded mb-4">
        <table>
          <tbody>
            <tr>
              <td className="font-medium">New Loan Number</td>
              <td className="text-right font-semibold">{newLoan.number}</td>
            </tr>
            <tr>
              <td className="font-medium">Loan Date</td>
              <td className="text-right">{formatDate(newLoan.date)}</td>
            </tr>
            <tr>
              <td className="font-medium">Maturity Date</td>
              <td className="text-right">{formatDate(newLoan.maturityDate)}</td>
            </tr>
            <tr>
              <td className="font-medium">Tenure</td>
              <td className="text-right">{newLoan.tenureDays} days</td>
            </tr>
            <tr style={{ background: '#f5f5f5' }}>
              <td className="font-medium">Principal Amount</td>
              <td className="text-right font-semibold">{formatCurrency(newLoan.principal)}</td>
            </tr>
            <tr>
              <td className="font-medium text-red-600">(-) Advance Interest</td>
              <td className="text-right text-red-600">- {formatCurrency(newLoan.advanceInterest)}</td>
            </tr>
            <tr>
              <td className="font-medium text-red-600">(-) Processing Fee</td>
              <td className="text-right text-red-600">- {formatCurrency(newLoan.processingFee)}</td>
            </tr>
            <tr>
              <td className="font-medium text-red-600">(-) Document Charges</td>
              <td className="text-right text-red-600">- {formatCurrency(newLoan.documentCharges)}</td>
            </tr>
            <tr style={{ background: '#c8e6c9' }}>
              <td className="font-bold">Net Disbursement</td>
              <td className="text-right font-bold">{formatCurrency(newLoan.netDisbursed)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Settlement */}
      <div 
        className="border-2 rounded p-4 mb-4 text-center" 
        style={{ 
          background: netSettlement.direction === 'to_customer' ? '#e8f5e9' : '#fff3e0',
          borderColor: netSettlement.direction === 'to_customer' ? '#4caf50' : '#ff9800'
        }}
      >
        <div className="text-lg font-bold mb-2">
          NET SETTLEMENT / நிகர தீர்வு
        </div>
        <div className="text-2xl font-bold" style={{ color: netSettlement.direction === 'to_customer' ? '#2e7d32' : '#e65100' }}>
          {formatCurrency(netSettlement.amount)}
        </div>
        <div className="text-sm mt-1 font-semibold">
          {netSettlement.direction === 'to_customer' 
            ? '↓ PAID TO CUSTOMER / வாடிக்கையாளருக்கு செலுத்தப்பட்டது'
            : '↑ RECEIVED FROM CUSTOMER / வாடிக்கையாளரிடமிருந்து பெறப்பட்டது'
          }
        </div>
      </div>

      {/* Confirmation */}
      <div className="text-xs p-2 border rounded mb-4 text-center" style={{ background: '#e8f5e9' }}>
        <p className="font-semibold text-green-700">
          ✓ RELOAN PROCESSED SUCCESSFULLY / மறுகடன் வெற்றிகரமாக செயலாக்கப்பட்டது
        </p>
        <p className="mt-1">Old loan closed and new loan issued. Gold remains pledged.</p>
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
