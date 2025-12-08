import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { bilingualLabel, translations } from '@/lib/translations';

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    borderBottom: '2pt solid #B45309',
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B45309',
    textAlign: 'center',
  },
  companyNameTamil: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  companyAddress: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#FEF3C7',
    padding: 6,
    marginBottom: 10,
    borderRadius: 4,
  },
  copyType: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#B45309',
    color: 'white',
    padding: 4,
    marginTop: 10,
    borderRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 4,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  table: {
    marginVertical: 10,
    border: '1pt solid #D1D5DB',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottom: '1pt solid #D1D5DB',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #E5E7EB',
    paddingVertical: 4,
  },
  tableCell: {
    fontSize: 8,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  tableCellHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  summaryBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    border: '1pt solid #86EFAC',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  netAmount: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1pt solid #86EFAC',
  },
  netAmountLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
  },
  netAmountValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  rebateBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    border: '1pt solid #FCD34D',
  },
  rebateTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    color: '#92400E',
  },
  rebateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rebateItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    padding: 4,
    backgroundColor: '#FFFBEB',
    borderRadius: 2,
  },
  rebateDays: {
    fontSize: 7,
    color: '#666',
  },
  rebateAmount: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#166534',
  },
  declarationBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    border: '1pt solid #FECACA',
  },
  declarationText: {
    fontSize: 7,
    lineHeight: 1.4,
    color: '#666',
    textAlign: 'justify',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 10,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottom: '1pt solid #000',
    marginBottom: 5,
    height: 40,
  },
  signatureLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
});

interface GoldItem {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
}

interface RebateItem {
  dayRange: string;
  rebateAmount: number;
}

interface ReceiptSectionProps {
  copyType: 'customer' | 'office';
  company: {
    name: string;
    nameTamil?: string;
    address?: string;
    phone?: string;
    license_number?: string;
  };
  loan: {
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    interest_rate: number;
    tenure_days: number;
    maturity_date: string;
    advance_interest?: number;
    processing_fee?: number;
    document_charges?: number;
    net_disbursed: number;
  };
  customer: {
    full_name: string;
    customer_code: string;
    phone?: string;
    address?: string;
  };
  goldItems: GoldItem[];
  rebateSchedule?: RebateItem[];
  logoUrl?: string | null;
  paperSize?: 'a4' | '80mm';
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const ReceiptSection: React.FC<ReceiptSectionProps> = ({
  copyType,
  company,
  loan,
  customer,
  goldItems,
  rebateSchedule,
  logoUrl,
  paperSize = 'a4',
}) => {
  const isThermal = paperSize === '80mm';
  const totalWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);

  return (
    <View style={[styles.section, isThermal && { padding: 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        {logoUrl && <Image src={logoUrl} style={styles.logo} />}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{company.name}</Text>
          {company.nameTamil && <Text style={styles.companyNameTamil}>{company.nameTamil}</Text>}
          {company.address && <Text style={styles.companyAddress}>{company.address}</Text>}
          {company.phone && <Text style={styles.companyAddress}>{bilingualLabel('phone')}: {company.phone}</Text>}
          {company.license_number && <Text style={styles.companyAddress}>{bilingualLabel('licenseNo')}: {company.license_number}</Text>}
        </View>
      </View>

      {/* Receipt Title */}
      <Text style={styles.receiptTitle}>{bilingualLabel('goldLoanReceipt')}</Text>

      {/* Loan & Customer Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('loanNumber')}</Text>
          <Text style={styles.value}>{loan.loan_number}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('loanDate')}</Text>
          <Text style={styles.value}>{formatDate(loan.loan_date)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('maturityDate')}</Text>
          <Text style={styles.value}>{formatDate(loan.maturity_date)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('customerName')}</Text>
          <Text style={styles.value}>{customer.full_name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('customerId')}</Text>
          <Text style={styles.value}>{customer.customer_code}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>{bilingualLabel('phone')}</Text>
          <Text style={styles.value}>{customer.phone || '-'}</Text>
        </View>
      </View>

      {/* Gold Items Table */}
      <Text style={[styles.label, { marginTop: 10, marginBottom: 5, fontSize: 9, fontWeight: 'bold' }]}>
        {bilingualLabel('goldDetails')}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { width: '5%' }]}>{translations.serialNo.en}</Text>
          <Text style={[styles.tableCellHeader, { width: '25%', textAlign: 'left' }]}>{bilingualLabel('itemType')}</Text>
          <Text style={[styles.tableCellHeader, { width: '15%' }]}>{bilingualLabel('grossWeight')}</Text>
          <Text style={[styles.tableCellHeader, { width: '15%' }]}>{bilingualLabel('netWeight')}</Text>
          <Text style={[styles.tableCellHeader, { width: '15%' }]}>{bilingualLabel('purity')}</Text>
          <Text style={[styles.tableCellHeader, { width: '25%' }]}>{bilingualLabel('appraisedValue')}</Text>
        </View>
        {goldItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '5%' }]}>{index + 1}</Text>
            <Text style={[styles.tableCell, { width: '25%', textAlign: 'left' }]}>{item.item_type}</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>{item.gross_weight_grams}g</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>{item.net_weight_grams}g</Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>{item.purity}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{formatCurrency(item.appraised_value)}</Text>
          </View>
        ))}
        <View style={[styles.tableRow, { backgroundColor: '#F9FAFB' }]}>
          <Text style={[styles.tableCellHeader, { width: '5%' }]}></Text>
          <Text style={[styles.tableCellHeader, { width: '25%', textAlign: 'left' }]}>{bilingualLabel('total')}</Text>
          <Text style={[styles.tableCellHeader, { width: '15%' }]}>{totalWeight.toFixed(2)}g</Text>
          <Text style={[styles.tableCellHeader, { width: '15%' }]}>-</Text>
          <Text style={[styles.tableCellHeader, { width: '15%' }]}>-</Text>
          <Text style={[styles.tableCellHeader, { width: '25%' }]}>{formatCurrency(totalValue)}</Text>
        </View>
      </View>

      {/* Disbursement Summary */}
      <View style={styles.summaryBox}>
        <Text style={[styles.label, { fontSize: 9, fontWeight: 'bold', marginBottom: 6 }]}>
          {bilingualLabel('disbursementSummary')}
        </Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('principalAmount')}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(loan.principal_amount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('interestRate')}</Text>
          <Text style={styles.summaryValue}>{loan.interest_rate}% {translations.perAnnum.en}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bilingualLabel('tenureDays')}</Text>
          <Text style={styles.summaryValue}>{loan.tenure_days} {translations.days.en}</Text>
        </View>
        {loan.advance_interest && loan.advance_interest > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{bilingualLabel('less')}: {bilingualLabel('advanceInterest')}</Text>
            <Text style={styles.summaryValue}>- {formatCurrency(loan.advance_interest)}</Text>
          </View>
        )}
        {loan.processing_fee && loan.processing_fee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{bilingualLabel('less')}: {bilingualLabel('processingFee')}</Text>
            <Text style={styles.summaryValue}>- {formatCurrency(loan.processing_fee)}</Text>
          </View>
        )}
        {loan.document_charges && loan.document_charges > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{bilingualLabel('less')}: {bilingualLabel('documentCharges')}</Text>
            <Text style={styles.summaryValue}>- {formatCurrency(loan.document_charges)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.netAmount]}>
          <Text style={styles.netAmountLabel}>{bilingualLabel('netDisbursed')}</Text>
          <Text style={styles.netAmountValue}>{formatCurrency(loan.net_disbursed)}</Text>
        </View>
      </View>

      {/* Rebate Schedule */}
      {rebateSchedule && rebateSchedule.length > 0 && (
        <View style={styles.rebateBox}>
          <Text style={styles.rebateTitle}>{bilingualLabel('earlyReleaseRebate')}</Text>
          <View style={styles.rebateGrid}>
            {rebateSchedule.map((item, index) => (
              <View key={index} style={styles.rebateItem}>
                <Text style={styles.rebateDays}>{item.dayRange}</Text>
                <Text style={styles.rebateAmount}>{formatCurrency(item.rebateAmount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Declaration */}
      <View style={styles.declarationBox}>
        <Text style={[styles.label, { fontSize: 8, fontWeight: 'bold', marginBottom: 4 }]}>
          {bilingualLabel('declaration')}
        </Text>
        <Text style={styles.declarationText}>
          {translations.loanDeclaration.en}
        </Text>
        <Text style={[styles.declarationText, { marginTop: 4 }]}>
          {translations.loanDeclaration.ta}
        </Text>
      </View>

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{bilingualLabel('customerSignature')}</Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{bilingualLabel('authorizedSignature')}</Text>
        </View>
      </View>

      {/* Copy Type Label */}
      <Text style={styles.copyType}>
        {copyType === 'customer' ? bilingualLabel('customerCopy') : bilingualLabel('officeCopy')}
      </Text>
    </View>
  );
};

export default ReceiptSection;
