import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatDatePrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFSignatures } from '../shared/PDFFooter';
import { LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';
import { amountToWordsOnly } from '@/lib/amount-to-words';

// Ensure fonts are loaded
const _fonts = fontsRegistered;

interface Term {
  id: string;
  terms_text: string;
  language: string;
  display_order: number;
}

interface ContentBlock {
  id: string;
  block_type: string;
  content_english: string;
  content_tamil: string;
  display_order: number;
}

interface Customer {
  customer_code: string;
  full_name: string;
  phone: string;
  nominee_name?: string | null;
  nominee_relation?: string | null;
}

interface Loan {
  loan_number: string;
  loan_date: string;
  principal_amount?: number;
}

interface TermsConditionsPDFProps {
  loan: Loan;
  customer: Customer;
  companyName: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  terms: Term[];
  acknowledgments: ContentBlock[];
  signatureLabels: ContentBlock[];
  sloganEnglish?: string | null;
  sloganTamil?: string | null;
  logoUrl?: string | null;
}

// Custom styles for terms
const termStyles = StyleSheet.create({
  termContainer: {
    marginBottom: 8,
    paddingBottom: 6,
  },
  termNumber: {
    fontFamily: 'Roboto',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  termText: {
    fontFamily: 'Noto Sans Tamil',
    fontSize: 9,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  fieldsSection: {
    marginTop: 20,
    gap: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: 'Noto Sans Tamil',
    fontSize: 9,
    width: 80,
  },
  fieldValue: {
    fontFamily: 'Roboto',
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dotted',
    paddingBottom: 2,
    flex: 1,
    minWidth: 150,
  },
});

// Replace placeholders with actual data
function replacePlaceholders(
  text: string,
  loan: Loan,
  customer: Customer,
  branchAddress?: string
): string {
  let result = text;
  
  // Replace loan amount placeholder
  if (loan.principal_amount) {
    const amountFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(loan.principal_amount);
    
    const amountWords = amountToWordsOnly(loan.principal_amount).toUpperCase();
    const fullAmount = `${amountFormatted} (${amountWords})`;
    
    // Replace various amount patterns
    result = result.replace(/\{LOAN_AMOUNT\}/gi, fullAmount);
    result = result.replace(/ரூ\.\s*[\d,]+\.\d{2}\s*\([^)]+\)/g, fullAmount);
  }
  
  // Replace customer name
  result = result.replace(/\{CUSTOMER_NAME\}/gi, customer.full_name);
  
  // Replace nominee placeholders
  const nomineeName = customer.nominee_name || '_______________';
  const nomineeRelation = customer.nominee_relation || 'Father';
  
  result = result.replace(/\{NOMINEE_NAME\}/gi, nomineeName);
  result = result.replace(/\{NOMINEE_RELATION\}/gi, nomineeRelation);
  result = result.replace(/திரு\.\s*\(Father\)/g, `திரு. ${nomineeName} (${nomineeRelation})`);
  
  // Replace place/address
  if (branchAddress) {
    result = result.replace(/\{PLACE\}/gi, branchAddress);
  }
  
  // Replace date
  result = result.replace(/\{DATE\}/gi, formatDatePrint(loan.loan_date));
  result = result.replace(/\{LOAN_DATE\}/gi, formatDatePrint(loan.loan_date));
  
  return result;
}

export function TermsConditionsPDF({
  loan,
  customer,
  companyName,
  branchName,
  branchAddress,
  branchPhone,
  language = 'bilingual',
  paperSize = 'A4',
  terms,
  acknowledgments,
  signatureLabels,
  sloganEnglish,
  sloganTamil,
  logoUrl,
}: TermsConditionsPDFProps) {
  const pageSize = PAPER_SIZES[paperSize];

  const signatureItems = signatureLabels.length > 0 
    ? signatureLabels.map(s => ({ english: s.content_english, tamil: s.content_tamil }))
    : [
        { english: 'Customer Signature', tamil: 'வாடிக்கையாளர் கையொப்பம்' },
        { english: 'Authorized Signature', tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
      ];

  // Sort terms by display order
  const sortedTerms = [...terms].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={pdfStyles.page}>
        <PDFHeader
          companyName={companyName}
          branchName={branchName}
          address={branchAddress}
          phone={branchPhone}
          date={loan.loan_date}
          documentNumber={loan.loan_number}
          sloganEnglish={sloganEnglish}
          sloganTamil={sloganTamil}
          language={language}
          logoUrl={logoUrl}
        />
        
        {/* Document Title */}
        <View style={pdfStyles.documentTitle}>
          <Text style={{ fontFamily: 'Noto Sans Tamil', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>
            நிபந்தனைகளும், அறிவிப்புகளும்
          </Text>
          <Text style={{ fontFamily: 'Roboto', fontSize: 12, textAlign: 'center', marginTop: 2 }}>
            TERMS & CONDITIONS
          </Text>
        </View>

        {/* Terms Section */}
        <View style={pdfStyles.section}>
          {sortedTerms.map((term, index) => {
            // Replace placeholders with actual data
            const processedText = replacePlaceholders(
              term.terms_text,
              loan,
              customer,
              branchAddress
            );
            
            return (
              <View key={term.id} style={termStyles.termContainer} wrap={false}>
                <Text style={termStyles.termText}>
                  {index + 1}. {processedText}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Fields Section - Place, Date, Name, Signature */}
        <View style={termStyles.fieldsSection}>
          <View style={termStyles.fieldRow}>
            <Text style={termStyles.fieldLabel}>இடம்:</Text>
            <Text style={termStyles.fieldValue}>{branchAddress || ''}</Text>
          </View>
          <View style={termStyles.fieldRow}>
            <Text style={termStyles.fieldLabel}>தேதி:</Text>
            <Text style={termStyles.fieldValue}>{formatDatePrint(loan.loan_date)}</Text>
          </View>
          <View style={termStyles.fieldRow}>
            <Text style={termStyles.fieldLabel}>பெயர்:</Text>
            <Text style={termStyles.fieldValue}>{customer.full_name}</Text>
          </View>
        </View>

        {/* Signatures */}
        <PDFSignatures language={language} signatureLabels={signatureItems} />

        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
