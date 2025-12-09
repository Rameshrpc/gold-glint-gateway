import { formatCurrency, formatDate } from '@/lib/print';

interface AuctionReceiptProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
  };
  auction: {
    lotNumber: string;
    date: string;
    soldPrice: number;
    buyerName: string;
    buyerContact?: string;
    paymentMode: string;
  };
  loan: {
    number: string;
    date: string;
    maturityDate: string;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  outstanding: {
    principal: number;
    interest: number;
    penalty: number;
    total: number;
  };
  settlement: {
    surplus: number;
    shortfall: number;
  };
  goldItems: Array<{
    item_type: string;
    gross_weight_grams: number;
    purity: string;
    appraised_value: number;
  }>;
}

export function AuctionReceipt({
  company,
  auction,
  loan,
  customer,
  outstanding,
  settlement,
  goldItems,
}: AuctionReceiptProps) {
  const totalWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);

  return (
    <div className="text-sm">
      {/* Header */}
      <div className="receipt-header">
        <h1 className="text-xl font-bold">{company.name}</h1>
        {company.address && <p className="text-xs mt-1">{company.address}</p>}
        {company.phone && <p className="text-xs">Phone: {company.phone}</p>}
      </div>

      {/* Receipt Title */}
      <div className="receipt-title" style={{ background: '#ffebee' }}>
        AUCTION SALE RECEIPT / ஏல விற்பனை ரசீது
      </div>

      {/* Auction Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="info-row">
            <span className="info-label">Auction Lot #:</span>
            <span className="info-value">{auction.lotNumber}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Auction Date:</span>
            <span className="info-value">{formatDate(auction.date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Buyer Name:</span>
            <span className="info-value">{auction.buyerName}</span>
          </div>
          {auction.buyerContact && (
            <div className="info-row">
              <span className="info-label">Buyer Contact:</span>
              <span className="info-value">{auction.buyerContact}</span>
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
            <span className="info-label">Maturity Date:</span>
            <span className="info-value">{formatDate(loan.maturityDate)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Payment Mode:</span>
            <span className="info-value">{auction.paymentMode.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Borrower Info */}
      <div className="border rounded p-3 mb-4" style={{ background: '#f5f5f5' }}>
        <div className="font-semibold mb-2">Original Borrower / அசல் கடன்தாரர்:</div>
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

      {/* Gold Items Sold */}
      <div className="receipt-title text-xs">
        GOLD ITEMS SOLD / விற்கப்பட்ட தங்கப் பொருட்கள்
      </div>
      <table className="mb-4">
        <thead>
          <tr>
            <th className="text-xs">#</th>
            <th className="text-xs">Item</th>
            <th className="text-xs text-right">Weight (g)</th>
            <th className="text-xs text-center">Purity</th>
            <th className="text-xs text-right">Appraised Value</th>
          </tr>
        </thead>
        <tbody>
          {goldItems.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.item_type}</td>
              <td className="text-right">{item.gross_weight_grams.toFixed(2)}</td>
              <td className="text-center">{item.purity.toUpperCase()}</td>
              <td className="text-right">{formatCurrency(item.appraised_value)}</td>
            </tr>
          ))}
          <tr className="font-semibold" style={{ background: '#f5f5f5' }}>
            <td colSpan={2}>Total</td>
            <td className="text-right">{totalWeight.toFixed(2)}g</td>
            <td></td>
            <td className="text-right">{formatCurrency(totalValue)}</td>
          </tr>
        </tbody>
      </table>

      {/* Outstanding & Settlement */}
      <div className="receipt-title text-xs">
        SETTLEMENT CALCULATION / தீர்வு கணக்கீடு
      </div>
      <div className="border rounded mb-4">
        <table>
          <tbody>
            <tr>
              <td className="font-medium">Outstanding Principal</td>
              <td className="text-right">{formatCurrency(outstanding.principal)}</td>
            </tr>
            <tr>
              <td className="font-medium">Outstanding Interest</td>
              <td className="text-right">{formatCurrency(outstanding.interest)}</td>
            </tr>
            <tr>
              <td className="font-medium">Penalty</td>
              <td className="text-right">{formatCurrency(outstanding.penalty)}</td>
            </tr>
            <tr style={{ background: '#ffcdd2' }}>
              <td className="font-bold">Total Outstanding</td>
              <td className="text-right font-bold">{formatCurrency(outstanding.total)}</td>
            </tr>
            <tr style={{ background: '#e3f2fd' }}>
              <td className="font-bold">Auction Sale Price</td>
              <td className="text-right font-bold">{formatCurrency(auction.soldPrice)}</td>
            </tr>
            {settlement.surplus > 0 && (
              <tr style={{ background: '#c8e6c9' }}>
                <td className="font-bold text-green-700">Surplus (Refundable to Borrower)</td>
                <td className="text-right font-bold text-green-700">{formatCurrency(settlement.surplus)}</td>
              </tr>
            )}
            {settlement.shortfall > 0 && (
              <tr style={{ background: '#ffcdd2' }}>
                <td className="font-bold text-red-700">Shortfall (Recoverable from Borrower)</td>
                <td className="text-right font-bold text-red-700">{formatCurrency(settlement.shortfall)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation */}
      <div className="text-xs p-2 border rounded mb-4 text-center" style={{ background: '#ffebee' }}>
        <p className="font-semibold text-red-700">
          AUCTION COMPLETED / ஏலம் முடிவடைந்தது
        </p>
        <p className="mt-1">Loan account closed. Gold items transferred to buyer.</p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div>
          <div className="signature-line">
            Buyer Signature
          </div>
        </div>
        <div>
          <div className="signature-line">
            Auctioneer Signature
          </div>
        </div>
        <div>
          <div className="signature-line">
            Manager Signature
          </div>
        </div>
      </div>
    </div>
  );
}
