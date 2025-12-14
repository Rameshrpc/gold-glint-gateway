import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { printElement, formatPrintDate } from '@/lib/print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import {
  PrintPageWrapper,
  PrintHeader,
  PrintFooter,
  BilingualLabel,
  SectionTitle,
  SignatureBlock,
  JewelTable,
} from '@/components/print/shared';

interface ClientData {
  id: string;
  company_name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
}

interface LoanData {
  id: string;
  loan_number: string;
  loan_date: string;
  jewel_photo_url: string | null;
  appraiser_sheet_url: string | null;
  remarks: string | null;
  client_id: string;
  customer: {
    full_name: string;
    customer_code: string;
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
    market_rate_per_gram: number;
  }>;
  appraised_by_profile?: {
    full_name: string;
  } | null;
}

export default function JewelDetails() {
  const { loanId } = useParams<{ loanId: string }>();
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loanId) {
      fetchLoanData();
    }
  }, [loanId]);

  const fetchLoanData = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_date, jewel_photo_url, appraiser_sheet_url, remarks, client_id,
          customer:customers(full_name, customer_code),
          gold_items(id, item_type, description, gross_weight_grams, stone_weight_grams, net_weight_grams, purity, purity_percentage, appraised_value, market_value, market_rate_per_gram),
          appraised_by_profile:profiles!loans_appraised_by_fkey(full_name)
        `)
        .eq('id', loanId)
        .single();

      if (error) throw error;
      setLoan(data);

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
      console.error('Error fetching loan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!loan) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Loan not found</div>;
  }

  const totals = loan.gold_items.reduce((acc, item) => ({
    grossWeight: acc.grossWeight + item.gross_weight_grams,
    netWeight: acc.netWeight + item.net_weight_grams,
    appraisedValue: acc.appraisedValue + item.appraised_value,
    marketValue: acc.marketValue + (item.market_value || 0),
  }), { grossWeight: 0, netWeight: 0, appraisedValue: 0, marketValue: 0 });

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
          documentTitle="JEWEL VERIFICATION SHEET"
          documentTitleTamil="நகை சரிபார்ப்பு தாள்"
          documentNumber={loan.loan_number}
          documentDate={formatPrintDate(loan.loan_date)}
        />

        {/* Customer Info */}
        <div className="text-[10px] mb-4 flex justify-between border-b pb-2">
          <div>
            <strong>Customer / வாடிக்கையாளர்:</strong> {loan.customer.full_name} ({loan.customer.customer_code})
          </div>
        </div>

        {/* Photo and Appraiser Notes */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Jewel Photo */}
          <div>
            <SectionTitle english="JEWEL PHOTO" tamil="நகை புகைப்படம்" />
            <div className="jewel-photo mt-2">
              {loan.jewel_photo_url ? (
                <img src={loan.jewel_photo_url} alt="Jewels" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-gray-400 text-sm">No photo available</span>
              )}
            </div>
          </div>

          {/* Appraiser Notes */}
          <div>
            <SectionTitle english="APPRAISER NOTES" tamil="மதிப்பீட்டாளர் குறிப்புகள்" />
            <div className="border border-black p-3 mt-2 min-h-[200px]">
              <div className="space-y-3 text-[10px]">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <BilingualLabel english="Total Items" tamil="மொத்த பொருட்கள்" />
                    <div className="font-bold">{loan.gold_items.length}</div>
                  </div>
                  <div>
                    <BilingualLabel english="Total Gross Weight" tamil="மொத்த எடை" />
                    <div className="font-bold">{totals.grossWeight.toFixed(2)} g</div>
                  </div>
                  <div>
                    <BilingualLabel english="Total Net Weight" tamil="நிகர எடை" />
                    <div className="font-bold">{totals.netWeight.toFixed(2)} g</div>
                  </div>
                  <div>
                    <BilingualLabel english="Appraised Value" tamil="மதிப்பீடு" />
                    <div className="font-bold">{formatIndianCurrency(totals.appraisedValue)}</div>
                  </div>
                </div>

                {/* Purity Breakdown */}
                <div className="border-t pt-2 mt-2">
                  <BilingualLabel english="Purity Breakdown" tamil="தூய்மை விவரம்" className="mb-1" />
                  {Object.entries(
                    loan.gold_items.reduce((acc, item) => {
                      acc[item.purity] = (acc[item.purity] || 0) + item.net_weight_grams;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([purity, weight]) => (
                    <div key={purity} className="flex justify-between text-[9px]">
                      <span>{purity.toUpperCase()}:</span>
                      <span className="font-medium">{weight.toFixed(2)} g</span>
                    </div>
                  ))}
                </div>

                {/* Remarks */}
                {loan.remarks && (
                  <div className="border-t pt-2 mt-2">
                    <BilingualLabel english="Remarks" tamil="குறிப்புகள்" className="mb-1" />
                    <p className="text-[9px]">{loan.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Jewel Table */}
        <SectionTitle english="DETAILED JEWEL LIST" tamil="விரிவான நகை பட்டியல்" />
        <JewelTable items={loan.gold_items} showMarketValue />

        {/* Rate Information */}
        <div className="mt-4 text-[9px] text-gray-600">
          <p>* Appraised value is calculated based on scheme rates applicable at the time of loan.</p>
          <p>* Market value is calculated based on current market rates.</p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-8">
          <SignatureBlock english="Customer Acknowledgement" tamil="வாடிக்கையாளர் ஒப்புதல்" />
          <SignatureBlock english="Appraiser" tamil="மதிப்பீட்டாளர்" />
          <SignatureBlock english="Branch Manager" tamil="கிளை மேலாளர்" />
        </div>

        <PrintFooter showComputerGenerated />
      </PrintPageWrapper>
    </div>
  );
}
