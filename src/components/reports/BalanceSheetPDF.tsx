import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { BalanceSheetEntry } from '@/hooks/useFinancialReports';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 2 },
  date: { fontSize: 9, color: '#888' },
  columns: { flexDirection: 'row', marginTop: 10 },
  column: { width: '50%', paddingHorizontal: 5 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  table: { width: '100%' },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#e5e7eb',
    paddingVertical: 3
  },
  groupRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 3,
    fontWeight: 'bold'
  },
  colName: { width: '65%', paddingHorizontal: 2, fontSize: 9 },
  colAmount: { width: '35%', paddingHorizontal: 2, textAlign: 'right', fontSize: 9 },
  totalRow: { 
    flexDirection: 'row', 
    paddingVertical: 4,
    fontWeight: 'bold',
    marginTop: 4
  },
  assetTotal: { backgroundColor: '#dbeafe' },
  liabilityTotal: { backgroundColor: '#fed7aa' },
  equityTotal: { backgroundColor: '#e9d5ff' },
  balanceCheck: {
    marginTop: 15,
    padding: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 11
  },
  balanced: { backgroundColor: '#dcfce7' },
  unbalanced: { backgroundColor: '#fee2e2' },
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
  assets: BalanceSheetEntry[];
  liabilities: BalanceSheetEntry[];
  equity: BalanceSheetEntry[];
  asOfDate: string;
  companyName: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
}

export function BalanceSheetPDF({ 
  assets, liabilities, equity, asOfDate, companyName,
  totalAssets, totalLiabilities, totalEquity, retainedEarnings 
}: Props) {
  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const groupByName = (entries: BalanceSheetEntry[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.group_name]) acc[entry.group_name] = [];
      acc[entry.group_name].push(entry);
      return acc;
    }, {} as Record<string, BalanceSheetEntry[]>);
  };

  const assetGroups = groupByName(assets);
  const liabilityGroups = groupByName(liabilities);
  const equityGroups = groupByName(equity);

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  const renderSection = (
    title: string,
    groups: Record<string, BalanceSheetEntry[]>,
    total: number,
    totalStyle: any
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        {Object.entries(groups).map(([groupName, groupEntries]) => (
          <View key={groupName}>
            <View style={styles.groupRow}>
              <Text style={styles.colName}>{groupName}</Text>
              <Text style={styles.colAmount}></Text>
            </View>
            {groupEntries.map(entry => (
              <View key={entry.account_id} style={styles.tableRow}>
                <Text style={{ ...styles.colName, paddingLeft: 10 }}>{entry.account_name}</Text>
                <Text style={styles.colAmount}>{formatCurrency(entry.balance)}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={[styles.totalRow, totalStyle]}>
          <Text style={styles.colName}>Total {title}</Text>
          <Text style={styles.colAmount}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>Balance Sheet</Text>
          <Text style={styles.date}>As of {format(new Date(asOfDate), 'dd MMMM yyyy')}</Text>
        </View>

        <View style={styles.columns}>
          {/* Left Column - Assets */}
          <View style={styles.column}>
            {renderSection('Assets', assetGroups, totalAssets, styles.assetTotal)}
          </View>

          {/* Right Column - Liabilities & Equity */}
          <View style={styles.column}>
            {renderSection('Liabilities', liabilityGroups, totalLiabilities, styles.liabilityTotal)}
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equity</Text>
              <View style={styles.table}>
                {Object.entries(equityGroups).map(([groupName, groupEntries]) => (
                  <View key={groupName}>
                    <View style={styles.groupRow}>
                      <Text style={styles.colName}>{groupName}</Text>
                      <Text style={styles.colAmount}></Text>
                    </View>
                    {groupEntries.map(entry => (
                      <View key={entry.account_id} style={styles.tableRow}>
                        <Text style={{ ...styles.colName, paddingLeft: 10 }}>{entry.account_name}</Text>
                        <Text style={styles.colAmount}>{formatCurrency(entry.balance)}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {retainedEarnings !== 0 && (
                  <View style={styles.tableRow}>
                    <Text style={styles.colName}>Retained Earnings</Text>
                    <Text style={styles.colAmount}>{formatCurrency(retainedEarnings)}</Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.equityTotal]}>
                  <Text style={styles.colName}>Total Equity</Text>
                  <Text style={styles.colAmount}>{formatCurrency(totalEquity)}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.totalRow, { backgroundColor: '#e5e7eb', marginTop: 10, padding: 6 }]}>
              <Text style={styles.colName}>Liabilities + Equity</Text>
              <Text style={styles.colAmount}>{formatCurrency(totalLiabilities + totalEquity)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.balanceCheck, isBalanced ? styles.balanced : styles.unbalanced]}>
          <Text>{isBalanced ? '✓ Books are Balanced' : '✗ Books are NOT Balanced'}</Text>
          <Text style={{ fontSize: 9, marginTop: 4 }}>
            Assets: {formatCurrency(totalAssets)} = Liabilities + Equity: {formatCurrency(totalLiabilities + totalEquity)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
          <Text>Balance Sheet</Text>
        </View>
      </Page>
    </Document>
  );
}
