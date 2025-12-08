import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { TrialBalanceEntry } from '@/hooks/useFinancialReports';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 2 },
  date: { fontSize: 9, color: '#888' },
  table: { width: '100%', marginTop: 10 },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#f3f4f6', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    fontWeight: 'bold'
  },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4
  },
  groupHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    paddingVertical: 4,
    fontWeight: 'bold'
  },
  colCode: { width: '12%', paddingHorizontal: 4 },
  colName: { width: '36%', paddingHorizontal: 4 },
  colGroup: { width: '20%', paddingHorizontal: 4 },
  colDebit: { width: '16%', paddingHorizontal: 4, textAlign: 'right' },
  colCredit: { width: '16%', paddingHorizontal: 4, textAlign: 'right' },
  totalRow: { 
    flexDirection: 'row', 
    backgroundColor: '#dbeafe',
    paddingVertical: 6,
    fontWeight: 'bold',
    marginTop: 4
  },
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
  entries: TrialBalanceEntry[];
  asOfDate: string;
  companyName: string;
  totalDebit: number;
  totalCredit: number;
}

export function TrialBalancePDF({ entries, asOfDate, companyName, totalDebit, totalCredit }: Props) {
  const formatCurrency = (amount: number) => {
    return amount > 0 ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-';
  };

  const typeLabels: Record<string, string> = {
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    income: 'Income',
    expense: 'Expenses'
  };

  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.account_type]) acc[entry.account_type] = [];
    acc[entry.account_type].push(entry);
    return acc;
  }, {} as Record<string, TrialBalanceEntry[]>);

  const typeOrder = ['asset', 'liability', 'equity', 'income', 'expense'];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>Trial Balance</Text>
          <Text style={styles.date}>As of {format(new Date(asOfDate), 'dd MMMM yyyy')}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colCode}>Code</Text>
            <Text style={styles.colName}>Account Name</Text>
            <Text style={styles.colGroup}>Group</Text>
            <Text style={styles.colDebit}>Debit (₹)</Text>
            <Text style={styles.colCredit}>Credit (₹)</Text>
          </View>

          {typeOrder.map(type => {
            const typeEntries = groupedEntries[type] || [];
            if (typeEntries.length === 0) return null;

            return (
              <View key={type}>
                <View style={styles.groupHeader}>
                  <Text style={{ ...styles.colName, width: '100%' }}>{typeLabels[type]}</Text>
                </View>
                {typeEntries.map(entry => (
                  <View key={entry.account_id} style={styles.tableRow}>
                    <Text style={styles.colCode}>{entry.account_code}</Text>
                    <Text style={styles.colName}>{entry.account_name}</Text>
                    <Text style={styles.colGroup}>{entry.group_name}</Text>
                    <Text style={styles.colDebit}>{formatCurrency(entry.debit_balance)}</Text>
                    <Text style={styles.colCredit}>{formatCurrency(entry.credit_balance)}</Text>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={{ ...styles.colName, width: '68%' }}>Grand Total</Text>
            <Text style={styles.colDebit}>{formatCurrency(totalDebit)}</Text>
            <Text style={styles.colCredit}>{formatCurrency(totalCredit)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          <Text>Trial Balance Report</Text>
        </View>
      </Page>
    </Document>
  );
}
