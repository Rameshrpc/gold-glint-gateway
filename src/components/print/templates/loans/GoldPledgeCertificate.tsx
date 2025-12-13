import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, GoldItemsTable, InfoGrid, SignatureSection } from '../core';
import { WatermarkType } from '../core/WatermarkOverlay';

interface GoldPledgeData {
  loanNumber: string;
  loanDate: string;
  maturityDate: string;
  certificateNumber: string;
  customer: {
    name: string;
    nameTamil?: string;
    code: string;
    phone: string;
    address?: string;
  };
  goldItems: Array<{
    id: string;
    serialNumber?: string;
    itemType: string;
    itemTypeTamil?: string;
    description?: string;
    grossWeight: number;
    stoneWeight?: number;
    netWeight: number;
    purity: string;
    purityPercentage: number;
    marketRate: number;
    appraisedValue: number;
    imageUrl?: string;
  }>;
  custodyLocation: string;
  custodyLocationCode: string;
  insuranceInfo?: {
    policyNumber: string;
    provider: string;
    validTill: string;
    coverageAmount: number;
  };
  branch: {
    name: string;
    nameTamil?: string;
    address?: string;
  };
  company: {
    name: string;
    nameTamil?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
}

interface GoldPledgeCertificateProps {
  data: GoldPledgeData;
  watermark?: WatermarkType;
  copyType?: 'original' | 'duplicate';
}

export const GoldPledgeCertificate: React.FC<GoldPledgeCertificateProps> = ({ 
  data, 
  watermark,
  copyType = 'original' 
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalWeight = data.goldItems.reduce((sum, item) => sum + item.netWeight, 0);
  const totalValue = data.goldItems.reduce((sum, item) => sum + item.appraisedValue, 0);

  return (
    <PrintWrapper 
      watermark={watermark || copyType} 
      id="gold-pledge-certificate"
    >
      <BilingualHeader
        companyName={data.company.name}
        companyNameTamil={data.company.nameTamil}
        address={data.company.address}
        phone={data.company.phone}
        email={data.company.email}
        logoUrl={data.company.logoUrl}
        branchName={data.branch.name}
        branchNameTamil={data.branch.nameTamil}
        documentTitle="Gold Pledge Certificate"
        documentTitleTamil="தங்க அடமான சான்றிதழ்"
        documentNumber={data.certificateNumber}
        documentDate={formatDate(data.loanDate)}
      />

      {/* Certificate Type Badge */}
      <div className="text-center my-4">
        <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
          copyType === 'original' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {copyType === 'original' ? 'ORIGINAL / அசல்' : 'DUPLICATE / நகல்'}
        </span>
      </div>

      {/* Pledgor Details */}
      <InfoGrid
        title="Pledgor Details"
        titleTamil="அடமானக்காரர் விவரங்கள்"
        columns={2}
        items={[
          { label: 'Name', labelTamil: 'பெயர்', value: data.customer.name, valueTamil: data.customer.nameTamil },
          { label: 'Customer Code', labelTamil: 'வாடிக்கையாளர் குறியீடு', value: data.customer.code },
          { label: 'Phone', labelTamil: 'தொலைபேசி', value: data.customer.phone },
          { label: 'Address', labelTamil: 'முகவரி', value: data.customer.address || '-', fullWidth: true },
        ]}
      />

      {/* Pledge Details */}
      <InfoGrid
        title="Pledge Details"
        titleTamil="அடமான விவரங்கள்"
        columns={4}
        items={[
          { label: 'Loan Number', labelTamil: 'கடன் எண்', value: data.loanNumber, highlight: true },
          { label: 'Certificate No.', labelTamil: 'சான்றிதழ் எண்', value: data.certificateNumber },
          { label: 'Pledge Date', labelTamil: 'அடமான தேதி', value: formatDate(data.loanDate) },
          { label: 'Valid Until', labelTamil: 'செல்லுபடியாகும் வரை', value: formatDate(data.maturityDate) },
        ]}
      />

      {/* Gold Items Inventory */}
      <GoldItemsTable 
        items={data.goldItems} 
        showSerials 
        showImages 
        showMarketValue 
      />

      {/* Summary Box */}
      <div className="my-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-600 text-english">Total Items</div>
            <div className="text-xs text-gray-500 text-tamil">மொத்த பொருட்கள்</div>
            <div className="text-xl font-bold text-amber-800">{data.goldItems.length}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 text-english">Total Gold Weight</div>
            <div className="text-xs text-gray-500 text-tamil">மொத்த தங்க எடை</div>
            <div className="text-xl font-bold text-amber-800">{totalWeight.toFixed(3)} g</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 text-english">Total Appraised Value</div>
            <div className="text-xs text-gray-500 text-tamil">மொத்த மதிப்பீடு</div>
            <div className="text-xl font-bold text-amber-800">{formatCurrency(totalValue)}</div>
          </div>
        </div>
      </div>

      {/* Custody Information */}
      <InfoGrid
        title="Custody Information"
        titleTamil="காவல் தகவல்"
        columns={2}
        items={[
          { label: 'Custody Location', labelTamil: 'காவல் இடம்', value: data.custodyLocation },
          { label: 'Location Code', labelTamil: 'இடக் குறியீடு', value: data.custodyLocationCode },
        ]}
      />

      {/* Insurance Details */}
      {data.insuranceInfo && (
        <InfoGrid
          title="Insurance Coverage"
          titleTamil="காப்பீடு பாதுகாப்பு"
          columns={4}
          items={[
            { label: 'Policy Number', labelTamil: 'பாலிசி எண்', value: data.insuranceInfo.policyNumber },
            { label: 'Provider', labelTamil: 'வழங்குநர்', value: data.insuranceInfo.provider },
            { label: 'Valid Till', labelTamil: 'செல்லுபடி', value: formatDate(data.insuranceInfo.validTill) },
            { label: 'Coverage', labelTamil: 'பாதுகாப்பு', value: formatCurrency(data.insuranceInfo.coverageAmount) },
          ]}
        />
      )}

      {/* Terms */}
      <div className="my-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
        <div className="font-semibold mb-2 text-english">Terms of Custody / காவல் நிபந்தனைகள்</div>
        <ul className="list-disc list-inside space-y-1">
          <li className="bilingual-text">
            <span className="text-english">Items will be stored in secure vault until loan closure.</span>
            <span className="text-tamil text-gray-600 block ml-5">கடன் மூடப்படும் வரை பொருட்கள் பாதுகாப்பான பெட்டகத்தில் சேமிக்கப்படும்.</span>
          </li>
          <li className="bilingual-text">
            <span className="text-english">Original pledge certificate required for release.</span>
            <span className="text-tamil text-gray-600 block ml-5">வெளியிடுவதற்கு அசல் அடமான சான்றிதழ் தேவை.</span>
          </li>
          <li className="bilingual-text">
            <span className="text-english">Items insured against fire, theft, and natural disasters.</span>
            <span className="text-tamil text-gray-600 block ml-5">தீ, திருட்டு மற்றும் இயற்கை பேரழிவுகளுக்கு எதிராக காப்பீடு செய்யப்பட்டுள்ளது.</span>
          </li>
        </ul>
      </div>

      {/* Signatures */}
      <SignatureSection
        columns={3}
        signatures={[
          { label: 'Pledgor Signature', labelTamil: 'அடமானக்காரர் கையொப்பம்' },
          { label: 'Appraiser', labelTamil: 'மதிப்பீட்டாளர்' },
          { label: 'Branch Manager', labelTamil: 'கிளை மேலாளர்' },
        ]}
        showDate
      />

      <BilingualFooter
        footerText="This certificate must be presented at the time of gold release"
        footerTextTamil="தங்கம் வெளியிடும் போது இந்த சான்றிதழ் சமர்ப்பிக்கப்பட வேண்டும்"
        companyName={data.company.name}
        printDate={new Date().toLocaleDateString('en-IN')}
      />
    </PrintWrapper>
  );
};

export default GoldPledgeCertificate;