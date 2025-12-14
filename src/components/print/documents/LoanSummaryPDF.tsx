import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatDatePrint, formatIndianCurrencyPrint, formatWeight, numberToWords } from '@/lib/print-utils';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

interface LoanSummaryPDFProps {
  data: {
    loan_number?: string;
    loan_date?: string;
    maturity_date?: string;
    principal_amount?: number;
    actual_principal?: number;
    net_disbursed?: number;
    interest_rate?: number;
    tenure_days?: number;
    processing_fee?: number;
    document_charges?: number;
    advance_interest_shown?: number;
    advance_interest_actual?: number;
    customer?: {
      full_name: string;
      customer_code: string;
      phone: string;
      address?: string;
    };
    scheme?: {
      scheme_name: string;
      scheme_code: string;
      shown_rate?: number;
      advance_interest_months?: number;
      ltv_percentage?: number;
    };
    gold_items?: Array<{
      item_type: string;
      gross_weight_grams: number;
      net_weight_grams: number;
      purity: string;
      appraised_value: number;
    }>;
    client?: {
      company_name: string;
      address?: string;
      phone?: string;
    };
    branch?: {
      branch_name: string;
      address?: string;
    };
  };
  config?: any;
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#B45309',
  },
  loanNumberBox: {
    backgroundColor: '#B45309',
    padding: 8,
    marginBottom: 15,
  },
  loanNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#B45309',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '50%',
    fontSize: 9,
    color: '#666',
  },
  value: {
    width: '50%',
    fontSize: 9,
    textAlign: 'right',
  },
  highlightRow: {
    flexDirection: 'row',
    marginBottom: 4,
    backgroundColor: '#fffbeb',
    padding: 4,
    marginHorizontal: -4,
  },
  highlightLabel: {
    width: '50%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B45309',
  },
  highlightValue: {
    width: '50%',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#B45309',
  },
  summaryBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  goldTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 5,
  },
  tableHeaderCell: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 5,
  },
  tableCell: {
    fontSize: 8,
  },
  termsSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  termItem: {
    fontSize: 8,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

export default function LoanSummaryPDF({ data, config }: LoanSummaryPDFProps) {
  const goldItems = data.gold_items || [];
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + (item.gross_weight_grams || 0), 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + (item.net_weight_grams || 0), 0);
  const totalValue = goldItems.reduce((sum, item) => sum + (item.appraised_value || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.client?.company_name || 'Gold Loan Company'}</Text>
          <Text style={styles.subtitle}>LOAN SUMMARY</Text>
          {data.branch && <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>{data.branch.branch_name}</Text>}
        </View>

        {/* Loan Number */}
        <View style={styles.loanNumberBox}>
          <Text style={styles.loanNumberText}>Loan No: {data.loan_number || '-'}</Text>
        </View>

        {/* Customer & Loan Info - Two Columns */}
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
          {/* Customer Details */}
          <View style={[styles.section, { width: '48%', marginRight: '4%' }]}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{data.customer?.full_name || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Customer Code:</Text>
              <Text style={styles.value}>{data.customer?.customer_code || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{data.customer?.phone || '-'}</Text>
            </View>
          </View>

          {/* Scheme Details */}
          <View style={[styles.section, { width: '48%' }]}>
            <Text style={styles.sectionTitle}>Scheme Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Scheme:</Text>
              <Text style={styles.value}>{data.scheme?.scheme_name || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Interest Rate:</Text>
              <Text style={styles.value}>{data.scheme?.shown_rate || data.interest_rate}% p.a.</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>LTV:</Text>
              <Text style={styles.value}>{data.scheme?.ltv_percentage || '-'}%</Text>
            </View>
          </View>
        </View>

        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Date:</Text>
            <Text style={styles.value}>{data.loan_date ? formatDatePrint(data.loan_date) : '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Maturity Date:</Text>
            <Text style={styles.value}>{data.maturity_date ? formatDatePrint(data.maturity_date) : '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tenure:</Text>
            <Text style={styles.value}>{data.tenure_days || '-'} days</Text>
          </View>
          <View style={styles.highlightRow}>
            <Text style={styles.highlightLabel}>Principal Amount:</Text>
            <Text style={styles.highlightValue}>{formatIndianCurrencyPrint(data.principal_amount || 0)}</Text>
          </View>
        </View>

        {/* Disbursement Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disbursement Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Amount:</Text>
            <Text style={styles.value}>{formatIndianCurrencyPrint(data.principal_amount || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: 'red' }]}>Less: Processing Fee:</Text>
            <Text style={[styles.value, { color: 'red' }]}>- {formatIndianCurrencyPrint(data.processing_fee || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: 'red' }]}>Less: Document Charges:</Text>
            <Text style={[styles.value, { color: 'red' }]}>- {formatIndianCurrencyPrint(data.document_charges || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: 'red' }]}>Less: Advance Interest:</Text>
            <Text style={[styles.value, { color: 'red' }]}>- {formatIndianCurrencyPrint(data.advance_interest_shown || 0)}</Text>
          </View>
          <View style={[styles.highlightRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#B45309' }]}>
            <Text style={styles.highlightLabel}>Net Amount Paid:</Text>
            <Text style={[styles.highlightValue, { color: 'green' }]}>{formatIndianCurrencyPrint(data.net_disbursed || 0)}</Text>
          </View>
          <Text style={{ fontSize: 8, fontStyle: 'italic', marginTop: 5, color: '#666' }}>
            ({numberToWords(data.net_disbursed || 0)})
          </Text>
        </View>

        {/* Gold Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gold Collateral Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Items:</Text>
            <Text style={styles.value}>{goldItems.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Gross Weight:</Text>
            <Text style={styles.value}>{formatWeight(totalGrossWeight)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Net Weight:</Text>
            <Text style={styles.value}>{formatWeight(totalNetWeight)}</Text>
          </View>
          <View style={styles.highlightRow}>
            <Text style={styles.highlightLabel}>Total Appraised Value:</Text>
            <Text style={styles.highlightValue}>{formatIndianCurrencyPrint(totalValue)}</Text>
          </View>
        </View>

        {/* Key Terms */}
        <View style={styles.termsSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 5 }]}>Key Terms</Text>
          <Text style={styles.termItem}>• Interest is calculated on monthly basis at {data.scheme?.shown_rate || data.interest_rate}% per annum</Text>
          <Text style={styles.termItem}>• Gold items will be auctioned if loan is not repaid by maturity date</Text>
          <Text style={styles.termItem}>• Early redemption is allowed with applicable rebate</Text>
          <Text style={styles.termItem}>• Customer must present original receipt for redemption</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated document. Please retain for your records.</Text>
        </View>
      </Page>
    </Document>
  );
}
