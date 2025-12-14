import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { numberToWords, formatPrintDate, printElement } from '@/lib/print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import {
  PrintPageWrapper,
  PrintHeader,
  PrintFooter,
  BilingualLabel,
  SectionTitle,
  SignatureBlock,
  BlankField,
  JewelTable,
} from '@/components/print/shared';

interface LoanData {
  id: string;
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  shown_principal: number | null;
  actual_principal: number | null;
  interest_rate: number;
  tenure_days: number;
  net_disbursed: number;
  advance_interest_shown: number | null;
  advance_interest_actual: number | null;
  processing_fee: number | null;
  document_charges: number | null;
  customer: {
    id: string;
    customer_code: string;
    full_name: string;
    phone: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    nominee_name: string | null;
    nominee_relation: string | null;
  };
  scheme: {
    id: string;
    scheme_code: string;
    scheme_name: string;
    interest_rate: number;
    shown_rate: number | null;
  };
  branch: {
    id: string;
    branch_name: string;
    branch_code: string;
    address: string | null;
    phone: string | null;
  };
  gold_items: Array<{
    id: string;
    item_type: string;
    description: string | null;
    gross_weight_grams: number;
    stone_weight_grams: number | null;
    net_weight_grams: number;
    purity: string;
    purity_percentage: number;
    appraised_value: number;
    market_value: number | null;
  }>;
}

export default function LoanReceipt() {
  const { loanId } = useParams<{ loanId: string }>();
  const { client } = useAuth();
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loanId && client) {
      fetchLoanData();
    }
  }, [loanId, client]);

  const fetchLoanData = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, customer_code, full_name, phone, address, city, state, pincode, nominee_name, nominee_relation),
          scheme:schemes(id, scheme_code, scheme_name, interest_rate, shown_rate),
          branch:branches(id, branch_name, branch_code, address, phone),
          gold_items(id, item_type, description, gross_weight_grams, stone_weight_grams, net_weight_grams, purity, purity_percentage, appraised_value, market_value)
        `)
        .eq('id', loanId)
        .single();

      if (error) throw error;
      setLoan(data);
    } catch (error) {
      console.error('Error fetching loan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Loan not found</div>
      </div>
    );
  }

  const principalAmount = loan.shown_principal || loan.principal_amount;
  const customerAddress = [
    loan.customer.address,
    loan.customer.city,
    loan.customer.state,
    loan.customer.pincode
  ].filter(Boolean).join(', ');

  const LoanCopy = ({ copyType }: { copyType: 'customer' | 'office' }) => (
    <div className="border border-black p-3">
      {/* Copy Label */}
      <div className="copy-label text-center w-full mb-3">
        {copyType === 'customer' ? (
          <BilingualLabel english="CUSTOMER COPY" tamil="வாடிக்கையாளர் நகல்" inline />
        ) : (
          <BilingualLabel english="OFFICE COPY" tamil="அலுவலக நகல்" inline />
        )}
      </div>

      {/* Customer Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] mb-3">
        <div>
          <BilingualLabel english="Name" tamil="பெயர்" inline />: 
          <span className="font-medium ml-1">{loan.customer.full_name}</span>
        </div>
        <div>
          <BilingualLabel english="Code" tamil="குறியீடு" inline />: 
          <span className="font-medium ml-1">{loan.customer.customer_code}</span>
        </div>
        <div className="col-span-2">
          <BilingualLabel english="Address" tamil="முகவரி" inline />: 
          <span className="ml-1">{customerAddress || '-'}</span>
        </div>
        <div>
          <BilingualLabel english="Phone" tamil="தொலைபேசி" inline />: 
          <span className="ml-1">{loan.customer.phone}</span>
        </div>
        <div>
          <BilingualLabel english="Nominee" tamil="வாரிசு" inline />: 
          <span className="ml-1">{loan.customer.nominee_name || '-'}</span>
        </div>
      </div>

      {/* Loan Details */}
      <div className="border-t border-gray-300 pt-2 mb-3">
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <BilingualLabel english="Principal" tamil="அசல்" />
            <div className="font-bold text-sm">{formatIndianCurrency(principalAmount)}</div>
          </div>
          <div>
            <BilingualLabel english="Interest" tamil="வட்டி" />
            <div className="font-bold">{loan.scheme.shown_rate || loan.interest_rate}% p.a.</div>
          </div>
          <div>
            <BilingualLabel english="Tenure" tamil="காலம்" />
            <div className="font-bold">{loan.tenure_days} days</div>
          </div>
        </div>
        <div className="text-[9px] italic mt-1">
          {numberToWords(principalAmount)}
        </div>
      </div>

      {/* Maturity & Net Amount */}
      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-gray-300 pt-2">
        <div>
          <BilingualLabel english="Maturity Date" tamil="முதிர்வு தேதி" />
          <div className="font-medium">{formatPrintDate(loan.maturity_date)}</div>
        </div>
        <div>
          <BilingualLabel english="Net Disbursed" tamil="வழங்கப்பட்டது" />
          <div className="font-bold text-sm">{formatIndianCurrency(loan.net_disbursed)}</div>
        </div>
      </div>

      {/* Redemption Signature */}
      <div className="border-t border-dashed border-gray-400 mt-4 pt-3">
        <div className="text-[9px] text-center mb-2">
          <BilingualLabel english="REDEMPTION SIGNATURE" tamil="மீட்டுச் செல்கையில் கையொப்பம்" inline />
        </div>
        <div className="flex justify-between items-end">
          <BlankField label="Date" tamilLabel="தேதி" size="md" />
          <div className="border-t border-black w-32 text-center text-[8px] pt-1">
            Signature / கையொப்பம்
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={printElement} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      <PrintPageWrapper>
        {/* Header */}
        <PrintHeader
          companyName={client?.company_name || 'Gold Loan Company'}
          companyAddress={(client as any)?.address || ''}
          companyPhone={(client as any)?.phone || ''}
          companyEmail={(client as any)?.email || ''}
          logoUrl={(client as any)?.logo_url || undefined}
          documentTitle="LOAN RECEIPT"
          documentTitleTamil="கடன் ரசீது"
          documentNumber={loan.loan_number}
          documentDate={formatPrintDate(loan.loan_date)}
        />

        {/* Branch & Scheme Info */}
        <div className="flex justify-between text-[9px] mb-4 px-2">
          <div>
            <span className="font-medium">Branch:</span> {loan.branch.branch_name} ({loan.branch.branch_code})
          </div>
          <div>
            <span className="font-medium">Scheme:</span> {loan.scheme.scheme_name}
          </div>
        </div>

        {/* Customer & Office Copies */}
        <div className="print-grid-2 mb-4">
          <LoanCopy copyType="customer" />
          <LoanCopy copyType="office" />
        </div>

        {/* Jewel Details Table */}
        <SectionTitle english="JEWEL DETAILS" tamil="நகை விவரம்" />
        <JewelTable items={loan.gold_items} compact />

        {/* Deductions Summary */}
        {(loan.advance_interest_shown || loan.processing_fee || loan.document_charges) && (
          <div className="mt-4">
            <SectionTitle english="DEDUCTIONS" tamil="கழிவுகள்" />
            <div className="grid grid-cols-4 gap-2 text-[10px] border border-black p-2">
              <div>
                <BilingualLabel english="Advance Interest" tamil="முன்கூட்டி வட்டி" />
                <div className="font-medium">{formatIndianCurrency(loan.advance_interest_shown || 0)}</div>
              </div>
              <div>
                <BilingualLabel english="Processing Fee" tamil="செயலாக்க கட்டணம்" />
                <div className="font-medium">{formatIndianCurrency(loan.processing_fee || 0)}</div>
              </div>
              <div>
                <BilingualLabel english="Document Charges" tamil="ஆவண கட்டணம்" />
                <div className="font-medium">{formatIndianCurrency(loan.document_charges || 0)}</div>
              </div>
              <div className="bg-gray-100 p-1">
                <BilingualLabel english="Net Amount" tamil="நிகர தொகை" />
                <div className="font-bold text-sm">{formatIndianCurrency(loan.net_disbursed)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="flex justify-between mt-8">
          <SignatureBlock english="Borrower" tamil="கடன் வாங்குபவர்" />
          <SignatureBlock english="Appraiser" tamil="மதிப்பீட்டாளர்" />
          <SignatureBlock english="Authorized Signatory" tamil="அதிகாரப்பூர்வ கையொப்பம்" />
        </div>

        {/* Footer */}
        <PrintFooter
          branchName={loan.branch.branch_name}
          showComputerGenerated
        />
      </PrintPageWrapper>
    </div>
  );
}
