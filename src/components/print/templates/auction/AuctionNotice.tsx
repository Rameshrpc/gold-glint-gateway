import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, InfoGrid, GoldItemsTable, SignatureSection } from '../core';

export const AuctionNotice: React.FC<{ data: any; watermark?: any }> = ({ data, watermark }) => {
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  
  return (
    <PrintWrapper watermark={watermark || 'original'} id="auction-notice">
      <BilingualHeader
        companyName={data?.company?.name || 'Company'}
        companyNameTamil={data?.company?.nameTamil}
        logoUrl={data?.company?.logoUrl}
        branchName={data?.branch?.name}
        documentTitle="AUCTION NOTICE"
        documentTitleTamil="ஏல அறிவிப்பு"
        documentNumber={data?.auctionLotNumber}
        documentDate={data?.noticeDate ? formatDate(data.noticeDate) : ''}
      />
      <div className="my-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg text-center">
        <div className="text-lg font-bold text-red-800">⚠️ LEGAL NOTICE / சட்ட அறிவிப்பு</div>
        <div className="text-sm text-red-700 mt-2">
          Notice is hereby given that the pledged gold items will be sold at public auction
        </div>
        <div className="text-sm text-red-600 text-tamil mt-1">
          அடமானம் வைக்கப்பட்ட தங்க பொருட்கள் பொது ஏலத்தில் விற்கப்படும் என்று அறிவிக்கப்படுகிறது
        </div>
      </div>
      <InfoGrid title="Auction Details" titleTamil="ஏல விவரங்கள்" columns={3} items={[
        { label: 'Auction Date', labelTamil: 'ஏல தேதி', value: data?.auctionDate ? formatDate(data.auctionDate) : '-', highlight: true },
        { label: 'Time', labelTamil: 'நேரம்', value: data?.auctionTime || '10:00 AM' },
        { label: 'Venue', labelTamil: 'இடம்', value: data?.venue || data?.branch?.name || '-' },
      ]} />
      {data?.goldItems && <GoldItemsTable items={data.goldItems} showSerials />}
      <div className="my-4 p-3 border border-gray-300 rounded text-xs">
        <div className="font-semibold mb-2">Terms & Conditions / நிபந்தனைகள்:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Bidding starts at the reserve price / ஏலம் இருப்பு விலையில் தொடங்கும்</li>
          <li>Payment must be made immediately after auction / ஏலத்திற்குப் பிறகு உடனடியாக பணம் செலுத்த வேண்டும்</li>
          <li>Items sold as-is without warranty / பொருட்கள் உத்தரவாதம் இல்லாமல் விற்கப்படும்</li>
        </ul>
      </div>
      <SignatureSection signatures={[{ label: 'Branch Manager', labelTamil: 'கிளை மேலாளர்' }]} columns={2} />
      <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
    </PrintWrapper>
  );
};
export default AuctionNotice;