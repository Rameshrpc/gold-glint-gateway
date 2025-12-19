import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from './PDFStyles';
import { BilingualLabel, LanguageMode } from '@/lib/bilingual-utils';

interface SignatureLabel {
  english: string;
  tamil: string;
}

interface PDFFooterProps {
  footerEnglish?: string | null;
  footerTamil?: string | null;
  language?: LanguageMode;
  showSignatures?: boolean;
  signatureLabels?: SignatureLabel[];
}

const DEFAULT_SIGNATURES: SignatureLabel[] = [
  { english: 'Customer Signature', tamil: 'வாடிக்கையாளர் கையொப்பம்' },
  { english: 'Redemption Signature', tamil: 'மீட்பு கையொப்பம்' },
  { english: 'Authorized Signature', tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
];

export function PDFSignatures({
  language = 'bilingual',
  signatureLabels = DEFAULT_SIGNATURES,
}: {
  language?: LanguageMode;
  signatureLabels?: SignatureLabel[];
}) {
  return (
    <View style={pdfStyles.signatureSection}>
      {signatureLabels.map((sig, index) => (
        <View key={index} style={pdfStyles.signatureBox}>
          <View style={pdfStyles.signatureLine} />
          <BilingualLabel
            english={sig.english}
            tamil={sig.tamil}
            mode={language}
            fontSize={8}
            color="#555"
          />
        </View>
      ))}
    </View>
  );
}

export function PDFFooter({
  footerEnglish,
  footerTamil,
  language = 'bilingual',
  showSignatures = true,
  signatureLabels,
}: PDFFooterProps) {
  return (
    <>
      {showSignatures && (
        <PDFSignatures language={language} signatureLabels={signatureLabels} />
      )}
      
      {(footerEnglish || footerTamil) && (
        <View style={pdfStyles.footer}>
          <View style={{ alignItems: 'center' }}>
            <BilingualLabel
              english={footerEnglish || ''}
              tamil={footerTamil || ''}
              mode={language}
              fontSize={8}
              color="#555"
            />
          </View>
        </View>
      )}
    </>
  );
}
