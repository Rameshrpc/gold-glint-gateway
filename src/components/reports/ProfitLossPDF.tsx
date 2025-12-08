import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ProfitLossEntry } from '@/hooks/useFinancialReports';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 2 },
  date: { fontSize: 9, color: '#888' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  table: { width: '100%' },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4
  },
  groupRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    fontWeight: 'bold'
  },
  colName: { width: '70%', paddingHorizontal: 4 },
  colAmount: { width: '30%', paddingHorizontal: 4, textAlign: 'right' },
  totalRow: { 
    flexDirection: 'row', 
    paddingVertical: 6,
    fontWeight: 'bold',
    marginTop: 4
  },
  incomeTotal: { backgroundColor: '#dcfce7' },
  expenseTotal: { backgroundColor: '#fee2e2' },
  netRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 12
  },
  profitRow: { backgroundColor: '#dbeafe' },
  lossRow: { backgroundColor: '#fef3c7' },
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
  income: ProfitLossEntry[];
  expenses: ProfitLossEntry[];
  fromDate: string;
  toDate: string;
  companyName: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export function ProfitLossPDF({ income, expenses, fromDate, toDate, companyName, totalIncome, totalExpenses, netProfit }: Props) {
  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const groupByName = (entries: ProfitLossEntry[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.group_name]) acc[entry.group_name] = [];
      acc[entry.group_name].push(entry);
      return acc;
    }, {} as Record<string, ProfitLossEntry[]>);
  };

  const incomeGroups = groupByName(income);
  const expenseGroups = groupByName(expenses);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>Profit & Loss Statement</Text>
          <Text style={styles.date}>
            For the period {format(new Date(fromDate), 'dd MMM yyyy')} to {format(new Date(toDate), 'dd MMM yyyy')}
          </Text>
        </View>

        {/* Income Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income</Text>
          <View style={styles.table}>
            {Object.entries(incomeGroups).map(([groupName, groupEntries]) => (
              <View key={groupName}>
                <View style={styles.groupRow}>
                  <Text style={styles.colName}>{groupName}</Text>
                  <Text style={styles.colAmount}></Text>
                </View>
                {groupEntries.map(entry => (
                  <View key={entry.account_id} style={styles.tableRow}>
                    <Text style={{ ...styles.colName, paddingLeft: 20 }}>{entry.account_name}</Text>
                    <Text style={styles.colAmount}>{formatCurrency(entry.amount)}</Text>
                  </View>
                ))}
              </View>
            ))}
            <View style={[styles.totalRow, styles.incomeTotal]}>
              <Text style={styles.colName}>Total Income</Text>
              <Text style={styles.colAmount}>{formatCurrency(totalIncome)}</Text>
            </View>
          </View>
        </View>

        {/* Expenses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          <View style={styles.table}>
            {Object.entries(expenseGroups).map(([groupName, groupEntries]) => (
              <View key={groupName}>
                <View style={styles.groupRow}>
                  <Text style={styles.colName}>{groupName}</Text>
                  <Text style={styles.colAmount}></Text>
                </View>
                {groupEntries.map(entry => (
                  <View key={entry.account_id} style={styles.tableRow}>
                    <Text style={{ ...styles.colName, paddingLeft: 20 }}>{entry.account_name}</Text>
                    <Text style={styles.colAmount}>{formatCurrency(entry.amount)}</Text>
                  </View>
                ))}
              </View>
            ))}
            <View style={[styles.totalRow, styles.expenseTotal]}>
              <Text style={styles.colName}>Total Expenses</Text>
              <Text style={styles.colAmount}>{formatCurrency(totalExpenses)}</Text>
            </View>
          </View>
        </View>

        {/* Net Profit/Loss */}
        <View style={[styles.netRow, netProfit >= 0 ? styles.profitRow : styles.lossRow]}>
          <Text style={styles.colName}>{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</Text>
          <Text style={styles.colAmount}>{formatCurrency(netProfit)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          <Text>Profit & Loss Statement</Text>
        </View>
      </Page>
    </Document>
  );
}
