import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const InterestWaiverNotice: React.FC<{ data: any; watermark?: any }> = ({ data, watermark }) => (
  <PrintWrapper watermark={watermark} id="interest-waiver-notice">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Interest Waiver/Adjustment Notice" documentTitleTamil="வட்டி விலக்கு/சரிசெய்தல் அறிவிப்பு" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default InterestWaiverNotice;