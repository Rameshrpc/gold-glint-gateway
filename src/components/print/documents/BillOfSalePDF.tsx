import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatCurrencyPrint, formatDatePrint, formatWeightPrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { BilingualLabel, BilingualValueRow, BilingualText, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';
import { calculateStrikePrices, generateAgreementRef, formatCurrencyForSale, parseStrikePeriod, StrikePeriodConfig } from '@/lib/strike-price-utils';
import { amountToWordsOnly } from '@/lib/amount-to-words';

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

interface Customer {
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

interface Loan {
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  interest_rate: number;
  tenure_days: number;
  processing_fee?: number | null;
  document_charges?: number | null;
  net_disbursed: number;
}

interface ContentBlock {
  content_english: string | null;
  content_tamil: string | null;
}

interface BillOfSaleContent {
  title?: ContentBlock;
  legalRef?: ContentBlock;
  sellerTitle?: ContentBlock;
  buyerTitle?: ContentBlock;
  goodsTitle?: ContentBlock;
  goodsIntro?: ContentBlock;
  considerationTitle?: ContentBlock;
  considerationIntro?: ContentBlock;
  spotPriceLabel?: ContentBlock;
  repurchaseTitle?: ContentBlock;
  repurchaseIntro?: ContentBlock;
  expiryNote?: ContentBlock;
  declarationsTitle?: ContentBlock;
  declarations?: ContentBlock[];
  sellerSignature?: ContentBlock;
  sellerSignatureNote?: ContentBlock;
  buyerSignature?: ContentBlock;
  buyerSignatureNote?: ContentBlock;
  strikePeriodHeader?: ContentBlock;
  strikePriceHeader?: ContentBlock;
  strikeStatusHeader?: ContentBlock;
  strikePeriods?: ContentBlock[];
}

interface BillOfSalePDFProps {
  loan: Loan;
  customer: Customer;
  goldItems: GoldItem[];
  companyName: string;
  companyAddress?: string;
  gstin?: string;
  stateCode?: string;
  branchName?: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  sloganEnglish?: string | null;
  sloganTamil?: string | null;
  logoUrl?: string | null;
  copyType?: 'customer' | 'office';
  content?: BillOfSaleContent;
}

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#000',
    backgroundColor: '#fff',
  },
  copyBadge: {
    position: 'absolute',
    top: 10,
    right: 25,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#000',
    borderRadius: 3,
  },
  copyBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 8,
    textAlign: 'center',
    color: '#555',
    marginBottom: 4,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  refText: {
    fontSize: 8,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  sectionTitleNumber: {
    backgroundColor: '#000',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    fontSize: 9,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  table: {
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 4,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    padding: 4,
    minHeight: 18,
  },
  tableCell: {
    fontSize: 7,
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 7,
    textAlign: 'left',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  amountBox: {
    marginTop: 8,
    padding: 10,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#f9f9f9',
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  amountWords: {
    fontSize: 8,
    textAlign: 'center',
    color: '#333',
  },
  strikePriceTable: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  strikePriceHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 4,
  },
  strikePriceRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    padding: 4,
    alignItems: 'center',
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 8,
  },
  declarationBox: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#fafafa',
  },
  declarationItem: {
    marginBottom: 6,
  },
  declarationTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  declarationText: {
    fontSize: 7,
    color: '#333',
    lineHeight: 1.4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 10,
  },
  signatureBox: {
    width: '40%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  signatureNote: {
    fontSize: 6,
    textAlign: 'center',
    color: '#555',
    marginTop: 2,
  },
  noteBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#d97706',
  },
  noteText: {
    fontSize: 7,
    color: '#92400e',
  },
});

// Helper to get text with fallback
const getText = (block: ContentBlock | undefined, defaultEnglish: string, defaultTamil: string) => ({
  english: block?.content_english || defaultEnglish,
  tamil: block?.content_tamil || defaultTamil,
});

// Helper to replace placeholders
const replacePlaceholders = (text: string, companyName: string, expiryDate: string) => {
  return text
    .replace(/\{\{company_name\}\}/g, companyName)
    .replace(/\{\{expiry_date\}\}/g, expiryDate);
};

// Parse declaration from content format: "Title|English Content|Tamil Content"
const parseDeclaration = (block: ContentBlock) => {
  const parts = (block.content_english || '').split('|');
  if (parts.length >= 2) {
    return {
      title: parts[0],
      english: parts[1],
      tamil: block.content_tamil || parts[2] || parts[1],
    };
  }
  return {
    title: '',
    english: block.content_english || '',
    tamil: block.content_tamil || block.content_english || '',
  };
};

export function BillOfSalePDF({
  loan,
  customer,
  goldItems,
  companyName,
  companyAddress,
  gstin,
  stateCode = '33',
  branchName,
  language = 'bilingual',
  paperSize = 'A4',
  sloganEnglish,
  sloganTamil,
  logoUrl,
  copyType,
  content,
}: BillOfSalePDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  
  // Parse custom strike periods from content
  const customPeriods: StrikePeriodConfig[] = [];
  if (content?.strikePeriods && content.strikePeriods.length > 0) {
    content.strikePeriods.forEach((block) => {
      const parsed = parseStrikePeriod(block.content_english, block.content_tamil);
      if (parsed) {
        customPeriods.push(parsed);
      }
    });
  }
  
  // Calculate strike prices
  const processingFeePercent = loan.processing_fee 
    ? (loan.processing_fee / loan.principal_amount) * 100 
    : 0;
  
  // Use effective rate if provided, otherwise use interest_rate for both
  const shownRate = loan.interest_rate;
  const effectiveRate = loan.interest_rate; // Could be passed as prop if needed
    
  const strikePriceData = calculateStrikePrices(
    loan.principal_amount,
    shownRate,
    effectiveRate,
    processingFeePercent,
    loan.loan_date,
    loan.tenure_days,
    customPeriods.length > 0 ? customPeriods : undefined
  );
  
  const agreementRef = generateAgreementRef(loan.loan_number);
  const copyLabel = copyType === 'customer' ? 'Customer Copy' : copyType === 'office' ? 'Office Copy' : null;
  
  // Get content with fallbacks
  const title = getText(content?.title, 'BILL OF SALE & REPURCHASE OPTION AGREEMENT', 'விற்பனை மற்றும் மறுகொள்முதல் விருப்ப ஒப்பந்தம்');
  const legalRef = getText(content?.legalRef, '(Under Sale of Goods Act, 1930 & Contract Act, 1872)', '(விற்பனை பொருட்கள் சட்டம், 1930 & ஒப்பந்த சட்டம், 1872 கீழ்)');
  const sellerTitle = getText(content?.sellerTitle, 'THE SELLER (Customer)', 'விற்பவர் (வாடிக்கையாளர்)');
  const buyerTitle = getText(content?.buyerTitle, 'THE BUYER (Trading Entity)', 'வாங்குபவர் (வர்த்தக நிறுவனம்)');
  const goodsTitle = getText(content?.goodsTitle, 'DESCRIPTION OF GOODS SOLD', 'விற்கப்பட்ட பொருட்களின் விவரம்');
  const goodsIntro = getText(content?.goodsIntro, 'The Seller hereby sells and transfers absolute title and ownership of the following pre-owned jewellery to the Buyer:', 'விற்பவர் பின்வரும் பழைய நகைகளின் முழு உரிமையையும் உடைமையையும் வாங்குபவருக்கு விற்பனை செய்து மாற்றுகிறார்:');
  const considerationTitle = getText(content?.considerationTitle, 'CONSIDERATION (PAYMENT DETAILS)', 'பரிசீலனை (கட்டண விவரங்கள்)');
  const considerationIntro = getText(content?.considerationIntro, 'The Buyer has paid the following amount to the Seller as full and final consideration for the purchase of the above goods:', 'மேற்கண்ட பொருட்களை வாங்குவதற்கான முழு மற்றும் இறுதித் தொகையாக வாங்குபவர் விற்பவருக்கு பின்வரும் தொகையை செலுத்தியுள்ளார்:');
  const spotPriceLabel = getText(content?.spotPriceLabel, 'SPOT PURCHASE PRICE (CASH HANDED OVER)', 'உடனடி கொள்முதல் விலை (ரொக்கமாக வழங்கப்பட்டது)');
  const repurchaseTitle = getText(content?.repurchaseTitle, 'REPURCHASE OPTION (BUYBACK TERMS)', 'மறுகொள்முதல் விருப்பம் (திருப்பி வாங்கும் விதிமுறைகள்)');
  const repurchaseIntro = getText(content?.repurchaseIntro, "As part of this trading transaction, the Buyer grants the Seller an exclusive option to buy back the exact same goods within the specified period at the following fixed Strike Prices. This price includes the original purchase cost plus the Buyer's trade margin and administrative fees.", 'இந்த வர்த்தக பரிவர்த்தனையின் ஒரு பகுதியாக, குறிப்பிட்ட காலத்திற்குள் கீழ்க்கண்ட நிலையான ஸ்ட்ரைக் விலையில் அதே பொருட்களை திருப்பி வாங்குவதற்கான பிரத்யேக விருப்பத்தை வாங்குபவர் விற்பவருக்கு வழங்குகிறார்.');
  const expiryNoteContent = getText(content?.expiryNote, `Note: If the option is not exercised by {{expiry_date}}, this agreement expires. The Buyer ({{company_name}}) retains full ownership and is free to liquidate/melt/sell the asset without further notice.`, `குறிப்பு: {{expiry_date}} க்குள் விருப்பம் பயன்படுத்தப்படாவிட்டால், இந்த ஒப்பந்தம் காலாவதியாகும். வாங்குபவர் ({{company_name}}) முழு உரிமையைத் தக்க வைத்துக் கொள்கிறார்.`);
  const declarationsTitle = getText(content?.declarationsTitle, 'DECLARATIONS & TAX COMPLIANCE', 'அறிவிப்புகள் & வரி இணக்கம்');
  const sellerSignature = getText(content?.sellerSignature, 'Signature of SELLER (Customer)', 'விற்பவர் கையொப்பம் (வாடிக்கையாளர்)');
  const sellerSignatureNote = getText(content?.sellerSignatureNote, '(I have received the cash and sold my gold)', '(நான் ரொக்கத்தைப் பெற்று என் தங்கத்தை விற்றேன்)');
  const buyerSignature = getText(content?.buyerSignature, `For {{company_name}}`, `{{company_name}} சார்பாக`);
  const buyerSignatureNote = getText(content?.buyerSignatureNote, '(Authorized Signatory)', '(அங்கீகரிக்கப்பட்ட கையொப்பமிடுபவர்)');
  const strikePeriodHeader = getText(content?.strikePeriodHeader, 'If Exercised Between...', 'இடையில் பயன்படுத்தினால்...');
  const strikePriceHeader = getText(content?.strikePriceHeader, 'You Pay (Strike Price)', 'நீங்கள் செலுத்த வேண்டிய தொகை (ஸ்ட்ரைக் விலை)');
  const strikeStatusHeader = getText(content?.strikeStatusHeader, 'Status', 'நிலை');
  
  // Default declarations
  const defaultDeclarations = [
    {
      title: 'Transfer of Title:',
      english: `I (The Seller) declare that I am the legal owner of these goods. I have sold them to ${companyName} voluntarily.`,
      tamil: `நான் (விற்பவர்) இந்த பொருட்களின் சட்டப்பூர்வ உரிமையாளர் என்று அறிவிக்கிறேன். நான் அவற்றை ${companyName} க்கு தானாகவே விற்றேன்.`,
    },
    {
      title: 'No Financial Transaction:',
      english: 'I understand this is a Buy-Sell transaction and not a financial transaction. There is no rate applicable; there is only a repurchase price difference.',
      tamil: 'இது கடன் பரிவர்த்தனை அல்ல, வாங்கல்-விற்றல் பரிவர்த்தனை என்பதை புரிந்துகொள்கிறேன். வட்டி விகிதம் இல்லை; மறுகொள்முதல் விலை வேறுபாடு மட்டுமே உள்ளது.',
    },
    {
      title: 'GST Rule 32(5):',
      english: `The Buyer (${companyName}) declares that this is a purchase of second-hand goods. GST will be paid on the margin earned upon resale/repurchase as per Rule 32(5) of CGST Rules, 2017.`,
      tamil: `வாங்குபவர் (${companyName}) இது பழைய பொருட்களின் கொள்முதல் என்று அறிவிக்கிறார். CGST விதிகள், 2017 இன் விதி 32(5) படி மறுவிற்பனை/மறுகொள்முதலில் ஈட்டிய மார்ஜினில் GST செலுத்தப்படும்.`,
    },
    {
      title: 'Custody Authorization:',
      english: `I authorize ${companyName} to store these goods in their safe deposit vaults or with their financial partners/bankers for logistics and safety purposes during the option period.`,
      tamil: `விருப்ப காலத்தில் பாதுகாப்பு மற்றும் தளவாட நோக்கங்களுக்காக இந்த பொருட்களை ${companyName} அவர்களின் பாதுகாப்பு பெட்டகங்களில் அல்லது நிதி பங்காளிகள்/வங்கிகளிடம் சேமிக்க அனுமதிக்கிறேன்.`,
    },
  ];
  
  // Parse declarations from content or use defaults
  const declarations = content?.declarations && content.declarations.length > 0
    ? content.declarations.map((block) => {
        const parsed = parseDeclaration(block);
        return {
          title: parsed.title,
          english: replacePlaceholders(parsed.english, companyName, strikePriceData.expiryDate),
          tamil: replacePlaceholders(parsed.tamil, companyName, strikePriceData.expiryDate),
        };
      })
    : defaultDeclarations;
  
  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={styles.page}>
        {/* Copy Badge */}
        {copyLabel && (
          <View style={styles.copyBadge}>
            <Text style={styles.copyBadgeText}>{copyLabel}</Text>
          </View>
        )}
        
        {/* Header */}
        <PDFHeader
          companyName={companyName}
          branchName={branchName}
          address={companyAddress}
          date={loan.loan_date}
          documentNumber={agreementRef}
          sloganEnglish={sloganEnglish}
          sloganTamil={sloganTamil}
          language={language}
          logoUrl={logoUrl}
        />
        
        {/* Document Title */}
        <View style={styles.title}>
          <BilingualLabel
            english={title.english}
            tamil={title.tamil}
            mode={language}
            fontSize={11}
            fontWeight="bold"
          />
        </View>
        
        <Text style={styles.subtitle}>
          {language === 'tamil' ? legalRef.tamil : legalRef.english}
        </Text>
        
        {/* Reference and Date */}
        <View style={styles.refRow}>
          <Text style={styles.refText}>Agreement Ref: {agreementRef}</Text>
          <Text style={styles.refText}>Date: {formatDatePrint(loan.loan_date)}</Text>
          <Text style={styles.refText}>Place: Coimbatore</Text>
        </View>
        
        {/* Section 1: The Seller (Customer) */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionTitleNumber}>1</Text>
            <BilingualLabel
              english={sellerTitle.english}
              tamil={sellerTitle.tamil}
              mode={language}
              fontSize={10}
              fontWeight="bold"
            />
          </View>
          
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <BilingualValueRow
                labelEn="Name"
                labelTa="பெயர்"
                value={customer.full_name}
                mode={language}
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="Mobile"
                labelTa="கைபேசி"
                value={customer.phone}
                mode={language}
                fontSize={8}
              />
            </View>
            <View style={styles.column}>
              <BilingualValueRow
                labelEn="Address"
                labelTa="முகவரி"
                value={[customer.address, customer.city, customer.state].filter(Boolean).join(', ') || '-'}
                mode={language}
                fontSize={8}
              />
              <BilingualValueRow
                labelEn="ID Proof"
                labelTa="அடையாள ஆவணம்"
                value="Aadhaar / PAN"
                mode={language}
                fontSize={8}
              />
            </View>
          </View>
        </View>
        
        {/* Section 2: The Buyer (Trading Entity) */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionTitleNumber}>2</Text>
            <BilingualLabel
              english={buyerTitle.english}
              tamil={buyerTitle.tamil}
              mode={language}
              fontSize={10}
              fontWeight="bold"
            />
          </View>
          
          <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>M/s. {companyName}</Text>
          {companyAddress && <Text style={{ fontSize: 8, color: '#333', marginBottom: 2 }}>{companyAddress}</Text>}
          {gstin && <Text style={{ fontSize: 8, color: '#333' }}>GSTIN: {gstin} | State Code: {stateCode} (Tamil Nadu)</Text>}
        </View>
        
        {/* Section A: Description of Goods Sold */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionTitleNumber}>A</Text>
            <BilingualLabel
              english={goodsTitle.english}
              tamil={goodsTitle.tamil}
              mode={language}
              fontSize={10}
              fontWeight="bold"
            />
          </View>
          
          <BilingualText
            english={goodsIntro.english}
            tamil={goodsIntro.tamil}
            mode={language}
            fontSize={7}
          />
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '8%' }]}>Sl.No</Text>
              <Text style={[styles.tableHeaderCell, { width: '32%', textAlign: 'left' }]}>Description of Item(s)</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Gross Wt (gms)</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Net Wt (gms)</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Purity (Karats)</Text>
            </View>
            
            {goldItems.map((item, index) => (
              <View key={item.id || index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '8%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCellLeft, { width: '32%' }]}>{item.item_type}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{formatWeightPrint(item.gross_weight_grams)}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{formatWeightPrint(item.net_weight_grams)}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{item.purity}</Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'right' }]}>TOTAL</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>{formatWeightPrint(totalGrossWeight)}</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>{formatWeightPrint(totalNetWeight)}</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>-</Text>
            </View>
          </View>
        </View>
        
        {/* Section B: Consideration (Payment Details) */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionTitleNumber}>B</Text>
            <BilingualLabel
              english={considerationTitle.english}
              tamil={considerationTitle.tamil}
              mode={language}
              fontSize={10}
              fontWeight="bold"
            />
          </View>
          
          <BilingualText
            english={considerationIntro.english}
            tamil={considerationIntro.tamil}
            mode={language}
            fontSize={7}
          />
          
          <View style={styles.amountBox}>
            <BilingualLabel
              english={spotPriceLabel.english}
              tamil={spotPriceLabel.tamil}
              mode={language}
              fontSize={8}
              fontWeight="bold"
            />
            <Text style={styles.amountValue}>{formatCurrencyForSale(loan.principal_amount)}</Text>
            <Text style={styles.amountWords}>(In Words): {amountToWordsOnly(loan.principal_amount)}</Text>
          </View>
        </View>
        
        {/* Section C: Repurchase Option (Buyback Terms) */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionTitleNumber}>C</Text>
            <BilingualLabel
              english={repurchaseTitle.english}
              tamil={repurchaseTitle.tamil}
              mode={language}
              fontSize={10}
              fontWeight="bold"
            />
          </View>
          
          <BilingualText
            english={repurchaseIntro.english}
            tamil={repurchaseIntro.tamil}
            mode={language}
            fontSize={7}
          />
          
          <View style={styles.strikePriceTable}>
            <View style={styles.strikePriceHeader}>
              <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'left' }]}>
                {language === 'tamil' ? strikePeriodHeader.tamil : strikePeriodHeader.english}
              </Text>
              <Text style={[styles.tableHeaderCell, { width: '35%' }]}>
                {language === 'tamil' ? strikePriceHeader.tamil : strikePriceHeader.english}
              </Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>
                {language === 'tamil' ? strikeStatusHeader.tamil : strikeStatusHeader.english}
              </Text>
            </View>
            
            {strikePriceData.strikePrices.map((row, index) => (
              <View key={index} style={styles.strikePriceRow}>
                <Text style={[styles.tableCellLeft, { width: '40%' }]}>
                  {language === 'tamil' ? row.periodLabelTamil : row.periodLabel}
                </Text>
                <Text style={[styles.tableCell, { width: '35%', fontWeight: 'bold' }]}>
                  {formatCurrencyForSale(row.strikePrice)}
                </Text>
                <View style={{ width: '25%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={styles.checkbox} />
                  <Text style={{ fontSize: 7, marginLeft: 4 }}>
                    {row.status === 'active' ? 'Active' : 'Future'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              {replacePlaceholders(
                language === 'tamil' ? expiryNoteContent.tamil : expiryNoteContent.english,
                companyName,
                strikePriceData.expiryDate
              )}
            </Text>
          </View>
        </View>
        
        {/* Section D: Declarations & Tax Compliance */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionTitleNumber}>D</Text>
            <BilingualLabel
              english={declarationsTitle.english}
              tamil={declarationsTitle.tamil}
              mode={language}
              fontSize={10}
              fontWeight="bold"
            />
          </View>
          
          <View style={styles.declarationBox}>
            {declarations.map((declaration, index) => (
              <View key={index} style={styles.declarationItem}>
                {declaration.title && (
                  <Text style={styles.declarationTitle}>{declaration.title}</Text>
                )}
                <Text style={styles.declarationText}>
                  {language === 'tamil' ? declaration.tamil : declaration.english}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <BilingualLabel
              english={sellerSignature.english}
              tamil={sellerSignature.tamil}
              mode={language}
              fontSize={8}
              fontWeight="bold"
            />
            <Text style={styles.signatureNote}>
              {language === 'tamil' ? sellerSignatureNote.tamil : sellerSignatureNote.english}
            </Text>
          </View>
          
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <BilingualLabel
              english={replacePlaceholders(buyerSignature.english, companyName, '')}
              tamil={replacePlaceholders(buyerSignature.tamil, companyName, '')}
              mode={language}
              fontSize={8}
              fontWeight="bold"
            />
            <Text style={styles.signatureNote}>
              {language === 'tamil' ? buyerSignatureNote.tamil : buyerSignatureNote.english}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
