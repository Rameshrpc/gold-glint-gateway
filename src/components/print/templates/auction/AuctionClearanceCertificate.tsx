import React from 'react';
import { PrintWrapper, BilingualHeader, BilingualFooter } from '../core';

export const AuctionClearanceCertificate: React.FC<{ data: any }> = ({ data }) => (
  <PrintWrapper id="auction-clearance-certificate">
    <BilingualHeader companyName={data?.company?.name || 'Company'} documentTitle="Auction Clearance Certificate" documentTitleTamil="ஏல அனுமதி சான்றிதழ்" />
    <div className="text-center py-8 text-gray-500">Template content will be populated with actual data</div>
    <BilingualFooter companyName={data?.company?.name} printDate={new Date().toLocaleDateString('en-IN')} />
  </PrintWrapper>
);
export default AuctionClearanceCertificate;