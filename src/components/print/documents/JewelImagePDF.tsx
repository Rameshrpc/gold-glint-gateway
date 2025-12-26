import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatWeightPrint, formatCurrencyPrint, formatDatePrint } from '../shared/PDFStyles';
import { BilingualLabel, BilingualValueRow, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';

// Ensure fonts are loaded
const _fonts = fontsRegistered;

interface GoldItem {
  id?: string;
  item_type: string;
  description?: string | null;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  appraised_value: number;
}

interface JewelImagePDFProps {
  jewelPhotoUrl?: string | null;
  goldItems: GoldItem[];
  loanNumber: string;
  loanDate: string;
  customerName: string;
  customerCode: string;
  companyName: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  logoUrl?: string | null;
}

export function JewelImagePDF({
  jewelPhotoUrl,
  goldItems,
  loanNumber,
  loanDate,
  customerName,
  customerCode,
  companyName,
  language = 'bilingual',
  paperSize = 'A4',
  logoUrl,
}: JewelImagePDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalAppraisedValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);
  
  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={pdfStyles.page}>
        {/* Header */}
        <View style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 }}>
          {logoUrl && (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Image src={logoUrl} style={{ width: 60, height: 60, objectFit: 'contain' }} />
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
            {companyName}
          </Text>
          <View style={pdfStyles.documentTitle}>
            <BilingualLabel
              english="JEWEL IMAGE"
              tamil="நகை படம்"
              mode={language}
              fontSize={14}
              fontWeight="bold"
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 10 }}>
              Customer: {customerName} ({customerCode})
            </Text>
            <Text style={{ fontSize: 10 }}>
              Loan: {loanNumber} | Date: {formatDatePrint(loanDate)}
            </Text>
          </View>
        </View>
        
        {/* Jewel Image - Horizontal/Landscape layout */}
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          {jewelPhotoUrl ? (
            <Image 
              src={jewelPhotoUrl} 
              style={{ 
                width: 480, 
                height: 280, 
                objectFit: 'contain',
                borderWidth: 1,
                borderColor: '#000',
              }} 
            />
          ) : (
            <View style={{ 
              width: 480, 
              height: 280, 
              justifyContent: 'center', 
              alignItems: 'center', 
              backgroundColor: '#f5f5f5',
              borderWidth: 1,
              borderColor: '#ccc',
            }}>
              <Text style={{ fontSize: 12, color: '#999' }}>No jewel image available</Text>
              <Text style={{ fontSize: 9, color: '#999', marginTop: 4 }}>நகை படம் இல்லை</Text>
            </View>
          )}
        </View>
        
        {/* Jewel Details Table */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Jewel Details"
              tamil="நகை விவரங்கள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '8%' }]}>S.No</Text>
              <View style={[pdfStyles.tableHeaderCell, { width: '27%', textAlign: 'left' }]}>
                <BilingualLabel english="Item" tamil="பொருள்" mode={language} fontSize={8} fontWeight="bold" />
              </View>
              <Text style={[pdfStyles.tableHeaderCell, { width: '16%' }]}>Gross Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '16%' }]}>Net Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '13%' }]}>Purity</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Value</Text>
            </View>
            
            {goldItems.map((item, index) => (
              <View key={item.id || index} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '8%' }]}>{index + 1}</Text>
                <Text style={[pdfStyles.tableCellLeft, { width: '27%' }]}>
                  {item.item_type}
                  {item.description && <Text style={{ color: '#666', fontSize: 8 }}>{'\n'}{item.description}</Text>}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '16%' }]}>{formatWeightPrint(item.gross_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '16%' }]}>{formatWeightPrint(item.net_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '13%' }]}>{item.purity}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{formatCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
            
            {/* Totals row */}
            <View style={[pdfStyles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <View style={[pdfStyles.tableHeaderCell, { width: '35%', textAlign: 'right' }]}>
                <BilingualLabel english="Total" tamil="மொத்தம்" mode={language} fontSize={8} fontWeight="bold" />
              </View>
              <Text style={[pdfStyles.tableHeaderCell, { width: '16%' }]}>{formatWeightPrint(totalGrossWeight)}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '16%' }]}>{formatWeightPrint(totalNetWeight)}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '13%' }]}>-</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>{formatCurrencyPrint(totalAppraisedValue)}</Text>
            </View>
          </View>
        </View>
        
        {/* Verification Note */}
        <View style={{ marginTop: 20, padding: 10, borderWidth: 1, borderColor: '#ccc' }}>
          <BilingualLabel
            english="I confirm that the above image represents the jewels pledged by me for this loan."
            tamil="இந்த கடனுக்காக நான் அடமானம் வைத்த நகைகளை மேலே உள்ள படம் பிரதிபலிக்கிறது என்பதை உறுதிப்படுத்துகிறேன்."
            mode={language}
            fontSize={9}
          />
        </View>
        
        {/* Signature */}
        <View style={{ marginTop: 40, alignItems: 'flex-end' }}>
          <View style={{ width: 200, alignItems: 'center' }}>
            <View style={pdfStyles.signatureLine} />
            <BilingualLabel
              english="Customer Signature"
              tamil="வாடிக்கையாளர் கையொப்பம்"
              mode={language}
              fontSize={8}
              color="#555"
            />
          </View>
        </View>
        
        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
