import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#B45309',
  },
  companyDetails: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: '#EDE9FE',
    padding: 8,
    color: '#5B21B6',
  },
  transactionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottom: '1 solid #ddd',
    paddingBottom: 8,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    padding: 5,
    color: '#374151',
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
  twoColumnSection: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  column: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
  },
  oldLoanColumn: {
    backgroundColor: '#FEF3C7',
    border: '1 solid #F59E0B',
  },
  newLoanColumn: {
    backgroundColor: '#DCFCE7',
    border: '1 solid #22C55E',
  },
  columnTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  calcLabel: {
    color: '#374151',
  },
  calcValue: {
    fontWeight: 'bold',
  },
  netBox: {
    backgroundColor: '#EDE9FE',
    border: '2 solid #7C3AED',
    padding: 15,
    marginVertical: 15,
    textAlign: 'center',
  },
  netTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5B21B6',
    marginBottom: 8,
  },
  netAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B21B6',
  },
  netDirection: {
    fontSize: 10,
    color: '#7C3AED',
    marginTop: 4,
  },
  goldSection: {
    marginBottom: 15,
    backgroundColor: '#FFFBEB',
    border: '1 solid #F59E0B',
    padding: 10,
  },
  goldTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottom: '1 solid #E5E7EB',
    fontSize: 8,
  },
  tableCell: {
    flex: 1,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '30%',
    borderTop: '1 dashed #333',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
  },
  badge: {
    padding: '4 12',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  closedBadge: {
    backgroundColor: '#F59E0B',
    color: '#fff',
  },
  newBadge: {
    backgroundColor: '#22C55E',
    color: '#fff',
  },
});

interface ReloanReceiptPDFProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  transaction: {
    date: string;
    paymentMode: string;
    paymentReference?: string;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  oldLoan: {
    number: string;
    date: string;
    originalPrincipal: number;
    daysSinceLoan: number;
    outstandingPrincipal: number;
    interestDue: number;
    penalty: number;
    rebateAmount: number;
    totalSettlement: number;
  };
  newLoan: {
    number: string;
    date: string;
    principalAmount: number;
    advanceInterest: number;
    processingFee: number;
    documentCharges: number;
    netDisbursement: number;
    tenureDays: number;
    maturityDate: string;
    schemeName: string;
  };
  netSettlement: {
    amount: number;
    direction: 'to_customer' | 'from_customer';
  };
  goldItems: Array<{
    item_type: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity: string;
    appraised_value: number;
  }>;
}

export function ReloanReceiptPDF({ 
  company, 
  transaction, 
  customer, 
  oldLoan, 
  newLoan, 
  netSettlement,
  goldItems 
}: ReloanReceiptPDFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          {company.address && <Text style={styles.companyDetails}>{company.address}</Text>}
          {company.phone && <Text style={styles.companyDetails}>Phone: {company.phone}</Text>}
          {company.email && <Text style={styles.companyDetails}>Email: {company.email}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.title}>RELOAN / LOAN TOP-UP RECEIPT</Text>

        {/* Transaction Info */}
        <View style={styles.transactionInfo}>
          <View>
            <Text>Date: {format(new Date(transaction.date), 'dd MMM yyyy')}</Text>
            <Text>Mode: {transaction.paymentMode.toUpperCase()}</Text>
          </View>
          <View>
            <Text>Old Loan: {oldLoan.number}</Text>
            <Text>New Loan: {newLoan.number}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Code:</Text>
            <Text style={styles.value}>{customer.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{customer.phone}</Text>
          </View>
        </View>

        {/* Two Column: Old vs New Loan */}
        <View style={styles.twoColumnSection}>
          {/* Old Loan Settlement */}
          <View style={[styles.column, styles.oldLoanColumn]}>
            <Text style={[styles.columnTitle, { color: '#92400E' }]}>OLD LOAN CLOSURE</Text>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Outstanding Principal</Text>
              <Text style={styles.calcValue}>{formatCurrency(oldLoan.outstandingPrincipal)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Interest Due</Text>
              <Text style={styles.calcValue}>{formatCurrency(oldLoan.interestDue)}</Text>
            </View>
            {oldLoan.penalty > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Penalty</Text>
                <Text style={styles.calcValue}>{formatCurrency(oldLoan.penalty)}</Text>
              </View>
            )}
            {oldLoan.rebateAmount > 0 && (
              <View style={[styles.calcRow, { color: '#16A34A' }]}>
                <Text>Less: Rebate</Text>
                <Text>- {formatCurrency(oldLoan.rebateAmount)}</Text>
              </View>
            )}
            <View style={[styles.calcRow, { borderTop: '1 solid #92400E', paddingTop: 5, marginTop: 5 }]}>
              <Text style={[styles.calcLabel, { fontWeight: 'bold' }]}>Settlement Amount</Text>
              <Text style={styles.calcValue}>{formatCurrency(oldLoan.totalSettlement)}</Text>
            </View>
          </View>

          {/* New Loan */}
          <View style={[styles.column, styles.newLoanColumn]}>
            <Text style={[styles.columnTitle, { color: '#166534' }]}>NEW LOAN CREATED</Text>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Approved Amount</Text>
              <Text style={styles.calcValue}>{formatCurrency(newLoan.principalAmount)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Less: Advance Interest</Text>
              <Text style={styles.calcValue}>- {formatCurrency(newLoan.advanceInterest)}</Text>
            </View>
            {newLoan.documentCharges > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Less: Document Charges</Text>
                <Text style={styles.calcValue}>- {formatCurrency(newLoan.documentCharges)}</Text>
              </View>
            )}
            {newLoan.processingFee > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Less: Processing Fee</Text>
                <Text style={styles.calcValue}>- {formatCurrency(newLoan.processingFee)}</Text>
              </View>
            )}
            <View style={[styles.calcRow, { borderTop: '1 solid #166534', paddingTop: 5, marginTop: 5 }]}>
              <Text style={[styles.calcLabel, { fontWeight: 'bold' }]}>Net Disbursement</Text>
              <Text style={styles.calcValue}>{formatCurrency(newLoan.netDisbursement)}</Text>
            </View>
          </View>
        </View>

        {/* Net Settlement Box */}
        <View style={styles.netBox}>
          <Text style={styles.netTitle}>NET SETTLEMENT</Text>
          <Text style={styles.netAmount}>
            {netSettlement.direction === 'to_customer' ? '+' : '-'} {formatCurrency(Math.abs(netSettlement.amount))}
          </Text>
          <Text style={styles.netDirection}>
            {netSettlement.direction === 'to_customer' 
              ? '↑ Amount Paid to Customer' 
              : '↓ Amount Received from Customer'}
          </Text>
        </View>

        {/* Gold Items (Pledged - Not Released) */}
        <View style={styles.goldSection}>
          <Text style={styles.goldTitle}>GOLD ITEMS (CONTINUES AS PLEDGE FOR NEW LOAN)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Item</Text>
            <Text style={styles.tableCell}>Gross Wt</Text>
            <Text style={styles.tableCell}>Net Wt</Text>
            <Text style={styles.tableCell}>Purity</Text>
            <Text style={styles.tableCell}>Value</Text>
          </View>
          {goldItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.item_type}</Text>
              <Text style={styles.tableCell}>{item.gross_weight_grams.toFixed(2)}g</Text>
              <Text style={styles.tableCell}>{item.net_weight_grams.toFixed(2)}g</Text>
              <Text style={styles.tableCell}>{item.purity}</Text>
              <Text style={styles.tableCell}>{formatCurrency(item.appraised_value)}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { fontWeight: 'bold' }]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>TOTAL</Text>
            <Text style={styles.tableCell}>{totalWeight.toFixed(2)}g</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>{formatCurrency(totalValue)}</Text>
          </View>
        </View>

        {/* New Loan Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NEW LOAN TERMS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Scheme:</Text>
            <Text style={styles.value}>{newLoan.schemeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tenure:</Text>
            <Text style={styles.value}>{newLoan.tenureDays} days</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Maturity Date:</Text>
            <Text style={styles.value}>{format(new Date(newLoan.maturityDate), 'dd MMM yyyy')}</Text>
          </View>
        </View>

        {/* Status Badges */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <View style={[styles.badge, styles.closedBadge]}>
            <Text>{oldLoan.number} - CLOSED</Text>
          </View>
          <View style={[styles.badge, styles.newBadge]}>
            <Text>{newLoan.number} - ACTIVE</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Witness Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Authorized Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer generated document. Gold items remain pledged against the new loan.</Text>
        </View>
      </Page>
    </Document>
  );
}