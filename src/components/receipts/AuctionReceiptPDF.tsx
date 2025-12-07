import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: '2px solid #dc2626',
    paddingBottom: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#dc2626',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  documentTitle: {
    textAlign: 'right',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  lotNumber: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: 700,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1px solid #e5e7eb',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '40%',
    fontSize: 9,
    color: '#666666',
  },
  value: {
    width: '60%',
    fontSize: 9,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
  },
  tableCellHeader: {
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  col1: { width: '30%' },
  col2: { width: '20%' },
  col3: { width: '25%' },
  col4: { width: '25%', textAlign: 'right' },
  settlementBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  settlementLabel: {
    fontSize: 9,
    color: '#666666',
  },
  settlementValue: {
    fontSize: 9,
    fontWeight: 700,
  },
  settlementTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  surplusBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  shortfallBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  surplusText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#166534',
    textAlign: 'center',
  },
  shortfallText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#dc2626',
    textAlign: 'center',
  },
  buyerSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  buyerTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0369a1',
    marginBottom: 8,
  },
  closedBadge: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#dc2626',
    borderRadius: 4,
    alignItems: 'center',
  },
  closedText: {
    fontSize: 14,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 2,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 20,
  },
  signatureBox: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

interface AuctionReceiptPDFProps {
  data: {
    auction: {
      auction_lot_number: string;
      auction_date: string;
      outstanding_principal: number;
      outstanding_interest: number;
      outstanding_penalty: number;
      total_outstanding: number;
      total_gold_weight_grams: number;
      total_appraised_value: number;
      reserve_price: number;
      sold_price: number;
      buyer_name: string;
      buyer_contact?: string;
      buyer_address?: string;
      payment_mode: string;
      payment_reference?: string;
      surplus_amount: number;
      shortfall_amount: number;
    };
    loan: {
      loan_number: string;
      loan_date: string;
      maturity_date: string;
    };
    customer: {
      full_name: string;
      phone: string;
      address?: string;
    };
    goldItems: Array<{
      item_type: string;
      purity: string;
      gross_weight_grams: number;
      appraised_value: number;
    }>;
    company?: {
      name: string;
      address: string;
    };
  };
}

const AuctionReceiptPDF: React.FC<AuctionReceiptPDFProps> = ({ data }) => {
  const { auction, loan, customer, goldItems, company } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company?.name || 'Gold Finance Company'}</Text>
            <Text style={styles.companyAddress}>{company?.address || 'Company Address'}</Text>
          </View>
          <View style={styles.documentTitle}>
            <Text style={styles.titleText}>AUCTION SETTLEMENT</Text>
            <Text style={styles.lotNumber}>Lot #{auction.auction_lot_number}</Text>
          </View>
        </View>

        {/* Auction Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auction Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Auction Date:</Text>
            <Text style={styles.value}>{formatDate(auction.auction_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Original Loan Number:</Text>
            <Text style={styles.value}>{loan.loan_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Date:</Text>
            <Text style={styles.value}>{formatDate(loan.loan_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Maturity Date:</Text>
            <Text style={styles.value}>{formatDate(loan.maturity_date)}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer (Original Borrower)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{customer.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{customer.phone}</Text>
          </View>
          {customer.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{customer.address}</Text>
            </View>
          )}
        </View>

        {/* Gold Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auctioned Gold Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.col1]}>Item Type</Text>
              <Text style={[styles.tableCellHeader, styles.col2]}>Purity</Text>
              <Text style={[styles.tableCellHeader, styles.col3]}>Weight (g)</Text>
              <Text style={[styles.tableCellHeader, styles.col4]}>Value</Text>
            </View>
            {goldItems.map((item, index) => (
              <View 
                key={index} 
                style={index === goldItems.length - 1 ? styles.tableRowLast : styles.tableRow}
              >
                <Text style={[styles.tableCell, styles.col1, { textTransform: 'capitalize' }]}>
                  {item.item_type}
                </Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.purity}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{item.gross_weight_grams}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(item.appraised_value)}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Total Gold Weight:</Text>
            <Text style={styles.value}>{auction.total_gold_weight_grams.toFixed(2)} grams</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Appraised Value:</Text>
            <Text style={styles.value}>{formatCurrency(auction.total_appraised_value)}</Text>
          </View>
        </View>

        {/* Settlement Calculation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement Calculation</Text>
          <View style={styles.settlementBox}>
            <View style={styles.settlementRow}>
              <Text style={styles.settlementLabel}>Outstanding Principal</Text>
              <Text style={styles.settlementValue}>{formatCurrency(auction.outstanding_principal)}</Text>
            </View>
            <View style={styles.settlementRow}>
              <Text style={styles.settlementLabel}>Outstanding Interest</Text>
              <Text style={styles.settlementValue}>{formatCurrency(auction.outstanding_interest)}</Text>
            </View>
            {auction.outstanding_penalty > 0 && (
              <View style={styles.settlementRow}>
                <Text style={styles.settlementLabel}>Penalty Amount</Text>
                <Text style={[styles.settlementValue, { color: '#dc2626' }]}>
                  {formatCurrency(auction.outstanding_penalty)}
                </Text>
              </View>
            )}
            <View style={styles.settlementTotal}>
              <Text style={styles.totalLabel}>Total Outstanding</Text>
              <Text style={styles.totalValue}>{formatCurrency(auction.total_outstanding)}</Text>
            </View>
          </View>

          <View style={[styles.settlementBox, { marginTop: 10 }]}>
            <View style={styles.settlementRow}>
              <Text style={styles.settlementLabel}>Reserve Price (Minimum)</Text>
              <Text style={styles.settlementValue}>{formatCurrency(auction.reserve_price)}</Text>
            </View>
            <View style={styles.settlementTotal}>
              <Text style={styles.totalLabel}>Auction Sale Price</Text>
              <Text style={[styles.totalValue, { color: '#166534' }]}>
                {formatCurrency(auction.sold_price)}
              </Text>
            </View>
          </View>

          {/* Surplus or Shortfall */}
          {auction.surplus_amount > 0 && (
            <View style={styles.surplusBox}>
              <Text style={styles.surplusText}>
                SURPLUS: {formatCurrency(auction.surplus_amount)} (To be returned to customer)
              </Text>
            </View>
          )}
          {auction.shortfall_amount > 0 && (
            <View style={styles.shortfallBox}>
              <Text style={styles.shortfallText}>
                SHORTFALL: {formatCurrency(auction.shortfall_amount)} (Loss on auction)
              </Text>
            </View>
          )}
        </View>

        {/* Buyer Details */}
        <View style={styles.buyerSection}>
          <Text style={styles.buyerTitle}>BUYER DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Buyer Name:</Text>
            <Text style={styles.value}>{auction.buyer_name}</Text>
          </View>
          {auction.buyer_contact && (
            <View style={styles.row}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{auction.buyer_contact}</Text>
            </View>
          )}
          {auction.buyer_address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{auction.buyer_address}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Payment Mode:</Text>
            <Text style={[styles.value, { textTransform: 'uppercase' }]}>{auction.payment_mode}</Text>
          </View>
          {auction.payment_reference && (
            <View style={styles.row}>
              <Text style={styles.label}>Reference:</Text>
              <Text style={styles.value}>{auction.payment_reference}</Text>
            </View>
          )}
        </View>

        {/* Loan Closed Badge */}
        <View style={styles.closedBadge}>
          <Text style={styles.closedText}>LOAN CLOSED - AUCTIONED</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Auctioneer</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Buyer</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Branch Manager</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated document. Gold items sold "as is" basis.
          {'\n'}Generated on: {new Date().toLocaleString('en-IN')}
        </Text>
      </Page>
    </Document>
  );
};

export default AuctionReceiptPDF;
