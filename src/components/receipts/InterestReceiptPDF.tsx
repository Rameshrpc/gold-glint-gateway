import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register a default font
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
    backgroundColor: '#FEF3C7',
    padding: 8,
    color: '#92400E',
  },
  receiptInfo: {
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
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 6,
    fontWeight: 'bold',
    borderBottom: '1 solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1 solid #eee',
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 10,
    borderTop: '2 solid #333',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    width: 150,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#FEF3C7',
    padding: 5,
    marginTop: 5,
  },
  outstanding: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F0FDF4',
    border: '1 solid #86EFAC',
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
    width: '45%',
    borderTop: '1 dashed #333',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 9,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

interface InterestReceiptPDFProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  receipt: {
    number: string;
    date: string;
    mode: string;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  loan: {
    number: string;
    date: string;
    schemeName: string;
    rate: number;
  };
  payment: {
    periodFrom: string;
    periodTo: string;
    days: number;
    interestAmount: number;
    partPayment: number;
    penalty: number;
    totalPaid: number;
    outstandingPrincipal: number;
  };
}

export function InterestReceiptPDF({ company, receipt, customer, loan, payment }: InterestReceiptPDFProps) {
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
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          {company.address && <Text style={styles.companyDetails}>{company.address}</Text>}
          {company.phone && <Text style={styles.companyDetails}>Phone: {company.phone}</Text>}
          {company.email && <Text style={styles.companyDetails}>Email: {company.email}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.title}>INTEREST PAYMENT RECEIPT</Text>

        {/* Receipt Info */}
        <View style={styles.receiptInfo}>
          <View>
            <Text>Receipt No: {receipt.number}</Text>
            <Text>Date: {format(new Date(receipt.date), 'dd MMM yyyy')}</Text>
          </View>
          <View>
            <Text>Mode: {receipt.mode.toUpperCase()}</Text>
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

        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOAN DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Number:</Text>
            <Text style={styles.value}>{loan.number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Date:</Text>
            <Text style={styles.value}>{format(new Date(loan.date), 'dd MMM yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Scheme:</Text>
            <Text style={styles.value}>{loan.schemeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Interest Rate:</Text>
            <Text style={styles.value}>{loan.rate}% p.a.</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Interest Period:</Text>
            <Text style={styles.value}>
              {format(new Date(payment.periodFrom), 'dd MMM yyyy')} to {format(new Date(payment.periodTo), 'dd MMM yyyy')} ({payment.days} days)
            </Text>
          </View>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Description</Text>
              <Text style={styles.tableCellRight}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Interest @ {loan.rate}% p.a.</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(payment.interestAmount)}</Text>
            </View>
            {payment.partPayment > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Part Payment (Principal Reduction)</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(payment.partPayment)}</Text>
              </View>
            )}
            {payment.penalty > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Penalty</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(payment.penalty)}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalSection}>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.totalLabel}>TOTAL PAID:</Text>
              <Text style={styles.totalValue}>{formatCurrency(payment.totalPaid)}</Text>
            </View>
          </View>
        </View>

        {/* Outstanding */}
        <View style={styles.outstanding}>
          <View style={styles.row}>
            <Text style={styles.label}>Outstanding Principal:</Text>
            <Text style={styles.value}>{formatCurrency(payment.outstandingPrincipal)}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Authorized Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            *** Thank You for Your Business *** {'\n'}
            This is a computer generated receipt. Subject to Terms & Conditions.
          </Text>
        </View>
      </Page>
    </Document>
  );
}