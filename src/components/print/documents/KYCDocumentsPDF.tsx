import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES } from '../shared/PDFStyles';
import { BilingualLabel, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';

// Ensure fonts are loaded
const _fonts = fontsRegistered;

interface Customer {
  customer_code: string;
  full_name: string;
  aadhaar_front_url?: string | null;
  aadhaar_back_url?: string | null;
  pan_card_url?: string | null;
}

interface KYCDocumentsPDFProps {
  customer: Customer;
  loanNumber: string;
  companyName: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  logoUrl?: string | null;
}

// Compact styles to fit all 3 images on one page
const kycStyles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#000',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  documentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 4,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    textTransform: 'uppercase',
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoText: {
    fontSize: 9,
  },
  // Grid layout for images - 2 columns
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  imageItem: {
    alignItems: 'center',
    width: '45%',
  },
  imageItemFull: {
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  imageLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  // Portrait image dimensions to match vertical document photos
  cardImage: {
    width: 160,
    height: 230,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#000',
  },
  cardImageSmall: {
    width: 140,
    height: 200,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#000',
  },
  noImagePlaceholder: {
    width: 140,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  noImageText: {
    fontSize: 8,
    color: '#999',
  },
  verificationNote: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  signatureSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  signatureBox: {
    width: 180,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 4,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    fontSize: 7,
    color: '#999',
  },
});

export function KYCDocumentsPDF({
  customer,
  loanNumber,
  companyName,
  language = 'bilingual',
  paperSize = 'A4',
  logoUrl,
}: KYCDocumentsPDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={kycStyles.page}>
        {/* Header */}
        <View style={kycStyles.header}>
          {logoUrl && (
            <View style={kycStyles.logoContainer}>
              <Image src={logoUrl} style={kycStyles.logo} />
            </View>
          )}
          <Text style={kycStyles.companyName}>{companyName}</Text>
          
          <View style={kycStyles.documentTitle}>
            <BilingualLabel
              english="KYC DOCUMENTS"
              tamil="கேஒய்சி ஆவணங்கள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={kycStyles.customerInfo}>
            <Text style={kycStyles.infoText}>
              Customer: {customer.full_name} ({customer.customer_code})
            </Text>
            <Text style={kycStyles.infoText}>
              Loan: {loanNumber}
            </Text>
          </View>
        </View>
        
        {/* KYC Documents Grid - All 3 on one page */}
        <View style={kycStyles.imageGrid}>
          {/* Aadhaar Front */}
          <View style={kycStyles.imageItem}>
            <View style={kycStyles.imageLabel}>
              <BilingualLabel
                english="Aadhaar Card (Front)"
                tamil="ஆதார் அட்டை (முன்பக்கம்)"
                mode={language}
                fontSize={9}
                fontWeight="bold"
              />
            </View>
            {customer.aadhaar_front_url ? (
              <Image src={customer.aadhaar_front_url} style={kycStyles.cardImageSmall} />
            ) : (
              <View style={kycStyles.noImagePlaceholder}>
                <Text style={kycStyles.noImageText}>No image available</Text>
              </View>
            )}
          </View>
          
          {/* Aadhaar Back */}
          <View style={kycStyles.imageItem}>
            <View style={kycStyles.imageLabel}>
              <BilingualLabel
                english="Aadhaar Card (Back)"
                tamil="ஆதார் அட்டை (பின்புறம்)"
                mode={language}
                fontSize={9}
                fontWeight="bold"
              />
            </View>
            {customer.aadhaar_back_url ? (
              <Image src={customer.aadhaar_back_url} style={kycStyles.cardImageSmall} />
            ) : (
              <View style={kycStyles.noImagePlaceholder}>
                <Text style={kycStyles.noImageText}>No image available</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* PAN Card - Centered below */}
        <View style={kycStyles.imageItemFull}>
          <View style={kycStyles.imageLabel}>
            <BilingualLabel
              english="PAN Card"
              tamil="பான் கார்டு"
              mode={language}
              fontSize={9}
              fontWeight="bold"
            />
          </View>
          {customer.pan_card_url ? (
            <Image src={customer.pan_card_url} style={kycStyles.cardImage} />
          ) : (
            <View style={[kycStyles.noImagePlaceholder, { width: 160, height: 230 }]}>
              <Text style={kycStyles.noImageText}>No image available</Text>
            </View>
          )}
        </View>
        
        {/* Verification Note */}
        <View style={kycStyles.verificationNote}>
          <BilingualLabel
            english="I certify that the above documents are genuine and belong to me."
            tamil="மேலே உள்ள ஆவணங்கள் உண்மையானவை மற்றும் எனக்கு சொந்தமானவை என்று நான் உறுதியளிக்கிறேன்."
            mode={language}
            fontSize={8}
          />
        </View>
        
        {/* Signature */}
        <View style={kycStyles.signatureSection}>
          <View style={kycStyles.signatureBox}>
            <View style={kycStyles.signatureLine} />
            <BilingualLabel
              english="Customer Signature"
              tamil="வாடிக்கையாளர் கையொப்பம்"
              mode={language}
              fontSize={7}
              color="#555"
            />
          </View>
        </View>
        
        <Text style={kycStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
