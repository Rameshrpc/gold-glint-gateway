import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const PreRedemptionStatement: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="pre-redemption-statement">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Pre-Redemption Statement" documentTitleTamil="முன்-மீட்பு அறிக்கை" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default PreRedemptionStatement;