import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PrintWrapper, BilingualHeader } from '../core';
import { WatermarkType } from '../core/WatermarkOverlay';

interface MiniReceiptData {
  loanNumber: string;
  loanDate: string;
  maturityDate: string;
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  principal: number;
  netDisbursed: number;
  interestRate: number;
  totalGoldWeight: number;
  itemCount: number;
  portalUrl?: string;
  branch: {
    name: string;
    phone?: string;
  };
  company: {
    name: string;
    logoUrl?: string;
  };
}

interface LoanMiniReceiptProps {
  data: MiniReceiptData;
  watermark?: WatermarkType;
}

export const LoanMiniReceipt: React.FC<LoanMiniReceiptProps> = ({ data, watermark }) => {
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

  const qrUrl = data.portalUrl || `https://portal.example.com/loan/${data.loanNumber}`;

  return (
    <PrintWrapper 
      paperSize="a6" 
      watermark={watermark} 
      id="loan-mini-receipt"
    >
      {/* Compact Header */}
      <div className="text-center border-b-2 border-gray-400 pb-3 mb-3">
        {data.company.logoUrl && (
          <img src={data.company.logoUrl} alt="Logo" className="h-8 mx-auto mb-1" />
        )}
        <div className="text-sm font-bold text-english">{data.company.name}</div>
        <div className="text-xs text-gray-600">{data.branch.name}</div>
        {data.branch.phone && (
          <div className="text-xs text-gray-500">Tel: {data.branch.phone}</div>
        )}
      </div>

      {/* Loan Number Highlight */}
      <div className="text-center bg-gray-100 py-2 rounded mb-3">
        <div className="text-xs text-gray-600">
          Loan No. / கடன் எண்
        </div>
        <div className="text-lg font-bold font-mono">{data.loanNumber}</div>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <div className="text-gray-500">Customer / வாடிக்கையாளர்</div>
          <div className="font-medium truncate">{data.customer.name}</div>
        </div>
        <div>
          <div className="text-gray-500">Phone / தொலைபேசி</div>
          <div className="font-medium">{data.customer.phone}</div>
        </div>
        <div>
          <div className="text-gray-500">Loan Date / கடன் தேதி</div>
          <div className="font-medium">{formatDate(data.loanDate)}</div>
        </div>
        <div>
          <div className="text-gray-500">Maturity / முதிர்வு</div>
          <div className="font-medium">{formatDate(data.maturityDate)}</div>
        </div>
      </div>

      {/* Amount Box */}
      <div className="bg-amber-50 border border-amber-300 rounded p-2 mb-3 text-center">
        <div className="text-xs text-gray-600">
          Net Amount Disbursed / வழங்கப்பட்ட தொகை
        </div>
        <div className="text-xl font-bold text-amber-800">
          {formatCurrency(data.netDisbursed)}
        </div>
      </div>

      {/* Gold Summary */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
        <div className="bg-gray-50 p-1 rounded">
          <div className="text-gray-500">Items</div>
          <div className="font-bold">{data?.itemCount || 0}</div>
        </div>
        <div className="bg-gray-50 p-1 rounded">
          <div className="text-gray-500">Weight</div>
          <div className="font-bold">{(data?.totalGoldWeight || 0).toFixed(2)}g</div>
        </div>
        <div className="bg-gray-50 p-1 rounded">
          <div className="text-gray-500">Rate</div>
          <div className="font-bold">{data?.interestRate || 0}%</div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-200">
        <QRCodeSVG value={qrUrl} size={64} level="M" />
        <div className="text-xs">
          <div className="font-medium text-english">Scan for Portal</div>
          <div className="text-gray-500 text-tamil">போர்ட்டலுக்கு ஸ்கேன் செய்யவும்</div>
          <div className="text-gray-400 mt-1">View loan details online</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-center text-xs text-gray-500">
        <div>{new Date().toLocaleDateString('en-IN')} | {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="text-tamil mt-1">நன்றி! Thank you!</div>
      </div>
    </PrintWrapper>
  );
};

export default LoanMiniReceipt;