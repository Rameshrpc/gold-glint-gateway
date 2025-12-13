import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface BilingualFooterProps {
  terms?: string[];
  termsTamil?: string[];
  footerText?: string;
  footerTextTamil?: string;
  showQrCode?: boolean;
  qrCodeUrl?: string;
  qrCodeLabel?: string;
  showSignatures?: boolean;
  signatures?: Array<{
    label: string;
    labelTamil?: string;
  }>;
  companyName?: string;
  printDate?: string;
}

export const BilingualFooter: React.FC<BilingualFooterProps> = ({
  terms,
  termsTamil,
  footerText,
  footerTextTamil,
  showQrCode = false,
  qrCodeUrl,
  qrCodeLabel,
  showSignatures = true,
  signatures = [
    { label: 'Customer Signature', labelTamil: 'வாடிக்கையாளர் கையொப்பம்' },
    { label: 'Authorized Signature', labelTamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' }
  ],
  companyName,
  printDate
}) => {
  return (
    <div className="print-footer mt-8">
      {/* Terms & Conditions */}
      {terms && terms.length > 0 && (
        <div className="declaration-box mb-4">
          <div className="font-semibold text-xs mb-2 text-english">
            Terms & Conditions / நிபந்தனைகள்
          </div>
          <div className="grid grid-cols-1 gap-1">
            {terms.map((term, index) => (
              <div key={index} className="flex gap-2 text-xs">
                <span className="flex-shrink-0">{index + 1}.</span>
                <div className="bilingual-text">
                  <span className="text-english">{term}</span>
                  {termsTamil && termsTamil[index] && (
                    <span className="text-tamil text-gray-600">{termsTamil[index]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Signature Section */}
      {showSignatures && (
        <div className="flex justify-between items-end mt-8 pt-4">
          {signatures.map((sig, index) => (
            <div key={index} className="text-center">
              <div className="signature-box">
                <div className="bilingual-text">
                  <span className="text-english">{sig.label}</span>
                  {sig.labelTamil && (
                    <span className="text-tamil text-gray-500">{sig.labelTamil}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* QR Code */}
          {showQrCode && qrCodeUrl && (
            <div className="qr-code-container">
              <QRCodeSVG value={qrCodeUrl} size={64} level="M" />
              {qrCodeLabel && (
                <span className="qr-code-label">{qrCodeLabel}</span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Footer Text */}
      <div className="mt-6 pt-3 border-t border-gray-200 text-center">
        {footerText && (
          <div className="bilingual-text text-xs text-gray-500">
            <span className="text-english">{footerText}</span>
            {footerTextTamil && (
              <span className="text-tamil">{footerTextTamil}</span>
            )}
          </div>
        )}
        
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          {companyName && <span>© {new Date().getFullYear()} {companyName}</span>}
          {printDate && <span>Printed on: {printDate}</span>}
        </div>
      </div>
    </div>
  );
};

export default BilingualFooter;