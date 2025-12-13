import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, SignatureSection } from '../core';
import { WatermarkType } from '../core/WatermarkOverlay';

interface LoanSummary {
  loanNumber: string;
  loanDate: string;
  maturityDate: string;
  principal: number;
  netDisbursed: number;
  interestRate: number;
  totalGoldWeight: number;
  itemCount: number;
  interestDue: number;
  nextDueDate: string;
  status: 'active' | 'overdue' | 'closed';
  daysRemaining: number;
}

interface MultiloanSummaryData {
  customer: {
    name: string;
    nameTamil?: string;
    code: string;
    phone: string;
    address?: string;
  };
  loans: LoanSummary[];
  summaryDate: string;
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

interface MultiloanSummaryProps {
  data: MultiloanSummaryData;
  watermark?: WatermarkType;
}

export const MultiloanSummary: React.FC<MultiloanSummaryProps> = ({ data, watermark }) => {
  const loans = data?.loans || [];
  
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
    }).format(amount || 0);
  };

  const totals = loans.reduce((acc, loan) => ({
    principal: acc.principal + (loan.principal || 0),
    goldWeight: acc.goldWeight + (loan.totalGoldWeight || 0),
    itemCount: acc.itemCount + (loan.itemCount || 0),
    interestDue: acc.interestDue + (loan.interestDue || 0),
  }), { principal: 0, goldWeight: 0, itemCount: 0, interestDue: 0 });

  const activeLoans = loans.filter(l => l.status === 'active').length;
  const overdueLoans = loans.filter(l => l.status === 'overdue').length;

  return (
    <PrintWrapper watermark={watermark} id="multiloan-summary">
      <BilingualHeader
        companyName={data.company.name}
        companyNameTamil={data.company.nameTamil}
        address={data.company.address}
        phone={data.company.phone}
        email={data.company.email}
        logoUrl={data.company.logoUrl}
        branchName={data.branch.name}
        branchNameTamil={data.branch.nameTamil}
        documentTitle="Multi-Loan Summary Statement"
        documentTitleTamil="பல கடன் சுருக்க அறிக்கை"
        documentDate={formatDate(data.summaryDate)}
      />

      {/* Customer Info */}
      <div className="my-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500">Customer Name / வாடிக்கையாளர் பெயர்</div>
            <div className="font-medium">{data.customer.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Customer Code / குறியீடு</div>
            <div className="font-medium">{data.customer.code}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Phone / தொலைபேசி</div>
            <div className="font-medium">{data.customer.phone}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Loans / மொத்த கடன்கள்</div>
            <div className="font-bold text-lg">{loans.length}</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-3 my-4">
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs text-gray-600">Total Principal</div>
          <div className="text-xs text-gray-500 text-tamil">மொத்த அசல்</div>
          <div className="text-lg font-bold text-blue-800">{formatCurrency(totals.principal)}</div>
        </div>
        <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded">
          <div className="text-xs text-gray-600">Total Gold</div>
          <div className="text-xs text-gray-500 text-tamil">மொத்த தங்கம்</div>
          <div className="text-lg font-bold text-amber-800">{totals.goldWeight.toFixed(2)}g</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded">
          <div className="text-xs text-gray-600">Total Items</div>
          <div className="text-xs text-gray-500 text-tamil">மொத்த பொருட்கள்</div>
          <div className="text-lg font-bold text-purple-800">{totals.itemCount}</div>
        </div>
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded">
          <div className="text-xs text-gray-600">Active Loans</div>
          <div className="text-xs text-gray-500 text-tamil">செயலில் உள்ளவை</div>
          <div className="text-lg font-bold text-green-800">{activeLoans}</div>
        </div>
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded">
          <div className="text-xs text-gray-600">Interest Due</div>
          <div className="text-xs text-gray-500 text-tamil">வட்டி நிலுவை</div>
          <div className="text-lg font-bold text-red-800">{formatCurrency(totals.interestDue)}</div>
        </div>
      </div>

      {/* Loan Comparison Table */}
      <div className="my-4">
        <div className="bilingual-text mb-2">
          <span className="text-sm font-semibold text-english">Loan Details Comparison</span>
          <span className="text-xs text-gray-600 text-tamil ml-2">கடன் விவர ஒப்பீடு</span>
        </div>
        
        <table className="print-table">
          <thead>
            <tr className="bg-gray-100">
              <th>S.No</th>
              <th>
                <div>Loan Number</div>
                <div className="text-tamil text-xs font-normal">கடன் எண்</div>
              </th>
              <th>
                <div>Loan Date</div>
                <div className="text-tamil text-xs font-normal">கடன் தேதி</div>
              </th>
              <th>
                <div>Maturity</div>
                <div className="text-tamil text-xs font-normal">முதிர்வு</div>
              </th>
              <th className="text-right">
                <div>Principal</div>
                <div className="text-tamil text-xs font-normal">அசல்</div>
              </th>
              <th className="text-center">
                <div>Gold (g)</div>
                <div className="text-tamil text-xs font-normal">தங்கம்</div>
              </th>
              <th className="text-center">
                <div>Rate</div>
                <div className="text-tamil text-xs font-normal">விகிதம்</div>
              </th>
              <th className="text-right">
                <div>Interest Due</div>
                <div className="text-tamil text-xs font-normal">வட்டி நிலுவை</div>
              </th>
              <th>
                <div>Status</div>
                <div className="text-tamil text-xs font-normal">நிலை</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan, index) => (
              <tr key={loan.loanNumber} className={loan.status === 'overdue' ? 'bg-red-50' : ''}>
                <td className="text-center">{index + 1}</td>
                <td className="font-mono font-medium">{loan.loanNumber}</td>
                <td>{formatDate(loan.loanDate)}</td>
                <td>
                  {formatDate(loan.maturityDate)}
                  <div className="text-xs text-gray-500">
                    {(loan.daysRemaining || 0) > 0 ? `${loan.daysRemaining} days left` : `${Math.abs(loan.daysRemaining || 0)} days overdue`}
                  </div>
                </td>
                <td className="text-right font-mono">{formatCurrency(loan.principal)}</td>
                <td className="text-center">{(loan.totalGoldWeight || 0).toFixed(2)}</td>
                <td className="text-center">{loan.interestRate || 0}%</td>
                <td className="text-right font-mono">{formatCurrency(loan.interestDue)}</td>
                <td>
                  <span className={`status-badge ${
                    loan.status === 'active' ? 'status-active' : 
                    loan.status === 'overdue' ? 'status-overdue' : 'status-closed'
                  }`}>
                    {loan.status === 'active' ? 'Active / செயலில்' : 
                     loan.status === 'overdue' ? 'Overdue / தாமதம்' : 'Closed / மூடப்பட்டது'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={4} className="text-right">
                Total / மொத்தம்
              </td>
              <td className="text-right font-mono">{formatCurrency(totals.principal)}</td>
              <td className="text-center">{totals.goldWeight.toFixed(2)}</td>
              <td></td>
              <td className="text-right font-mono">{formatCurrency(totals.interestDue)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Overdue Alert */}
      {overdueLoans > 0 && (
        <div className="my-4 p-3 bg-red-50 border border-red-300 rounded">
          <div className="text-sm font-semibold text-red-800">
            ⚠️ {overdueLoans} loan(s) are overdue. Please clear the dues to avoid auction.
          </div>
          <div className="text-xs text-red-700 text-tamil mt-1">
            {overdueLoans} கடன்(கள்) தாமதமாக உள்ளன. ஏலத்தை தவிர்க்க நிலுவைகளை செலுத்தவும்.
          </div>
        </div>
      )}

      {/* Signatures */}
      <SignatureSection
        columns={2}
        signatures={[
          { label: 'Customer Signature', labelTamil: 'வாடிக்கையாளர் கையொப்பம்' },
          { label: 'Branch Officer', labelTamil: 'கிளை அதிகாரி' },
        ]}
      />

      <BilingualFooter
        footerText="This is a consolidated statement of all your active loans"
        footerTextTamil="இது உங்கள் அனைத்து செயலில் உள்ள கடன்களின் ஒருங்கிணைந்த அறிக்கை"
        companyName={data.company.name}
        printDate={new Date().toLocaleDateString('en-IN')}
      />
    </PrintWrapper>
  );
};

export default MultiloanSummary;