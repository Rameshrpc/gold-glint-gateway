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
    backgroundColor: '#DCFCE7',
    padding: 8,
    color: '#166534',
  },
  redemptionInfo: {
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
  settlementBox: {
    backgroundColor: '#F0FDF4',
    border: '1 solid #86EFAC',
    padding: 10,
    marginTop: 10,
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
  rebateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    color: '#16A34A',
  },
  totalSettlement: {
    backgroundColor: '#DCFCE7',
    padding: 8,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '2 solid #166534',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  goldReleaseBox: {
    backgroundColor: '#FEF3C7',
    border: '1 solid #F59E0B',
    padding: 10,
    marginTop: 15,
  },
  goldReleaseTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1 solid #333',
    marginRight: 8,
    textAlign: 'center',
    fontSize: 8,
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
  declaration: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F3F4F6',
    fontSize: 8,
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
  closedBadge: {
    backgroundColor: '#166534',
    color: '#fff',
    padding: '4 12',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
});

interface RedemptionReceiptPDFProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  redemption: {
    number: string;
    date: string;
    paymentMode: string;
    paymentReference?: string;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  loan: {
    number: string;
    date: string;
    originalPrincipal: number;
    tenureDays: number;
    daysSinceLoan: number;
  };
  settlement: {
    outstandingPrincipal: number;
    interestDue: number;
    penalty: number;
    rebateAmount: number;
    totalSettlement: number;
    amountReceived: number;
  };
  goldRelease: {
    releasedTo: string;
    releaseDate: string;
    identityVerified: boolean;
  };
}

export function RedemptionReceiptPDF({ company, redemption, customer, loan, settlement, goldRelease }: RedemptionReceiptPDFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        <Text style={styles.title}>LOAN SETTLEMENT / REDEMPTION RECEIPT</Text>

        {/* Redemption Info */}
        <View style={styles.redemptionInfo}>
          <View>
            <Text>Redemption No: {redemption.number}</Text>
            <Text>Date: {format(new Date(redemption.date), 'dd MMM yyyy')}</Text>
          </View>
          <View>
            <Text>Mode: {redemption.paymentMode.toUpperCase()}</Text>
            {redemption.paymentReference && <Text>Ref: {redemption.paymentReference}</Text>}
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

        {/* Loan Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOAN SUMMARY</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Number:</Text>
            <Text style={styles.value}>{loan.number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Date:</Text>
            <Text style={styles.value}>{format(new Date(loan.date), 'dd MMM yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Original Principal:</Text>
            <Text style={styles.value}>{formatCurrency(loan.originalPrincipal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Tenure:</Text>
            <Text style={styles.value}>{loan.tenureDays} days</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Days Used:</Text>
            <Text style={styles.value}>{loan.daysSinceLoan} days</Text>
          </View>
        </View>

        {/* Settlement Calculation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTLEMENT CALCULATION</Text>
          <View style={styles.settlementBox}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Outstanding Principal</Text>
              <Text style={styles.calcValue}>{formatCurrency(settlement.outstandingPrincipal)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Interest Due</Text>
              <Text style={styles.calcValue}>{formatCurrency(settlement.interestDue)}</Text>
            </View>
            {settlement.penalty > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Penalty</Text>
                <Text style={styles.calcValue}>{formatCurrency(settlement.penalty)}</Text>
              </View>
            )}
            {settlement.rebateAmount > 0 && (
              <View style={styles.rebateRow}>
                <Text>Less: Rebate (Unused Days)</Text>
                <Text>- {formatCurrency(settlement.rebateAmount)}</Text>
              </View>
            )}
            <View style={styles.totalSettlement}>
              <Text style={styles.totalLabel}>TOTAL SETTLEMENT</Text>
              <Text style={styles.totalValue}>{formatCurrency(settlement.totalSettlement)}</Text>
            </View>
            <View style={[styles.calcRow, { marginTop: 10 }]}>
              <Text style={styles.calcLabel}>Amount Received</Text>
              <Text style={styles.calcValue}>{formatCurrency(settlement.amountReceived)}</Text>
            </View>
          </View>
        </View>

        {/* Gold Release */}
        <View style={styles.goldReleaseBox}>
          <Text style={styles.goldReleaseTitle}>GOLD RELEASE CONFIRMATION</Text>
          <View style={styles.verificationRow}>
            <View style={styles.checkbox}>
              <Text>{goldRelease.identityVerified ? '✓' : ''}</Text>
            </View>
            <Text>Identity Verified</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gold Released To:</Text>
            <Text style={styles.value}>{goldRelease.releasedTo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Release Date:</Text>
            <Text style={styles.value}>{format(new Date(goldRelease.releaseDate), 'dd MMM yyyy')}</Text>
          </View>
        </View>

        {/* Loan Closed Badge */}
        <View style={styles.closedBadge}>
          <Text>LOAN CLOSED - SETTLEMENT COMPLETE</Text>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text>
            I, {customer.name}, hereby confirm that I have received back all the gold ornaments 
            pledged against the above loan in good condition. The loan has been fully settled and 
            I have no further claims against the company.
          </Text>
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
          <Text>This is a computer generated document. Please retain for your records.</Text>
        </View>
      </Page>
    </Document>
  );
}