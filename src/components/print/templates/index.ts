// Main templates index - exports all 24+ bilingual templates
export * from './core';
export * from './loans';
export * from './interest';
export * from './redemption';
export * from './auction';

// Template registry for Print Manager
export const TEMPLATE_REGISTRY = {
  loans: [
    { id: 'loan-standard-receipt', name: 'Standard Receipt (Customer Copy)', nameTamil: 'நிலையான ரசீது (வாடிக்கையாளர் நகல்)' },
    { id: 'loan-detailed-statement', name: 'Detailed Statement (Office Copy)', nameTamil: 'விரிவான அறிக்கை (அலுவலக நகல்)' },
    { id: 'loan-disbursement-confirmation', name: 'Disbursement Confirmation', nameTamil: 'வழங்கல் உறுதிப்படுத்தல்' },
    { id: 'gold-pledge-certificate', name: 'Gold Pledge Certificate', nameTamil: 'தங்க அடமான சான்றிதழ்' },
    { id: 'loan-mini-receipt', name: 'Mini Receipt (A6 Portable)', nameTamil: 'சிறிய ரசீது (A6)' },
    { id: 'multiloan-summary', name: 'Multi-Loan Summary', nameTamil: 'பல கடன் சுருக்கம்' },
  ],
  interest: [
    { id: 'interest-monthly-statement', name: 'Monthly Interest Statement', nameTamil: 'மாதாந்திர வட்டி அறிக்கை' },
    { id: 'interest-payment-receipt', name: 'Interest Payment Receipt', nameTamil: 'வட்டி செலுத்துதல் ரசீது' },
    { id: 'interest-quarterly-summary', name: 'Quarterly Summary', nameTamil: 'காலாண்டு சுருக்கம்' },
    { id: 'advance-interest-certificate', name: 'Advance Interest Certificate', nameTamil: 'முன்கூட்டி வட்டி சான்றிதழ்' },
    { id: 'interest-waiver-notice', name: 'Interest Waiver Notice', nameTamil: 'வட்டி விலக்கு அறிவிப்பு' },
    { id: 'interest-annual-ledger', name: 'Annual Interest Ledger', nameTamil: 'வருடாந்திர வட்டி பேரேடு' },
  ],
  redemption: [
    { id: 'redemption-request-form', name: 'Redemption Request Form', nameTamil: 'மீட்பு கோரிக்கை படிவம்' },
    { id: 'pre-redemption-statement', name: 'Pre-Redemption Statement', nameTamil: 'முன்-மீட்பு அறிக்கை' },
    { id: 'redemption-receipt', name: 'Redemption Receipt', nameTamil: 'மீட்பு ரசீது' },
    { id: 'partial-redemption-certificate', name: 'Partial Redemption Certificate', nameTamil: 'பகுதி மீட்பு சான்றிதழ்' },
    { id: 'redemption-ledger', name: 'Redemption Ledger', nameTamil: 'மீட்பு பேரேடு' },
    { id: 'final-settlement-statement', name: 'Final Settlement Statement', nameTamil: 'இறுதி தீர்வு அறிக்கை' },
  ],
  auction: [
    { id: 'auction-notice', name: 'Auction Notice', nameTamil: 'ஏல அறிவிப்பு' },
    { id: 'pre-auction-valuation', name: 'Pre-Auction Valuation', nameTamil: 'முன்-ஏல மதிப்பீடு' },
    { id: 'auction-catalog', name: 'Auction Catalog', nameTamil: 'ஏல பட்டியல்' },
    { id: 'auction-result-certificate', name: 'Auction Result Certificate', nameTamil: 'ஏல முடிவு சான்றிதழ்' },
    { id: 'post-auction-settlement', name: 'Post-Auction Settlement', nameTamil: 'ஏலத்திற்குப் பிந்தைய தீர்வு' },
    { id: 'auction-clearance-certificate', name: 'Auction Clearance Certificate', nameTamil: 'ஏல அனுமதி சான்றிதழ்' },
  ],
};