import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, GoldItemsTable, InfoGrid, AmountSummary, SignatureSection } from '../core';
import { WatermarkType } from '../core/WatermarkOverlay';
import { LoanData } from './LoanStandardReceipt';

interface LoanDetailedStatementProps {
  data: LoanData & {
    appraiser?: { name: string; code: string };
    approvedBy?: { name: string; designation: string };
    createdBy?: { name: string };
    schemeCode?: string;
    emiDetails?: Array<{ installment: number; dueDate: string; amount: number; status: string }>;
    internalNotes?: string;
  };
  watermark?: WatermarkType;
}

export const LoanDetailedStatement: React.FC<LoanDetailedStatementProps> = ({ data, watermark = 'original' }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
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

  // Defensive null checks
  const goldItems = data?.goldItems || [];

  return (
    <PrintWrapper watermark={watermark} id="loan-detailed-statement">
      <BilingualHeader
        companyName={data?.company?.name || 'Company'}
        companyNameTamil={data?.company?.nameTamil}
        address={data?.company?.address}
        phone={data?.company?.phone}
        email={data?.company?.email}
        logoUrl={data?.company?.logoUrl}
        branchName={data?.branch?.name}
        branchNameTamil={data?.branch?.nameTamil}
        documentTitle="Loan Statement - Office Copy"
        documentTitleTamil="கடன் அறிக்கை - அலுவலக நகல்"
        documentNumber={data?.loanNumber || 'N/A'}
        documentDate={formatDate(data?.loanDate)}
      />

      {/* Customer Details */}
      <InfoGrid
        title="Borrower Information"
        titleTamil="கடன் பெறுபவர் தகவல்"
        columns={3}
        items={[
          { label: 'Customer Name', labelTamil: 'வாடிக்கையாளர் பெயர்', value: data?.customer?.name || 'N/A' },
          { label: 'Customer Code', labelTamil: 'வாடிக்கையாளர் குறியீடு', value: data?.customer?.code || 'N/A' },
          { label: 'Phone', labelTamil: 'தொலைபேசி', value: data?.customer?.phone || 'N/A' },
          { label: 'Address', labelTamil: 'முகவரி', value: data?.customer?.address || '-', fullWidth: true },
        ]}
      />

      {/* Loan & Scheme Details */}
      <InfoGrid
        title="Loan & Scheme Details"
        titleTamil="கடன் மற்றும் திட்ட விவரங்கள்"
        columns={4}
        items={[
          { label: 'Loan Number', labelTamil: 'கடன் எண்', value: data?.loanNumber || 'N/A', highlight: true },
          { label: 'Scheme Code', labelTamil: 'திட்ட குறியீடு', value: data?.schemeCode || data?.scheme?.name || 'Standard' },
          { label: 'Loan Date', labelTamil: 'கடன் தேதி', value: formatDate(data?.loanDate) },
          { label: 'Maturity Date', labelTamil: 'முதிர்வு தேதி', value: formatDate(data?.maturityDate) },
          { label: 'Scheme Name', labelTamil: 'திட்டப் பெயர்', value: data?.scheme?.name || 'Standard' },
          { label: 'Interest Rate', labelTamil: 'வட்டி விகிதம்', value: `${data?.scheme?.interestRate || 0}% p.m.` },
          { label: 'Tenure', labelTamil: 'கால அளவு', value: `${data?.scheme?.tenure || 0} days` },
          { label: 'Disbursement Mode', labelTamil: 'வழங்கல் முறை', value: data?.disbursementMode || 'Cash' },
        ]}
      />

      {/* Gold Items with Images */}
      <GoldItemsTable items={goldItems} showSerials showMarketValue />

      {/* Disbursement Summary */}
      <AmountSummary
        title="Financial Summary"
        titleTamil="நிதி சுருக்கம்"
        lines={[
          { label: 'Principal Amount', labelTamil: 'அசல் தொகை', amount: data?.principal || 0 },
          { label: 'Processing Fee', labelTamil: 'செயலாக்க கட்டணம்', amount: data?.processingFee || 0, isDeduction: true },
          { label: 'Document Charges', labelTamil: 'ஆவண கட்டணங்கள்', amount: data?.documentCharges || 0, isDeduction: true },
          { label: 'Advance Interest', labelTamil: 'முன்கூட்டி வட்டி', amount: data?.advanceInterest || 0, isDeduction: true },
          { label: 'Net Disbursed', labelTamil: 'நிகர வழங்கல்', amount: data?.netDisbursed || 0, isTotal: true },
        ]}
      />

      {/* Internal Accounting Details */}
      <div className="my-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div className="bilingual-text mb-2">
          <span className="text-sm font-semibold text-english">Internal Details</span>
          <span className="text-xs text-gray-600 text-tamil ml-2">உள் விவரங்கள்</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          {data.appraiser && (
            <div>
              <span className="text-gray-500">Appraiser:</span>
              <span className="ml-2 font-medium">{data.appraiser.name} ({data.appraiser.code})</span>
            </div>
          )}
          {data.approvedBy && (
            <div>
              <span className="text-gray-500">Approved By:</span>
              <span className="ml-2 font-medium">{data.approvedBy.name}</span>
            </div>
          )}
          {data.createdBy && (
            <div>
              <span className="text-gray-500">Created By:</span>
              <span className="ml-2 font-medium">{data.createdBy.name}</span>
            </div>
          )}
        </div>
        {data.internalNotes && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
            <span className="text-gray-500">Notes:</span>
            <span className="ml-2">{data.internalNotes}</span>
          </div>
        )}
      </div>

      {/* EMI Schedule if available */}
      {data.emiDetails && data.emiDetails.length > 0 && (
        <div className="my-4">
          <div className="bilingual-text mb-2">
            <span className="text-sm font-semibold text-english">EMI Schedule</span>
            <span className="text-xs text-gray-600 text-tamil ml-2">EMI அட்டவணை</span>
          </div>
          <table className="print-table print-table-compact">
            <thead>
              <tr>
                <th>Installment</th>
                <th>Due Date</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.emiDetails.map((emi, index) => (
                <tr key={index}>
                  <td className="text-center">{emi.installment}</td>
                  <td>{formatDate(emi.dueDate)}</td>
                  <td className="text-right font-mono">{formatCurrency(emi.amount)}</td>
                  <td>
                    <span className={`status-badge ${emi.status === 'paid' ? 'status-active' : emi.status === 'overdue' ? 'status-overdue' : 'status-closed'}`}>
                      {emi.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures */}
      <SignatureSection
        columns={3}
        signatures={[
          { label: 'Customer Signature', labelTamil: 'வாடிக்கையாளர் கையொப்பம்' },
          { label: 'Loan Officer', labelTamil: 'கடன் அதிகாரி', name: data.createdBy?.name },
          { label: 'Branch Manager', labelTamil: 'கிளை மேலாளர்' },
        ]}
        showDate
      />

      <BilingualFooter
        footerText="For Office Use Only - Confidential"
        footerTextTamil="அலுவலக பயன்பாட்டிற்கு மட்டும் - ரகசியம்"
        companyName={data?.company?.name}
        printDate={new Date().toLocaleDateString('en-IN')}
      />
    </PrintWrapper>
  );
};

export default LoanDetailedStatement;