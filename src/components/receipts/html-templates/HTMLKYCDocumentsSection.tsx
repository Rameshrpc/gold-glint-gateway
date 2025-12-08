import React from 'react';

interface HTMLKYCDocumentsSectionProps {
  customer: {
    name: string;
    customerId: string;
    photoUrl?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    panCardUrl?: string;
  };
  loanNumber: string;
  paperSize?: 'a4' | 'thermal';
}

export const HTMLKYCDocumentsSection: React.FC<HTMLKYCDocumentsSectionProps> = ({
  customer,
  loanNumber,
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === 'thermal';

  const DocumentCard = ({ label, imageUrl }: { label: string; imageUrl?: string }) => (
    <div className="border p-2 avoid-break">
      <div className="font-semibold text-xs mb-1 text-center">{label}</div>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={label}
          className="w-full"
          style={{ 
            height: isThermal ? '50px' : '80px', 
            objectFit: 'contain',
            backgroundColor: '#f5f5f5'
          }}
        />
      ) : (
        <div 
          className="w-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs"
          style={{ height: isThermal ? '50px' : '80px' }}
        >
          Not Available
        </div>
      )}
    </div>
  );

  return (
    <div className={`print-section ${isThermal ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: "'Catamaran', sans-serif" }}>
      {/* Header */}
      <div className="section-title">
        KYC DOCUMENTS / KYC ஆவணங்கள்
      </div>

      {/* Customer Info */}
      <div className="flex justify-between mb-4 text-xs border-b pb-2">
        <div><span className="font-semibold">Customer / வாடிக்கையாளர்:</span> {customer.name}</div>
        <div><span className="font-semibold">ID:</span> {customer.customerId}</div>
        <div><span className="font-semibold">Loan / கடன்:</span> {loanNumber}</div>
      </div>

      {/* Documents Grid */}
      <div className={`grid ${isThermal ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-4`}>
        <DocumentCard 
          label="Passport Photo / புகைப்படம்" 
          imageUrl={customer.photoUrl} 
        />
        <DocumentCard 
          label="Aadhaar Front / ஆதார் முன்" 
          imageUrl={customer.aadhaarFrontUrl} 
        />
        <DocumentCard 
          label="Aadhaar Back / ஆதார் பின்" 
          imageUrl={customer.aadhaarBackUrl} 
        />
        <DocumentCard 
          label="PAN Card / பான் கார்டு" 
          imageUrl={customer.panCardUrl} 
        />
      </div>

      {/* Verification Box */}
      <div className="border p-3 mt-4">
        <div className="font-semibold mb-2">Verification / சரிபார்ப்பு</div>
        <div className="text-xs mb-4">
          <p>I hereby confirm that the above KYC documents have been verified and belong to the customer named above.</p>
          <p className="mt-1">மேலே உள்ள KYC ஆவணங்கள் சரிபார்க்கப்பட்டு, மேலே குறிப்பிட்ட வாடிக்கையாளருக்கு சொந்தமானவை என்பதை இதன்மூலம் உறுதிப்படுத்துகிறேன்.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="signature-line">
            Verified by / சரிபார்த்தவர்
          </div>
          <div className="signature-line">
            Date / தேதி
          </div>
        </div>
      </div>
    </div>
  );
};
