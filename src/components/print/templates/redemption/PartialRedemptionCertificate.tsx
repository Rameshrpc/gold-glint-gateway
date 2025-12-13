import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const PartialRedemptionCertificate: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="partial-redemption-certificate">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Partial Redemption Certificate" documentTitleTamil="பகுதி மீட்பு சான்றிதழ்" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default PartialRedemptionCertificate;