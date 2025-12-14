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
  BilingualText,
  SectionTitle,
  SignatureBlock,
  BlankField,
} from '@/components/print/shared';

// Default Terms & Conditions (Bilingual)
const DEFAULT_TERMS = [
  {
    tamil: 'என்னுடைய குடும்ப/வியாபார செலவுக்கு பணம் தேவைப்படுவதால் இந்த விண்ணப்பத்தின் பின்பக்கத்தில் அட்டவணையில் கண்டுள்ள எனக்கு பரிபூரணமாகச் சொந்தமான நகையை/நகைகளை ஈடாக வைத்துக் கொண்டு கடன் வழங்குமாறு கேட்டுக்கொள்கிறேன்.',
    english: 'Since I require funds for family/business expenses, I request a loan by pledging the jewelry listed overleaf, which belongs to me absolutely.',
  },
  {
    tamil: 'நிறுவனத்தின் அங்கீகரிக்கப்பட்ட மதிப்பீட்டாளர்களால் இப்படிவத்தின் பின்பக்கத்தில் குறிப்பிட்ட மதிப்பு தொகை நகைகளின் விபர எடை, விலை, மதிப்பு ஆகியவற்றை ஒப்புக்கொள்கிறேன்.',
    english: 'I accept the weight, purity, and valuation of the jewelry as assessed by the company\'s authorized appraiser as listed overleaf.',
  },
  {
    tamil: 'மேற்படி கடன் தொகைக்கு மேலே குறிப்பிடப்பட்ட வட்டியை அல்லது நிறுவனத்தால் அவ்வப்பொழுது நிர்ணயிக்கப்படும் வட்டியை செலுத்த ஒப்புக்கொள்கிறேன். வட்டியை கடன் பெற்ற நாளிலிருந்து 3 மாதத்திற்குள்ளோ அல்லது காலாண்டு இறுதிக்குள்ளோ செலுத்துகிறேன். தவறினால், அசலுடன் வட்டி சேர்ந்து கூட்டு வட்டியாக செலுத்த உறுதியளிக்கிறேன்.',
    english: 'I agree to pay the interest rates fixed by the company. I will pay interest quarterly. If I default, I agree to pay compound interest calculated on the principal plus accrued interest.',
  },
  {
    tamil: 'நிறுவனத்தால் அவ்வப்பொழுது கடன் கணக்கு சம்மந்தமாக விதிக்கப்படும் அல்லது கணக்கில் பற்று வைக்கப்படும் கட்டணங்களுக்கு நான் கட்டுப்பட்டு செலுத்திவிடுவதாகவும் உறுதி அளிக்கிறேன்.',
    english: 'I agree to pay any processing fees or incidental charges levied by the company regarding this loan account.',
  },
  {
    tamil: 'ஆயுளுக்கு பிறகு மேற்கண்ட கணக்கிற்காக நாமினி அவர்களை நியமிக்கிறேன்.',
    english: 'I hereby appoint my nominee for this loan account after my lifetime.',
  },
  {
    tamil: 'நகைக்கடன் சட்ட திட்டங்களை எந்த சமயத்திலும் அறிவிப்பின்றி திருத்தவோ, வட்டிவிகிதத்தை மாற்றவோ நிறுவனத்திற்கு முழு உரிமை உண்டு.',
    english: 'The Company reserves the right to amend loan rules or interest rates at any time without prior notice.',
  },
  {
    tamil: 'நான் அடகு வைக்கும் நகைகள் மீது வேறு வில்லங்கம் இருந்து நிறுவனத்திற்கு நட்டம் ஏற்பட்டால், என் சுய சொத்துக்களைக்கொண்டு இழப்பீட்டை கொடுப்பேன்.',
    english: 'I confirm the pledged jewelry is free of encumbrances. I agree to indemnify the company using my personal assets if any legal dispute arises regarding ownership.',
  },
  {
    tamil: 'பாக்கித் தொகையை திருப்பிச் செலுத்த முடியாவிட்டால் நகைகளை பொது ஏலத்திலோ விற்க நிறுவனத்திற்கு உரிமை உண்டு. ஏலத்தில் பற்றாக்குறை ஏற்பட்டால் நான் செலுத்துவேன்; மீதம் இருந்தால் என் கணக்கில் வரவு வைக்கவும்.',
    english: 'If the loan is not repaid, the company has the right to auction the jewelry. I am liable for any deficit after the sale, and any surplus will be credited to my account.',
  },
  {
    tamil: 'நகை களவு போகும்பட்சத்தில் மதிப்பீட்டாளர் மதிப்பு தொகை மட்டும் வழங்கப்படும் என்பதை அறிவேன்.',
    english: 'I understand that in case of theft or loss, only the appraiser\'s valued amount will be reimbursed.',
  },
  {
    tamil: 'குறிப்பிட்ட காலத்தில் மீட்காதபட்சத்தில், இக்கடனை அசல்+வட்டி சேர்த்து புதிய கடனாக புதுப்பிக்கவும், பழைய விதிமுறைகள் இதற்கும் பொருந்தும் எனவும் ஒப்புக்கொள்கிறேன்.',
    english: 'If not redeemed within the specific period, I agree to renew this as a new loan (Principal + Interest) subject to the same terms and conditions.',
  },
  {
    tamil: 'விதிகள் அனைத்தும் எனக்கு படித்துக் காட்டப்பட்டு, புரிந்து கொண்டேன்.',
    english: 'The rules have been read over and explained to me, and I have understood and accepted them.',
  },
  {
    tamil: 'முகவரி மாற்றம் இருந்தால் உடனே தெரிவிப்பேன். இல்லையெனில் பழைய முகவரிக்கு அனுப்பும் அறிவிப்புகள் (ஏல நோட்டீஸ் உட்பட) செல்லும்.',
    english: 'I will inform any change of address immediately in writing. Otherwise, notices (including Auction Notice) sent to the address on record are deemed valid.',
  },
  {
    tamil: 'தினசரி 3 மணி வரை மட்டுமே நகை மீட்பு. சனி, ஞாயிறு, விடுமுறை நாட்களில் மீட்பு இல்லை.',
    english: 'Redemption is allowed only until 3:00 PM. No redemption on Saturdays, Sundays, and Government Holidays.',
  },
];

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
  principal_amount: number;
  shown_principal: number | null;
  client_id: string;
  customer: {
    id: string;
    customer_code: string;
    full_name: string;
    phone: string;
    address: string | null;
    nominee_name: string | null;
    nominee_relation: string | null;
  };
}

export default function GoldDeclaration() {
  const { loanId } = useParams<{ loanId: string }>();
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [customTerms, setCustomTerms] = useState<any[]>([]);
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
          id, loan_number, loan_date, principal_amount, shown_principal, client_id,
          customer:customers(id, customer_code, full_name, phone, address, nominee_name, nominee_relation)
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

        // Fetch custom terms
        const { data: termsData } = await supabase
          .from('client_terms_conditions')
          .select('*')
          .eq('client_id', data.client_id)
          .eq('term_type', 'loan')
          .eq('is_active', true)
          .order('display_order');

        setCustomTerms(termsData || []);
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

  const principalAmount = loan.shown_principal || loan.principal_amount;
  const terms = customTerms && customTerms.length > 0 
    ? customTerms.map(t => ({ tamil: t.terms_text, english: '' }))
    : DEFAULT_TERMS;

  // Replace dynamic variables in terms
  const processedTerms = terms.map(term => ({
    tamil: term.tamil
      .replace('{totalLoanAmount}', formatIndianCurrency(principalAmount))
      .replace('{amountInWords}', numberToWords(principalAmount))
      .replace('{nomineeName}', loan.customer.nominee_name || '___________')
      .replace('{nomineeRelationName}', loan.customer.nominee_relation || '___________'),
    english: term.english
      .replace('{totalLoanAmount}', formatIndianCurrency(principalAmount))
      .replace('{amountInWords}', numberToWords(principalAmount))
      .replace('{nomineeName}', loan.customer.nominee_name || '___________')
      .replace('{nomineeRelationName}', loan.customer.nominee_relation || '___________'),
  }));

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
          documentTitle="LOAN DECLARATION"
          documentTitleTamil="கடன் உறுதிமொழி"
          documentNumber={loan.loan_number}
          documentDate={formatPrintDate(loan.loan_date)}
        />

        {/* Customer Info */}
        <div className="border border-black p-3 mb-4 text-[10px]">
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Name / பெயர்:</strong> {loan.customer.full_name}</div>
            <div><strong>Code / குறியீடு:</strong> {loan.customer.customer_code}</div>
            <div className="col-span-2"><strong>Address / முகவரி:</strong> {loan.customer.address || '-'}</div>
          </div>
        </div>

        {/* Loan Amount Box */}
        <div className="border-2 border-black p-3 mb-4 text-center">
          <BilingualLabel english="LOAN AMOUNT" tamil="கடன் தொகை" className="justify-center text-xs mb-1" />
          <div className="text-xl font-bold">{formatIndianCurrency(principalAmount)}</div>
          <div className="text-[9px] italic">({numberToWords(principalAmount)})</div>
        </div>

        {/* Terms & Conditions */}
        <SectionTitle english="TERMS AND CONDITIONS" tamil="நிபந்தனைகளும், அறிவிப்புகளும்" />
        
        <div className="space-y-2 text-[8px] leading-relaxed">
          {processedTerms.map((term, index) => (
            <div key={index} className="flex gap-2">
              <span className="font-bold shrink-0">{index + 1}.</span>
              <BilingualText tamil={term.tamil} english={term.english} />
            </div>
          ))}
        </div>

        {/* Signature Section */}
        <div className="mt-6 pt-4 border-t border-black">
          <div className="grid grid-cols-3 gap-4 text-[10px] mb-6">
            <BlankField label="Place" tamilLabel="இடம்" size="md" />
            <BlankField label="Date" tamilLabel="தேதி" size="md" />
          </div>

          <div className="flex justify-between mt-8">
            <SignatureBlock english="Borrower's Signature" tamil="கடன் வாங்குபவர் கையொப்பம்" />
            <SignatureBlock english="Witness Signature" tamil="சாட்சி கையொப்பம்" />
          </div>
        </div>

        <PrintFooter showComputerGenerated={false} />
      </PrintPageWrapper>
    </div>
  );
}
