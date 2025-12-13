import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const InterestAnnualLedger: React.FC<{ data: any; watermark?: any }> = ({ data, watermark }) => (
  <PrintWrapper watermark={watermark} id="interest-annual-ledger">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Annual Interest Ledger" documentTitleTamil="வருடாந்திர வட்டி பேரேடு" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default InterestAnnualLedger;