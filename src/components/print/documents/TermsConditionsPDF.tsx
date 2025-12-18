import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import '@/lib/pdf-fonts';
import { ClientPrintData, BranchPrintData } from '@/types/print-data';
import { LanguageMode, BilingualParagraph } from '@/lib/bilingual-utils';
import { translations, getRegulatoryTerms, getBusinessTerms } from '@/lib/translations';
import { formatDatePrint } from '@/lib/print-utils';

interface TermsConditionsPDFProps {
  client: ClientPrintData;
  branch: BranchPrintData;
  loanNumber: string;
  customerName: string;
  language?: LanguageMode;
  layout?: 'stacked' | 'two-column';
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 9,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
    paddingBottom: 10,
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
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
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
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  subtitleTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#1E40AF',
    backgroundColor: '#f0f9ff',
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
  },
  sectionTitleTamil: {
    fontSize: 10,
    fontFamily: 'Noto Sans Tamil',
    color: '#1E40AF',
  },
  termsContainer: {
    marginBottom: 10,
  },
  termRow: {
    marginBottom: 8,
    paddingLeft: 5,
  },
  termNumber: {
    fontWeight: 'bold',
    color: '#B45309',
  },
  termTextEnglish: {
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#333',
  },
  termTextTamil: {
    fontFamily: 'Noto Sans Tamil',
    fontSize: 8,
    lineHeight: 1.5,
    color: '#555',
    marginTop: 2,
    marginLeft: 12,
  },
  twoColumnContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    width: '48%',
    paddingHorizontal: 5,
  },
  columnDivider: {
    width: '4%',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  acknowledgmentSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 4,
  },
  acknowledgmentText: {
    fontSize: 9,
    fontFamily: 'Roboto',
    color: '#333',
  },
  acknowledgmentTextTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#555',
    marginTop: 4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 10,
  },
  signatureBox: {
    width: '40%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 50,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
  },
  signatureLabelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  loanInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loanInfoItem: {
    fontSize: 8,
  },
  loanInfoLabel: {
    color: '#666',
  },
  loanInfoValue: {
    fontWeight: 'bold',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 8,
    color: '#666',
  },
});

function TermItem({ 
  number, 
  english, 
  tamil, 
  language 
}: { 
  number: number; 
  english: string; 
  tamil: string; 
  language: LanguageMode;
}) {
  return (
    <View style={styles.termRow}>
      <Text style={styles.termTextEnglish}>
        <Text style={styles.termNumber}>{number}. </Text>
        {english}
      </Text>
      {language !== 'english' && (
        <Text style={styles.termTextTamil}>{tamil}</Text>
      )}
    </View>
  );
}

export default function TermsConditionsPDF({ 
  client, 
  branch, 
  loanNumber, 
  customerName,
  language = 'bilingual',
  layout = 'stacked'
}: TermsConditionsPDFProps) {
  const regulatoryTerms = getRegulatoryTerms();
  const businessTerms = getBusinessTerms();
  const showTamil = language !== 'english';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{client.company_name}</Text>
          <Text style={styles.branchName}>{branch.branch_name}</Text>
        </View>
        
        {/* Title */}
        <Text style={styles.title}>{translations.termsAndConditions.en}</Text>
        {showTamil && (
          <Text style={styles.titleTamil}>{translations.termsAndConditions.ta}</Text>
        )}
        
        {/* Subtitle */}
        <View style={styles.subtitle}>
          <Text>{translations.asPerTNPawnbrokersAct.en}</Text>
          {showTamil && (
            <Text style={styles.subtitleTamil}>{translations.asPerTNPawnbrokersAct.ta}</Text>
          )}
        </View>
        
        {/* Loan Info */}
        <View style={styles.loanInfo}>
          <View style={styles.loanInfoItem}>
            <Text style={styles.loanInfoLabel}>Loan Number</Text>
            <Text style={styles.loanInfoValue}>{loanNumber}</Text>
          </View>
          <View style={styles.loanInfoItem}>
            <Text style={styles.loanInfoLabel}>Customer Name</Text>
            <Text style={styles.loanInfoValue}>{customerName}</Text>
          </View>
          <View style={styles.loanInfoItem}>
            <Text style={styles.loanInfoLabel}>Date</Text>
            <Text style={styles.loanInfoValue}>{formatDatePrint(new Date().toISOString(), 'long')}</Text>
          </View>
        </View>
        
        {/* Regulatory Terms Section */}
        <View style={styles.sectionTitle}>
          <Text>Regulatory Terms (As per Tamil Nadu Pawnbrokers Act)</Text>
          {showTamil && (
            <Text style={styles.sectionTitleTamil}>
              ஒழுங்குமுறை விதிமுறைகள் (தமிழ்நாடு அடமானதாரர் சட்டத்தின்படி)
            </Text>
          )}
        </View>
        
        <View style={styles.termsContainer}>
          {regulatoryTerms.map((term, index) => (
            <TermItem 
              key={index}
              number={index + 1}
              english={term.en}
              tamil={term.ta}
              language={language}
            />
          ))}
        </View>
        
        {/* Business Terms Section */}
        <View style={styles.sectionTitle}>
          <Text>Additional Business Terms</Text>
          {showTamil && (
            <Text style={styles.sectionTitleTamil}>கூடுதல் வணிக விதிமுறைகள்</Text>
          )}
        </View>
        
        <View style={styles.termsContainer}>
          {businessTerms.map((term, index) => (
            <TermItem 
              key={index}
              number={regulatoryTerms.length + index + 1}
              english={term.en}
              tamil={term.ta}
              language={language}
            />
          ))}
        </View>
        
        {/* Acknowledgment Section */}
        <View style={styles.acknowledgmentSection}>
          <Text style={styles.acknowledgmentText}>
            {translations.iHaveReadTerms.en}
          </Text>
          {showTamil && (
            <Text style={styles.acknowledgmentTextTamil}>
              {translations.iHaveReadTerms.ta}
            </Text>
          )}
        </View>
        
        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>{translations.customerSignature.en}</Text>
              {showTamil && (
                <Text style={styles.signatureLabelTamil}>{translations.customerSignature.ta}</Text>
              )}
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>{translations.authorizedSignature.en}</Text>
              {showTamil && (
                <Text style={styles.signatureLabelTamil}>{translations.authorizedSignature.ta}</Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>
          {translations.computerGenerated.en}
          {showTamil ? ` / ${translations.computerGenerated.ta}` : ''}
        </Text>
      </Page>
    </Document>
  );
}
