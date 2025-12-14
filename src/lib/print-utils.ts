// Print utility functions

export const FONT_OPTIONS = [
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Noto Sans', label: 'Noto Sans' },
  { value: 'Noto Sans Tamil', label: 'Noto Sans Tamil' },
];

export const PAPER_SIZES = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'legal', label: 'Legal (216 × 356 mm)' },
  { value: 'letter', label: 'Letter (216 × 279 mm)' },
];

export const RECEIPT_TYPES = [
  { value: 'loan', label: 'Loan Receipt' },
  { value: 'interest', label: 'Interest Receipt' },
  { value: 'redemption', label: 'Redemption Receipt' },
  { value: 'reloan', label: 'Reloan Receipt' },
  { value: 'auction', label: 'Auction Notice' },
  { value: 'gold_declaration', label: 'Gold Declaration' },
  { value: 'kyc', label: 'KYC Documents' },
  { value: 'summary', label: 'Loan Summary' },
  { value: 'declaration', label: 'Declaration' },
];

export const DOCUMENT_TYPES = [
  { value: 'loan_receipt', label: 'Loan Receipt' },
  { value: 'interest_receipt', label: 'Interest Receipt' },
  { value: 'redemption_receipt', label: 'Redemption Receipt' },
  { value: 'reloan_receipt', label: 'Reloan Receipt' },
  { value: 'auction_notice', label: 'Auction Notice' },
  { value: 'gold_declaration', label: 'Gold Declaration' },
  { value: 'kyc', label: 'KYC Documents' },
  { value: 'summary', label: 'Loan Summary' },
  { value: 'declaration', label: 'Declaration' },
];

export const PROFILE_TYPES = [
  { value: 'loan', label: 'Loan', documents: ['loan_receipt', 'kyc', 'gold_declaration', 'summary', 'declaration'] },
  { value: 'interest', label: 'Interest Payment', documents: ['interest_receipt'] },
  { value: 'redemption', label: 'Redemption', documents: ['redemption_receipt', 'gold_declaration'] },
  { value: 'reloan', label: 'Reloan', documents: ['reloan_receipt', 'kyc', 'gold_declaration'] },
  { value: 'auction', label: 'Auction', documents: ['auction_notice'] },
];

export const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'bilingual', label: 'Bilingual (English + Tamil)' },
];

export const formatIndianCurrencyPrint = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDatePrint = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  if (format === 'long') {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatWeight = (grams: number): string => {
  return `${grams.toFixed(3)} g`;
};

// Number to words conversion for Indian numbering system
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  
  const convertLessThanHundred = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  };
  
  const convertLessThanThousand = (n: number): string => {
    if (n < 100) return convertLessThanHundred(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanHundred(n % 100) : '');
  };
  
  let result = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor(num % 1000);
  
  if (crore > 0) result += convertLessThanHundred(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanHundred(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanHundred(thousand) + ' Thousand ';
  if (hundred > 0) result += convertLessThanThousand(hundred);
  
  return result.trim() + ' Rupees Only';
};

export interface PrintTemplateConfig {
  fontFamily: string;
  fontSize: number;
  colorScheme: {
    primary: string;
    secondary: string;
  };
  paperSize: string;
  language: string;
  showLogo: boolean;
  showDeclaration: boolean;
  showSignatureSection: boolean;
  showTerms: boolean;
  headerText?: string;
  footerText?: string;
  watermarkText?: string;
}

export const DEFAULT_TEMPLATE_CONFIG: PrintTemplateConfig = {
  fontFamily: 'Roboto',
  fontSize: 10,
  colorScheme: {
    primary: '#B45309',
    secondary: '#1E40AF',
  },
  paperSize: 'a4',
  language: 'bilingual',
  showLogo: true,
  showDeclaration: true,
  showSignatureSection: true,
  showTerms: true,
};
