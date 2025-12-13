import React from 'react';
import { BilingualLabel } from './BilingualLabel';

interface PrintHeaderProps {
  companyName?: string;
  companyNameTamil?: string;
  address?: string;
  addressTamil?: string;
  phone?: string;
  gstin?: string;
  licenseNo?: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  companyName = 'ABC Gold Finance',
  companyNameTamil = 'ஏபிசி கோல்ட் ஃபைனான்ஸ்',
  address = '123, Main Street, Chennai - 600001',
  addressTamil = '123, மெயின் ஸ்ட்ரீட், சென்னை - 600001',
  phone = '+91 98765 43210',
  gstin = '33AAAAA0000A1Z5',
  licenseNo = 'TN/PB/2024/001234'
}) => {
  return (
    <div className="print-header text-center border-b-2 border-black pb-4 mb-4">
      {/* Company Name - Bilingual */}
      <div className="mb-2">
        <div className="text-tamil text-xl font-bold">{companyNameTamil}</div>
        <div className="text-english text-2xl font-bold">{companyName}</div>
      </div>

      {/* Address */}
      <div className="text-[11px] mb-1">
        <div className="text-tamil">{addressTamil}</div>
        <div className="text-english">{address}</div>
      </div>

      {/* Contact & License Info */}
      <div className="flex justify-center gap-8 text-[10px] mt-2">
        <div>
          <BilingualLabel tamil="தொலைபேசி" english="Phone" inline /> : {phone}
        </div>
        <div>
          <BilingualLabel tamil="ஜிஎஸ்டி எண்" english="GSTIN" inline /> : {gstin}
        </div>
        <div>
          <BilingualLabel tamil="உரிம எண்" english="License No" inline /> : {licenseNo}
        </div>
      </div>
    </div>
  );
};
