import { formatCurrency, formatDate } from '@/lib/print';

interface InterestReceiptProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
  };
  receipt: {
    number: string;
    date: string;
    paymentMode: string;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  loan: {
    number: string;
    date: string;
    principal: number;
  };
  payment: {
    amountPaid: number;
    interestAmount: number;
    penaltyAmount: number;
    principalReduction: number;
    periodFrom: string;
    periodTo: string;
    daysCovered: number;
  };
  balances: {
    previousPrincipal: number;
    newPrincipal: number;
  };
}

export function InterestReceipt({
  company,
  receipt,
  customer,
  loan,
  payment,
  balances,
}: InterestReceiptProps) {
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
        INTEREST PAYMENT RECEIPT / வட்டி செலுத்துதல் ரசீது
      </div>

      {/* Receipt & Loan Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="info-row">
            <span className="info-label">Receipt Number:</span>
            <span className="info-value">{receipt.number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Payment Date:</span>
            <span className="info-value">{formatDate(receipt.date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Payment Mode:</span>
            <span className="info-value">{receipt.paymentMode.toUpperCase()}</span>
          </div>
        </div>
        <div>
          <div className="info-row">
            <span className="info-label">Loan Number:</span>
            <span className="info-value">{loan.number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Loan Date:</span>
            <span className="info-value">{formatDate(loan.date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Principal:</span>
            <span className="info-value">{formatCurrency(loan.principal)}</span>
          </div>
        </div>
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

      {/* Payment Period */}
      <div className="border rounded p-3 mb-4" style={{ background: '#e3f2fd' }}>
        <div className="font-semibold mb-2">Interest Period / வட்டி காலம்:</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="info-label">From:</span>
            <span className="info-value ml-2">{formatDate(payment.periodFrom)}</span>
          </div>
          <div>
            <span className="info-label">To:</span>
            <span className="info-value ml-2">{formatDate(payment.periodTo)}</span>
          </div>
          <div>
            <span className="info-label">Days:</span>
            <span className="info-value ml-2">{payment.daysCovered} days</span>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="receipt-title text-xs">
        PAYMENT BREAKDOWN / செலுத்துதல் விவரம்
      </div>
      <div className="border rounded mb-4">
        <table>
          <tbody>
            <tr>
              <td className="font-medium">Interest Amount / வட்டித் தொகை</td>
              <td className="text-right font-semibold">{formatCurrency(payment.interestAmount)}</td>
            </tr>
            {payment.penaltyAmount > 0 && (
              <tr>
                <td className="font-medium text-red-600">Penalty / அபராதம்</td>
                <td className="text-right font-semibold text-red-600">{formatCurrency(payment.penaltyAmount)}</td>
              </tr>
            )}
            {payment.principalReduction > 0 && (
              <tr>
                <td className="font-medium text-blue-600">Principal Reduction / அசல் குறைப்பு</td>
                <td className="text-right font-semibold text-blue-600">{formatCurrency(payment.principalReduction)}</td>
              </tr>
            )}
            <tr style={{ background: '#e8f5e9' }}>
              <td className="font-bold text-lg text-green-700">Total Paid / மொத்தம் செலுத்தப்பட்டது</td>
              <td className="text-right font-bold text-lg text-green-700">{formatCurrency(payment.amountPaid)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Principal Update */}
      {payment.principalReduction > 0 && (
        <div className="border rounded p-3 mb-4" style={{ background: '#fff3e0' }}>
          <div className="font-semibold mb-2">Principal Update / அசல் புதுப்பிப்பு:</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="info-label">Previous:</span>
              <span className="info-value ml-2">{formatCurrency(balances.previousPrincipal)}</span>
            </div>
            <div>
              <span className="info-label">Reduced by:</span>
              <span className="info-value ml-2 text-green-600">- {formatCurrency(payment.principalReduction)}</span>
            </div>
            <div>
              <span className="info-label">New Balance:</span>
              <span className="info-value ml-2 font-bold">{formatCurrency(balances.newPrincipal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation */}
      <div className="text-xs p-2 border rounded mb-4 text-center" style={{ background: '#e8f5e9' }}>
        <p className="font-semibold text-green-700">
          ✓ INTEREST PAYMENT RECEIVED / வட்டி செலுத்துதல் பெறப்பட்டது
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
            Cashier Signature / காசாளர் கையொப்பம்
          </div>
        </div>
      </div>
    </div>
  );
}
