import { formatCurrency, formatDate } from '@/lib/print';

interface RedemptionReceiptProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
  };
  redemption: {
    number: string;
    date: string;
    paymentMode: string;
    paymentReference?: string;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  loan: {
    number: string;
    date: string;
    originalPrincipal: number;
    tenureDays: number;
    daysSinceLoan: number;
  };
  settlement: {
    outstandingPrincipal: number;
    interestDue: number;
    penalty: number;
    rebateAmount: number;
    totalSettlement: number;
    amountReceived: number;
  };
  goldRelease: {
    releasedTo: string;
    releaseDate: string;
    identityVerified: boolean;
  };
}

export function RedemptionReceipt({
  company,
  redemption,
  customer,
  loan,
  settlement,
  goldRelease,
}: RedemptionReceiptProps) {
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
        REDEMPTION RECEIPT / மீட்பு ரசீது
      </div>

      {/* Redemption & Loan Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="info-row">
            <span className="info-label">Redemption #:</span>
            <span className="info-value">{redemption.number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Redemption Date:</span>
            <span className="info-value">{formatDate(redemption.date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Payment Mode:</span>
            <span className="info-value">{redemption.paymentMode.toUpperCase()}</span>
          </div>
          {redemption.paymentReference && (
            <div className="info-row">
              <span className="info-label">Reference:</span>
              <span className="info-value">{redemption.paymentReference}</span>
            </div>
          )}
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
            <span className="info-label">Original Principal:</span>
            <span className="info-value">{formatCurrency(loan.originalPrincipal)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Days Held:</span>
            <span className="info-value">{loan.daysSinceLoan} days</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="border rounded p-3 mb-4" style={{ background: '#f5f5f5' }}>
        <div className="font-semibold mb-2">Customer Details / வாடிக்கையாளர் விவரங்கள்:</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="info-label">Name:</span>
            <span className="info-value ml-2">{customer.name}</span>
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

      {/* Settlement Details */}
      <div className="receipt-title text-xs">
        SETTLEMENT DETAILS / தீர்வு விவரங்கள்
      </div>
      <div className="border rounded mb-4">
        <table>
          <tbody>
            <tr>
              <td className="font-medium">Outstanding Principal / நிலுவை அசல்</td>
              <td className="text-right font-semibold">{formatCurrency(settlement.outstandingPrincipal)}</td>
            </tr>
            <tr>
              <td className="font-medium">Interest Due / நிலுவை வட்டி</td>
              <td className="text-right font-semibold">{formatCurrency(settlement.interestDue)}</td>
            </tr>
            {settlement.penalty > 0 && (
              <tr>
                <td className="font-medium text-red-600">(+) Penalty / அபராதம்</td>
                <td className="text-right font-semibold text-red-600">{formatCurrency(settlement.penalty)}</td>
              </tr>
            )}
            {settlement.rebateAmount > 0 && (
              <tr>
                <td className="font-medium text-green-600">(-) Rebate / தள்ளுபடி</td>
                <td className="text-right font-semibold text-green-600">- {formatCurrency(settlement.rebateAmount)}</td>
              </tr>
            )}
            <tr style={{ background: '#e3f2fd' }}>
              <td className="font-bold text-lg">Total Settlement / மொத்த தீர்வு</td>
              <td className="text-right font-bold text-lg">{formatCurrency(settlement.totalSettlement)}</td>
            </tr>
            <tr style={{ background: '#e8f5e9' }}>
              <td className="font-bold text-lg text-green-700">Amount Received / பெறப்பட்ட தொகை</td>
              <td className="text-right font-bold text-lg text-green-700">{formatCurrency(settlement.amountReceived)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Gold Release */}
      <div className="receipt-title text-xs">
        GOLD RELEASE / தங்கம் விடுவிப்பு
      </div>
      <div className="border rounded p-3 mb-4" style={{ background: '#fff3e0' }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="info-label">Released To:</span>
            <span className="info-value ml-2 font-bold">{goldRelease.releasedTo}</span>
          </div>
          <div>
            <span className="info-label">Release Date:</span>
            <span className="info-value ml-2">{formatDate(goldRelease.releaseDate)}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="info-label">Identity Verified:</span>
          <span className={`ml-2 font-semibold ${goldRelease.identityVerified ? 'text-green-600' : 'text-red-600'}`}>
            {goldRelease.identityVerified ? '✓ YES' : '✗ NO'}
          </span>
        </div>
      </div>

      {/* Confirmation */}
      <div className="text-xs p-2 border rounded mb-4" style={{ background: '#e8f5e9' }}>
        <p className="font-semibold text-center text-green-700">
          ✓ LOAN CLOSED SUCCESSFULLY / கடன் வெற்றிகரமாக மூடப்பட்டது
        </p>
        <p className="text-center mt-1">
          Gold items have been released to the customer after verification.
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
