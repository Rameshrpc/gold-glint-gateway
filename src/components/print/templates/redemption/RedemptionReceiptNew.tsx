import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, InfoGrid, AmountSummary, GoldItemsTable, SignatureSection } from '../core';

export const RedemptionReceiptNew: React.FC<{ data: any; watermark?: any }> = ({ data, watermark = 'original' }) => {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatCurrency = (a: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);

  return (
    <PrintWrapper watermark={watermark} id="redemption-receipt">
      <BilingualHeader
        companyName={data?.company?.name || 'Company'}
        companyNameTamil={data?.company?.nameTamil}
        logoUrl={data?.company?.logoUrl}
        branchName={data?.branch?.name}
        documentTitle="Redemption Receipt"
        documentTitleTamil="மீட்பு ரசீது"
        documentNumber={data?.redemptionNumber}
        documentDate={data?.redemptionDate ? formatDate(data.redemptionDate) : ''}
      />
      <div className="my-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
        <div className="text-sm text-green-700">Gold Released Successfully / தங்கம் வெற்றிகரமாக வெளியிடப்பட்டது</div>
        <div className="text-2xl font-bold text-green-900 mt-2">✓ REDEEMED</div>
      </div>
      {data?.goldItems && <GoldItemsTable items={data.goldItems} showSerials />}
      {data?.totalSettlement && (
        <AmountSummary title="Settlement Details" titleTamil="தீர்வு விவரங்கள்" lines={[
          { label: 'Principal Outstanding', labelTamil: 'அசல் நிலுவை', amount: data.principalOutstanding || 0 },
          { label: 'Interest Due', labelTamil: 'வட்டி நிலுவை', amount: data.interestDue || 0 },
          { label: 'Total Settlement', labelTamil: 'மொத்த தீர்வு', amount: data.totalSettlement, isTotal: true },
        ]} />
      )}
      <SignatureSection signatures={[
        { label: 'Customer Signature', labelTamil: 'வாடிக்கையாளர் கையொப்பம்' },
        { label: 'Gold Verified By', labelTamil: 'தங்கம் சரிபார்க்கப்பட்டது' },
        { label: 'Authorized Signatory', labelTamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
      ]} columns={3} />
      <BilingualFooter footerText="Gold items have been released to the customer" footerTextTamil="தங்க பொருட்கள் வாடிக்கையாளருக்கு வெளியிடப்பட்டன" companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
    </PrintWrapper>
  );
};

export default RedemptionReceiptNew;