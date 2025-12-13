import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const FinalSettlementStatement: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="final-settlement-statement">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Final Settlement Statement" documentTitleTamil="இறுதி தீர்வு அறிக்கை" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default FinalSettlementStatement;