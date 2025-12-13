import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter, InfoGrid, SignatureSection } from '../core';

export const InterestMonthlyStatement: React.FC<{ data: any; watermark?: any }> = ({ data, watermark }) => (
  <PrintWrapper watermark={watermark} id="interest-monthly-statement">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Monthly Interest Statement" documentTitleTamil="மாதாந்திர வட்டி அறிக்கை" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);

export default InterestMonthlyStatement;