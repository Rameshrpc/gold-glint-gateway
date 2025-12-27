import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, formatCurrencyPrint, formatDatePrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFFooter } from '../shared/PDFFooter';

interface LoanSummary {
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  interest_rate: number;
  maturity_date: string;
  status: string;
  total_interest_paid: number;
  outstanding_principal: number;
  outstanding_interest: number;
  gold_weight_grams: number;
  scheme_name: string;
}

interface CustomerData {
  full_name: string;
  customer_code: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface CustomerStatementPDFProps {
  customer: CustomerData;
  loans: LoanSummary[];
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
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusActive: {
    color: '#16a34a',
  },
  statusClosed: {
    color: '#6b7280',
  },
  loanCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  loanNumber: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  loanStatus: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#e0e0e0',
    textTransform: 'uppercase',
  },
  loanDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loanDetailItem: {
    width: '50%',
    marginBottom: 4,
  },
  loanDetailLabel: {
    fontSize: 8,
    color: '#666',
  },
  loanDetailValue: {
    fontSize: 9,
  },
});

export function CustomerStatementPDF({
  customer,
  loans,
  companyName,
  branchName,
  branchAddress,
  logoUrl,
  footerText,
  asOfDate,
}: CustomerStatementPDFProps) {
  const activeLoans = loans.filter(l => l.status === 'active');
  const closedLoans = loans.filter(l => l.status === 'closed');
  
  const totalPrincipal = activeLoans.reduce((sum, l) => sum + l.outstanding_principal, 0);
  const totalInterest = activeLoans.reduce((sum, l) => sum + l.outstanding_interest, 0);
  const totalGoldWeight = activeLoans.reduce((sum, l) => sum + l.gold_weight_grams, 0);
  const totalInterestPaid = loans.reduce((sum, l) => sum + l.total_interest_paid, 0);

  const getStatusStyle = (status: string) => {
    return status === 'active' ? styles.statusActive : styles.statusClosed;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          companyName={companyName}
          branchName={branchName}
          address={branchAddress}
          logoUrl={logoUrl}
        />

        <Text style={pdfStyles.documentTitle}>CUSTOMER STATEMENT</Text>

        {/* Customer Details */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Customer Details</Text>
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Name:</Text>
                <Text style={pdfStyles.rowValue}>{customer.full_name}</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Customer Code:</Text>
                <Text style={pdfStyles.rowValue}>{customer.customer_code}</Text>
              </View>
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Phone:</Text>
                <Text style={pdfStyles.rowValue}>{customer.phone}</Text>
              </View>
              {customer.email && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.rowLabel}>Email:</Text>
                  <Text style={pdfStyles.rowValue}>{customer.email}</Text>
                </View>
              )}
            </View>
            <View style={pdfStyles.column}>
              {customer.address && (
                <View style={pdfStyles.row}>
                  <Text style={pdfStyles.rowLabel}>Address:</Text>
                  <Text style={pdfStyles.rowValue}>
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                    {customer.pincode && ` - ${customer.pincode}`}
                  </Text>
                </View>
              )}
              <View style={pdfStyles.row}>
                <Text style={pdfStyles.rowLabel}>Statement Date:</Text>
                <Text style={pdfStyles.rowValue}>{formatDatePrint(asOfDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Portfolio Summary */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Active Loans</Text>
            <Text style={styles.summaryValue}>{activeLoans.length}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Principal</Text>
            <Text style={styles.summaryValue}>{formatCurrencyPrint(totalPrincipal)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Interest Due</Text>
            <Text style={styles.summaryValue}>{formatCurrencyPrint(totalInterest)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Gold in Custody</Text>
            <Text style={styles.summaryValue}>{totalGoldWeight.toFixed(2)}g</Text>
          </View>
        </View>

        {/* Active Loans */}
        {activeLoans.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Active Loans</Text>
            {activeLoans.map((loan, index) => (
              <View style={styles.loanCard} key={index}>
                <View style={styles.loanHeader}>
                  <Text style={styles.loanNumber}>{loan.loan_number}</Text>
                  <Text style={[styles.loanStatus, { backgroundColor: '#dcfce7', color: '#16a34a' }]}>ACTIVE</Text>
                </View>
                <View style={styles.loanDetails}>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Loan Date</Text>
                    <Text style={styles.loanDetailValue}>{formatDatePrint(loan.loan_date)}</Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Maturity Date</Text>
                    <Text style={styles.loanDetailValue}>{formatDatePrint(loan.maturity_date)}</Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Principal</Text>
                    <Text style={styles.loanDetailValue}>{formatCurrencyPrint(loan.principal_amount)}</Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Interest Rate</Text>
                    <Text style={styles.loanDetailValue}>{loan.interest_rate}% p.m.</Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Outstanding Principal</Text>
                    <Text style={styles.loanDetailValue}>{formatCurrencyPrint(loan.outstanding_principal)}</Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Outstanding Interest</Text>
                    <Text style={styles.loanDetailValue}>{formatCurrencyPrint(loan.outstanding_interest)}</Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Gold Weight</Text>
                    <Text style={styles.loanDetailValue}>{loan.gold_weight_grams.toFixed(3)}g</Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Scheme</Text>
                    <Text style={styles.loanDetailValue}>{loan.scheme_name}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Closed Loans Summary */}
        {closedLoans.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Closed Loans ({closedLoans.length})</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { width: '25%' }]}>Loan #</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Loan Date</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Principal</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Interest Paid</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Status</Text>
              </View>
              {closedLoans.map((loan, index) => (
                <View style={pdfStyles.tableRow} key={index}>
                  <Text style={[pdfStyles.tableCell, { width: '25%' }]}>{loan.loan_number}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{formatDatePrint(loan.loan_date)}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{formatCurrencyPrint(loan.principal_amount)}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{formatCurrencyPrint(loan.total_interest_paid)}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '15%', textTransform: 'uppercase' }]}>{loan.status}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Total Outstanding */}
        <View style={pdfStyles.amountBox}>
          <View style={pdfStyles.amountRow}>
            <Text style={pdfStyles.amountLabel}>Total Active Loans:</Text>
            <Text style={pdfStyles.amountValue}>{activeLoans.length}</Text>
          </View>
          <View style={pdfStyles.amountRow}>
            <Text style={pdfStyles.amountLabel}>Total Principal Outstanding:</Text>
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(totalPrincipal)}</Text>
          </View>
          <View style={pdfStyles.amountRow}>
            <Text style={pdfStyles.amountLabel}>Total Interest Outstanding:</Text>
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(totalInterest)}</Text>
          </View>
          <View style={pdfStyles.amountRow}>
            <Text style={pdfStyles.amountLabel}>Total Interest Paid (All Time):</Text>
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(totalInterestPaid)}</Text>
          </View>
          <View style={pdfStyles.amountTotal}>
            <Text style={pdfStyles.amountTotalLabel}>Total Outstanding:</Text>
            <Text style={pdfStyles.amountTotalValue}>{formatCurrencyPrint(totalPrincipal + totalInterest)}</Text>
          </View>
        </View>

        <PDFFooter footerEnglish={footerText} showSignatures={false} />
      </Page>
    </Document>
  );
}

export default CustomerStatementPDF;
