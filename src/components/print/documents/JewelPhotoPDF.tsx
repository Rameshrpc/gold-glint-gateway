import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import '@/lib/pdf-fonts';
import { LoanPrintData, GoldItemPrintData } from '@/types/print-data';
import { LanguageMode } from '@/lib/bilingual-utils';
import { translations } from '@/lib/translations';
import { formatDatePrint, formatWeight, formatIndianCurrencyPrint } from '@/lib/print-utils';

interface JewelPhotoPDFProps {
  data: LoanPrintData;
  language?: LanguageMode;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Roboto',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    color: '#B45309',
  },
  branchName: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  loanNumber: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  loanDate: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
    color: '#1E40AF',
  },
  titleTamil: {
    fontSize: 12,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1E40AF',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  jewelImage: {
    maxWidth: '100%',
    maxHeight: 450,
    objectFit: 'contain',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  noImageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
  },
  noImageTextTamil: {
    fontSize: 12,
    fontFamily: 'Noto Sans Tamil',
    color: '#999',
    marginTop: 4,
  },
  overlayBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    marginTop: 10,
    borderRadius: 4,
  },
  overlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  overlayLabel: {
    color: '#aaa',
    fontSize: 8,
  },
  overlayLabelTamil: {
    color: '#888',
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
  },
  overlayValue: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  overlayHighlight: {
    color: '#fcd34d',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timestampSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  timestampLabel: {
    color: '#888',
    fontSize: 8,
    marginRight: 8,
  },
  timestampValue: {
    color: '#fff',
    fontSize: 9,
  },
  itemsSummary: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemsSummaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E40AF',
  },
  itemsTable: {
    marginTop: 4,
  },
  itemsHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 4,
    fontSize: 7,
    fontWeight: 'bold',
  },
  itemsRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    fontSize: 7,
  },
  col1: { width: '5%', textAlign: 'center' },
  col2: { width: '30%' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'center' },
  col6: { width: '20%', textAlign: 'right' },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    fontSize: 60,
    color: 'rgba(180, 83, 9, 0.08)',
    transform: 'rotate(-30deg)',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#999',
  },
});

export default function JewelPhotoPDF({ data, language = 'bilingual' }: JewelPhotoPDFProps) {
  const totalWeight = data.gold_items.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = data.gold_items.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalValue = data.gold_items.reduce((sum, item) => sum + item.appraised_value, 0);
  const itemCount = data.gold_items.length;
  
  const showTamil = language !== 'english';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>{data.client.company_name}</Text>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{data.client.company_name}</Text>
            <Text style={styles.branchName}>{data.branch.branch_name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.loanNumber}>Loan: {data.loan.loan_number}</Text>
            <Text style={styles.loanDate}>{formatDatePrint(data.loan.loan_date, 'long')}</Text>
          </View>
        </View>
        
        {/* Title */}
        <Text style={styles.title}>{translations.pledgedGoldOrnaments.en}</Text>
        {showTamil && (
          <Text style={styles.titleTamil}>{translations.pledgedGoldOrnaments.ta}</Text>
        )}
        
        {/* Main Image */}
        <View style={styles.imageContainer}>
          {data.loan.jewel_photo_url ? (
            <Image src={data.loan.jewel_photo_url} style={styles.jewelImage} />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>{translations.noImageAvailable.en}</Text>
              {showTamil && (
                <Text style={styles.noImageTextTamil}>{translations.noImageAvailable.ta}</Text>
              )}
            </View>
          )}
        </View>
        
        {/* Overlay Information Bar */}
        <View style={styles.overlayBar}>
          <View style={styles.overlayRow}>
            <View>
              <Text style={styles.overlayLabel}>Customer / {showTamil ? 'வாடிக்கையாளர்' : ''}</Text>
              <Text style={styles.overlayValue}>{data.customer.full_name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.overlayLabel}>Total Items / {showTamil ? 'மொத்த பொருட்கள்' : ''}</Text>
              <Text style={styles.overlayHighlight}>{itemCount}</Text>
            </View>
          </View>
          
          <View style={styles.overlayRow}>
            <View>
              <Text style={styles.overlayLabel}>Gross Weight / {showTamil ? 'மொத்த எடை' : ''}</Text>
              <Text style={styles.overlayHighlight}>{formatWeight(totalWeight)}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.overlayLabel}>Net Weight / {showTamil ? 'நிகர எடை' : ''}</Text>
              <Text style={styles.overlayValue}>{formatWeight(totalNetWeight)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.overlayLabel}>Appraised Value / {showTamil ? 'மதிப்பீடு' : ''}</Text>
              <Text style={styles.overlayHighlight}>{formatIndianCurrencyPrint(totalValue)}</Text>
            </View>
          </View>
          
          {/* Timestamp */}
          <View style={styles.timestampSection}>
            <Text style={styles.timestampLabel}>
              {translations.capturedOn.en}{showTamil ? ` / ${translations.capturedOn.ta}` : ''}:
            </Text>
            <Text style={styles.timestampValue}>
              {formatDatePrint(data.meta.print_timestamp, 'datetime')}
            </Text>
          </View>
        </View>
        
        {/* Items Summary Table */}
        <View style={styles.itemsSummary}>
          <Text style={styles.itemsSummaryTitle}>
            {translations.goldDetails.en}{showTamil ? ` / ${translations.goldDetails.ta}` : ''}
          </Text>
          <View style={styles.itemsTable}>
            <View style={styles.itemsHeader}>
              <Text style={styles.col1}>#</Text>
              <Text style={styles.col2}>Item</Text>
              <Text style={styles.col3}>Gross Wt</Text>
              <Text style={styles.col4}>Net Wt</Text>
              <Text style={styles.col5}>Purity</Text>
              <Text style={styles.col6}>Value</Text>
            </View>
            {data.gold_items.map((item, index) => (
              <View key={index} style={styles.itemsRow}>
                <Text style={styles.col1}>{index + 1}</Text>
                <Text style={styles.col2}>{item.item_type}</Text>
                <Text style={styles.col3}>{formatWeight(item.gross_weight_grams)}</Text>
                <Text style={styles.col4}>{formatWeight(item.net_weight_grams)}</Text>
                <Text style={styles.col5}>{item.purity.toUpperCase()}</Text>
                <Text style={styles.col6}>{formatIndianCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>{translations.computerGenerated.en}</Text>
          <Text>Generated: {formatDatePrint(data.meta.print_timestamp, 'datetime')}</Text>
        </View>
      </Page>
    </Document>
  );
}
