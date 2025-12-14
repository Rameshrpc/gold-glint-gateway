import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { numberToWords, printElement, formatPrintDate } from '@/lib/print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import {
  PrintPageWrapper,
  PrintHeader,
  PrintFooter,
  BilingualLabel,
  SectionTitle,
  SignatureBlock,
} from '@/components/print/shared';

interface ClientData {
  id: string;
  company_name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
}

interface PaymentData {
  id: string;
  receipt_number: string;
  payment_date: string;
  amount_paid: number;
  shown_interest: number;
  actual_interest: number;
  penalty_amount: number | null;
  principal_reduction: number | null;
  days_covered: number;
  period_from: string;
  period_to: string;
  overdue_days: number | null;
  payment_mode: string;
  remarks: string | null;
  client_id: string;
  loan: {
    id: string;
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    actual_principal: number | null;
    interest_rate: number;
    customer: {
      full_name: string;
      customer_code: string;
      phone: string;
    };
    scheme: {
      scheme_name: string;
      shown_rate: number | null;
    };
    branch: {
      branch_name: string;
    };
  };
  collected_by_profile?: {
    full_name: string;
  } | null;
}

export default function InterestReceipt() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentData();
    }
  }, [paymentId]);

  const fetchPaymentData = async () => {
    try {
      const { data, error } = await supabase
        .from('interest_payments')
        .select(`
          *,
          loan:loans(
            id, loan_number, loan_date, principal_amount, actual_principal, interest_rate,
            customer:customers(full_name, customer_code, phone),
            scheme:schemes(scheme_name, shown_rate),
            branch:branches(branch_name)
          ),
          collected_by_profile:profiles!interest_payments_collected_by_fkey(full_name)
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      setPayment(data);

      // Fetch client data
      if (data?.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, company_name, address, phone, logo_url')
          .eq('id', data.client_id)
          .single();
        
        setClient(clientData);
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!payment) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Payment not found</div>;
  }

  const loan = payment.loan;
  const balancePrincipal = (loan.actual_principal || loan.principal_amount) - (payment.principal_reduction || 0);

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={printElement} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      <PrintPageWrapper>
        <PrintHeader
          companyName={client?.company_name || 'Gold Loan Company'}
          companyAddress={client?.address || ''}
          companyPhone={client?.phone || ''}
          logoUrl={client?.logo_url || undefined}
          documentTitle="INTEREST RECEIPT"
          documentTitleTamil="வட்டி ரசீது"
          documentNumber={payment.receipt_number}
          documentDate={formatPrintDate(payment.payment_date)}
        />

        {/* Loan & Customer Info */}
        <div className="border border-black p-3 mb-4">
          <div className="grid grid-cols-3 gap-4 text-[10px]">
            <div>
              <BilingualLabel english="Loan No" tamil="கடன் எண்" />
              <div className="font-bold text-sm">{loan.loan_number}</div>
            </div>
            <div>
              <BilingualLabel english="Customer" tamil="வாடிக்கையாளர்" />
              <div className="font-bold">{loan.customer.full_name}</div>
              <div className="text-[9px] text-gray-600">{loan.customer.customer_code}</div>
            </div>
            <div>
              <BilingualLabel english="Phone" tamil="தொலைபேசி" />
              <div>{loan.customer.phone}</div>
            </div>
          </div>
        </div>

        {/* Interest Calculation Table */}
        <SectionTitle english="INTEREST CALCULATION" tamil="வட்டி கணக்கீடு" />
        <table className="print-table mt-2">
          <thead>
            <tr>
              <th><BilingualLabel english="Description" tamil="விவரம்" /></th>
              <th className="text-right"><BilingualLabel english="Value" tamil="மதிப்பு" /></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><BilingualLabel english="Loan Date" tamil="கடன் தேதி" inline /></td>
              <td className="text-right">{formatPrintDate(loan.loan_date)}</td>
            </tr>
            <tr>
              <td><BilingualLabel english="Period From" tamil="காலம் தொடக்கம்" inline /></td>
              <td className="text-right">{formatPrintDate(payment.period_from)}</td>
            </tr>
            <tr>
              <td><BilingualLabel english="Period To" tamil="காலம் முடிவு" inline /></td>
              <td className="text-right">{formatPrintDate(payment.period_to)}</td>
            </tr>
            <tr>
              <td><BilingualLabel english="Days Covered" tamil="நாட்கள் கணக்கு" inline /></td>
              <td className="text-right font-medium">{payment.days_covered} days</td>
            </tr>
            <tr>
              <td><BilingualLabel english="Principal Amount" tamil="அசல்" inline /></td>
              <td className="text-right">{formatIndianCurrency(loan.actual_principal || loan.principal_amount)}</td>
            </tr>
            <tr>
              <td><BilingualLabel english="Interest Rate" tamil="வட்டி வீதம்" inline /></td>
              <td className="text-right">{loan.scheme.shown_rate || loan.interest_rate}% p.a.</td>
            </tr>
            <tr>
              <td><BilingualLabel english="Interest Amount" tamil="வட்டி தொகை" inline /></td>
              <td className="text-right font-medium">{formatIndianCurrency(payment.shown_interest)}</td>
            </tr>
            {(payment.penalty_amount || 0) > 0 && (
              <tr>
                <td><BilingualLabel english="Penalty Interest" tamil="அபராத வட்டி" inline /></td>
                <td className="text-right text-red-600">{formatIndianCurrency(payment.penalty_amount || 0)}</td>
              </tr>
            )}
            {(payment.principal_reduction || 0) > 0 && (
              <tr>
                <td><BilingualLabel english="Principal Reduction" tamil="அசல் குறைப்பு" inline /></td>
                <td className="text-right">{formatIndianCurrency(payment.principal_reduction || 0)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td><BilingualLabel english="TOTAL PAID" tamil="மொத்தம் செலுத்தியது" inline /></td>
              <td className="text-right text-lg">{formatIndianCurrency(payment.amount_paid)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div className="mt-2 text-[9px] italic border-b pb-2">
          <strong>Amount in words:</strong> {numberToWords(payment.amount_paid)}
        </div>

        {/* Balance Principal */}
        <div className="mt-4 p-3 border-2 border-black bg-gray-50">
          <div className="flex justify-between items-center">
            <BilingualLabel english="Balance Principal Remaining" tamil="மீதமுள்ள அசல்" />
            <div className="text-xl font-bold">{formatIndianCurrency(balancePrincipal)}</div>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="mt-4 text-[10px]">
          <span className="font-medium">Payment Mode / பணம் செலுத்தும் முறை:</span> {payment.payment_mode.toUpperCase()}
          {payment.remarks && (
            <span className="ml-4">
              <span className="font-medium">Remarks:</span> {payment.remarks}
            </span>
          )}
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-8">
          <SignatureBlock english="Cashier" tamil="காசாளர்" />
          <SignatureBlock english="Customer" tamil="வாடிக்கையாளர்" />
        </div>

        <PrintFooter 
          branchName={loan.branch.branch_name}
          preparedBy={payment.collected_by_profile?.full_name}
          showComputerGenerated 
        />
      </PrintPageWrapper>
    </div>
  );
}
