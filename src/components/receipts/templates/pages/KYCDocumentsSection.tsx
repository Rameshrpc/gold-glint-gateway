import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { bilingualLabel, translations } from '@/lib/translations';

// Credit card size in points (86mm x 54mm = 244pt x 153pt at 72dpi)
const CARD_WIDTH = 200;
const CARD_HEIGHT = 126;

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#EEF2FF',
    padding: 8,
    marginBottom: 15,
    borderRadius: 4,
    color: '#3730A3',
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
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  documentContainer: {
    width: CARD_WIDTH,
    marginBottom: 15,
  },
  documentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#374151',
    textAlign: 'center',
  },
  cardBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    border: '1pt solid #D1D5DB',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  noImageText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  photoContainer: {
    width: 100,
    marginBottom: 15,
  },
  photoBox: {
    width: 100,
    height: 120,
    border: '1pt solid #D1D5DB',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  verificationBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    border: '1pt solid #86EFAC',
  },
  verificationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#166534',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottom: '1pt solid #000',
    marginBottom: 5,
    height: 30,
  },
  signatureLabel: {
    fontSize: 7,
    textAlign: 'center',
    color: '#666',
  },
});

interface KYCDocumentsSectionProps {
  customer: {
    full_name: string;
    customer_code: string;
    photo_url?: string;
    aadhaar_front_url?: string;
    aadhaar_back_url?: string;
    pan_card_url?: string;
  };
  loanNumber: string;
  paperSize?: 'a4' | '80mm';
}

export const KYCDocumentsSection: React.FC<KYCDocumentsSectionProps> = ({
  customer,
  loanNumber,
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === '80mm';

  const DocumentCard = ({ 
    label, 
    imageUrl 
  }: { 
    label: string; 
    imageUrl?: string;
  }) => (
    <View style={[styles.documentContainer, isThermal && { width: '100%' }]}>
      <Text style={styles.documentLabel}>{label}</Text>
      <View style={[styles.cardBox, isThermal && { width: '100%', height: 100 }]}>
        {imageUrl ? (
          <Image src={imageUrl} style={styles.cardImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>{translations.noImageAvailable.en}</Text>
            <Text style={styles.noImageText}>{translations.noImageAvailable.ta}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.section, isThermal && { padding: 10 }]}>
      {/* Title */}
      <Text style={styles.title}>{bilingualLabel('customerKycDocuments')}</Text>

      {/* Customer Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('customerName')}</Text>
          <Text style={styles.value}>{customer.full_name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('customerId')}</Text>
          <Text style={styles.value}>{customer.customer_code}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('loanNumber')}</Text>
          <Text style={styles.value}>{loanNumber}</Text>
        </View>
      </View>

      {/* Documents Grid */}
      <View style={styles.documentsGrid}>
        {/* Passport Photo */}
        <View style={[styles.photoContainer, isThermal && { width: '100%', alignItems: 'center' }]}>
          <Text style={styles.documentLabel}>{bilingualLabel('passportPhoto')}</Text>
          <View style={styles.photoBox}>
            {customer.photo_url ? (
              <Image src={customer.photo_url} style={styles.photoImage} />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>{translations.noImageAvailable.en}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Aadhaar Front */}
        <DocumentCard 
          label={bilingualLabel('aadhaarFront')} 
          imageUrl={customer.aadhaar_front_url} 
        />

        {/* Aadhaar Back */}
        <DocumentCard 
          label={bilingualLabel('aadhaarBack')} 
          imageUrl={customer.aadhaar_back_url} 
        />

        {/* PAN Card */}
        <DocumentCard 
          label={bilingualLabel('panCard')} 
          imageUrl={customer.pan_card_url} 
        />
      </View>

      {/* Verification Section */}
      <View style={styles.verificationBox}>
        <Text style={styles.verificationTitle}>{bilingualLabel('verifiedBy')}</Text>
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{bilingualLabel('verifiedBy')}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{bilingualLabel('date')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default KYCDocumentsSection;
