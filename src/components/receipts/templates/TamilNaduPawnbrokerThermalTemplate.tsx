import React from 'react';
import { Document, Page, StyleSheet, View, Text } from '@react-pdf/renderer';
import { ReceiptSection } from './pages/ReceiptSection';
import { JewelImagesSection } from './pages/JewelImagesSection';
import { KYCDocumentsSection } from './pages/KYCDocumentsSection';
import { GoldDeclarationSection } from './pages/GoldDeclarationSection';
import { TermsConditionsSection } from './pages/TermsConditionsSection';
import { bilingualLabel } from '@/lib/translations';

// 80mm thermal paper = 226.77pt (80mm * 2.8346pt/mm)
const THERMAL_WIDTH = 227;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    width: THERMAL_WIDTH,
  },
  sectionDivider: {
    borderTop: '1pt dashed #999',
    marginVertical: 15,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#F3F4F6',
    padding: 4,
    marginBottom: 8,
    borderRadius: 2,
  },
  footer: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: '1pt solid #000',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
  },
});

export interface TamilNaduPawnbrokerThermalTemplateProps {
  company: {
    name: string;
    nameTamil?: string;
    address?: string;
    phone?: string;
    license_number?: string;
  };
  loan: {
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    interest_rate: number;
    tenure_days: number;
    maturity_date: string;
    advance_interest?: number;
    processing_fee?: number;
    document_charges?: number;
    net_disbursed: number;
  };
  customer: {
    full_name: string;
    father_name?: string;
    customer_code: string;
    phone?: string;
    address?: string;
    photo_url?: string;
    aadhaar_front_url?: string;
    aadhaar_back_url?: string;
    pan_card_url?: string;
  };
  goldItems: Array<{
    item_type: string;
    description?: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity: string;
    appraised_value: number;
    image_url?: string;
  }>;
  rebateSchedule?: Array<{
    dayRange: string;
    rebateAmount: number;
  }>;
  jewelPhotos?: {
    timestamp?: string;
    appraiser_name?: string;
    appraiser_sheet_url?: string;
  };
  customTerms?: string[];
  logoUrl?: string | null;
  place?: string;
}

export const TamilNaduPawnbrokerThermalTemplate: React.FC<TamilNaduPawnbrokerThermalTemplateProps> = ({
  company,
  loan,
  customer,
  goldItems,
  rebateSchedule,
  jewelPhotos,
  customTerms,
  logoUrl,
  place,
}) => {
  const goldSummary = {
    totalItems: goldItems.length,
    totalWeight: goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0),
    totalValue: goldItems.reduce((sum, item) => sum + item.appraised_value, 0),
  };

  return (
    <Document>
      <Page size={{ width: THERMAL_WIDTH, height: 'auto' }} style={styles.page}>
        {/* Section 1: Customer Copy */}
        <ReceiptSection
          copyType="customer"
          company={company}
          loan={loan}
          customer={customer}
          goldItems={goldItems}
          rebateSchedule={rebateSchedule}
          logoUrl={logoUrl}
          paperSize="80mm"
        />

        {/* Divider */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>{bilingualLabel('officeCopy')}</Text>
        </View>

        {/* Section 2: Office Copy */}
        <ReceiptSection
          copyType="office"
          company={company}
          loan={loan}
          customer={customer}
          goldItems={goldItems}
          rebateSchedule={rebateSchedule}
          logoUrl={logoUrl}
          paperSize="80mm"
        />

        {/* Divider */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>{bilingualLabel('jewelImages')}</Text>
        </View>

        {/* Section 3: Jewel Images */}
        <JewelImagesSection
          loanNumber={loan.loan_number}
          loanDate={loan.loan_date}
          goldItems={goldItems}
          timestamp={jewelPhotos?.timestamp}
          appraiserName={jewelPhotos?.appraiser_name}
          appraiserSheetUrl={jewelPhotos?.appraiser_sheet_url}
          paperSize="80mm"
        />

        {/* Divider */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>{bilingualLabel('kycDocuments')}</Text>
        </View>

        {/* Section 4: KYC Documents */}
        <KYCDocumentsSection
          customer={customer}
          loanNumber={loan.loan_number}
          paperSize="80mm"
        />

        {/* Divider */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>{bilingualLabel('declarationOfGold')}</Text>
        </View>

        {/* Section 5: Gold Declaration */}
        <GoldDeclarationSection
          customer={customer}
          goldSummary={goldSummary}
          loanNumber={loan.loan_number}
          loanDate={loan.loan_date}
          place={place}
          paperSize="80mm"
        />

        {/* Divider */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>{bilingualLabel('termsAndConditions')}</Text>
        </View>

        {/* Section 6: Terms & Conditions */}
        <TermsConditionsSection
          customTerms={customTerms}
          loanNumber={loan.loan_number}
          paperSize="80mm"
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>*** END OF RECEIPT ***</Text>
          <Text style={styles.footerText}>*** ரசீதின் முடிவு ***</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TamilNaduPawnbrokerThermalTemplate;
