import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const PostAuctionSettlement: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="post-auction-settlement">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Post-Auction Settlement" documentTitleTamil="ஏலத்திற்குப் பிந்தைய தீர்வு" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default PostAuctionSettlement;