import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const InterestQuarterlySummary: React.FC<{ data: any; watermark?: any }> = ({ data, watermark }) => (
  <PrintWrapper watermark={watermark} id="interest-quarterly-summary">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Quarterly Interest Summary" documentTitleTamil="காலாண்டு வட்டி சுருக்கம்" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default InterestQuarterlySummary;