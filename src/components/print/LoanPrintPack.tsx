import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import '@/lib/pdf-fonts';
import { LoanPrintData, DEFAULT_LOAN_PACK } from '@/types/print-data';
import { LanguageMode } from '@/lib/bilingual-utils';
import { translations } from '@/lib/translations';
import { formatDatePrint, formatIndianCurrencyPrint, formatWeight, numberToWords } from '@/lib/print-utils';

interface LoanPrintPackProps {
  data: LoanPrintData;
  language?: LanguageMode;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    color: '#B45309',
  },
  companyNameTamil: {
    fontSize: 12,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
    marginTop: 2,
  },
  branchName: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  copyBadge: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: '#1E40AF',
    color: '#fff',
    padding: '4 10',
    fontSize: 8,
    fontWeight: 'bold',
  },
  copyBadgeTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Poppins',
    color: '#1E40AF',
  },
  titleTamil: {
    fontSize: 11,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    color: '#1E40AF',
    marginBottom: 15,
  },
  loanInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loanInfoItem: {
    alignItems: 'center',
  },
  loanInfoLabel: {
    fontSize: 8,
    color: '#666',
  },
  loanInfoLabelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  loanInfoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#f0f9ff',
    padding: 6,
    marginBottom: 8,
    color: '#1E40AF',
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
  },
  sectionTitleTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    color: '#1E40AF',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '35%',
    fontSize: 9,
    color: '#666',
  },
  labelTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  value: {
    width: '65%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 8,
  },
  totalRow: {
    flexDirection: 'row',
    padding: 6,
    backgroundColor: '#fef3c7',
    fontWeight: 'bold',
    fontSize: 9,
  },
  col1: { width: '5%', textAlign: 'center' },
  col2: { width: '30%' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'center' },
  col6: { width: '20%', textAlign: 'right' },
  highlight: {
    backgroundColor: '#fef3c7',
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 4,
  },
  highlightLabel: {
    fontSize: 10,
    color: '#666',
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B45309',
  },
  amountInWords: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 4,
    color: '#666',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  signatureBox: {
    width: '30%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 40,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
  },
  signatureLabelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  declaration: {
    fontSize: 8,
    color: '#666',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    lineHeight: 1.4,
  },
  declarationTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
    marginTop: 4,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
});

function LoanReceiptPage({ 
  data, 
  copyType, 
  language 
}: { 
  data: LoanPrintData; 
  copyType: 'customer' | 'office'; 
  language: LanguageMode;
}) {
  const showTamil = language !== 'english';
  const totalGoldWeight = data.gold_items.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = data.gold_items.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalAppraisedValue = data.gold_items.reduce((sum, item) => sum + item.appraised_value, 0);
  
  const copyLabel = copyType === 'customer' 
    ? { en: translations.customerCopy.en, ta: translations.customerCopy.ta }
    : { en: translations.officeCopy.en, ta: translations.officeCopy.ta };
  
  return (
    <Page size="A4" style={styles.page}>
      {/* Copy Badge */}
      <View style={styles.copyBadge}>
        <Text>{copyLabel.en}</Text>
        {showTamil && <Text style={styles.copyBadgeTamil}>{copyLabel.ta}</Text>}
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{data.client.company_name}</Text>
        {showTamil && data.client.company_name_tamil && (
          <Text style={styles.companyNameTamil}>{data.client.company_name_tamil}</Text>
        )}
        <Text style={styles.branchName}>{data.branch.branch_name}</Text>
        {data.client.license_number && (
          <Text style={{ fontSize: 8, color: '#888', marginTop: 2 }}>
            License: {data.client.license_number}
          </Text>
        )}
      </View>
      
      {/* Title */}
      <Text style={styles.title}>{translations.goldLoanReceipt.en}</Text>
      {showTamil && <Text style={styles.titleTamil}>{translations.goldLoanReceipt.ta}</Text>}
      
      {/* Loan Info Bar */}
      <View style={styles.loanInfo}>
        <View style={styles.loanInfoItem}>
          <Text style={styles.loanInfoLabel}>Loan No.</Text>
          {showTamil && <Text style={styles.loanInfoLabelTamil}>கடன் எண்</Text>}
          <Text style={styles.loanInfoValue}>{data.loan.loan_number}</Text>
        </View>
        <View style={styles.loanInfoItem}>
          <Text style={styles.loanInfoLabel}>Loan Date</Text>
          {showTamil && <Text style={styles.loanInfoLabelTamil}>கடன் தேதி</Text>}
          <Text style={styles.loanInfoValue}>{formatDatePrint(data.loan.loan_date, 'long')}</Text>
        </View>
        <View style={styles.loanInfoItem}>
          <Text style={styles.loanInfoLabel}>Maturity Date</Text>
          {showTamil && <Text style={styles.loanInfoLabelTamil}>முதிர்வு தேதி</Text>}
          <Text style={styles.loanInfoValue}>{formatDatePrint(data.loan.maturity_date, 'long')}</Text>
        </View>
      </View>
      
      {/* Customer Details */}
      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Text>{translations.customerDetails.en}</Text>
          {showTamil && <Text style={styles.sectionTitleTamil}>{translations.customerDetails.ta}</Text>}
        </View>
        <View style={styles.row}>
          <View style={styles.label}>
            <Text>Customer Name</Text>
            {showTamil && <Text style={styles.labelTamil}>வாடிக்கையாளர் பெயர்</Text>}
          </View>
          <Text style={styles.value}>{data.customer.full_name}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.label}>
            <Text>Customer ID</Text>
            {showTamil && <Text style={styles.labelTamil}>வாடிக்கையாளர் எண்</Text>}
          </View>
          <Text style={styles.value}>{data.customer.customer_code}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.label}>
            <Text>Phone</Text>
            {showTamil && <Text style={styles.labelTamil}>தொலைபேசி</Text>}
          </View>
          <Text style={styles.value}>{data.customer.phone}</Text>
        </View>
        {data.customer.address && (
          <View style={styles.row}>
            <View style={styles.label}>
              <Text>Address</Text>
              {showTamil && <Text style={styles.labelTamil}>முகவரி</Text>}
            </View>
            <Text style={[styles.value, { fontSize: 9 }]}>{data.customer.address}</Text>
          </View>
        )}
      </View>
      
      {/* Loan Details */}
      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Text>Loan Details</Text>
          {showTamil && <Text style={styles.sectionTitleTamil}>கடன் விவரங்கள்</Text>}
        </View>
        <View style={styles.row}>
          <View style={styles.label}>
            <Text>Scheme</Text>
            {showTamil && <Text style={styles.labelTamil}>திட்டம்</Text>}
          </View>
          <Text style={styles.value}>{data.scheme.scheme_name}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.label}>
            <Text>Principal Amount</Text>
            {showTamil && <Text style={styles.labelTamil}>அசல் தொகை</Text>}
          </View>
          <Text style={styles.value}>
            {formatIndianCurrencyPrint(data.loan.shown_principal || data.loan.principal_amount)}
          </Text>
        </View>
        <View style={styles.row}>
          <View style={styles.label}>
            <Text>Interest Rate</Text>
            {showTamil && <Text style={styles.labelTamil}>வட்டி விகிதம்</Text>}
          </View>
          <Text style={styles.value}>{data.scheme.shown_rate || data.loan.interest_rate}% p.a.</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.label}>
            <Text>Tenure</Text>
            {showTamil && <Text style={styles.labelTamil}>கால அளவு</Text>}
          </View>
          <Text style={styles.value}>{data.loan.tenure_days} days</Text>
        </View>
      </View>
      
      {/* Gold Items */}
      <View style={styles.section}>
        <View style={styles.sectionTitle}>
          <Text>{translations.goldDetails.en}</Text>
          {showTamil && <Text style={styles.sectionTitleTamil}>{translations.goldDetails.ta}</Text>}
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Item</Text>
            <Text style={styles.col3}>Gross Wt</Text>
            <Text style={styles.col4}>Net Wt</Text>
            <Text style={styles.col5}>Purity</Text>
            <Text style={styles.col6}>Value</Text>
          </View>
          {data.gold_items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{item.item_type}</Text>
              <Text style={styles.col3}>{formatWeight(item.gross_weight_grams)}</Text>
              <Text style={styles.col4}>{formatWeight(item.net_weight_grams)}</Text>
              <Text style={styles.col5}>{item.purity.toUpperCase()}</Text>
              <Text style={styles.col6}>{formatIndianCurrencyPrint(item.appraised_value)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.col1}></Text>
            <Text style={styles.col2}>Total ({data.gold_items.length} items)</Text>
            <Text style={styles.col3}>{formatWeight(totalGoldWeight)}</Text>
            <Text style={styles.col4}>{formatWeight(totalNetWeight)}</Text>
            <Text style={styles.col5}></Text>
            <Text style={styles.col6}>{formatIndianCurrencyPrint(totalAppraisedValue)}</Text>
          </View>
        </View>
      </View>
      
      {/* Net Disbursed Highlight */}
      <View style={styles.highlight}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.highlightLabel}>Net Amount Disbursed</Text>
            {showTamil && <Text style={{ fontSize: 8, fontFamily: 'Noto Sans Tamil', color: '#888' }}>நிகர வழங்கப்பட்ட தொகை</Text>}
          </View>
          <Text style={styles.highlightValue}>{formatIndianCurrencyPrint(data.loan.net_disbursed)}</Text>
        </View>
        <Text style={styles.amountInWords}>({numberToWords(Math.round(data.loan.net_disbursed))})</Text>
      </View>
      
      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>{translations.customerSignature.en}</Text>
            {showTamil && <Text style={styles.signatureLabelTamil}>{translations.customerSignature.ta}</Text>}
          </View>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Redemption Signature</Text>
            {showTamil && <Text style={styles.signatureLabelTamil}>மீட்பு கையொப்பம்</Text>}
          </View>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>{translations.authorizedSignature.en}</Text>
            {showTamil && <Text style={styles.signatureLabelTamil}>{translations.authorizedSignature.ta}</Text>}
          </View>
        </View>
      </View>
      
      {/* Declaration */}
      <View style={styles.declaration}>
        <Text>{translations.loanDeclaration.en}</Text>
        {showTamil && <Text style={styles.declarationTamil}>{translations.loanDeclaration.ta}</Text>}
      </View>
      
      {/* Footer */}
      <Text style={styles.footer}>
        {translations.computerGenerated.en}{showTamil ? ` / ${translations.computerGenerated.ta}` : ''} | 
        Generated: {formatDatePrint(data.meta.print_timestamp, 'datetime')}
      </Text>
    </Page>
  );
}

export default function LoanPrintPack({ data, language = 'bilingual' }: LoanPrintPackProps) {
  return (
    <Document>
      {/* Page 1: Customer Copy Loan Receipt */}
      <LoanReceiptPage data={data} copyType="customer" language={language} />
      
      {/* Page 2: Office Copy Loan Receipt */}
      <LoanReceiptPage data={data} copyType="office" language={language} />
      
      {/* Note: KYC Cards, Jewel Photo, Declaration, and Terms pages 
          should be generated separately and merged using pdf-lib for the full pack */}
    </Document>
  );
}
