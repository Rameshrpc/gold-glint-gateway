import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles, formatDatePrint } from './PDFStyles';
import { BilingualLabel, LanguageMode } from '@/lib/bilingual-utils';

interface PDFHeaderProps {
  companyName: string;
  branchName?: string;
  address?: string;
  phone?: string;
  date?: string | Date;
  documentNumber?: string;
  sloganEnglish?: string | null;
  sloganTamil?: string | null;
  language?: LanguageMode;
}

export function PDFHeader({
  companyName,
  branchName,
  address,
  phone,
  date,
  documentNumber,
  sloganEnglish,
  sloganTamil,
  language = 'bilingual',
}: PDFHeaderProps) {
  return (
    <View style={pdfStyles.header}>
      <Text style={pdfStyles.headerCompanyName}>{companyName}</Text>
      
      {sloganEnglish && sloganTamil && (
        <View style={{ alignItems: 'center' }}>
          <BilingualLabel
            english={sloganEnglish}
            tamil={sloganTamil}
            mode={language}
            fontSize={9}
            color="#555"
          />
        </View>
      )}
      
      {branchName && (
        <Text style={pdfStyles.headerBranch}>Branch: {branchName}</Text>
      )}
      
      {address && (
        <Text style={{ fontSize: 8, textAlign: 'center', color: '#666', marginTop: 2 }}>
          {address}
        </Text>
      )}
      
      {phone && (
        <Text style={{ fontSize: 8, textAlign: 'center', color: '#666' }}>
          Phone: {phone}
        </Text>
      )}
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 9, color: '#555' }}>
          {documentNumber && `Doc No: ${documentNumber}`}
        </Text>
        <Text style={pdfStyles.headerDate}>
          Date: {formatDatePrint(date || new Date())}
        </Text>
      </View>
    </View>
  );
}
