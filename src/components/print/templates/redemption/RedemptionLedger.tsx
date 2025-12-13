import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const RedemptionLedger: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="redemption-ledger">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Redemption Ledger" documentTitleTamil="மீட்பு பேரேடு" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default RedemptionLedger;