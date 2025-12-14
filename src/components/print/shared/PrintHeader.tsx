import React from 'react';
import BilingualLabel from './BilingualLabel';

interface PrintHeaderProps {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  logoUrl?: string;
  documentTitle: string;
  documentTitleTamil: string;
  documentNumber?: string;
  documentDate?: string;
}

export default function PrintHeader({
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  logoUrl,
  documentTitle,
  documentTitleTamil,
  documentNumber,
  documentDate,
}: PrintHeaderProps) {
  return (
    <div className="print-header">
      {/* Left: Logo */}
      <div className="flex-shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="Company Logo" className="h-16 w-16 object-contain" />
        ) : (
          <div className="h-16 w-16 border border-black flex items-center justify-center text-xs">
            LOGO
          </div>
        )}
      </div>

      {/* Center: Company Info & Document Title */}
      <div className="flex-1 text-center px-4">
        <h1 className="text-lg font-bold uppercase tracking-wide">{companyName}</h1>
        {companyAddress && (
          <p className="text-[10px] text-gray-700 mt-1">{companyAddress}</p>
        )}
        {(companyPhone || companyEmail) && (
          <p className="text-[9px] text-gray-600">
            {companyPhone && `Ph: ${companyPhone}`}
            {companyPhone && companyEmail && ' | '}
            {companyEmail && `Email: ${companyEmail}`}
          </p>
        )}
        <div className="mt-2 pt-2 border-t border-gray-300">
          <BilingualLabel 
            english={documentTitle} 
            tamil={documentTitleTamil} 
            className="justify-center text-sm font-semibold"
          />
        </div>
      </div>

      {/* Right: Document Number & Date */}
      <div className="flex-shrink-0 text-right">
        {documentNumber && (
          <div className="text-xs">
            <span className="font-semibold">No:</span>
            <span className="ml-1 font-bold text-sm">{documentNumber}</span>
          </div>
        )}
        {documentDate && (
          <div className="text-xs mt-1">
            <span className="font-semibold">Date / தேதி:</span>
            <span className="ml-1">{documentDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
