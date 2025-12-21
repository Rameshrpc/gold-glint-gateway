import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
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
      <Page size={[pageSize.width, pageSize.height]} style={pdfStyles.page}>
        {/* Header */}
        <View style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 }}>
          {logoUrl && (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Image src={logoUrl} style={{ width: 60, height: 60, objectFit: 'contain' }} />
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
            {companyName}
          </Text>
          <View style={pdfStyles.documentTitle}>
            <BilingualLabel
              english="KYC DOCUMENTS"
              tamil="கேஒய்சி ஆவணங்கள்"
              mode={language}
              fontSize={14}
              fontWeight="bold"
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 10 }}>
              Customer: {customer.full_name} ({customer.customer_code})
            </Text>
            <Text style={{ fontSize: 10 }}>
              Loan: {loanNumber}
            </Text>
          </View>
        </View>
        
        {/* KYC Documents Grid */}
        <View style={pdfStyles.kycGrid}>
          {/* Aadhaar Front */}
          <View style={pdfStyles.kycItem}>
            <View style={pdfStyles.kycLabel}>
              <BilingualLabel
                english="Aadhaar Card (Front)"
                tamil="ஆதார் அட்டை (முன்பக்கம்)"
                mode={language}
                fontSize={10}
                fontWeight="bold"
              />
            </View>
            {customer.aadhaar_front_url ? (
              <Image src={customer.aadhaar_front_url} style={pdfStyles.creditCardImage} />
            ) : (
              <View style={[pdfStyles.creditCardImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
                <Text style={{ fontSize: 9, color: '#999' }}>No image available</Text>
              </View>
            )}
          </View>
          
          {/* Aadhaar Back */}
          <View style={pdfStyles.kycItem}>
            <View style={pdfStyles.kycLabel}>
              <BilingualLabel
                english="Aadhaar Card (Back)"
                tamil="ஆதார் அட்டை (பின்புறம்)"
                mode={language}
                fontSize={10}
                fontWeight="bold"
              />
            </View>
            {customer.aadhaar_back_url ? (
              <Image src={customer.aadhaar_back_url} style={pdfStyles.creditCardImage} />
            ) : (
              <View style={[pdfStyles.creditCardImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
                <Text style={{ fontSize: 9, color: '#999' }}>No image available</Text>
              </View>
            )}
          </View>
          
          {/* PAN Card */}
          <View style={pdfStyles.kycItem}>
            <View style={pdfStyles.kycLabel}>
              <BilingualLabel
                english="PAN Card"
                tamil="பான் கார்டு"
                mode={language}
                fontSize={10}
                fontWeight="bold"
              />
            </View>
            {customer.pan_card_url ? (
              <Image src={customer.pan_card_url} style={pdfStyles.creditCardImage} />
            ) : (
              <View style={[pdfStyles.creditCardImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
                <Text style={{ fontSize: 9, color: '#999' }}>No image available</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Verification Note */}
        <View style={{ marginTop: 30, padding: 10, borderWidth: 1, borderColor: '#ccc' }}>
          <BilingualLabel
            english="I certify that the above documents are genuine and belong to me."
            tamil="மேலே உள்ள ஆவணங்கள் உண்மையானவை மற்றும் எனக்கு சொந்தமானவை என்று நான் உறுதியளிக்கிறேன்."
            mode={language}
            fontSize={9}
          />
        </View>
        
        {/* Signature */}
        <View style={{ marginTop: 40, alignItems: 'flex-end' }}>
          <View style={{ width: 200, alignItems: 'center' }}>
            <View style={pdfStyles.signatureLine} />
            <BilingualLabel
              english="Customer Signature"
              tamil="வாடிக்கையாளர் கையொப்பம்"
              mode={language}
              fontSize={8}
              color="#555"
            />
          </View>
        </View>
        
        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
