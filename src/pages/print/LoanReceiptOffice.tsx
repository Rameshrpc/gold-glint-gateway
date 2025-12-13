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

const LoanReceiptOffice: React.FC = () => {
  return (
    <PrintPageWrapper title="Loan Receipt - Office Copy">
      <div className="print-preview font-sans text-black">
        <PrintHeader />

        {/* Office Copy Watermark */}
        <div className="absolute top-20 right-4 text-[10px] border border-black px-2 py-1 font-bold no-print-hide">
          <BilingualLabel tamil="அலுவலக நகல்" english="OFFICE COPY" />
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <div className="text-tamil text-lg font-bold">கடன் ரசீது – அலுவலக நகல்</div>
          <div className="text-english text-xl font-bold">Loan Receipt – Office Copy</div>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-4 gap-3 mb-4 text-[10px]">
          <BlankField label={{ tamil: 'ரசீது எண்', english: 'Receipt No' }} width="100%" />
          <BlankField label={{ tamil: 'தேதி', english: 'Date' }} width="100%" />
          <BlankField label={{ tamil: 'கிளை குறியீடு', english: 'Branch Code' }} width="100%" />
          <BlankField label={{ tamil: 'ஊழியர் எண்', english: 'Staff ID' }} width="100%" />
        </div>

        {/* Customer Details Section */}
        <SectionTitle tamil="வாடிக்கையாளர் விவரங்கள்" english="Customer Details" />
        <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
          <BlankField label={{ tamil: 'பெயர்', english: 'Name' }} width="100%" />
          <BlankField label={{ tamil: 'தொலைபேசி', english: 'Mobile' }} width="100%" />
          <div className="col-span-2">
            <BlankField label={{ tamil: 'முகவரி', english: 'Address' }} width="100%" height="35px" />
          </div>
          <BlankField label={{ tamil: 'அடையாள எண்', english: 'ID Number' }} width="100%" />
          <BlankField label={{ tamil: 'அடையாள வகை', english: 'ID Type' }} width="100%" />
        </div>

        {/* Loan Details Section */}
        <SectionTitle tamil="கடன் விவரங்கள்" english="Loan Details" />
        <div className="grid grid-cols-4 gap-3 mb-4 text-[10px]">
          <BlankField label={{ tamil: 'கடன் கணக்கு எண்', english: 'Loan Account No' }} width="100%" />
          <BlankField label={{ tamil: 'கடன் தேதி', english: 'Loan Date' }} width="100%" />
          <BlankField label={{ tamil: 'அசல் தொகை', english: 'Principal Amount' }} width="100%" />
          <BlankField label={{ tamil: 'வட்டி விகிதம்', english: 'Interest Rate' }} width="100%" />
          <BlankField label={{ tamil: 'கால அளவு', english: 'Loan Period' }} width="100%" />
          <BlankField label={{ tamil: 'முதிர்வு தேதி', english: 'Due Date' }} width="100%" />
          <BlankField label={{ tamil: 'பாக்கெட் எண்', english: 'Packet No' }} width="100%" />
          <BlankField label={{ tamil: 'லாக்கர் எண்', english: 'Locker No' }} width="100%" />
        </div>

        {/* Jewel Summary Section */}
        <SectionTitle tamil="நகை சுருக்கம்" english="Jewel Summary" />
        <table className="print-table-bw w-full mb-4 text-[9px]">
          <thead>
            <tr>
              <th className="border border-black p-1">
                <BilingualLabel tamil="வ.எண்" english="S.No" />
              </th>
              <th className="border border-black p-1">
                <BilingualLabel tamil="பொருள் விவரம்" english="Item Description" />
              </th>
              <th className="border border-black p-1">
                <BilingualLabel tamil="மொத்த எடை" english="Gross Wt" />
              </th>
              <th className="border border-black p-1">
                <BilingualLabel tamil="நிகர எடை" english="Net Wt" />
              </th>
              <th className="border border-black p-1">
                <BilingualLabel tamil="தூய்மை" english="Purity" />
              </th>
              <th className="border border-black p-1">
                <BilingualLabel tamil="மதிப்பு" english="Value" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((i) => (
              <tr key={i}>
                <td className="border border-black p-1 h-6">{i}</td>
                <td className="border border-black p-1 h-6"></td>
                <td className="border border-black p-1 h-6"></td>
                <td className="border border-black p-1 h-6"></td>
                <td className="border border-black p-1 h-6"></td>
                <td className="border border-black p-1 h-6"></td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td colSpan={2} className="border border-black p-1 text-right">
                <BilingualLabel tamil="மொத்தம்" english="Total" inline />
              </td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1">-</td>
              <td className="border border-black p-1"></td>
            </tr>
          </tbody>
        </table>

        {/* Amount Section */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-[10px]">
          <BlankField label={{ tamil: 'தொகை (எண்களில்)', english: 'Amount (in figures)' }} width="100%" />
          <BlankField label={{ tamil: 'கட்டண முறை', english: 'Payment Mode' }} width="100%" />
          <BlankField label={{ tamil: 'குறிப்பு எண்', english: 'Reference No' }} width="100%" />
        </div>

        {/* Office Redemption Confirmation */}
        <div className="border-2 border-black p-3 mt-4">
          <div className="text-center mb-3">
            <div className="text-tamil text-[11px] font-bold">அலுவலக மீட்பு உறுதிப்படுத்தல்</div>
            <div className="text-english text-[12px] font-bold">OFFICE REDEMPTION CONFIRMATION</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-[10px]">
            <BlankField label={{ tamil: 'மீட்பு தேதி', english: 'Redemption Date' }} width="100%" />
            <BlankField label={{ tamil: 'மீட்பு தொகை', english: 'Redemption Amount' }} width="100%" />
            <BlankField label={{ tamil: 'தங்கம் சரிபார்க்கப்பட்டது', english: 'Gold Verified' }} width="100%" />
            <BlankField label={{ tamil: 'நகை வழங்கப்பட்டது', english: 'Jewels Released' }} width="100%" />
          </div>

          <div className="flex justify-between mt-4">
            <SignatureBlock 
              title={{ tamil: 'வாடிக்கையாளர்', english: 'Customer' }}
              showThumbBox={true}
              showNameField={true}
              showDateField={false}
              width="150px"
            />
            <SignatureBlock 
              title={{ tamil: 'மேக்கர்', english: 'Maker' }}
              showThumbBox={false}
              showNameField={true}
              showDateField={false}
              width="150px"
            />
            <SignatureBlock 
              title={{ tamil: 'செக்கர்', english: 'Checker' }}
              showThumbBox={false}
              showNameField={true}
              showDateField={false}
              width="150px"
            />
          </div>
        </div>

        <PrintFooter />
      </div>
    </PrintPageWrapper>
  );
};

export default LoanReceiptOffice;
