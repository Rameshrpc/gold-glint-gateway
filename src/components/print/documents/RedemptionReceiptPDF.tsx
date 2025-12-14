import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatIndianCurrencyPrint, formatDatePrint, numberToWords } from '@/lib/print-utils';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 },
  ],
});

interface RedemptionReceiptPDFProps {
  data: {
    id: string;
    redemption_number: string;
    redemption_date: string;
    outstanding_principal: number;
    interest_due: number;
    penalty_amount?: number;
    rebate_amount?: number;
    total_settlement: number;
    amount_received: number;
    payment_mode: string;
    released_to?: string;
    loan: {
      loan_number: string;
      loan_date: string;
      principal_amount: number;
      customer: {
        full_name: string;
        customer_code: string;
        phone: string;
      };
    };
    gold_items?: Array<{
      item_type: string;
      gross_weight_grams: number;
      purity: string;
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
    borderBottomColor: '#7c3aed',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
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
    width: '45%',
    color: '#666',
  },
  value: {
    width: '55%',
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
  highlight: {
    backgroundColor: '#ede9fe',
    padding: 12,
    marginTop: 10,
    borderRadius: 4,
  },
  goldReleaseBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#f59e0b',
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
    width: '30%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 40,
    paddingTop: 5,
    fontSize: 9,
  },
  footer: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginVertical: 8,
  },
});

export default function RedemptionReceiptPDF({ data, config }: RedemptionReceiptPDFProps) {
  const totalGoldWeight = data.gold_items?.reduce((sum, item) => sum + item.gross_weight_grams, 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.client?.company_name || 'LOAN REDEMPTION RECEIPT'}</Text>
          <Text style={styles.subtitle}>{data.branch?.branch_name || ''}</Text>
          <Text style={styles.receiptNumber}>Redemption No: {data.redemption_number}</Text>
        </View>

        {/* Customer & Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan & Customer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Number:</Text>
            <Text style={styles.value}>{data.loan.loan_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Date:</Text>
            <Text style={styles.value}>{formatDatePrint(data.loan.loan_date, 'long')}</Text>
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
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.loan.customer.phone}</Text>
          </View>
        </View>

        {/* Settlement Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text>Outstanding Principal:</Text>
            <Text style={{ fontWeight: 'bold' }}>{formatIndianCurrencyPrint(data.outstanding_principal)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text>Interest Due:</Text>
            <Text style={{ fontWeight: 'bold' }}>{formatIndianCurrencyPrint(data.interest_due)}</Text>
          </View>
          {(data.penalty_amount || 0) > 0 && (
            <View style={styles.breakdownRow}>
              <Text>Penalty Amount:</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatIndianCurrencyPrint(data.penalty_amount || 0)}</Text>
            </View>
          )}
          {(data.rebate_amount || 0) > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={{ color: '#059669' }}>Rebate (-):</Text>
              <Text style={{ fontWeight: 'bold', color: '#059669' }}>-{formatIndianCurrencyPrint(data.rebate_amount || 0)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>Total Settlement:</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{formatIndianCurrencyPrint(data.total_settlement)}</Text>
          </View>
        </View>

        {/* Amount Received */}
        <View style={styles.highlight}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: '#000' }]}>Amount Received:</Text>
            <Text style={[styles.value, { fontSize: 14, color: '#7c3aed' }]}>
              {formatIndianCurrencyPrint(data.amount_received)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: '#000' }]}>Payment Mode:</Text>
            <Text style={styles.value}>{data.payment_mode.toUpperCase()}</Text>
          </View>
          <Text style={styles.amountInWords}>({numberToWords(Math.round(data.amount_received))})</Text>
        </View>

        {/* Gold Release */}
        <View style={styles.goldReleaseBox}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 11 }}>GOLD RELEASE ACKNOWLEDGMENT</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Gold Released:</Text>
            <Text style={styles.value}>{totalGoldWeight.toFixed(3)} grams</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Items Count:</Text>
            <Text style={styles.value}>{data.gold_items?.length || 0} item(s)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Released To:</Text>
            <Text style={styles.value}>{data.released_to || data.loan.customer.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Release Date:</Text>
            <Text style={styles.value}>{formatDatePrint(data.redemption_date, 'long')}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>ID Verified By</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Manager Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>I acknowledge receipt of the gold items listed above in good condition.</Text>
          <Text style={{ marginTop: 5 }}>This receipt is proof of loan closure and gold release.</Text>
        </View>
      </Page>
    </Document>
  );
}
