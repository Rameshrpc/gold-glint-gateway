import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import '@/lib/pdf-fonts';
import { CustomerPrintData, ClientPrintData, BranchPrintData } from '@/types/print-data';
import { LanguageMode, BilingualLabel } from '@/lib/bilingual-utils';
import { translations } from '@/lib/translations';
import { formatDatePrint } from '@/lib/print-utils';

interface KycCardPDFProps {
  customer: CustomerPrintData;
  client: ClientPrintData;
  branch: BranchPrintData;
  loanNumber: string;
  language?: LanguageMode;
}

// Credit card dimensions: 85.6mm × 54mm
// At 72 DPI: ~243 × 153 points
const CARD_WIDTH = 243;
const CARD_HEIGHT = 153;
const CARD_MARGIN = 20;

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
    color: '#B45309',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    margin: CARD_MARGIN,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fefefe',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#B45309',
    paddingBottom: 4,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#B45309',
  },
  cardTitleTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
  },
  companyName: {
    fontSize: 6,
    color: '#666',
  },
  cardBody: {
    flexDirection: 'row',
    flex: 1,
  },
  photoSection: {
    width: 50,
    marginRight: 8,
  },
  photo: {
    width: 48,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: 48,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: '35%',
    fontSize: 6,
    color: '#666',
  },
  labelTamil: {
    fontSize: 5,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  value: {
    flex: 1,
    fontSize: 7,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingTop: 4,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 5,
    color: '#888',
  },
  cutMark: {
    position: 'absolute',
    width: 10,
    height: 1,
    backgroundColor: '#ccc',
  },
  documentImage: {
    width: '100%',
    height: 85,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 4,
  },
});

function KycCard({ 
  title, 
  titleTamil,
  customer, 
  client, 
  branch,
  loanNumber,
  showPhoto = true,
  documentUrl,
  documentType,
  language = 'bilingual'
}: {
  title: string;
  titleTamil: string;
  customer: CustomerPrintData;
  client: ClientPrintData;
  branch: BranchPrintData;
  loanNumber: string;
  showPhoto?: boolean;
  documentUrl?: string;
  documentType?: 'aadhaar' | 'pan' | 'photo';
  language?: LanguageMode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          {language !== 'english' && (
            <Text style={styles.cardTitleTamil}>{titleTamil}</Text>
          )}
        </View>
        <Text style={styles.companyName}>{client.company_name}</Text>
      </View>
      
      <View style={styles.cardBody}>
        {showPhoto && (
          <View style={styles.photoSection}>
            {customer.photo_url ? (
              <Image src={customer.photo_url} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={{ fontSize: 5, color: '#999' }}>Photo</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.label}>
              <Text>Name</Text>
              {language !== 'english' && <Text style={styles.labelTamil}>பெயர்</Text>}
            </View>
            <Text style={styles.value}>{customer.full_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.label}>
              <Text>ID</Text>
              {language !== 'english' && <Text style={styles.labelTamil}>எண்</Text>}
            </View>
            <Text style={styles.value}>{customer.customer_code}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.label}>
              <Text>Phone</Text>
              {language !== 'english' && <Text style={styles.labelTamil}>தொலைபேசி</Text>}
            </View>
            <Text style={styles.value}>{customer.phone}</Text>
          </View>
          
          {customer.address && (
            <View style={styles.detailRow}>
              <View style={styles.label}>
                <Text>Address</Text>
                {language !== 'english' && <Text style={styles.labelTamil}>முகவரி</Text>}
              </View>
              <Text style={[styles.value, { fontSize: 5 }]}>
                {customer.address?.substring(0, 60)}{customer.address && customer.address.length > 60 ? '...' : ''}
              </Text>
            </View>
          )}
          
          {documentUrl && !showPhoto && (
            <Image src={documentUrl} style={styles.documentImage} />
          )}
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>{branch.branch_name}</Text>
        <Text style={styles.footerText}>Loan: {loanNumber}</Text>
      </View>
    </View>
  );
}

export default function KycCardPDF({ customer, client, branch, loanNumber, language = 'bilingual' }: KycCardPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {language === 'tamil' ? translations.customerKycDocuments.ta : 
           language === 'english' ? translations.customerKycDocuments.en :
           `${translations.customerKycDocuments.en} / ${translations.customerKycDocuments.ta}`}
        </Text>
        
        <View style={styles.cardsContainer}>
          {/* Photo ID Card */}
          <KycCard
            title="Photo ID Card"
            titleTamil="புகைப்பட அடையாள அட்டை"
            customer={customer}
            client={client}
            branch={branch}
            loanNumber={loanNumber}
            showPhoto={true}
            language={language}
          />
          
          {/* PAN Card */}
          <KycCard
            title="PAN Card"
            titleTamil="பான் அட்டை"
            customer={customer}
            client={client}
            branch={branch}
            loanNumber={loanNumber}
            showPhoto={false}
            documentUrl={customer.pan_card_url}
            documentType="pan"
            language={language}
          />
          
          {/* Aadhaar Front */}
          <KycCard
            title="Aadhaar (Front)"
            titleTamil="ஆதார் (முன்பக்கம்)"
            customer={customer}
            client={client}
            branch={branch}
            loanNumber={loanNumber}
            showPhoto={false}
            documentUrl={customer.aadhaar_front_url}
            documentType="aadhaar"
            language={language}
          />
          
          {/* Aadhaar Back */}
          <KycCard
            title="Aadhaar (Back)"
            titleTamil="ஆதார் (பின்பக்கம்)"
            customer={customer}
            client={client}
            branch={branch}
            loanNumber={loanNumber}
            showPhoto={false}
            documentUrl={customer.aadhaar_back_url}
            documentType="aadhaar"
            language={language}
          />
        </View>
        
        {/* Cut marks instruction */}
        <Text style={{ fontSize: 7, color: '#999', textAlign: 'center', marginTop: 20 }}>
          Cut along the card borders for credit-card sized KYC cards (85.6 × 54 mm)
        </Text>
      </Page>
    </Document>
  );
}
