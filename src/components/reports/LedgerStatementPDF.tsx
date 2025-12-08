import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { LedgerEntry } from '@/hooks/useFinancialReports';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  header: { marginBottom: 15, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  accountInfo: { fontSize: 11, marginBottom: 2 },
  date: { fontSize: 8, color: '#888' },
  balanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4
  },
  balanceItem: { textAlign: 'center' },
  balanceLabel: { fontSize: 8, color: '#666' },
  balanceValue: { fontSize: 11, fontWeight: 'bold' },
  table: { width: '100%', marginTop: 10 },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#e5e7eb', 
    paddingVertical: 5,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db'
  },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#e5e7eb',
    paddingVertical: 3
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 5,
    fontWeight: 'bold'
  },
  colDate: { width: '10%', paddingHorizontal: 2 },
  colVoucher: { width: '12%', paddingHorizontal: 2 },
  colType: { width: '8%', paddingHorizontal: 2 },
  colNarration: { width: '30%', paddingHorizontal: 2 },
  colDebit: { width: '13%', paddingHorizontal: 2, textAlign: 'right' },
  colCredit: { width: '13%', paddingHorizontal: 2, textAlign: 'right' },
  colBalance: { width: '14%', paddingHorizontal: 2, textAlign: 'right' },
  footer: { 
    position: 'absolute', 
    bottom: 20, 
    left: 30, 
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#888'
  }
});

interface Props {
  accountCode: string;
  accountName: string;
  entries: LedgerEntry[];
  fromDate: string;
  toDate: string;
  companyName: string;
  openingBalance: number;
  closingBalance: number;
}

export function LedgerStatementPDF({ 
  accountCode, accountName, entries, fromDate, toDate, 
  companyName, openingBalance, closingBalance 
}: Props) {
  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatBalance = (amount: number) => {
    return `${formatCurrency(amount)} ${amount >= 0 ? 'Dr' : 'Cr'}`;
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit_amount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit_amount, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.accountInfo}>Ledger Statement: {accountCode} - {accountName}</Text>
          <Text style={styles.date}>
            Period: {format(new Date(fromDate), 'dd MMM yyyy')} to {format(new Date(toDate), 'dd MMM yyyy')}
          </Text>
        </View>

        <View style={styles.balanceBox}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Opening Balance</Text>
            <Text style={styles.balanceValue}>{formatBalance(openingBalance)}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Total Debit</Text>
            <Text style={styles.balanceValue}>{formatCurrency(totalDebit)}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Total Credit</Text>
            <Text style={styles.balanceValue}>{formatCurrency(totalCredit)}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Closing Balance</Text>
            <Text style={styles.balanceValue}>{formatBalance(closingBalance)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colVoucher}>Voucher</Text>
            <Text style={styles.colType}>Type</Text>
            <Text style={styles.colNarration}>Narration</Text>
            <Text style={styles.colDebit}>Debit (₹)</Text>
            <Text style={styles.colCredit}>Credit (₹)</Text>
            <Text style={styles.colBalance}>Balance</Text>
          </View>

          {entries.map((entry, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDate}>{format(new Date(entry.voucher_date), 'dd/MM/yy')}</Text>
              <Text style={styles.colVoucher}>{entry.voucher_number}</Text>
              <Text style={styles.colType}>{entry.voucher_type}</Text>
              <Text style={styles.colNarration}>{entry.narration?.substring(0, 40)}</Text>
              <Text style={styles.colDebit}>{entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}</Text>
              <Text style={styles.colCredit}>{entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}</Text>
              <Text style={styles.colBalance}>{formatBalance(entry.running_balance)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={{ ...styles.colNarration, width: '60%' }}>Totals</Text>
            <Text style={styles.colDebit}>{formatCurrency(totalDebit)}</Text>
            <Text style={styles.colCredit}>{formatCurrency(totalCredit)}</Text>
            <Text style={styles.colBalance}></Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          <Text>Ledger Statement - {accountName}</Text>
        </View>
      </Page>
    </Document>
  );
}
