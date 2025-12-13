import React from 'react';

interface BilingualHeaderProps {
  companyName: string;
  companyNameTamil?: string;
  tagline?: string;
  taglineTamil?: string;
  address?: string;
  addressTamil?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  branchName?: string;
  branchNameTamil?: string;
  documentTitle: string;
  documentTitleTamil?: string;
  documentNumber?: string;
  documentDate?: string;
}

export const BilingualHeader: React.FC<BilingualHeaderProps> = ({
  companyName,
  companyNameTamil,
  tagline,
  taglineTamil,
  address,
  addressTamil,
  phone,
  email,
  logoUrl,
  branchName,
  branchNameTamil,
  documentTitle,
  documentTitleTamil,
  documentNumber,
  documentDate
}) => {
  return (
    <div className="print-header">
      <div className="flex items-start justify-between mb-3">
        {/* Logo */}
        {logoUrl && (
          <div className="flex-shrink-0">
            <img src={logoUrl} alt="Company Logo" className="print-header-logo" />
          </div>
        )}
        
        {/* Company Info */}
        <div className="flex-1 text-center px-4">
          <h1 className="text-xl font-bold text-gray-900 text-english">{companyName}</h1>
          {companyNameTamil && (
            <h2 className="text-lg font-semibold text-gray-700 text-tamil">{companyNameTamil}</h2>
          )}
          
          {tagline && (
            <div className="bilingual-text mt-1">
              <span className="text-xs text-gray-600 text-english">{tagline}</span>
              {taglineTamil && (
                <span className="text-xs text-gray-500 text-tamil">{taglineTamil}</span>
              )}
            </div>
          )}
          
          {address && (
            <div className="bilingual-text mt-2 text-xs text-gray-600">
              <span className="text-english">{address}</span>
              {addressTamil && (
                <span className="text-tamil">{addressTamil}</span>
              )}
            </div>
          )}
          
          {(phone || email) && (
            <div className="text-xs text-gray-600 mt-1">
              {phone && <span>Tel: {phone}</span>}
              {phone && email && <span className="mx-2">|</span>}
              {email && <span>Email: {email}</span>}
            </div>
          )}
        </div>
        
        {/* Branch Info */}
        {branchName && (
          <div className="flex-shrink-0 text-right">
            <div className="bilingual-text">
              <span className="text-sm font-medium text-english">{branchName}</span>
              {branchNameTamil && (
                <span className="text-xs text-gray-600 text-tamil">{branchNameTamil}</span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Document Title */}
      <div className="bg-gray-100 py-2 px-4 mt-3 border-y border-gray-300">
        <div className="flex items-center justify-between">
          <div className="bilingual-text text-center flex-1">
            <h3 className="text-base font-bold text-gray-900 text-english uppercase tracking-wide">
              {documentTitle}
            </h3>
            {documentTitleTamil && (
              <h4 className="text-sm font-semibold text-gray-700 text-tamil">
                {documentTitleTamil}
              </h4>
            )}
          </div>
          
          {(documentNumber || documentDate) && (
            <div className="text-right text-xs">
              {documentNumber && (
                <div className="font-medium">No: {documentNumber}</div>
              )}
              {documentDate && (
                <div className="text-gray-600">Date: {documentDate}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BilingualHeader;