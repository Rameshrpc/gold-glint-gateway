import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { bilingualLabel, translations } from '@/lib/translations';
import '@/lib/fonts';

const styles = StyleSheet.create({
  section: {
    fontFamily: 'Catamaran',
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    marginBottom: 5,
    borderRadius: 4,
    color: '#374151',
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  termsList: {
    marginBottom: 20,
  },
  termItem: {
    marginBottom: 12,
    paddingLeft: 10,
  },
  termNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  termText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#374151',
    textAlign: 'justify',
  },
  termTextTamil: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'justify',
  },
  acknowledgmentBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    border: '1pt solid #86EFAC',
  },
  acknowledgmentText: {
    fontSize: 9,
    lineHeight: 1.5,
    textAlign: 'center',
    color: '#166534',
  },
  acknowledgmentTextTamil: {
    fontSize: 8,
    lineHeight: 1.4,
    textAlign: 'center',
    color: '#15803D',
    fontStyle: 'italic',
    marginTop: 4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottom: '1pt solid #000',
    marginBottom: 5,
    height: 40,
  },
  signatureLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  dateBox: {
    width: '30%',
    alignItems: 'center',
  },
  dateLine: {
    width: '100%',
    borderBottom: '1pt solid #000',
    marginBottom: 5,
    height: 20,
  },
  footer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 4,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#92400E',
    textAlign: 'center',
  },
});

interface TermsConditionsSectionProps {
  customTerms?: string[];
  loanNumber: string;
  paperSize?: 'a4' | '80mm';
}

// Default Tamil Nadu Pawnbrokers Act compliant terms
const defaultTerms = [
  { en: translations.term1.en, ta: translations.term1.ta },
  { en: translations.term2.en, ta: translations.term2.ta },
  { en: translations.term3.en, ta: translations.term3.ta },
  { en: translations.term4.en, ta: translations.term4.ta },
  { en: translations.term5.en, ta: translations.term5.ta },
  { en: translations.term6.en, ta: translations.term6.ta },
  { en: translations.term7.en, ta: translations.term7.ta },
  { en: translations.term8.en, ta: translations.term8.ta },
];

export const TermsConditionsSection: React.FC<TermsConditionsSectionProps> = ({
  customTerms,
  loanNumber,
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === '80mm';
  const terms = customTerms && customTerms.length > 0 
    ? customTerms.map(t => ({ en: t, ta: '' }))
    : defaultTerms;

  return (
    <View style={[styles.section, isThermal && { padding: 10 }]}>
      {/* Title */}
      <Text style={styles.title}>{bilingualLabel('termsAndConditions')}</Text>
      <Text style={styles.subtitle}>{translations.asPerTNPawnbrokersAct.en} / {translations.asPerTNPawnbrokersAct.ta}</Text>

      {/* Terms List */}
      <View style={styles.termsList}>
        {terms.map((term, index) => (
          <View key={index} style={styles.termItem}>
            <Text style={styles.termNumber}>{index + 1}.</Text>
            <Text style={styles.termText}>{term.en}</Text>
            {term.ta && <Text style={styles.termTextTamil}>{term.ta}</Text>}
          </View>
        ))}
      </View>

      {/* Acknowledgment */}
      <View style={styles.acknowledgmentBox}>
        <Text style={styles.acknowledgmentText}>{translations.iHaveReadTerms.en}</Text>
        <Text style={styles.acknowledgmentTextTamil}>{translations.iHaveReadTerms.ta}</Text>
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{bilingualLabel('customerSignature')}</Text>
        </View>
        <View style={styles.dateBox}>
          <View style={styles.dateLine} />
          <Text style={styles.signatureLabel}>{bilingualLabel('date')}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{translations.computerGenerated.en}</Text>
        <Text style={styles.footerText}>{translations.computerGenerated.ta}</Text>
        <Text style={[styles.footerText, { marginTop: 4 }]}>{bilingualLabel('loanNumber')}: {loanNumber}</Text>
      </View>
    </View>
  );
};

export default TermsConditionsSection;
