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

const InterestReceiptPrint: React.FC = () => {
  return (
    <PrintPageWrapper title="Interest Receipt">
      <div className="print-preview font-sans text-black">
        <PrintHeader />

        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-tamil text-lg font-bold">வட்டி ரசீது</div>
          <div className="text-english text-xl font-bold">INTEREST RECEIPT</div>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-[11px]">
          <BlankField label={{ tamil: 'வட்டி ரசீது எண்', english: 'Interest Receipt No' }} width="100%" />
          <BlankField label={{ tamil: 'தேதி', english: 'Date' }} width="100%" />
          <BlankField label={{ tamil: 'கிளை', english: 'Branch' }} width="100%" />
        </div>

        {/* Customer & Loan Details */}
        <SectionTitle tamil="வாடிக்கையாளர் & கடன் விவரங்கள்" english="Customer & Loan Details" />
        <div className="grid grid-cols-2 gap-4 mb-6 text-[11px]">
          <BlankField label={{ tamil: 'வாடிக்கையாளர் பெயர்', english: 'Customer Name' }} width="100%" />
          <BlankField label={{ tamil: 'கடன் கணக்கு எண்', english: 'Loan Account No' }} width="100%" />
        </div>

        {/* Interest Details Section */}
        <SectionTitle tamil="வட்டி விவரங்கள்" english="Interest Details" />
        <table className="print-table-bw w-full mb-6 text-[10px]">
          <tbody>
            <tr>
              <td className="border border-black p-3 w-1/2">
                <BilingualLabel tamil="காலம் முதல்" english="Period From" />
              </td>
              <td className="border border-black p-3 w-1/2 h-10"></td>
            </tr>
            <tr>
              <td className="border border-black p-3">
                <BilingualLabel tamil="காலம் வரை" english="Period To" />
              </td>
              <td className="border border-black p-3 h-10"></td>
            </tr>
            <tr>
              <td className="border border-black p-3">
                <BilingualLabel tamil="நிலுவை அசல்" english="Principal Outstanding" />
              </td>
              <td className="border border-black p-3 h-10"></td>
            </tr>
            <tr>
              <td className="border border-black p-3">
                <BilingualLabel tamil="வட்டி விகிதம்" english="Interest Rate" />
              </td>
              <td className="border border-black p-3 h-10"></td>
            </tr>
            <tr>
              <td className="border border-black p-3">
                <BilingualLabel tamil="மாதங்கள்/நாட்களின் எண்ணிக்கை" english="Number of Months/Days" />
              </td>
              <td className="border border-black p-3 h-10"></td>
            </tr>
            <tr>
              <td className="border border-black p-3">
                <BilingualLabel tamil="வட்டித் தொகை" english="Interest Amount" />
              </td>
              <td className="border border-black p-3 h-10"></td>
            </tr>
            <tr>
              <td className="border border-black p-3">
                <BilingualLabel tamil="அபராதம்/பிற கட்டணங்கள்" english="Penalty/Other Charges" />
              </td>
              <td className="border border-black p-3 h-10"></td>
            </tr>
            <tr className="font-bold">
              <td className="border border-black p-3 bg-gray-50">
                <BilingualLabel tamil="பெறப்பட்ட மொத்த தொகை" english="Total Amount Received" />
              </td>
              <td className="border border-black p-3 h-10 bg-gray-50"></td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        <div className="mb-6 text-[11px]">
          <BlankField 
            label={{ tamil: 'தொகை (சொற்களில்)', english: 'Amount (in words)' }} 
            width="100%" 
            height="30px"
          />
        </div>

        {/* Payment Mode */}
        <div className="mb-6 text-[11px]">
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

        {/* Declaration */}
        <div className="border border-black p-4 mb-6">
          <div className="text-[10px]">
            <div className="text-tamil mb-2">
              மேற்குறிப்பிட்ட காலத்திற்கான வட்டித் தொகையை ஒப்புக்கொண்ட நிபந்தனைகளின்படி செலுத்தியதை வாடிக்கையாளர் ஏற்றுக்கொள்கிறார்.
            </div>
            <div className="text-english">
              The customer acknowledges payment of the above mentioned interest amount for the specified period as per the agreed terms.
            </div>
          </div>
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
            title={{ tamil: 'காசாளர் / ஊழியர்', english: 'Cashier / Staff' }}
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

export default InterestReceiptPrint;
