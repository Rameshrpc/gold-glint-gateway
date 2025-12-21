import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatDatePrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFSignatures } from '../shared/PDFFooter';
import { BilingualLabel, BilingualParagraph, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';

// Ensure fonts are loaded
const _fonts = fontsRegistered;

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
  address?: string | null;
}

interface Loan {
  loan_number: string;
  loan_date: string;
  principal_amount: number;
}

interface GoldDeclarationPDFProps {
  loan: Loan;
  customer: Customer;
  companyName: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  declarations: ContentBlock[];
  warnings: ContentBlock[];
  acknowledgments: ContentBlock[];
  signatureLabels: ContentBlock[];
  sloganEnglish?: string | null;
  sloganTamil?: string | null;
  logoUrl?: string | null;
}

export function GoldDeclarationPDF({
  loan,
  customer,
  companyName,
  branchName,
  branchAddress,
  branchPhone,
  language = 'bilingual',
  paperSize = 'A4',
  declarations,
  warnings,
  acknowledgments,
  signatureLabels,
  sloganEnglish,
  sloganTamil,
  logoUrl,
}: GoldDeclarationPDFProps) {
  const pageSize = PAPER_SIZES[paperSize];

  const signatureItems = signatureLabels.length > 0 
    ? signatureLabels.map(s => ({ english: s.content_english, tamil: s.content_tamil }))
    : [
        { english: 'Customer Signature', tamil: 'வாடிக்கையாளர் கையொப்பம்' },
        { english: 'Witness Signature', tamil: 'சாட்சி கையொப்பம்' },
        { english: 'Authorized Signature', tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
      ];

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
          <BilingualLabel
            english="GOLD DECLARATION FORM"
            tamil="தங்க அறிவிப்பு படிவம்"
            mode={language}
            fontSize={14}
            fontWeight="bold"
          />
        </View>

        {/* Customer Info */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>
              {language !== 'tamil' ? 'Customer:' : 'வாடிக்கையாளர்:'}
            </Text>
            <Text style={pdfStyles.rowValue}>{customer.full_name} ({customer.customer_code})</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>
              {language !== 'tamil' ? 'Loan No:' : 'கடன் எண்:'}
            </Text>
            <Text style={pdfStyles.rowValue}>{loan.loan_number}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>
              {language !== 'tamil' ? 'Date:' : 'தேதி:'}
            </Text>
            <Text style={pdfStyles.rowValue}>{formatDatePrint(loan.loan_date)}</Text>
          </View>
        </View>

        {/* Declaration Statements */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Declaration Statements"
              tamil="அறிவிப்பு அறிக்கைகள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <Text style={{ fontSize: 9, marginBottom: 8, color: '#555' }}>
            {language !== 'tamil' 
              ? 'I, the undersigned, hereby declare the following:'
              : 'நான், கீழே கையொப்பமிட்டவர், பின்வருவனவற்றை அறிவிக்கிறேன்:'
            }
          </Text>

          {declarations.map((declaration, index) => (
            <BilingualParagraph
              key={declaration.id}
              english={declaration.content_english}
              tamil={declaration.content_tamil}
              mode={language}
              clauseNumber={index + 1}
              fontSize={9}
            />
          ))}
        </View>

        {/* Warning Box */}
        {warnings.length > 0 && (
          <View style={pdfStyles.warningBox}>
            {warnings.map((warning) => (
              <BilingualLabel
                key={warning.id}
                english={warning.content_english}
                tamil={warning.content_tamil}
                mode={language}
                fontSize={9}
                fontWeight="bold"
              />
            ))}
          </View>
        )}

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
            <Text style={pdfStyles.rowLabel}>
              {language !== 'tamil' ? 'Place & Date:' : 'இடம் & தேதி:'}
            </Text>
            <Text style={[pdfStyles.rowValue, { borderBottomWidth: 0.5, borderBottomColor: '#000' }]}>
              ________________________________
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <PDFSignatures language={language} signatureLabels={signatureItems} />

        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
