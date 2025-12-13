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

const AuctionNoticePrint: React.FC = () => {
  return (
    <PrintPageWrapper title="Auction Notice">
      <div className="print-preview font-sans text-black">
        <PrintHeader />

        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-tamil text-lg font-bold">ஏல அறிவிப்பு</div>
          <div className="text-english text-xl font-bold">AUCTION NOTICE</div>
        </div>

        {/* Notice Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-[11px]">
          <BlankField label={{ tamil: 'அறிவிப்பு எண்', english: 'Notice Number' }} width="100%" />
          <BlankField label={{ tamil: 'அறிவிப்பு தேதி', english: 'Notice Date' }} width="100%" />
        </div>

        {/* Customer Details */}
        <SectionTitle tamil="கடன்தாரர் விவரங்கள்" english="Borrower Details" />
        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
          <BlankField label={{ tamil: 'பெயர்', english: 'Name' }} width="100%" />
          <BlankField label={{ tamil: 'தொலைபேசி', english: 'Mobile' }} width="100%" />
          <div className="col-span-2">
            <BlankField label={{ tamil: 'முகவரி', english: 'Address' }} width="100%" height="40px" />
          </div>
          <BlankField label={{ tamil: 'கடன் கணக்கு எண்', english: 'Loan Account No' }} width="100%" />
        </div>

        {/* Loan Summary */}
        <SectionTitle tamil="கடன் சுருக்கம்" english="Loan Summary" />
        <table className="print-table-bw w-full mb-6 text-[10px]">
          <tbody>
            <tr>
              <td className="border border-black p-2 w-1/2">
                <BilingualLabel tamil="கடன் தொகை" english="Loan Amount" />
              </td>
              <td className="border border-black p-2 w-1/2 h-8"></td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="கடன் தேதி" english="Sanction Date" />
              </td>
              <td className="border border-black p-2 h-8"></td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="முதிர்வு தேதி" english="Due Date" />
              </td>
              <td className="border border-black p-2 h-8"></td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="நிலுவைத் தொகை" english="Outstanding Amount" />
              </td>
              <td className="border border-black p-2 h-8"></td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <BilingualLabel tamil="இன்றுவரை வட்டி" english="Interest up to date" />
              </td>
              <td className="border border-black p-2 h-8"></td>
            </tr>
            <tr className="font-bold">
              <td className="border border-black p-2 bg-gray-50">
                <BilingualLabel tamil="மொத்த நிலுவை" english="Total Outstanding" />
              </td>
              <td className="border border-black p-2 h-8 bg-gray-50"></td>
            </tr>
          </tbody>
        </table>

        {/* Notice Body */}
        <div className="border border-black p-4 mb-4">
          <div className="text-[10px] space-y-3">
            <div>
              <div className="text-tamil mb-1">
                மேற்கூறிய கடன் குறிப்பிட்ட காலத்திற்குள் திருப்பிச் செலுத்தப்படாததால், தமிழ்நாடு அடமானதாரர் சட்டத்தின்படி, அடமானம் வைக்கப்பட்ட நகைகளை பகிரங்க ஏலத்தில் விற்பனை செய்ய உத்தேசிக்கப்பட்டுள்ளது.
              </div>
              <div className="text-english">
                As the above mentioned loan has not been repaid within the stipulated period, it is proposed to sell the pledged ornaments by public auction as per the Tamil Nadu Pawnbrokers Act.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <BlankField label={{ tamil: 'ஏல தேதி & நேரம்', english: 'Auction Date & Time' }} width="100%" />
              <BlankField label={{ tamil: 'ஏல இடம்', english: 'Auction Venue' }} width="100%" />
            </div>

            <div>
              <div className="text-tamil mb-1">
                நீங்கள் மேற்கண்ட தேதிக்கு முன்பு கடன் மற்றும் வட்டியை முழுமையாக செலுத்தி உங்கள் நகைகளை மீட்டுக்கொள்ளலாம். இல்லையெனில், நகைகள் ஏலத்தில் விற்கப்படும்.
              </div>
              <div className="text-english">
                You may redeem your ornaments by paying the full loan amount and interest before the above date. Otherwise, the ornaments will be sold in auction.
              </div>
            </div>
          </div>
        </div>

        {/* Jewel Items Table */}
        <SectionTitle tamil="ஏலத்திற்கான நகைகள்" english="Jewels for Auction" />
        <table className="print-table-bw w-full mb-6 text-[9px]">
          <thead>
            <tr>
              <th className="border border-black p-2">
                <BilingualLabel tamil="வ.எண்" english="S.No" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="நகை விவரம்" english="Jewel Description" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="எடை (கி)" english="Weight (g)" />
              </th>
              <th className="border border-black p-2">
                <BilingualLabel tamil="மதிப்பீடு" english="Valuation" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((i) => (
              <tr key={i}>
                <td className="border border-black p-2 h-6 text-center">{i}</td>
                <td className="border border-black p-2 h-6"></td>
                <td className="border border-black p-2 h-6"></td>
                <td className="border border-black p-2 h-6"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Important Note */}
        <div className="border border-black p-3 mb-6 text-[10px]">
          <div className="font-bold mb-1">
            <BilingualLabel tamil="முக்கிய குறிப்பு" english="Important Note" inline />:
          </div>
          <div className="text-tamil mb-1">
            ஏலத்திற்குப் பின் உபரி தொகை இருந்தால் அது உரிமையாளருக்கு திருப்பியளிக்கப்படும். பற்றாக்குறை இருந்தால் அது உரிமையாளரிடமிருந்து வசூலிக்கப்படும்.
          </div>
          <div className="text-english">
            Any surplus after auction will be returned to the owner. Any shortfall will be recovered from the owner.
          </div>
        </div>

        {/* Authorized Signatory */}
        <div className="flex justify-end mt-8">
          <div className="text-center">
            <SignatureBlock 
              title={{ tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பதாரர்', english: 'Authorized Signatory' }}
              showThumbBox={false}
              showNameField={true}
              showDateField={false}
              width="200px"
            />
            <div className="mt-2 text-[10px]">
              <BlankField label={{ tamil: 'பதவி', english: 'Designation' }} width="150px" />
            </div>
            <div className="mt-4 border-2 border-dashed border-black w-24 h-24 mx-auto flex items-center justify-center">
              <div className="text-[8px] text-center text-gray-500">
                <div className="text-tamil">அலுவலக முத்திரை</div>
                <div className="text-english">Office Seal</div>
              </div>
            </div>
          </div>
        </div>

        <PrintFooter />
      </div>
    </PrintPageWrapper>
  );
};

export default AuctionNoticePrint;
