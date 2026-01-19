import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatCurrencyPrint, formatDatePrint, formatWeightPrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFFooter } from '../shared/PDFFooter';
import { BilingualLabel, BilingualValueRow, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';
import { calculateRebateSchedule } from '@/lib/interestCalculations';

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
  actual_principal?: number | null;
  advance_interest_shown?: number | null;
  rebate_days?: number | null;
  rebate_amount?: number | null;
  differential_capitalized?: number | null;
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
  logoUrl?: string | null;
  copyType?: 'customer' | 'office';
}

// Compact styles for single-page receipt
const compactStyles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#000',
    backgroundColor: '#fff',
  },
  copyBadge: {
    position: 'absolute',
    top: 10,
    right: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#000',
    borderRadius: 3,
  },
  copyBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    paddingBottom: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  table: {
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 3,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    padding: 3,
    minHeight: 16,
  },
  tableCell: {
    fontSize: 7,
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 7,
    textAlign: 'left',
  },
  amountBox: {
    marginTop: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f9f9f9',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  amountTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  amountTotalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Early Release Benefit styles
  earlyReleaseBox: {
    marginTop: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#d97706',
    backgroundColor: '#fffbeb',
    borderRadius: 3,
  },
  earlyReleaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d97706',
  },
  earlyReleaseTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#b45309',
  },
  earlyReleaseSubtitle: {
    fontSize: 6,
    color: '#78716c',
    marginTop: 1,
  },
  earlyReleaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  earlyReleaseDays: {
    fontSize: 7,
    color: '#374151',
  },
  earlyReleaseAmount: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#059669',
  },
  noRebateText: {
    fontSize: 7,
    color: '#9ca3af',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
  },
  signatureBox: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7,
    textAlign: 'center',
    color: '#555',
  },
  documentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 6,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    textTransform: 'uppercase',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    fontSize: 7,
    color: '#999',
  },
});

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
  logoUrl,
  copyType,
}: LoanReceiptPDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
  
  const displayPrincipal = loan.actual_principal || loan.principal_amount;
  
  const copyLabel = copyType === 'customer' ? 'Customer Copy' : copyType === 'office' ? 'Office Copy' : null;
  
  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={compactStyles.page}>
        {/* Copy Badge */}
        {copyLabel && (
          <View style={compactStyles.copyBadge}>
            <Text style={compactStyles.copyBadgeText}>{copyLabel}</Text>
          </View>
        )}
        
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
        <View style={compactStyles.documentTitle}>
          <BilingualLabel
            english="GOLD LOAN RECEIPT"
            tamil="தங்க கடன் ரசீது"
            mode={language}
            fontSize={11}
            fontWeight="bold"
          />
        </View>
        
        {/* Customer Information */}
        <View style={compactStyles.section}>
          <View style={compactStyles.sectionTitle}>
            <BilingualLabel
              english="Customer Information"
              tamil="வாடிக்கையாளர் தகவல்"
              mode={language}
              fontSize={9}
              fontWeight="bold"
            />
          </View>
          
          <View style={compactStyles.twoColumn}>
            <View style={compactStyles.column}>
              <BilingualValueRow
                labelEn="Customer ID"
                labelTa="வாடிக்கையாளர் எண்"
                value={customer.customer_code}
                mode={language}
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="Name"
                labelTa="பெயர்"
                value={customer.full_name}
                mode={language}
                fontSize={8}
              />
            </View>
            <View style={compactStyles.column}>
              <BilingualValueRow
                labelEn="Phone"
                labelTa="தொலைபேசி"
                value={customer.phone}
                mode={language}
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="Address"
                labelTa="முகவரி"
                value={[customer.address, customer.city, customer.state].filter(Boolean).join(', ') || '-'}
                mode={language}
                fontSize={8}
              />
            </View>
          </View>
        </View>
        
        {/* Loan Details */}
        <View style={compactStyles.section}>
          <View style={compactStyles.sectionTitle}>
            <BilingualLabel
              english="Loan Details"
              tamil="கடன் விவரங்கள்"
              mode={language}
              fontSize={9}
              fontWeight="bold"
            />
          </View>
          
          <View style={compactStyles.twoColumn}>
            <View style={compactStyles.column}>
              <BilingualValueRow
                labelEn="Loan Number"
                labelTa="கடன் எண்"
                value={loan.loan_number}
                mode={language}
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="Loan Date"
                labelTa="கடன் தேதி"
                value={formatDatePrint(loan.loan_date)}
                mode={language}
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="Maturity Date"
                labelTa="முதிர்வு தேதி"
                value={formatDatePrint(loan.maturity_date)}
                mode={language}
                fontSize={8}
              />
            </View>
            <View style={compactStyles.column}>
              <BilingualValueRow
                labelEn="Principal Amount"
                labelTa="அசல் தொகை"
                value={formatCurrencyPrint(displayPrincipal)}
                mode={language}
                valueStyle="bold"
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="Interest Rate"
                labelTa="வட்டி விகிதம்"
                value={`${loan.interest_rate}% p.m.`}
                mode={language}
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="Tenure"
                labelTa="காலம்"
                value={`${loan.tenure_days} days`}
                mode={language}
                fontSize={8}
              />
            </View>
          </View>
        </View>
        
        {/* Gold Items Pledged */}
        <View style={compactStyles.section}>
          <View style={compactStyles.sectionTitle}>
            <BilingualLabel
              english="Gold Items Pledged"
              tamil="அடமானம் வைக்கப்பட்ட தங்க பொருட்கள்"
              mode={language}
              fontSize={9}
              fontWeight="bold"
            />
          </View>
          
          <View style={compactStyles.table}>
            <View style={compactStyles.tableHeader}>
              <Text style={[compactStyles.tableHeaderCell, { width: '6%' }]}>S.No</Text>
              <View style={[compactStyles.tableHeaderCell, { width: '24%', textAlign: 'left' }]}>
                <BilingualLabel english="Item" tamil="பொருள்" mode={language} fontSize={7} fontWeight="bold" />
              </View>
              <Text style={[compactStyles.tableHeaderCell, { width: '17%' }]}>Gross Wt</Text>
              <Text style={[compactStyles.tableHeaderCell, { width: '17%' }]}>Net Wt</Text>
              <Text style={[compactStyles.tableHeaderCell, { width: '16%' }]}>Purity</Text>
              <Text style={[compactStyles.tableHeaderCell, { width: '20%' }]}>Value</Text>
            </View>
            
            {goldItems.map((item, index) => (
              <View key={item.id || index} style={compactStyles.tableRow}>
                <Text style={[compactStyles.tableCell, { width: '6%' }]}>{index + 1}</Text>
                <Text style={[compactStyles.tableCellLeft, { width: '24%' }]}>{item.item_type}</Text>
                <Text style={[compactStyles.tableCell, { width: '17%' }]}>{formatWeightPrint(item.gross_weight_grams)}</Text>
                <Text style={[compactStyles.tableCell, { width: '17%' }]}>{formatWeightPrint(item.net_weight_grams)}</Text>
                <Text style={[compactStyles.tableCell, { width: '16%' }]}>{item.purity}</Text>
                <Text style={[compactStyles.tableCell, { width: '20%' }]}>{formatCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
            
            {/* Totals row */}
            <View style={[compactStyles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <View style={[compactStyles.tableHeaderCell, { width: '30%', textAlign: 'right' }]}>
                <BilingualLabel english="Total" tamil="மொத்தம்" mode={language} fontSize={7} fontWeight="bold" />
              </View>
              <Text style={[compactStyles.tableHeaderCell, { width: '17%' }]}>{formatWeightPrint(totalGrossWeight)}</Text>
              <Text style={[compactStyles.tableHeaderCell, { width: '17%' }]}>{formatWeightPrint(totalNetWeight)}</Text>
              <Text style={[compactStyles.tableHeaderCell, { width: '16%' }]}>-</Text>
              <Text style={[compactStyles.tableHeaderCell, { width: '20%' }]}>{formatCurrencyPrint(totalAppraisedValue)}</Text>
            </View>
          </View>
        </View>
        
        {/* Rebate Details - only show if rebate exists */}
        {((loan.rebate_days && loan.rebate_days > 0) || (loan.rebate_amount && loan.rebate_amount > 0)) && (
          <View style={compactStyles.section}>
            <View style={compactStyles.sectionTitle}>
              <BilingualLabel
                english="Rebate Details"
                tamil="தள்ளுபடி விவரங்கள்"
                mode={language}
                fontSize={9}
                fontWeight="bold"
              />
            </View>
            <View style={compactStyles.twoColumn}>
              <View style={compactStyles.column}>
                <BilingualValueRow
                  labelEn="Rebate Days"
                  labelTa="தள்ளுபடி நாட்கள்"
                  value={`${loan.rebate_days || 0} days`}
                  mode={language}
                  fontSize={8}
                />
              </View>
              <View style={compactStyles.column}>
                <BilingualValueRow
                  labelEn="Rebate Amount"
                  labelTa="தள்ளுபடி தொகை"
                  value={formatCurrencyPrint(loan.rebate_amount || 0)}
                  mode={language}
                  valueStyle="bold"
                  fontSize={8}
                />
              </View>
            </View>
          </View>
        )}
        
        {/* Early Release Benefit - show if differential_capitalized exists */}
        {loan.differential_capitalized && loan.differential_capitalized > 0 && (() => {
          const rebateSchedule = calculateRebateSchedule(loan.differential_capitalized);
          return (
            <View style={compactStyles.earlyReleaseBox}>
              <View style={compactStyles.earlyReleaseHeader}>
                <View>
                  <BilingualLabel
                    english="Early Release Benefit"
                    tamil="முன்கூட்டிய விடுவிப்பு சலுகை"
                    mode={language}
                    fontSize={8}
                    fontWeight="bold"
                    color="#b45309"
                  />
                  <BilingualLabel
                    english="Rebate on early loan closure"
                    tamil="கடன் முன்கூட்டியே முடிக்கும் போது தள்ளுபடி"
                    mode={language}
                    fontSize={6}
                    color="#666"
                  />
                </View>
              </View>
              
              {/* Rebate schedule rows */}
              <View style={compactStyles.earlyReleaseRow}>
                <BilingualLabel english="Within 1-30 days" tamil="1-30 நாட்களுக்குள்" mode={language} fontSize={6} />
                <BilingualLabel english="No rebate" tamil="தள்ளுபடி இல்லை" mode={language} fontSize={6} color="#9ca3af" />
              </View>
              <View style={compactStyles.earlyReleaseRow}>
                <BilingualLabel english="Within 30-45 days" tamil="30-45 நாட்களுக்குள்" mode={language} fontSize={6} />
                <Text style={compactStyles.earlyReleaseAmount}>{formatCurrencyPrint(rebateSchedule.slots[1].rebateAmount)}</Text>
              </View>
              <View style={compactStyles.earlyReleaseRow}>
                <BilingualLabel english="Within 45-60 days" tamil="45-60 நாட்களுக்குள்" mode={language} fontSize={6} />
                <Text style={compactStyles.earlyReleaseAmount}>{formatCurrencyPrint(rebateSchedule.slots[2].rebateAmount)}</Text>
              </View>
              <View style={compactStyles.earlyReleaseRow}>
                <BilingualLabel english="Within 60-75 days" tamil="60-75 நாட்களுக்குள்" mode={language} fontSize={6} />
                <Text style={compactStyles.earlyReleaseAmount}>{formatCurrencyPrint(rebateSchedule.slots[3].rebateAmount)}</Text>
              </View>
              <View style={[compactStyles.earlyReleaseRow, { borderBottomWidth: 0 }]}>
                <BilingualLabel english="After 75 days" tamil="75 நாட்களுக்கு பிறகு" mode={language} fontSize={6} />
                <BilingualLabel english="No rebate" tamil="தள்ளுபடி இல்லை" mode={language} fontSize={6} color="#888" />
              </View>
            </View>
          );
        })()}
        
        {/* Signatures */}
        <View style={compactStyles.signatureSection}>
          <View style={compactStyles.signatureBox}>
            <View style={compactStyles.signatureLine} />
            <BilingualLabel
              english="Customer Signature"
              tamil="வாடிக்கையாளர் கையொப்பம்"
              mode={language}
              fontSize={7}
              color="#555"
            />
          </View>
          <View style={compactStyles.signatureBox}>
            <View style={compactStyles.signatureLine} />
            <BilingualLabel
              english="Redemption Signature"
              tamil="மீட்பு கையொப்பம்"
              mode={language}
              fontSize={7}
              color="#555"
            />
          </View>
          <View style={compactStyles.signatureBox}>
            <View style={compactStyles.signatureLine} />
            <BilingualLabel
              english="Authorized Signature"
              tamil="அங்கீகரிக்கப்பட்ட கையொப்பம்"
              mode={language}
              fontSize={7}
              color="#555"
            />
          </View>
        </View>
        
        {/* Footer Text */}
        {(footerEnglish || footerTamil) && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 7, textAlign: 'center', color: '#666' }}>
              {language === 'tamil-only' as string ? footerTamil : language === 'english-only' as string ? footerEnglish : `${footerEnglish || ''} | ${footerTamil || ''}`}
            </Text>
          </View>
        )}
        
        <Text style={compactStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
