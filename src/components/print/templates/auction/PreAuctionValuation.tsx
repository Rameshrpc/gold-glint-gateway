import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const PreAuctionValuation: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="pre-auction-valuation">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Pre-Auction Valuation Report" documentTitleTamil="முன்-ஏல மதிப்பீட்டு அறிக்கை" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default PreAuctionValuation;