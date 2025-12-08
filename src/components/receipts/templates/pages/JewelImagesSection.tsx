import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { bilingualLabel, translations } from '@/lib/translations';

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    marginBottom: 15,
    borderRadius: 4,
    color: '#92400E',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    color: '#666',
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  imageContainer: {
    width: '48%',
    marginBottom: 10,
  },
  imageBox: {
    width: '100%',
    height: 150,
    border: '1pt solid #D1D5DB',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jewelImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  noImage: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  imageCaption: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  timestampOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  timestampText: {
    fontSize: 6,
    color: 'white',
    textAlign: 'center',
  },
  appraiserSheetContainer: {
    marginTop: 15,
    border: '1pt solid #D1D5DB',
    borderRadius: 4,
    padding: 10,
  },
  appraiserSheetTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  appraiserSheetImage: {
    width: '100%',
    height: 250,
    objectFit: 'contain',
    backgroundColor: '#F9FAFB',
  },
  appraiserInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
  },
  summaryBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 4,
    border: '1pt solid #FCD34D',
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400E',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});

interface GoldItem {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
  image_url?: string;
}

interface JewelImagesSectionProps {
  loanNumber: string;
  loanDate: string;
  goldItems: GoldItem[];
  timestamp?: string;
  appraiserName?: string;
  appraiserSheetUrl?: string;
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

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) {
    return new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  return new Date(timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const JewelImagesSection: React.FC<JewelImagesSectionProps> = ({
  loanNumber,
  loanDate,
  goldItems,
  timestamp,
  appraiserName,
  appraiserSheetUrl,
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === '80mm';
  const totalWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);

  return (
    <View style={[styles.section, isThermal && { padding: 10 }]}>
      {/* Title */}
      <Text style={styles.title}>{bilingualLabel('pledgedGoldOrnaments')}</Text>

      {/* Loan Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('loanNumber')}</Text>
          <Text style={styles.value}>{loanNumber}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('loanDate')}</Text>
          <Text style={styles.value}>{formatDate(loanDate)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('captured')}</Text>
          <Text style={styles.value}>{formatTimestamp(timestamp)}</Text>
        </View>
      </View>

      {/* Gold Items with Images */}
      <View style={styles.imagesGrid}>
        {goldItems.map((item, index) => (
          <View key={index} style={[styles.imageContainer, isThermal && { width: '100%' }]}>
            <View style={styles.imageBox}>
              {item.image_url ? (
                <Image src={item.image_url} style={styles.jewelImage} />
              ) : (
                <Text style={styles.noImage}>{translations.noImageAvailable.en}</Text>
              )}
            </View>
            <Text style={styles.imageCaption}>
              {index + 1}. {item.item_type} - {item.gross_weight_grams}g {item.purity}
            </Text>
          </View>
        ))}
      </View>

      {/* Appraiser Sheet */}
      {appraiserSheetUrl && (
        <View style={styles.appraiserSheetContainer}>
          <Text style={styles.appraiserSheetTitle}>{bilingualLabel('appraiserSheet')}</Text>
          <Image src={appraiserSheetUrl} style={styles.appraiserSheetImage} />
          <View style={styles.appraiserInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>{bilingualLabel('captureTime')}</Text>
              <Text style={styles.value}>{formatTimestamp(timestamp)}</Text>
            </View>
            {appraiserName && (
              <View style={styles.infoItem}>
                <Text style={styles.label}>{bilingualLabel('appraisedBy')}</Text>
                <Text style={styles.value}>{appraiserName}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>{bilingualLabel('detailsOfPledgedGold')}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('totalItems')}</Text>
          <Text style={styles.summaryValue}>{goldItems.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('totalWeight')}</Text>
          <Text style={styles.summaryValue}>{totalWeight.toFixed(2)} {translations.grams.en}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('totalValue')}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
        </View>
        {appraiserName && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{bilingualLabel('appraiser')}</Text>
            <Text style={styles.summaryValue}>{appraiserName}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default JewelImagesSection;
