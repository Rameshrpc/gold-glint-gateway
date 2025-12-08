import React from 'react';
import { Document, Page, StyleSheet, View, Text } from '@react-pdf/renderer';
import { ReceiptSection } from './pages/ReceiptSection';
import { JewelImagesSection } from './pages/JewelImagesSection';
import { KYCDocumentsSection } from './pages/KYCDocumentsSection';
import { GoldDeclarationSection } from './pages/GoldDeclarationSection';
import { TermsConditionsSection } from './pages/TermsConditionsSection';
import { bilingualLabel } from '@/lib/translations';
import '@/lib/fonts';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666',
  },
});

export interface TamilNaduPawnbrokerA4TemplateProps {
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

export const TamilNaduPawnbrokerA4Template: React.FC<TamilNaduPawnbrokerA4TemplateProps> = ({
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
      {/* Page 1: Customer Copy */}
      <Page size="A4" style={styles.page}>
        <ReceiptSection
          copyType="customer"
          company={company}
          loan={loan}
          customer={customer}
          goldItems={goldItems}
          rebateSchedule={rebateSchedule}
          logoUrl={logoUrl}
          paperSize="a4"
        />
        <Text style={styles.pageNumber}>{bilingualLabel('pageOf')} 1 / 6</Text>
      </Page>

      {/* Page 2: Office Copy */}
      <Page size="A4" style={styles.page}>
        <ReceiptSection
          copyType="office"
          company={company}
          loan={loan}
          customer={customer}
          goldItems={goldItems}
          rebateSchedule={rebateSchedule}
          logoUrl={logoUrl}
          paperSize="a4"
        />
        <Text style={styles.pageNumber}>{bilingualLabel('pageOf')} 2 / 6</Text>
      </Page>

      {/* Page 3: Jewel Images */}
      <Page size="A4" style={styles.page}>
        <JewelImagesSection
          loanNumber={loan.loan_number}
          loanDate={loan.loan_date}
          goldItems={goldItems}
          timestamp={jewelPhotos?.timestamp}
          appraiserName={jewelPhotos?.appraiser_name}
          appraiserSheetUrl={jewelPhotos?.appraiser_sheet_url}
          paperSize="a4"
        />
        <Text style={styles.pageNumber}>{bilingualLabel('pageOf')} 3 / 6</Text>
      </Page>

      {/* Page 4: KYC Documents */}
      <Page size="A4" style={styles.page}>
        <KYCDocumentsSection
          customer={customer}
          loanNumber={loan.loan_number}
          paperSize="a4"
        />
        <Text style={styles.pageNumber}>{bilingualLabel('pageOf')} 4 / 6</Text>
      </Page>

      {/* Page 5: Gold Declaration */}
      <Page size="A4" style={styles.page}>
        <GoldDeclarationSection
          customer={customer}
          goldSummary={goldSummary}
          loanNumber={loan.loan_number}
          loanDate={loan.loan_date}
          place={place}
          paperSize="a4"
        />
        <Text style={styles.pageNumber}>{bilingualLabel('pageOf')} 5 / 6</Text>
      </Page>

      {/* Page 6: Terms & Conditions */}
      <Page size="A4" style={styles.page}>
        <TermsConditionsSection
          customTerms={customTerms}
          loanNumber={loan.loan_number}
          paperSize="a4"
        />
        <Text style={styles.pageNumber}>{bilingualLabel('pageOf')} 6 / 6</Text>
      </Page>
    </Document>
  );
};

export default TamilNaduPawnbrokerA4Template;
