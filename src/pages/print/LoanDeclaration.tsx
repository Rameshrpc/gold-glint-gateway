import React from 'react';
import { 
  PrintPageWrapper, 
  PrintHeader, 
  PrintFooter, 
  BilingualLabel, 
  BlankField, 
  SignatureBlock, 
  SectionTitle 
} from '@/components/print/shared';

const LoanDeclaration: React.FC = () => {
  return (
    <PrintPageWrapper title="Loan Declaration">
      <div className="print-preview font-sans text-black">
        <PrintHeader />

        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-tamil text-lg font-bold">கடன் அறிவிப்பு</div>
          <div className="text-english text-xl font-bold">LOAN DECLARATION</div>
        </div>

        {/* Customer Details Section */}
        <SectionTitle tamil="வாடிக்கையாளர் விவரங்கள்" english="Customer Details" />
        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
          <BlankField label={{ tamil: 'பெயர்', english: 'Name' }} width="100%" />
          <BlankField label={{ tamil: 'தந்தை/கணவர் பெயர்', english: "Father's/Spouse Name" }} width="100%" />
          <div className="col-span-2">
            <BlankField label={{ tamil: 'முகவரி', english: 'Address' }} width="100%" height="40px" />
          </div>
          <BlankField label={{ tamil: 'தொலைபேசி', english: 'Mobile' }} width="100%" />
          <BlankField label={{ tamil: 'அடையாள வகை & எண்', english: 'ID Type & Number' }} width="100%" />
          <BlankField label={{ tamil: 'பான் எண்', english: 'PAN Number' }} width="100%" />
        </div>

        {/* Loan Details Section */}
        <SectionTitle tamil="கடன் விவரங்கள்" english="Loan Details" />
        <div className="grid grid-cols-3 gap-4 mb-6 text-[11px]">
          <BlankField label={{ tamil: 'கடன் கணக்கு எண்', english: 'Loan Account No' }} width="100%" />
          <BlankField label={{ tamil: 'கடன் தொகை', english: 'Loan Amount' }} width="100%" />
          <BlankField label={{ tamil: 'வட்டி விகிதம்', english: 'Interest Rate' }} width="100%" />
          <BlankField label={{ tamil: 'கால அளவு', english: 'Tenure' }} width="100%" />
          <BlankField label={{ tamil: 'முதிர்வு தேதி', english: 'Due Date' }} width="100%" />
        </div>

        {/* Declaration Section */}
        <div className="border border-black p-4 mb-6">
          <div className="text-center mb-4">
            <div className="text-tamil text-[12px] font-bold">நான் இதன்மூலம் உறுதியளிக்கிறேன்</div>
            <div className="text-english text-[13px] font-bold">I HEREBY DECLARE THAT:</div>
          </div>

          <div className="space-y-3 text-[10px]">
            {/* Declaration 1 */}
            <div className="flex gap-2">
              <span className="font-bold">1.</span>
              <div>
                <div className="text-tamil">அடமானம் வைக்கப்பட்ட தங்க நகைகள் எனது சொந்த சொத்து மற்றும் வேறு எங்கும் அடமானம் வைக்கப்படவில்லை.</div>
                <div className="text-english">The gold ornaments pledged are my personal property and are not pledged elsewhere.</div>
              </div>
            </div>

            {/* Declaration 2 */}
            <div className="flex gap-2">
              <span className="font-bold">2.</span>
              <div>
                <div className="text-tamil">நான் ஒப்புக்கொண்ட வட்டி விகிதம் மற்றும் திருப்பிச் செலுத்தும் நிபந்தனைகளை ஏற்றுக்கொள்கிறேன்.</div>
                <div className="text-english">I accept the agreed interest rate and repayment terms as mentioned above.</div>
              </div>
            </div>

            {/* Declaration 3 */}
            <div className="flex gap-2">
              <span className="font-bold">3.</span>
              <div>
                <div className="text-tamil">கடனைச் செலுத்தத் தவறினால், பொருந்தும் சட்டத்தின்படி நகைகளை ஏலம் விடுவதற்கு சம்மதிக்கிறேன்.</div>
                <div className="text-english">In case of default, I consent to auction of ornaments as per applicable law.</div>
              </div>
            </div>

            {/* Declaration 4 */}
            <div className="flex gap-2">
              <span className="font-bold">4.</span>
              <div>
                <div className="text-tamil">கடன் தொடர்பான SMS/அழைப்புகளைப் பெற சம்மதிக்கிறேன்.</div>
                <div className="text-english">I consent to receive SMS/calls related to this loan.</div>
              </div>
            </div>

            {/* Declaration 5 */}
            <div className="flex gap-2">
              <span className="font-bold">5.</span>
              <div>
                <div className="text-tamil">நான் அளித்த தகவல்கள் அனைத்தும் உண்மையானவை மற்றும் துல்லியமானவை.</div>
                <div className="text-english">All information provided by me is true and accurate to the best of my knowledge.</div>
              </div>
            </div>

            {/* Declaration 6 */}
            <div className="flex gap-2">
              <span className="font-bold">6.</span>
              <div>
                <div className="text-tamil">விதிமுறைகள் மற்றும் நிபந்தனைகளைப் படித்து புரிந்துகொண்டேன்.</div>
                <div className="text-english">I have read and understood the terms and conditions of this loan.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Place and Date */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-[11px]">
          <BlankField label={{ tamil: 'இடம்', english: 'Place' }} width="100%" />
          <BlankField label={{ tamil: 'தேதி', english: 'Date' }} width="100%" />
        </div>

        {/* Signature Section */}
        <div className="flex justify-between mt-8">
          <SignatureBlock 
            title={{ tamil: 'வாடிக்கையாளர் கையொப்பம்', english: 'Customer Signature' }}
            showThumbBox={true}
            showNameField={true}
            showDateField={false}
            width="180px"
          />
          <SignatureBlock 
            title={{ tamil: 'சாட்சி கையொப்பம்', english: 'Witness Signature' }}
            showThumbBox={false}
            showNameField={true}
            showDateField={false}
            width="180px"
          />
          <SignatureBlock 
            title={{ tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்', english: 'Authorized Signatory' }}
            showThumbBox={false}
            showNameField={true}
            showDateField={false}
            width="180px"
          />
        </div>

        <PrintFooter />
      </div>
    </PrintPageWrapper>
  );
};

export default LoanDeclaration;
