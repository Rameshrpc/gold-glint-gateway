import { Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { PDF_FONTS } from './pdf-fonts';

// Tamil Unicode range detection
const TAMIL_UNICODE_RANGE = /[\u0B80-\u0BFF]/;

/**
 * Check if text contains Tamil characters
 */
export function containsTamil(text: string): boolean {
  return TAMIL_UNICODE_RANGE.test(text);
}

/**
 * Get appropriate font family based on text content
 */
export function getFontForText(text: string): string {
  if (containsTamil(text)) {
    return PDF_FONTS.tamil;
  }
  return PDF_FONTS.english;
}

/**
 * Bilingual label styles
 */
const bilingualStyles = StyleSheet.create({
  bilingualContainer: {
    marginBottom: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  englishText: {
    fontFamily: 'Roboto',
  },
  tamilText: {
    fontFamily: 'Noto Sans Tamil',
  },
  separator: {
    fontFamily: 'Roboto',
    marginHorizontal: 4,
  },
  stackedContainer: {
    flexDirection: 'column',
  },
  paragraphContainer: {
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    marginVertical: 4,
  },
});

export type LanguageMode = 'bilingual' | 'english' | 'tamil';

interface BilingualLabelProps {
  english: string;
  tamil: string;
  mode?: LanguageMode;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  separator?: string;
}

/**
 * Bilingual label component for PDF - shows "English / தமிழ்" format
 */
export function BilingualLabel({ 
  english, 
  tamil, 
  mode = 'bilingual',
  fontSize = 10,
  fontWeight = 'normal',
  color = '#000',
  separator = ' / '
}: BilingualLabelProps) {
  if (mode === 'english') {
    return (
      <Text style={[bilingualStyles.englishText, { fontSize, fontWeight, color }]}>
        {english}
      </Text>
    );
  }
  
  if (mode === 'tamil') {
    return (
      <Text style={[bilingualStyles.tamilText, { fontSize, fontWeight, color }]}>
        {tamil}
      </Text>
    );
  }

  // Bilingual mode - use stacked layout to prevent overlapping
  // Long text doesn't fit side-by-side in PDFs
  return (
    <View style={bilingualStyles.stackedContainer}>
      <Text style={[bilingualStyles.englishText, { fontSize, fontWeight, color }]}>
        {english}
      </Text>
      <Text style={[bilingualStyles.tamilText, { fontSize: fontSize - 1, fontWeight, color, marginTop: 1 }]}>
        {tamil}
      </Text>
    </View>
  );
}

interface BilingualTextProps {
  english: string;
  tamil: string;
  mode?: LanguageMode;
  fontSize?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * Bilingual text block component for PDF - shows stacked English then Tamil
 */
export function BilingualText({ 
  english, 
  tamil, 
  mode = 'bilingual',
  fontSize = 10,
  color = '#000',
  textAlign = 'left'
}: BilingualTextProps) {
  if (mode === 'english') {
    return (
      <Text style={[bilingualStyles.englishText, { fontSize, color, textAlign }]}>
        {english}
      </Text>
    );
  }
  
  if (mode === 'tamil') {
    return (
      <Text style={[bilingualStyles.tamilText, { fontSize, color, textAlign }]}>
        {tamil}
      </Text>
    );
  }

  // Bilingual mode - stacked
  return (
    <View style={bilingualStyles.stackedContainer}>
      <Text style={[bilingualStyles.englishText, { fontSize, color, textAlign }]}>
        {english}
      </Text>
      <Text style={[bilingualStyles.tamilText, { fontSize: fontSize - 1, color, textAlign, marginTop: 2 }]}>
        {tamil}
      </Text>
    </View>
  );
}

interface BilingualParagraphProps {
  english: string;
  tamil: string;
  mode?: LanguageMode;
  fontSize?: number;
  color?: string;
  showDivider?: boolean;
  clauseNumber?: number;
}

/**
 * Bilingual paragraph component for PDF - shows clause with number and translations
 */
export function BilingualParagraph({ 
  english, 
  tamil, 
  mode = 'bilingual',
  fontSize = 9,
  color = '#333',
  showDivider = false,
  clauseNumber
}: BilingualParagraphProps) {
  const prefix = clauseNumber ? `${clauseNumber}. ` : '';
  
  if (mode === 'english') {
    return (
      <View style={bilingualStyles.paragraphContainer}>
        <Text style={[bilingualStyles.englishText, { fontSize, color }]}>
          {prefix}{english}
        </Text>
        {showDivider && <View style={bilingualStyles.divider} />}
      </View>
    );
  }
  
  if (mode === 'tamil') {
    return (
      <View style={bilingualStyles.paragraphContainer}>
        <Text style={[bilingualStyles.tamilText, { fontSize, color }]}>
          {prefix}{tamil}
        </Text>
        {showDivider && <View style={bilingualStyles.divider} />}
      </View>
    );
  }

  // Bilingual mode
  return (
    <View style={bilingualStyles.paragraphContainer}>
      <Text style={[bilingualStyles.englishText, { fontSize, color }]}>
        {prefix}{english}
      </Text>
      <Text style={[bilingualStyles.tamilText, { fontSize: fontSize - 0.5, color: '#555', marginTop: 2, marginLeft: clauseNumber ? 12 : 0 }]}>
        {tamil}
      </Text>
      {showDivider && <View style={bilingualStyles.divider} />}
    </View>
  );
}

interface BilingualValueRowProps {
  labelEn: string;
  labelTa: string;
  value: string | number;
  mode?: LanguageMode;
  fontSize?: number;
  labelWidth?: string;
  valueStyle?: 'normal' | 'bold' | 'highlight';
}

/**
 * Bilingual row component for label: value pairs
 * Uses stacked layout to prevent text overlapping
 */
export function BilingualValueRow({
  labelEn,
  labelTa,
  value,
  mode = 'bilingual',
  fontSize = 10,
  labelWidth = '45%',
  valueStyle = 'normal'
}: BilingualValueRowProps) {
  const valueStyleObj = {
    fontWeight: valueStyle === 'bold' || valueStyle === 'highlight' ? 'bold' as const : 'normal' as const,
    backgroundColor: valueStyle === 'highlight' ? '#fef3c7' : 'transparent',
    padding: valueStyle === 'highlight' ? 2 : 0,
  };

  // For bilingual mode, use stacked label layout
  if (mode === 'bilingual') {
    return (
      <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' }}>
        <View style={{ width: labelWidth }}>
          <Text style={[bilingualStyles.englishText, { fontSize: fontSize - 1, color: '#555' }]}>
            {labelEn}
          </Text>
          <Text style={[bilingualStyles.tamilText, { fontSize: fontSize - 2, color: '#777', marginTop: 1 }]}>
            {labelTa}
          </Text>
        </View>
        <Text style={[bilingualStyles.englishText, { fontSize, flex: 1, ...valueStyleObj }]}>
          : {String(value)}
        </Text>
      </View>
    );
  }

  // Single language mode - simpler layout
  return (
    <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' }}>
      <View style={{ width: labelWidth }}>
        <Text style={[mode === 'tamil' ? bilingualStyles.tamilText : bilingualStyles.englishText, { fontSize: fontSize - 1, color: '#555' }]}>
          {mode === 'tamil' ? labelTa : labelEn}
        </Text>
      </View>
      <Text style={[bilingualStyles.englishText, { fontSize, flex: 1, ...valueStyleObj }]}>
        : {String(value)}
      </Text>
    </View>
  );
}

/**
 * Smart text component that automatically selects font based on content
 */
export function SmartText({ 
  children, 
  style = {} 
}: { 
  children: string; 
  style?: any;
}) {
  const font = getFontForText(children);
  return (
    <Text style={[{ fontFamily: font }, style]}>
      {children}
    </Text>
  );
}
