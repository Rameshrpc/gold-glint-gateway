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

const JewelDetails: React.FC = () => {
  return (
    <PrintPageWrapper title="Jewel Details Sheet">
      <div className="print-preview font-sans text-black">
        <PrintHeader />

        {/* Title */}
        <div className="text-center mb-4">
          <div className="text-tamil text-lg font-bold">நகை விவரத் தாள்</div>
          <div className="text-english text-xl font-bold">Jewel Details Sheet</div>
        </div>

        {/* Top Info Row */}
        <div className="grid grid-cols-5 gap-3 mb-6 text-[10px]">
          <BlankField label={{ tamil: 'வாடிக்கையாளர் பெயர்', english: 'Customer Name' }} width="100%" />
          <BlankField label={{ tamil: 'கடன் கணக்கு எண்', english: 'Loan Account No' }} width="100%" />
          <BlankField label={{ tamil: 'தேதி', english: 'Date' }} width="100%" />
          <BlankField label={{ tamil: 'கிளை', english: 'Branch' }} width="100%" />
          <BlankField label={{ tamil: 'பாக்கெட் எண்', english: 'Packet No' }} width="100%" />
        </div>

        {/* Photo Boxes Section */}
        <SectionTitle tamil="நகை புகைப்படங்கள்" english="Jewel Photographs" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-2 border-black p-2">
              <div className="text-[9px] text-center mb-1">
                <BilingualLabel tamil={`புகைப்படம் ${i}`} english={`Photo ${i}`} />
              </div>
              <div className="h-[140px] border border-dashed border-gray-400 flex items-center justify-center">
                <div className="text-[9px] text-gray-400 text-center">
                  <div className="text-tamil">புகைப்படத்தை இங்கே ஒட்டவும்</div>
                  <div className="text-english">Paste Photo Here</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Jewel Details Table */}
        <SectionTitle tamil="நகை விவரங்கள் அட்டவணை" english="Jewel Details Table" />
        <table className="print-table-bw w-full mb-6 text-[9px]">
          <thead>
            <tr>
              <th className="border border-black p-2 w-12">
                <BilingualLabel tamil="வ.எண்" english="S.No" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="நகை விவரம்" english="Jewel Description" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="மொத்த எடை (கி)" english="Gross Weight (g)" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="நிகர எடை (கி)" english="Net Weight (g)" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="தூய்மை (கேரட்)" english="Purity (Karat)" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="மதிப்பீட்டு மதிப்பு" english="Appraised Value" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="குறிப்புகள்" english="Remarks" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i}>
                <td className="border border-black p-2 h-8 text-center">{i}</td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
                <td className="border border-black p-2 h-8"></td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td colSpan={2} className="border border-black p-2 text-right">
                <BilingualLabel tamil="மொத்தம்" english="TOTAL" inline />
              </td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2">-</td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2">-</td>
            </tr>
          </tbody>
        </table>

        {/* Staff Certification */}
        <div className="border border-black p-3 mb-6">
          <div className="text-[10px] mb-4">
            <div className="text-tamil mb-1">
              மேலே குறிப்பிட்ட நகைகள் வாடிக்கையாளரிடமிருந்து பெறப்பட்டு, எடை மற்றும் தூய்மை சரிபார்க்கப்பட்டது என்பதை உறுதிப்படுத்துகிறேன்.
            </div>
            <div className="text-english">
              I certify that the above mentioned jewels have been received from the customer and the weight and purity have been verified.
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between mt-6">
          <SignatureBlock 
            title={{ tamil: 'மதிப்பீட்டாளர் கையொப்பம்', english: 'Appraiser Signature' }}
            showThumbBox={false}
            showNameField={true}
            showDateField={true}
            width="180px"
          />
          <SignatureBlock 
            title={{ tamil: 'வாடிக்கையாளர் கையொப்பம்', english: 'Customer Signature' }}
            showThumbBox={true}
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

export default JewelDetails;
