import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatCurrencyPrint, formatDatePrint, formatWeightPrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFFooter } from '../shared/PDFFooter';
import { BilingualLabel, BilingualValueRow, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';

// Ensure fonts are loaded
const _fonts = fontsRegistered;

interface GoldItem {
  id?: string;
  item_type: string;
  description?: string | null;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  appraised_value: number;
}

interface Customer {
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

interface Loan {
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  interest_rate: number;
  tenure_days: number;
  processing_fee?: number | null;
  document_charges?: number | null;
  net_disbursed: number;
  shown_principal?: number | null;
  advance_interest_shown?: number | null;
}

interface LoanReceiptPDFProps {
  loan: Loan;
  customer: Customer;
  goldItems: GoldItem[];
  companyName: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  footerEnglish?: string | null;
  footerTamil?: string | null;
  sloganEnglish?: string | null;
  sloganTamil?: string | null;
}

export function LoanReceiptPDF({
  loan,
  customer,
  goldItems,
  companyName,
  branchName,
  branchAddress,
  branchPhone,
  language = 'bilingual',
  paperSize = 'A4',
  footerEnglish,
  footerTamil,
  sloganEnglish,
  sloganTamil,
}: LoanReceiptPDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
  
  const displayPrincipal = loan.shown_principal || loan.principal_amount;
  
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
            english="GOLD LOAN RECEIPT"
            tamil="தங்க கடன் ரசீது"
            mode={language}
            fontSize={14}
            fontWeight="bold"
          />
        </View>
        
        {/* Customer Information */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Customer Information"
              tamil="வாடிக்கையாளர் தகவல்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <BilingualValueRow
                labelEn="Customer ID"
                labelTa="வாடிக்கையாளர் எண்"
                value={customer.customer_code}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Name"
                labelTa="பெயர்"
                value={customer.full_name}
                mode={language}
              />
            </View>
            <View style={pdfStyles.column}>
              <BilingualValueRow
                labelEn="Phone"
                labelTa="தொலைபேசி"
                value={customer.phone}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Address"
                labelTa="முகவரி"
                value={[customer.address, customer.city, customer.state].filter(Boolean).join(', ') || '-'}
                mode={language}
              />
            </View>
          </View>
        </View>
        
        {/* Loan Details */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Loan Details"
              tamil="கடன் விவரங்கள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <BilingualValueRow
                labelEn="Loan Number"
                labelTa="கடன் எண்"
                value={loan.loan_number}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Loan Date"
                labelTa="கடன் தேதி"
                value={formatDatePrint(loan.loan_date)}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Maturity Date"
                labelTa="முதிர்வு தேதி"
                value={formatDatePrint(loan.maturity_date)}
                mode={language}
              />
            </View>
            <View style={pdfStyles.column}>
              <BilingualValueRow
                labelEn="Principal Amount"
                labelTa="அசல் தொகை"
                value={formatCurrencyPrint(displayPrincipal)}
                mode={language}
                valueStyle="bold"
              />
              <BilingualValueRow
                labelEn="Interest Rate"
                labelTa="வட்டி விகிதம்"
                value={`${loan.interest_rate}% p.m.`}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Tenure"
                labelTa="காலம்"
                value={`${loan.tenure_days} days`}
                mode={language}
              />
            </View>
          </View>
        </View>
        
        {/* Gold Items Pledged */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Gold Items Pledged"
              tamil="அடமானம் வைக்கப்பட்ட தங்க பொருட்கள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '6%' }]}>S.No</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '24%', textAlign: 'left' }]}>Item / பொருள்</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '17%' }]}>Gross Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '17%' }]}>Net Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '16%' }]}>Purity</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Value</Text>
            </View>
            
            {goldItems.map((item, index) => (
              <View key={item.id} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '6%' }]}>{index + 1}</Text>
                <Text style={[pdfStyles.tableCellLeft, { width: '24%' }]}>{item.item_type}</Text>
                <Text style={[pdfStyles.tableCell, { width: '17%' }]}>{formatWeightPrint(item.gross_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '17%' }]}>{formatWeightPrint(item.net_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '16%' }]}>{item.purity}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{formatCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
            
            {/* Totals row */}
            <View style={[pdfStyles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>Total / மொத்தம்</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '17%' }]}>{formatWeightPrint(totalGrossWeight)}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '17%' }]}>{formatWeightPrint(totalNetWeight)}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '16%' }]}>-</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>{formatCurrencyPrint(totalAppraisedValue)}</Text>
            </View>
          </View>
        </View>
        
        {/* Amount Summary */}
        <View style={pdfStyles.amountBox}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Amount Summary"
              tamil="தொகை சுருக்கம்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.amountRow}>
            <BilingualLabel english="Principal Amount" tamil="அசல் தொகை" mode={language} fontSize={10} />
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(displayPrincipal)}</Text>
          </View>
          
          {(loan.processing_fee || 0) > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Processing Fee" tamil="செயலாக்க கட்டணம்" mode={language} fontSize={10} color="#666" />
              <Text style={[pdfStyles.amountValue, { color: '#c00' }]}>- {formatCurrencyPrint(loan.processing_fee || 0)}</Text>
            </View>
          )}
          
          {(loan.document_charges || 0) > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Document Charges" tamil="ஆவண கட்டணங்கள்" mode={language} fontSize={10} color="#666" />
              <Text style={[pdfStyles.amountValue, { color: '#c00' }]}>- {formatCurrencyPrint(loan.document_charges || 0)}</Text>
            </View>
          )}
          
          {(loan.advance_interest_shown || 0) > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Advance Interest" tamil="முன்கூட்டியே வட்டி" mode={language} fontSize={10} color="#666" />
              <Text style={[pdfStyles.amountValue, { color: '#c00' }]}>- {formatCurrencyPrint(loan.advance_interest_shown || 0)}</Text>
            </View>
          )}
          
          <View style={pdfStyles.amountTotal}>
            <BilingualLabel english="Net Disbursed Amount" tamil="நிகர வழங்கப்பட்ட தொகை" mode={language} fontSize={12} fontWeight="bold" />
            <Text style={pdfStyles.amountTotalValue}>{formatCurrencyPrint(loan.net_disbursed)}</Text>
          </View>
        </View>
        
        {/* Signatures */}
        <PDFFooter
          footerEnglish={footerEnglish}
          footerTamil={footerTamil}
          language={language}
          showSignatures={true}
        />
        
        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
