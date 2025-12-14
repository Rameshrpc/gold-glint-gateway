import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { printElement, formatPrintDate, daysBetween } from '@/lib/print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import {
  PrintPageWrapper,
  PrintHeader,
  PrintFooter,
  BilingualLabel,
  BilingualText,
  SectionTitle,
  SignatureBlock,
} from '@/components/print/shared';

interface AuctionData {
  id: string;
  auction_lot_number: string;
  auction_date: string;
  outstanding_principal: number;
  outstanding_interest: number;
  outstanding_penalty: number;
  total_outstanding: number;
  total_gold_weight_grams: number;
  total_appraised_value: number;
  reserve_price: number;
  status: string;
  customer_notified_date: string | null;
  remarks: string | null;
  loan: {
    id: string;
    loan_number: string;
    loan_date: string;
    maturity_date: string;
    customer: {
      full_name: string;
      customer_code: string;
      phone: string;
      address: string | null;
      city: string | null;
      state: string | null;
      pincode: string | null;
    };
    branch: {
      branch_name: string;
      address: string | null;
    };
  };
}

export default function AuctionNotice() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { client } = useAuth();
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auctionId && client) {
      fetchAuctionData();
    }
  }, [auctionId, client]);

  const fetchAuctionData = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          loan:loans(
            id, loan_number, loan_date, maturity_date,
            customer:customers(full_name, customer_code, phone, address, city, state, pincode),
            branch:branches(branch_name, address)
          )
        `)
        .eq('id', auctionId)
        .single();

      if (error) throw error;
      setAuction(data);
    } catch (error) {
      console.error('Error fetching auction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!auction) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Auction not found</div>;
  }

  const loan = auction.loan;
  const customer = loan.customer;
  const customerAddress = [
    customer.address,
    customer.city,
    customer.state,
    customer.pincode
  ].filter(Boolean).join(', ');

  const daysOverdue = daysBetween(loan.maturity_date, new Date());
  const paymentDeadline = new Date(auction.auction_date);
  paymentDeadline.setDate(paymentDeadline.getDate() - 7);

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
          companyAddress={(client as any)?.address || ''}
          companyPhone={(client as any)?.phone || ''}
          logoUrl={(client as any)?.logo_url || undefined}
          documentTitle="AUCTION NOTICE"
          documentTitleTamil="ஏல அறிவிப்பு"
          documentNumber={auction.auction_lot_number}
          documentDate={formatPrintDate(new Date().toISOString())}
        />

        {/* FROM Section */}
        <div className="text-[10px] mb-4">
          <strong>FROM / அனுப்புநர்:</strong>
          <div className="ml-4">
            <div className="font-semibold">{client?.company_name}</div>
            <div>{loan.branch.branch_name}</div>
            {loan.branch.address && <div>{loan.branch.address}</div>}
          </div>
        </div>

        {/* TO Section */}
        <div className="text-[10px] mb-4">
          <strong>TO / பெறுநர்:</strong>
          <div className="ml-4 border border-black p-2">
            <div className="font-bold">{customer.full_name}</div>
            <div>{customerAddress || 'Address not available'}</div>
            <div>Phone: {customer.phone}</div>
          </div>
        </div>

        {/* Subject */}
        <div className="text-center mb-6">
          <div className="legal-notice text-lg">
            <BilingualLabel english="FINAL AUCTION NOTICE" tamil="இறுதி ஏல அறிவிப்பு" inline />
          </div>
        </div>

        {/* Reference */}
        <div className="text-[10px] mb-4">
          <strong>Ref / குறிப்பு:</strong> Loan No. <span className="font-bold">{loan.loan_number}</span> dated {formatPrintDate(loan.loan_date)}
        </div>

        {/* Body - Bilingual */}
        <div className="mb-6">
          <BilingualText
            tamil={`அன்புள்ள வாடிக்கையாளர், மேற்கண்ட கடன் எண் ${loan.loan_number} தேதி ${formatPrintDate(loan.loan_date)} அன்று வழங்கப்பட்ட கடனுக்கான முதிர்வு தேதி ${formatPrintDate(loan.maturity_date)} அன்று முடிவடைந்துள்ளது. நீங்கள் ${daysOverdue} நாட்களாக வட்டி செலுத்தத் தவறியுள்ளீர்கள். எனவே, உங்கள் நகைகள் பொது ஏலத்திற்கு திட்டமிடப்பட்டுள்ளன.`}
            english={`Dear Customer, the maturity date for Loan No. ${loan.loan_number} dated ${formatPrintDate(loan.loan_date)} has expired on ${formatPrintDate(loan.maturity_date)}. You have failed to pay interest for ${daysOverdue} days. Therefore, your jewelry is scheduled for public auction.`}
          />
        </div>

        {/* Financial Summary */}
        <div className="financial-summary">
          <SectionTitle english="FINANCIAL SUMMARY" tamil="நிதி சுருக்கம்" />
          <div className="space-y-1 mt-2">
            <div className="financial-summary-row">
              <BilingualLabel english="Principal Due" tamil="அசல் நிலுவை" inline />
              <span>{formatIndianCurrency(auction.outstanding_principal)}</span>
            </div>
            <div className="financial-summary-row">
              <BilingualLabel english="Interest Due" tamil="வட்டி நிலுவை" inline />
              <span>{formatIndianCurrency(auction.outstanding_interest)}</span>
            </div>
            {auction.outstanding_penalty > 0 && (
              <div className="financial-summary-row">
                <BilingualLabel english="Penalty" tamil="அபராதம்" inline />
                <span>{formatIndianCurrency(auction.outstanding_penalty)}</span>
              </div>
            )}
            <div className="financial-summary-row financial-summary-total">
              <BilingualLabel english="TOTAL OUTSTANDING" tamil="மொத்த நிலுவை" inline />
              <span className="text-lg">{formatIndianCurrency(auction.total_outstanding)}</span>
            </div>
          </div>
        </div>

        {/* Auction Details */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-[11px]">
          <div className="border border-black p-3">
            <BilingualLabel english="AUCTION DATE" tamil="ஏல தேதி" className="font-bold" />
            <div className="text-lg font-bold mt-1">{formatPrintDate(auction.auction_date)}</div>
          </div>
          <div className="border border-black p-3">
            <BilingualLabel english="AUCTION VENUE" tamil="ஏல இடம்" className="font-bold" />
            <div className="mt-1">{loan.branch.branch_name}</div>
            {loan.branch.address && <div className="text-[9px]">{loan.branch.address}</div>}
          </div>
        </div>

        {/* Gold Details */}
        <div className="mt-4 text-[10px] border border-black p-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <BilingualLabel english="Total Gold Weight" tamil="மொத்த தங்க எடை" />
              <div className="font-bold">{auction.total_gold_weight_grams.toFixed(2)} grams</div>
            </div>
            <div>
              <BilingualLabel english="Appraised Value" tamil="மதிப்பீடு" />
              <div className="font-bold">{formatIndianCurrency(auction.total_appraised_value)}</div>
            </div>
            <div>
              <BilingualLabel english="Reserve Price" tamil="குறைந்தபட்ச விலை" />
              <div className="font-bold">{formatIndianCurrency(auction.reserve_price)}</div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="warning-text mt-6">
          <BilingualText
            tamil={`ஏலத்தை நிறுத்த, ${formatPrintDate(paymentDeadline.toISOString())} தேதிக்கு முன் மொத்த தொகையை செலுத்தவும்.`}
            english={`To stop the auction, pay the full amount before ${formatPrintDate(paymentDeadline.toISOString())}.`}
            tamilFirst={false}
          />
        </div>

        {/* Legal Note */}
        <div className="mt-4 text-[8px] text-gray-600">
          <p>This notice is issued as per the terms and conditions agreed at the time of loan disbursement. If no response is received within the stipulated time, the company reserves the right to proceed with the auction without further notice.</p>
          <p className="mt-1" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            இந்த அறிவிப்பு கடன் வழங்கும் நேரத்தில் ஒப்புக்கொள்ளப்பட்ட விதிமுறைகளின்படி வழங்கப்படுகிறது. குறிப்பிட்ட நேரத்திற்குள் பதில் வரவில்லை என்றால், மேலும் அறிவிப்பின்றி ஏலத்தை நடத்த நிறுவனத்திற்கு உரிமை உள்ளது.
          </p>
        </div>

        {/* Signature */}
        <div className="flex justify-end mt-8">
          <SignatureBlock english="Authorized Signatory" tamil="அதிகாரப்பூர்வ கையொப்பம்" />
        </div>

        <PrintFooter showComputerGenerated={false} />
      </PrintPageWrapper>
    </div>
  );
}
