import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
} from '@/components/print/shared';

interface CustomerData {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  photo_url: string | null;
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  pan_card_url: string | null;
}

interface LoanData {
  id: string;
  loan_number: string;
  loan_date: string;
  customer: CustomerData;
}

export default function KycDocuments() {
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
          id, loan_number, loan_date,
          customer:customers(id, customer_code, full_name, phone, address, city, state, pincode, photo_url, aadhaar_front_url, aadhaar_back_url, pan_card_url)
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!loan) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Loan not found</div>;
  }

  const customer = loan.customer;
  const fullAddress = [
    customer.address,
    customer.city,
    customer.state,
    customer.pincode
  ].filter(Boolean).join(', ');

  const DocumentImage = ({ url, label, tamilLabel }: { url: string | null; label: string; tamilLabel: string }) => (
    <div className="text-center">
      <BilingualLabel english={label} tamil={tamilLabel} className="justify-center mb-2" />
      <div className="kyc-document mx-auto">
        {url ? (
          <img src={url} alt={label} />
        ) : (
          <span className="text-gray-400 text-[10px]">Not Available</span>
        )}
      </div>
    </div>
  );

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
          documentTitle="KYC DOCUMENTS"
          documentTitleTamil="KYC ஆவணங்கள்"
          documentNumber={loan.loan_number}
          documentDate={formatPrintDate(loan.loan_date)}
        />

        {/* Customer Photo and Details */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Photo */}
          <div className="text-center">
            <BilingualLabel english="Customer Photo" tamil="வாடிக்கையாளர் புகைப்படம்" className="justify-center mb-2" />
            <div className="photo-placeholder mx-auto">
              {customer.photo_url ? (
                <img src={customer.photo_url} alt="Customer" />
              ) : (
                <span className="text-gray-400">No Photo</span>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="col-span-2">
            <SectionTitle english="CUSTOMER DETAILS" tamil="வாடிக்கையாளர் விவரங்கள்" />
            <div className="border border-black p-3 mt-2 text-[10px] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <BilingualLabel english="Name" tamil="பெயர்" />
                  <div className="font-bold">{customer.full_name}</div>
                </div>
                <div>
                  <BilingualLabel english="Customer Code" tamil="குறியீடு" />
                  <div className="font-bold">{customer.customer_code}</div>
                </div>
              </div>
              <div>
                <BilingualLabel english="Address" tamil="முகவரி" />
                <div>{fullAddress || '-'}</div>
              </div>
              <div>
                <BilingualLabel english="Phone" tamil="தொலைபேசி" />
                <div>{customer.phone}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Aadhaar Card */}
        <SectionTitle english="AADHAAR CARD" tamil="ஆதார் அட்டை" />
        <div className="grid grid-cols-2 gap-6 mb-6 mt-2">
          <DocumentImage url={customer.aadhaar_front_url} label="Aadhaar Front" tamilLabel="ஆதார் முன்பக்கம்" />
          <DocumentImage url={customer.aadhaar_back_url} label="Aadhaar Back" tamilLabel="ஆதார் பின்பக்கம்" />
        </div>

        {/* PAN Card */}
        <SectionTitle english="PAN CARD" tamil="பான் அட்டை" />
        <div className="mt-2 mb-6">
          <DocumentImage url={customer.pan_card_url} label="PAN Card" tamilLabel="பான் அட்டை" />
        </div>

        {/* Verification Declaration */}
        <div className="border-2 border-black p-4 mt-6">
          <SectionTitle english="VERIFICATION DECLARATION" tamil="சரிபார்ப்பு உறுதிமொழி" />
          <p className="text-[9px] mt-2 mb-4">
            I hereby certify that I have verified the original documents and the copies attached are true copies of the originals.
            <br />
            <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              நான் இந்த அசல் ஆவணங்களை சரிபார்த்துள்ளேன், இணைக்கப்பட்ட நகல்கள் அசல்களின் உண்மையான நகல்கள் என்பதை உறுதிப்படுத்துகிறேன்.
            </span>
          </p>
          <div className="flex justify-between">
            <SignatureBlock english="Verified By" tamil="சரிபார்த்தவர்" showDate />
            <SignatureBlock english="Customer Signature" tamil="வாடிக்கையாளர் கையொப்பம்" showDate />
          </div>
        </div>

        <PrintFooter showComputerGenerated />
      </PrintPageWrapper>
    </div>
  );
}
