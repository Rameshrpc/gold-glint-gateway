import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatIndianCurrencyPrint, formatDatePrint, numberToWords } from '@/lib/print-utils';
import '@/lib/pdf-fonts';

interface InterestReceiptPDFProps {
  data: {
    id: string;
    receipt_number: string;
    payment_date: string;
    amount_paid: number;
    shown_interest: number;
    actual_interest: number;
    penalty_amount?: number;
    period_from: string;
    period_to: string;
    days_covered: number;
    payment_mode: string;
    loan: {
      loan_number: string;
      principal_amount: number;
      customer: {
        full_name: string;
        customer_code: string;
        phone: string;
      };
    };
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
    borderBottomColor: '#059669',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  receiptNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
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
    width: '40%',
    color: '#666',
  },
  value: {
    width: '60%',
    fontWeight: 'bold',
  },
  highlight: {
    backgroundColor: '#d1fae5',
    padding: 12,
    marginTop: 10,
    borderRadius: 4,
  },
  amountInWords: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 5,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 40,
    paddingTop: 5,
  },
  footer: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 10,
  },
});

export default function InterestReceiptPDF({ data, config }: InterestReceiptPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.client?.company_name || 'INTEREST PAYMENT RECEIPT'}</Text>
          <Text style={styles.subtitle}>{data.branch?.branch_name || ''}</Text>
          <Text style={styles.receiptNumber}>Receipt No: {data.receipt_number}</Text>
        </View>

        {/* Customer & Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan & Customer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Number:</Text>
            <Text style={styles.value}>{data.loan.loan_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{data.loan.customer.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Code:</Text>
            <Text style={styles.value}>{data.loan.customer.customer_code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Principal Amount:</Text>
            <Text style={styles.value}>{formatIndianCurrencyPrint(data.loan.principal_amount)}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>{formatDatePrint(data.payment_date, 'long')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Period Covered:</Text>
            <Text style={styles.value}>
              {formatDatePrint(data.period_from)} to {formatDatePrint(data.period_to)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Days Covered:</Text>
            <Text style={styles.value}>{data.days_covered} days</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Mode:</Text>
            <Text style={styles.value}>{data.payment_mode.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Amount Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Interest Amount:</Text>
            <Text style={styles.value}>{formatIndianCurrencyPrint(data.shown_interest)}</Text>
          </View>
          {(data.penalty_amount || 0) > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Penalty Amount:</Text>
              <Text style={styles.value}>{formatIndianCurrencyPrint(data.penalty_amount || 0)}</Text>
            </View>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.highlight}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: '#000' }]}>Total Amount Paid:</Text>
            <Text style={[styles.value, { fontSize: 14, color: '#059669' }]}>
              {formatIndianCurrencyPrint(data.amount_paid)}
            </Text>
          </View>
          <Text style={styles.amountInWords}>({numberToWords(Math.round(data.amount_paid))})</Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Cashier Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer generated receipt. Thank you for your payment.</Text>
        </View>
      </Page>
    </Document>
  );
}
