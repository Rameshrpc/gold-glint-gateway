import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const AuctionCatalog: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="auction-catalog">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Auction Catalog" documentTitleTamil="ஏல பட்டியல்" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default AuctionCatalog;