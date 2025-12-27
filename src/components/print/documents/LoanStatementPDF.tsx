import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, formatCurrencyPrint, formatDatePrint, PAPER_SIZES } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFFooter } from '../shared/PDFFooter';

interface InterestPayment {
  id: string;
  receipt_number: string;
  payment_date: string;
  period_from: string;
  period_to: string;
  days_covered: number;
  amount_paid: number;
  payment_mode: string;
}

interface GoldItem {
  item_type: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
}

interface LoanData {
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  interest_rate: number;
  tenure_days: number;
  maturity_date: string;
  status: string;
  net_disbursed: number;
  advance_interest_shown: number | null;
  processing_fee: number | null;
  document_charges: number | null;
  customer: {
    full_name: string;
    customer_code: string;
    phone: string;
    address?: string;
  };
  scheme: {
    scheme_name: string;
    interest_rate: number;
  };
  gold_items: GoldItem[];
  interest_payments: InterestPayment[];
  total_interest_paid: number;
  outstanding_principal: number;
  outstanding_interest: number;
}

interface LoanStatementPDFProps {
  loan: LoanData;
  companyName: string;
  branchName: string;
  branchAddress?: string;
  logoUrl?: string;
  footerText?: string;
  asOfDate: string;
}

const styles = StyleSheet.create({
  ...pdfStyles,
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  summaryBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f9f9f9',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#e0e0e0',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export function LoanStatementPDF({
  loan,
  companyName,
  branchName,
  branchAddress,
  logoUrl,
  footerText,
  asOfDate,
}: LoanStatementPDFProps) {
  const totalGoldWeight = loan.gold_items.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalAppraisedValue = loan.gold_items.reduce((sum, item) => sum + item.appraised_value, 0);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          companyName={companyName}
          branchName={branchName}
          address={branchAddress}
          logoUrl={logoUrl}
        />

        <Text style={pdfStyles.documentTitle}>LOAN STATEMENT</Text>

        {/* Loan Summary */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Loan Number</Text>
            <Text style={styles.summaryValue}>{loan.loan_number}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Loan Date</Text>
            <Text style={styles.summaryValue}>{formatDatePrint(loan.loan_date)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={[styles.summaryValue, { textTransform: 'uppercase' }]}>{loan.status}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>As of Date</Text>
            <Text style={styles.summaryValue}>{formatDatePrint(asOfDate)}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Customer Details</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>Name:</Text>
            <Text style={pdfStyles.rowValue}>{loan.customer.full_name}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>Customer Code:</Text>
            <Text style={pdfStyles.rowValue}>{loan.customer.customer_code}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.rowLabel}>Phone:</Text>
            <Text style={pdfStyles.rowValue}>{loan.customer.phone}</Text>
          </View>
          {loan.customer.address && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.rowLabel}>Address:</Text>
              <Text style={pdfStyles.rowValue}>{loan.customer.address}</Text>
            </View>
          )}
        </View>

        {/* Loan Details */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Loan Details</Text>
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Principal Amount:</Text>
                <Text style={pdfStyles.rowValue}>{formatCurrencyPrint(loan.principal_amount)}</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Interest Rate:</Text>
                <Text style={pdfStyles.rowValue}>{loan.interest_rate}% p.m.</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Scheme:</Text>
                <Text style={pdfStyles.rowValue}>{loan.scheme.scheme_name}</Text>
              </View>
            </View>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Tenure:</Text>
                <Text style={pdfStyles.rowValue}>{loan.tenure_days} days</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Maturity Date:</Text>
                <Text style={pdfStyles.rowValue}>{formatDatePrint(loan.maturity_date)}</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Net Disbursed:</Text>
                <Text style={pdfStyles.rowValue}>{formatCurrencyPrint(loan.net_disbursed)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gold Items */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Gold Items Pledged</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '5%' }]}>#</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '30%', textAlign: 'left' }]}>Item</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Gross Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Net Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Purity</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Value</Text>
            </View>
            {loan.gold_items.map((item, index) => (
              <View style={pdfStyles.tableRow} key={index}>
                <Text style={[pdfStyles.tableCell, { width: '5%' }]}>{index + 1}</Text>
                <Text style={[pdfStyles.tableCellLeft, { width: '30%' }]}>{item.item_type}</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%' }]}>{item.gross_weight_grams.toFixed(3)}g</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%' }]}>{item.net_weight_grams.toFixed(3)}g</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%' }]}>{item.purity}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{formatCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
            <View style={[pdfStyles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={[pdfStyles.tableCell, { width: '5%' }]}></Text>
              <Text style={[pdfStyles.tableCellLeft, { width: '30%', fontWeight: 'bold' }]}>Total</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%' }]}></Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', fontWeight: 'bold' }]}>{totalGoldWeight.toFixed(3)}g</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%' }]}></Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{formatCurrencyPrint(totalAppraisedValue)}</Text>
            </View>
          </View>
        </View>

        {/* Interest Payment History */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Interest Payment History</Text>
          {loan.interest_payments.length > 0 ? (
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Receipt #</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Date</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '25%' }]}>Period</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '10%' }]}>Days</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Amount</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Mode</Text>
              </View>
              {loan.interest_payments.map((payment, index) => (
                <View style={pdfStyles.tableRow} key={index}>
                  <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{payment.receipt_number}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '15%' }]}>{formatDatePrint(payment.payment_date)}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '25%' }]}>
                    {formatDatePrint(payment.period_from)} - {formatDatePrint(payment.period_to)}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: '10%' }]}>{payment.days_covered}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '15%' }]}>{formatCurrencyPrint(payment.amount_paid)}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '15%' }]}>{payment.payment_mode}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 9, color: '#666', textAlign: 'center', padding: 10 }}>
              No interest payments recorded yet
            </Text>
          )}
        </View>

        {/* Outstanding Summary */}
        <View style={pdfStyles.amountBox}>
          <View style={pdfStyles.amountRow}>
            <Text style={pdfStyles.amountLabel}>Total Interest Paid:</Text>
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(loan.total_interest_paid)}</Text>
          </View>
          <View style={pdfStyles.amountRow}>
            <Text style={pdfStyles.amountLabel}>Outstanding Principal:</Text>
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(loan.outstanding_principal)}</Text>
          </View>
          <View style={pdfStyles.amountRow}>
            <Text style={pdfStyles.amountLabel}>Outstanding Interest (as of {formatDatePrint(asOfDate)}):</Text>
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(loan.outstanding_interest)}</Text>
          </View>
          <View style={pdfStyles.amountTotal}>
            <Text style={pdfStyles.amountTotalLabel}>Total Outstanding:</Text>
            <Text style={pdfStyles.amountTotalValue}>
              {formatCurrencyPrint(loan.outstanding_principal + loan.outstanding_interest)}
            </Text>
          </View>
        </View>

        <PDFFooter footerEnglish={footerText} showSignatures={false} />
      </Page>
    </Document>
  );
}

export default LoanStatementPDF;
