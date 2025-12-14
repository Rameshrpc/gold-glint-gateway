import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatIndianCurrencyPrint, formatDatePrint, numberToWords, formatWeight } from '@/lib/print-utils';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 },
  ],
});

interface LoanReceiptPDFProps {
  data: {
    id: string;
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    shown_principal?: number;
    interest_rate: number;
    tenure_days: number;
    maturity_date: string;
    net_disbursed: number;
    processing_fee?: number;
    document_charges?: number;
    advance_interest_shown?: number;
    customer: {
      full_name: string;
      customer_code: string;
      phone: string;
      address?: string;
    };
    scheme: {
      scheme_name: string;
      interest_rate: number;
      shown_rate?: number;
    };
    gold_items?: Array<{
      item_type: string;
      gross_weight_grams: number;
      net_weight_grams: number;
      purity: string;
      appraised_value: number;
    }>;
    branch?: {
      branch_name: string;
    };
    client?: {
      company_name: string;
    };
  };
  config?: {
    fontFamily?: string;
    colorScheme?: { primary: string; secondary: string };
    language?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 6,
    marginBottom: 8,
    color: '#1E40AF',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '35%',
    color: '#666',
  },
  value: {
    width: '65%',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  col1: { width: '30%' },
  col2: { width: '15%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '25%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
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
    fontSize: 7,
    color: '#666',
    marginTop: 2,
  },
  declaration: {
    fontSize: 8,
    color: '#666',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  highlight: {
    backgroundColor: '#fef3c7',
    padding: 10,
    marginTop: 10,
  },
  amountInWords: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default function LoanReceiptPDF({ data, config }: LoanReceiptPDFProps) {
  const totalGoldWeight = data.gold_items?.reduce((sum, item) => sum + item.gross_weight_grams, 0) || 0;
  const totalAppraisedValue = data.gold_items?.reduce((sum, item) => sum + item.appraised_value, 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.client?.company_name || 'GOLD LOAN RECEIPT'}</Text>
          <Text style={styles.subtitle}>{data.branch?.branch_name || ''}</Text>
          <Text style={[styles.subtitle, { marginTop: 4 }]}>Loan Number: {data.loan_number}</Text>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{data.customer.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Code:</Text>
            <Text style={styles.value}>{data.customer.customer_code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.customer.phone}</Text>
          </View>
          {data.customer.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{data.customer.address}</Text>
            </View>
          )}
        </View>

        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Date:</Text>
            <Text style={styles.value}>{formatDatePrint(data.loan_date, 'long')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Scheme:</Text>
            <Text style={styles.value}>{data.scheme.scheme_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Principal Amount:</Text>
            <Text style={styles.value}>{formatIndianCurrencyPrint(data.shown_principal || data.principal_amount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Interest Rate:</Text>
            <Text style={styles.value}>{data.scheme.shown_rate || data.interest_rate}% p.a.</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tenure:</Text>
            <Text style={styles.value}>{data.tenure_days} days</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Maturity Date:</Text>
            <Text style={styles.value}>{formatDatePrint(data.maturity_date, 'long')}</Text>
          </View>
        </View>

        {/* Gold Items */}
        {data.gold_items && data.gold_items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gold Items Pledged</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Item</Text>
                <Text style={styles.col2}>Gross Wt</Text>
                <Text style={styles.col3}>Net Wt</Text>
                <Text style={styles.col4}>Purity</Text>
                <Text style={styles.col5}>Value</Text>
              </View>
              {data.gold_items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.col1}>{item.item_type}</Text>
                  <Text style={styles.col2}>{formatWeight(item.gross_weight_grams)}</Text>
                  <Text style={styles.col3}>{formatWeight(item.net_weight_grams)}</Text>
                  <Text style={styles.col4}>{item.purity.toUpperCase()}</Text>
                  <Text style={styles.col5}>{formatIndianCurrencyPrint(item.appraised_value)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.col1}>Total</Text>
                <Text style={styles.col2}>{formatWeight(totalGoldWeight)}</Text>
                <Text style={styles.col3}></Text>
                <Text style={styles.col4}></Text>
                <Text style={styles.col5}>{formatIndianCurrencyPrint(totalAppraisedValue)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Disbursement Details */}
        <View style={styles.highlight}>
          <View style={styles.row}>
            <Text style={styles.label}>Net Amount Disbursed:</Text>
            <Text style={[styles.value, { fontSize: 12 }]}>{formatIndianCurrencyPrint(data.net_disbursed)}</Text>
          </View>
          <Text style={styles.amountInWords}>({numberToWords(Math.round(data.net_disbursed))})</Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Customer Signature</Text>
            <Text style={styles.signatureLabel}>(At Loan Creation)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Redemption Signature</Text>
            <Text style={styles.signatureLabel}>(At Gold Release)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text>
            I hereby acknowledge receipt of the loan amount mentioned above and confirm that the gold items 
            listed have been pledged as security for this loan. I agree to the terms and conditions of the 
            loan scheme and understand that failure to repay may result in auction of the pledged items.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
