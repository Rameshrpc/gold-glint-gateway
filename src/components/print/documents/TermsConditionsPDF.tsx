import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatDatePrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFSignatures } from '../shared/PDFFooter';
import { BilingualLabel, BilingualParagraph, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';

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
}

interface Loan {
  loan_number: string;
  loan_date: string;
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
}

// Parse bilingual term text (format: "English text / Tamil text")
function parseBilingualTerm(termText: string): { english: string; tamil: string } {
  const parts = termText.split(' / ');
  if (parts.length >= 2) {
    return {
      english: parts[0].trim(),
      tamil: parts.slice(1).join(' / ').trim(),
    };
  }
  return { english: termText, tamil: termText };
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
        />
        
        {/* Document Title */}
        <View style={pdfStyles.documentTitle}>
          <BilingualLabel
            english="TERMS & CONDITIONS"
            tamil="விதிமுறைகள் & நிபந்தனைகள்"
            mode={language}
            fontSize={14}
            fontWeight="bold"
          />
        </View>

        {/* Customer & Loan Reference */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Customer:</Text>
                <Text style={pdfStyles.rowValue}>{customer.full_name}</Text>
              </View>
            </View>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Loan No:</Text>
                <Text style={pdfStyles.rowValue}>{loan.loan_number}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms Section */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Loan Terms & Conditions"
              tamil="கடன் விதிமுறைகள் & நிபந்தனைகள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          {sortedTerms.map((term, index) => {
            const parsed = parseBilingualTerm(term.terms_text);
            return (
              <BilingualParagraph
                key={term.id}
                english={parsed.english}
                tamil={parsed.tamil}
                mode={language}
                clauseNumber={index + 1}
                fontSize={9}
                showDivider={index < sortedTerms.length - 1}
              />
            );
          })}
        </View>

        {/* Acknowledgment */}
        {acknowledgments.length > 0 && (
          <View style={[pdfStyles.section, { marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={pdfStyles.checkbox} />
              <View style={{ flex: 1 }}>
                {acknowledgments.map((ack) => (
                  <BilingualLabel
                    key={ack.id}
                    english={ack.content_english}
                    tamil={ack.content_tamil}
                    mode={language}
                    fontSize={9}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Date field */}
        <View style={{ marginTop: 20 }}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>Date:</Text>
            <Text style={pdfStyles.rowValue}>{formatDatePrint(loan.loan_date)}</Text>
          </View>
        </View>

        {/* Signatures */}
        <PDFSignatures language={language} signatureLabels={signatureItems} />

        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
