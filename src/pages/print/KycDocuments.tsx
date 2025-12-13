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

const KycDocuments: React.FC = () => {
  return (
    <PrintPageWrapper title="KYC Documents Cover Sheet">
      <div className="print-preview font-sans text-black">
        <PrintHeader />

        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-tamil text-lg font-bold">கே.ஒய்.சி ஆவணங்கள்</div>
          <div className="text-english text-xl font-bold">KYC DOCUMENTS</div>
        </div>

        {/* Customer Details Row */}
        <div className="grid grid-cols-4 gap-4 mb-6 text-[10px]">
          <BlankField label={{ tamil: 'வாடிக்கையாளர் பெயர்', english: 'Customer Name' }} width="100%" />
          <BlankField label={{ tamil: 'கடன் கணக்கு எண்', english: 'Loan Account No' }} width="100%" />
          <BlankField label={{ tamil: 'தேதி', english: 'Date' }} width="100%" />
          <BlankField label={{ tamil: 'கிளை', english: 'Branch' }} width="100%" />
        </div>

        {/* Photo Box */}
        <div className="float-right ml-4 mb-4">
          <div className="border-2 border-black p-2 w-[100px]">
            <div className="text-[8px] text-center mb-1">
              <BilingualLabel tamil="வாடிக்கையாளர் புகைப்படம்" english="Customer Photo" />
            </div>
            <div className="h-[120px] border border-dashed border-gray-400 flex items-center justify-center">
              <div className="text-[8px] text-gray-400 text-center">
                <div className="text-tamil">புகைப்படம்</div>
                <div className="text-english">Photo</div>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Checklist Table */}
        <SectionTitle tamil="KYC சரிபார்ப்பு பட்டியல்" english="KYC Verification Checklist" />
        <table className="print-table-bw w-full mb-6 text-[9px] clear-both">
          <thead>
            <tr>
              <th className="border border-black p-2" style={{ width: '25%' }}>
                <BilingualLabel tamil="ஆவண வகை" english="Document Type" />
              </th>
              <th className="border border-black p-2" style={{ width: '25%' }}>
                <BilingualLabel tamil="ஆவண பெயர்" english="Document Name" />
              </th>
              <th className="border border-black p-2" style={{ width: '20%' }}>
                <BilingualLabel tamil="ஆவண எண்" english="Document Number" />
              </th>
              <th className="border border-black p-2" style={{ width: '15%' }}>
                <BilingualLabel tamil="காலாவதி தேதி" english="Expiry Date" />
              </th>
              <th className="border border-black p-2" style={{ width: '15%' }}>
                <BilingualLabel tamil="பெறப்பட்டதா?" english="Received?" />
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Proof of Identity */}
            <tr>
              <td className="border border-black p-2" rowSpan={4}>
                <BilingualLabel tamil="அடையாள ஆதாரம்" english="Proof of Identity" />
              </td>
              <td className="border border-black p-2">
                <BilingualLabel tamil="ஆதார் அட்டை" english="Aadhaar Card" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8 text-center">N/A</td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="வாக்காளர் அட்டை" english="Voter ID" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="ஓட்டுநர் உரிமம்" english="Driving License" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="பாஸ்போர்ட்" english="Passport" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>

            {/* Proof of Address */}
            <tr>
              <td className="border border-black p-2" rowSpan={3}>
                <BilingualLabel tamil="முகவரி ஆதாரம்" english="Proof of Address" />
              </td>
              <td className="border border-black p-2">
                <BilingualLabel tamil="ஆதார் அட்டை" english="Aadhaar Card" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8 text-center">N/A</td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="மின் கட்டண ரசீது" english="Electricity Bill" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="ரேஷன் அட்டை" english="Ration Card" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>

            {/* PAN Card */}
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="பான்" english="PAN" />
              </td>
              <td className="border border-black p-2">
                <BilingualLabel tamil="பான் அட்டை" english="PAN Card" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8 text-center">N/A</td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>

            {/* Others */}
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="மற்றவை" english="Others" />
              </td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">Yes</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-black inline-block"></span>
                    <span className="text-[8px]">No</span>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* KYC Document Image Placeholders */}
        <SectionTitle tamil="KYC ஆவண படங்கள்" english="KYC Document Images" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Aadhaar Front */}
          <div className="border-2 border-black p-2">
            <div className="text-[9px] text-center font-bold mb-2">
              <BilingualLabel tamil="ஆதார் முன்புறம்" english="Aadhaar Front" />
            </div>
            <div className="h-[140px] border border-dashed border-gray-500 flex items-center justify-center bg-gray-50">
              <div className="text-[10px] text-gray-400 text-center">
                <div className="text-tamil">ஆவண நகலை இங்கே ஒட்டவும்</div>
                <div className="text-english">Paste document copy here</div>
              </div>
            </div>
          </div>

          {/* Aadhaar Back */}
          <div className="border-2 border-black p-2">
            <div className="text-[9px] text-center font-bold mb-2">
              <BilingualLabel tamil="ஆதார் பின்புறம்" english="Aadhaar Back" />
            </div>
            <div className="h-[140px] border border-dashed border-gray-500 flex items-center justify-center bg-gray-50">
              <div className="text-[10px] text-gray-400 text-center">
                <div className="text-tamil">ஆவண நகலை இங்கே ஒட்டவும்</div>
                <div className="text-english">Paste document copy here</div>
              </div>
            </div>
          </div>

          {/* PAN Card */}
          <div className="border-2 border-black p-2">
            <div className="text-[9px] text-center font-bold mb-2">
              <BilingualLabel tamil="பான் அட்டை" english="PAN Card" />
            </div>
            <div className="h-[140px] border border-dashed border-gray-500 flex items-center justify-center bg-gray-50">
              <div className="text-[10px] text-gray-400 text-center">
                <div className="text-tamil">ஆவண நகலை இங்கே ஒட்டவும்</div>
                <div className="text-english">Paste document copy here</div>
              </div>
            </div>
          </div>

          {/* Address Proof */}
          <div className="border-2 border-black p-2">
            <div className="text-[9px] text-center font-bold mb-2">
              <BilingualLabel tamil="முகவரி ஆதாரம்" english="Address Proof" />
            </div>
            <div className="h-[140px] border border-dashed border-gray-500 flex items-center justify-center bg-gray-50">
              <div className="text-[10px] text-gray-400 text-center">
                <div className="text-tamil">ஆவண நகலை இங்கே ஒட்டவும்</div>
                <div className="text-english">Paste document copy here</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Statement */}
        <div className="border border-black p-3 mb-6">
          <div className="text-[10px]">
            <div className="text-tamil mb-1">
              மேற்கண்ட KYC ஆவணங்கள் சரிபார்க்கப்பட்டு, அசல்களுடன் ஒத்துப்போகின்றன என்பதை உறுதிப்படுத்துகிறேன்.
            </div>
            <div className="text-english">
              I certify that the above KYC documents have been verified and match with the originals.
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between mt-6">
          <SignatureBlock 
            title={{ tamil: 'வாடிக்கையாளர் கையொப்பம்', english: 'Customer Signature' }}
            showThumbBox={true}
            showNameField={true}
            showDateField={true}
            width="180px"
          />
          <SignatureBlock 
            title={{ tamil: 'KYC சரிபார்ப்பு ஊழியர்', english: 'KYC Verifying Staff' }}
            showThumbBox={false}
            showNameField={true}
            showDateField={true}
            width="180px"
          />
        </div>

        <PrintFooter />
      </div>
    </PrintPageWrapper>
  );
};

export default KycDocuments;
