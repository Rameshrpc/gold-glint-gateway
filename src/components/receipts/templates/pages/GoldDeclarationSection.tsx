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
    backgroundColor: '#FEF2F2',
    padding: 8,
    marginBottom: 15,
    borderRadius: 4,
    color: '#991B1B',
  },
  customerInfo: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  customerText: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  declarationHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 4,
    color: '#92400E',
  },
  declarationList: {
    marginBottom: 15,
  },
  declarationItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 10,
  },
  declarationNumber: {
    width: 25,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  declarationTextContainer: {
    flex: 1,
  },
  declarationText: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  declarationTextTamil: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#666',
  },
  goldSummary: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    border: '1pt solid #FCD34D',
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400E',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  warningBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    border: '1pt solid #FECACA',
  },
  warningText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: '#991B1B',
    textAlign: 'center',
  },
  warningTextTamil: {
    fontSize: 7,
    lineHeight: 1.4,
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 4,
  },
  placeDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
  },
  placeDateItem: {
    width: '45%',
  },
  placeDateLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  placeDateLine: {
    borderBottom: '1pt solid #000',
    height: 20,
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
  thumbBox: {
    marginTop: 10,
    alignItems: 'center',
  },
  thumbSpace: {
    width: 60,
    height: 60,
    border: '1pt solid #000',
    marginBottom: 5,
  },
  thumbLabel: {
    fontSize: 7,
    textAlign: 'center',
    color: '#666',
  },
});

interface GoldDeclarationSectionProps {
  customer: {
    full_name: string;
    father_name?: string;
    address?: string;
    customer_code: string;
  };
  goldSummary: {
    totalItems: number;
    totalWeight: number;
    totalValue: number;
  };
  loanNumber: string;
  loanDate: string;
  place?: string;
  paperSize?: 'a4' | '80mm';
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const declarationPoints = [
  { key: 'goldDeclaration1', en: translations.goldDeclaration1.en, ta: translations.goldDeclaration1.ta },
  { key: 'goldDeclaration2', en: translations.goldDeclaration2.en, ta: translations.goldDeclaration2.ta },
  { key: 'goldDeclaration3', en: translations.goldDeclaration3.en, ta: translations.goldDeclaration3.ta },
  { key: 'goldDeclaration4', en: translations.goldDeclaration4.en, ta: translations.goldDeclaration4.ta },
  { key: 'goldDeclaration5', en: translations.goldDeclaration5.en, ta: translations.goldDeclaration5.ta },
];

export const GoldDeclarationSection: React.FC<GoldDeclarationSectionProps> = ({
  customer,
  goldSummary,
  loanNumber,
  loanDate,
  place,
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === '80mm';

  return (
    <View style={[styles.section, isThermal && { padding: 10 }]}>
      {/* Title */}
      <Text style={styles.title}>{bilingualLabel('declarationOfGold')}</Text>

      {/* Customer Information */}
      <View style={styles.customerInfo}>
        <Text style={styles.customerText}>
          I, <Text style={styles.boldText}>{customer.full_name}</Text>
          {customer.father_name && <Text>, {translations.sonOf.en} {customer.father_name}</Text>}
          , {translations.residingAt.en}:
        </Text>
        <Text style={[styles.customerText, styles.boldText]}>
          {customer.address || '___________________________'}
        </Text>
        <Text style={[styles.customerText, { fontSize: 8, color: '#666' }]}>
          ({translations.customerId.en}: {customer.customer_code})
        </Text>
      </View>

      {/* Declaration Header */}
      <Text style={styles.declarationHeader}>{bilingualLabel('herebyDeclare')}</Text>

      {/* Declaration Points */}
      <View style={styles.declarationList}>
        {declarationPoints.map((point, index) => (
          <View key={point.key} style={styles.declarationItem}>
            <Text style={styles.declarationNumber}>{index + 1}.</Text>
            <View style={styles.declarationTextContainer}>
              <Text style={styles.declarationText}>{point.en}</Text>
              <Text style={styles.declarationTextTamil}>{point.ta}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Gold Summary */}
      <View style={styles.goldSummary}>
        <Text style={styles.summaryTitle}>{bilingualLabel('detailsOfPledgedGold')}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('loanNumber')}</Text>
          <Text style={styles.summaryValue}>{loanNumber}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('totalItems')}</Text>
          <Text style={styles.summaryValue}>{goldSummary.totalItems}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('totalWeight')}</Text>
          <Text style={styles.summaryValue}>{goldSummary.totalWeight.toFixed(2)} {translations.grams.en}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('totalValue')}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(goldSummary.totalValue)}</Text>
        </View>
      </View>

      {/* Warning */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>{translations.goldDeclarationWarning.en}</Text>
        <Text style={styles.warningTextTamil}>{translations.goldDeclarationWarning.ta}</Text>
      </View>

      {/* Place and Date */}
      <View style={styles.placeDate}>
        <View style={styles.placeDateItem}>
          <Text style={styles.placeDateLabel}>{bilingualLabel('place')}</Text>
          <View style={styles.placeDateLine}>
            <Text style={{ fontSize: 9, paddingTop: 4 }}>{place || ''}</Text>
          </View>
        </View>
        <View style={styles.placeDateItem}>
          <Text style={styles.placeDateLabel}>{bilingualLabel('date')}</Text>
          <View style={styles.placeDateLine}>
            <Text style={{ fontSize: 9, paddingTop: 4 }}>{formatDate(loanDate)}</Text>
          </View>
        </View>
      </View>

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{bilingualLabel('customerSignature')}</Text>
          <Text style={[styles.signatureLabel, { fontSize: 7 }]}>{translations.withThumbImpression.en}</Text>
          <View style={styles.thumbBox}>
            <View style={styles.thumbSpace} />
            <Text style={styles.thumbLabel}>{bilingualLabel('thumbImpression')}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{bilingualLabel('witnessSignature')}</Text>
        </View>
      </View>
    </View>
  );
};

export default GoldDeclarationSection;
