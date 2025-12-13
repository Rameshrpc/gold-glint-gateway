import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const AdvanceInterestCertificate: React.FC<{ data: any; watermark?: any }> = ({ data, watermark }) => (
  <PrintWrapper watermark={watermark} id="advance-interest-certificate">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Advance Interest Certificate" documentTitleTamil="முன்கூட்டி வட்டி சான்றிதழ்" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default AdvanceInterestCertificate;