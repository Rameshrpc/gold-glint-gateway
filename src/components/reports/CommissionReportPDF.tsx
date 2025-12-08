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
    fontSize: 9,
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: '#FEF3C7',
    padding: 6,
    color: '#92400E',
  },
  dateRange: {
    textAlign: 'center',
    fontSize: 9,
    marginBottom: 15,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    padding: 5,
    color: '#374151',
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 5,
    fontWeight: 'bold',
    borderBottom: '1 solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '1 solid #eee',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '1 solid #eee',
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
    fontSize: 8,
  },
  tableCellSmall: {
    flex: 0.7,
    fontSize: 8,
  },
  tableCellLarge: {
    flex: 1.5,
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
  },
  totalRow: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: '#FEF3C7',
    fontWeight: 'bold',
  },
});

interface AgentSummaryItem {
  agent: { id: string; full_name: string; agent_code: string };
  totalLoans: number;
  totalPrincipal: number;
  totalCommission: number;
  pending: number;
  approved: number;
  paid: number;
}

interface PaymentHistoryItem {
  id: string;
  payment_date: string | null;
  commission_amount: number;
  payment_mode: string | null;
  payment_reference: string | null;
  agent?: { full_name: string; agent_code: string };
  loan?: { loan_number: string };
  voucher?: { voucher_number: string };
}

interface CommissionReportPDFProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalGenerated: number;
    totalPending: number;
    totalApproved: number;
    totalPaid: number;
    totalCancelled: number;
  };
  agentSummary: AgentSummaryItem[];
  paymentHistory: PaymentHistoryItem[];
  reportType: string;
}

export function CommissionReportPDF({ 
  company, 
  dateRange, 
  summary, 
  agentSummary, 
  paymentHistory 
}: CommissionReportPDFProps) {
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
        </View>

        {/* Title */}
        <Text style={styles.title}>AGENT COMMISSION REPORT</Text>
        <Text style={styles.dateRange}>
          Period: {format(new Date(dateRange.from), 'dd MMM yyyy')} to {format(new Date(dateRange.to), 'dd MMM yyyy')}
        </Text>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Generated</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalGenerated)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: '#CA8A04' }]}>{formatCurrency(summary.totalPending)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Approved</Text>
            <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{formatCurrency(summary.totalApproved)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryValue, { color: '#16A34A' }]}>{formatCurrency(summary.totalPaid)}</Text>
          </View>
        </View>

        {/* Agent-wise Summary */}
        {agentSummary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AGENT-WISE SUMMARY</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellLarge}>Agent</Text>
                <Text style={styles.tableCellSmall}>Loans</Text>
                <Text style={styles.tableCellRight}>Principal</Text>
                <Text style={styles.tableCellRight}>Commission</Text>
                <Text style={styles.tableCellRight}>Pending</Text>
                <Text style={styles.tableCellRight}>Paid</Text>
              </View>
              {agentSummary.map((item, index) => (
                <View key={item.agent.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCellLarge}>{item.agent.full_name}</Text>
                  <Text style={styles.tableCellSmall}>{item.totalLoans}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(item.totalPrincipal)}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(item.totalCommission)}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(item.pending + item.approved)}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(item.paid)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.tableCellLarge}>Total</Text>
                <Text style={styles.tableCellSmall}>{agentSummary.reduce((sum, i) => sum + i.totalLoans, 0)}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(agentSummary.reduce((sum, i) => sum + i.totalPrincipal, 0))}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(agentSummary.reduce((sum, i) => sum + i.totalCommission, 0))}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(agentSummary.reduce((sum, i) => sum + i.pending + i.approved, 0))}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(agentSummary.reduce((sum, i) => sum + i.paid, 0))}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PAYMENT HISTORY</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Date</Text>
                <Text style={styles.tableCellLarge}>Agent</Text>
                <Text style={styles.tableCell}>Loan #</Text>
                <Text style={styles.tableCellRight}>Amount</Text>
                <Text style={styles.tableCell}>Mode</Text>
                <Text style={styles.tableCell}>Voucher</Text>
              </View>
              {paymentHistory.slice(0, 30).map((payment, index) => (
                <View key={payment.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>
                    {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yy') : '-'}
                  </Text>
                  <Text style={styles.tableCellLarge}>{payment.agent?.full_name || '-'}</Text>
                  <Text style={styles.tableCell}>{payment.loan?.loan_number || '-'}</Text>
                  <Text style={styles.tableCellRight}>{formatCurrency(payment.commission_amount)}</Text>
                  <Text style={styles.tableCell}>{payment.payment_mode || '-'}</Text>
                  <Text style={styles.tableCell}>{payment.voucher?.voucher_number || '-'}</Text>
                </View>
              ))}
              {paymentHistory.length > 30 && (
                <Text style={{ fontSize: 7, textAlign: 'center', marginTop: 5, color: '#666' }}>
                  ... and {paymentHistory.length - 30} more payments
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {format(new Date(), 'dd MMM yyyy HH:mm')} | This is a computer generated report
        </Text>
      </Page>
    </Document>
  );
}