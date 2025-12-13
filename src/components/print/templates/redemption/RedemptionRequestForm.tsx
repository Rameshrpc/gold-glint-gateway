import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const RedemptionRequestForm: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="redemption-request-form">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Redemption Request Form" documentTitleTamil="மீட்பு கோரிக்கை படிவம்" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default RedemptionRequestForm;