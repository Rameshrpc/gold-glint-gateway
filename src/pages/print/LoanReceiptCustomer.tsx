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

const LoanReceiptCustomer: React.FC = () => {
  return (
    <PrintPageWrapper title="Loan Receipt - Customer Copy">
      <div className="print-preview font-sans text-black">
        <PrintHeader />

        {/* Title */}
        <div className="text-center mb-4">
          <div className="text-tamil text-lg font-bold">கடன் ரசீது – வாடிக்கையாளர் நகல்</div>
          <div className="text-english text-xl font-bold">Loan Receipt – Customer Copy</div>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-[11px]">
          <BlankField label={{ tamil: 'ரசீது எண்', english: 'Receipt No' }} width="100%" />
          <BlankField label={{ tamil: 'தேதி', english: 'Date' }} width="100%" />
          <BlankField label={{ tamil: 'கிளை', english: 'Branch' }} width="100%" />
        </div>

        {/* Customer Details Section */}
        <SectionTitle tamil="வாடிக்கையாளர் விவரங்கள்" english="Customer Details" />
        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
          <BlankField label={{ tamil: 'பெயர்', english: 'Name' }} width="100%" />
          <BlankField label={{ tamil: 'தொலைபேசி', english: 'Mobile' }} width="100%" />
          <div className="col-span-2">
            <BlankField label={{ tamil: 'முகவரி', english: 'Address' }} width="100%" height="40px" />
          </div>
          <BlankField label={{ tamil: 'அடையாள எண்', english: 'ID Number' }} width="100%" />
          <BlankField label={{ tamil: 'அடையாள வகை', english: 'ID Type' }} width="100%" />
        </div>

        {/* Loan Details Section */}
        <SectionTitle tamil="கடன் விவரங்கள்" english="Loan Details" />
        <div className="grid grid-cols-3 gap-4 mb-4 text-[11px]">
          <BlankField label={{ tamil: 'கடன் கணக்கு எண்', english: 'Loan Account No' }} width="100%" />
          <BlankField label={{ tamil: 'கடன் தேதி', english: 'Loan Date' }} width="100%" />
          <BlankField label={{ tamil: 'அசல் தொகை', english: 'Principal Amount' }} width="100%" />
          <BlankField label={{ tamil: 'வட்டி விகிதம்', english: 'Interest Rate' }} width="100%" />
          <BlankField label={{ tamil: 'கால அளவு', english: 'Loan Period' }} width="100%" />
          <BlankField label={{ tamil: 'முதிர்வு தேதி', english: 'Due Date' }} width="100%" />
        </div>

        {/* Jewel Summary Section */}
        <SectionTitle tamil="நகை சுருக்கம்" english="Jewel Summary" />
        <table className="print-table-bw w-full mb-4 text-[10px]">
          <thead>
            <tr>
              <th className="border border-black p-2">
                <BilingualLabel tamil="வ.எண்" english="S.No" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="பொருள் விவரம்" english="Item Description" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="மொத்த எடை (கி)" english="Gross Wt (g)" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="நிகர எடை (கி)" english="Net Wt (g)" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="தூய்மை" english="Purity" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="மதிப்பு" english="Value" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((i) => (
              <tr key={i}>
                <td className="border border-black p-2 h-8">{i}</td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td colSpan={2} className="border border-black p-2 text-right">
                <BilingualLabel tamil="மொத்தம்" english="Total" inline />
              </td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2">-</td>
              <td className="border border-black p-2"></td>
            </tr>
          </tbody>
        </table>

        {/* Amount Received Section */}
        <SectionTitle tamil="பெறப்பட்ட தொகை" english="Amount Received" />
        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
          <BlankField label={{ tamil: 'தொகை (எண்களில்)', english: 'Amount (in figures)' }} width="100%" />
          <div className="col-span-1">
            <BlankField label={{ tamil: 'தொகை (சொற்களில்)', english: 'Amount (in words)' }} width="100%" height="30px" />
          </div>
        </div>

        {/* Payment Mode */}
        <div className="mb-4 text-[11px]">
          <BilingualLabel tamil="கட்டண முறை" english="Mode of Payment" className="mb-2" />
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <span className="checkbox-box w-4 h-4 border border-black inline-block"></span>
              <BilingualLabel tamil="ரொக்கம்" english="Cash" inline />
            </label>
            <label className="flex items-center gap-2">
              <span className="checkbox-box w-4 h-4 border border-black inline-block"></span>
              <BilingualLabel tamil="காசோலை" english="Cheque" inline />
            </label>
            <label className="flex items-center gap-2">
              <span className="checkbox-box w-4 h-4 border border-black inline-block"></span>
              <BilingualLabel tamil="வங்கி மாற்றம்" english="Bank Transfer" inline />
            </label>
          </div>
        </div>

        {/* Redemption Acknowledgement */}
        <div className="border-2 border-black p-4 mt-6">
          <div className="text-center mb-4">
            <div className="text-tamil text-[12px] font-bold">மீட்பு ஒப்புதல்</div>
            <div className="text-english text-[13px] font-bold">REDEMPTION ACKNOWLEDGEMENT</div>
          </div>
          
          <div className="text-[10px] mb-4">
            <div className="text-tamil mb-1">
              மேலே குறிப்பிட்ட கடனை முழுமையாக செலுத்தி, அடமானம் வைக்கப்பட்ட நகைகளை சரியான நிலையில் பெற்றுக்கொண்டேன் என்பதை உறுதிப்படுத்துகிறேன்.
            </div>
            <div className="text-english">
              I hereby acknowledge that I have fully repaid the above mentioned loan and have received the pledged ornaments in good condition.
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <SignatureBlock 
              title={{ tamil: 'வாடிக்கையாளர் கையொப்பம்', english: 'Customer Signature' }}
              showThumbBox={true}
              showNameField={true}
              showDateField={true}
            />
            <SignatureBlock 
              title={{ tamil: 'சாட்சி / ஊழியர் கையொப்பம்', english: 'Witness / Staff Signature' }}
              showThumbBox={false}
              showNameField={true}
              showDateField={true}
            />
          </div>
        </div>

        <PrintFooter />
      </div>
    </PrintPageWrapper>
  );
};

export default LoanReceiptCustomer;
