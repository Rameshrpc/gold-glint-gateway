import React from 'react';

interface TermItem {
  en: string;
  ta: string;
}

interface HTMLTermsConditionsSectionProps {
  customTerms?: TermItem[];
  paperSize?: 'a4' | 'thermal';
}

const defaultTerms: TermItem[] = [
  {
    en: 'The pledged gold ornaments will be stored safely in our vault under proper security.',
    ta: 'அடமானம் வைக்கப்பட்ட தங்க நகைகள் உரிய பாதுகாப்பில் எங்கள் பெட்டகத்தில் பத்திரமாக வைக்கப்படும்.',
  },
  {
    en: 'Interest will be calculated on a monthly basis from the date of loan disbursement.',
    ta: 'கடன் வழங்கப்பட்ட தேதியிலிருந்து மாதாந்திர அடிப்படையில் வட்டி கணக்கிடப்படும்.',
  },
  {
    en: 'The loan must be repaid within the tenure period along with all accrued interest.',
    ta: 'கடனை திட்டமிட்ட காலத்திற்குள் அனைத்து திரட்டப்பட்ட வட்டியுடன் திருப்பிச் செலுத்த வேண்டும்.',
  },
  {
    en: 'Failure to repay may result in the pledged gold being auctioned as per regulations.',
    ta: 'திருப்பிச் செலுத்தத் தவறினால், அடமானம் வைக்கப்பட்ட தங்கம் விதிகளின்படி ஏலம் விடப்படலாம்.',
  },
  {
    en: 'The customer must produce the original receipt for redemption of the pledged gold.',
    ta: 'அடமானம் வைக்கப்பட்ட தங்கத்தை மீட்க வாடிக்கையாளர் அசல் ரசீதை சமர்ப்பிக்க வேண்டும்.',
  },
  {
    en: 'Any changes to customer contact details must be immediately informed to the office.',
    ta: 'வாடிக்கையாளர் தொடர்பு விவரங்களில் ஏதேனும் மாற்றங்கள் இருந்தால் உடனடியாக அலுவலகத்திற்கு தெரிவிக்க வேண்டும்.',
  },
  {
    en: 'The company is not responsible for any natural calamities affecting the pledged items.',
    ta: 'அடமானம் வைக்கப்பட்ட பொருட்களை பாதிக்கும் இயற்கை பேரழிவுகளுக்கு நிறுவனம் பொறுப்பல்ல.',
  },
  {
    en: 'Partial redemption and top-up loans are subject to company policies and approval.',
    ta: 'பகுதி மீட்பு மற்றும் டாப்-அப் கடன்கள் நிறுவன கொள்கைகள் மற்றும் ஒப்புதலுக்கு உட்பட்டவை.',
  },
  {
    en: 'The customer agrees to all terms and conditions by signing this document.',
    ta: 'இந்த ஆவணத்தில் கையொப்பமிடுவதன் மூலம் வாடிக்கையாளர் அனைத்து விதிமுறைகளுக்கும் ஒப்புக்கொள்கிறார்.',
  },
  {
    en: 'All disputes are subject to the jurisdiction of local courts.',
    ta: 'அனைத்து தகராறுகளும் உள்ளூர் நீதிமன்றங்களின் அதிகார வரம்பிற்கு உட்பட்டவை.',
  },
];

export const HTMLTermsConditionsSection: React.FC<HTMLTermsConditionsSectionProps> = ({
  customTerms,
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === 'thermal';
  const terms = customTerms && customTerms.length > 0 ? customTerms : defaultTerms;

  return (
    <div className={`print-section ${isThermal ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: "'Catamaran', sans-serif" }}>
      {/* Header */}
      <div className="section-title">
        TERMS & CONDITIONS / விதிமுறைகள் மற்றும் நிபந்தனைகள்
      </div>

      {/* Terms List */}
      <div className="space-y-2 mb-4">
        {terms.map((term, index) => (
          <div key={index} className="text-xs border-l-2 border-gray-400 pl-2">
            <div>{index + 1}. {term.en}</div>
            <div className="text-gray-600">{term.ta}</div>
          </div>
        ))}
      </div>

      {/* Acknowledgment */}
      <div className="border p-3 mt-4">
        <div className="font-semibold mb-2">Acknowledgment / ஒப்புகை</div>
        <div className="text-xs mb-4">
          <p>I have read and understood all the terms and conditions mentioned above and agree to abide by them.</p>
          <p className="mt-1 text-gray-600">மேலே குறிப்பிடப்பட்டுள்ள அனைத்து விதிமுறைகள் மற்றும் நிபந்தனைகளையும் படித்து புரிந்துகொண்டேன், அவற்றைக் கடைபிடிக்க ஒப்புக்கொள்கிறேன்.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="signature-line">
            Customer Signature / வாடிக்கையாளர் கையொப்பம்
          </div>
          <div className="signature-line">
            Date / தேதி
          </div>
        </div>
      </div>
    </div>
  );
};
