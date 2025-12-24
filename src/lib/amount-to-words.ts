// Convert number to words (Indian English format)

const ones = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];

const tens = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
];

function convertLessThanHundred(num: number): string {
  if (num < 20) return ones[num];
  const tenDigit = Math.floor(num / 10);
  const oneDigit = num % 10;
  return tens[tenDigit] + (oneDigit ? ' ' + ones[oneDigit] : '');
}

function convertLessThanThousand(num: number): string {
  if (num < 100) return convertLessThanHundred(num);
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;
  return ones[hundreds] + ' HUNDRED' + (remainder ? ' AND ' + convertLessThanHundred(remainder) : '');
}

// Indian numbering system: Lakhs and Crores
export function numberToWords(num: number): string {
  if (num === 0) return 'ZERO';
  if (num < 0) return 'MINUS ' + numberToWords(-num);

  // Round to 2 decimal places
  num = Math.round(num * 100) / 100;
  
  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  let words = '';

  // Crores (1,00,00,000)
  if (intPart >= 10000000) {
    const crores = Math.floor(intPart / 10000000);
    words += convertLessThanThousand(crores) + ' CRORE ';
  }

  // Lakhs (1,00,000)
  const afterCrores = intPart % 10000000;
  if (afterCrores >= 100000) {
    const lakhs = Math.floor(afterCrores / 100000);
    words += convertLessThanHundred(lakhs) + ' LAKH ';
  }

  // Thousands (1,000)
  const afterLakhs = afterCrores % 100000;
  if (afterLakhs >= 1000) {
    const thousands = Math.floor(afterLakhs / 1000);
    words += convertLessThanHundred(thousands) + ' THOUSAND ';
  }

  // Hundreds and below
  const afterThousands = afterLakhs % 1000;
  if (afterThousands > 0) {
    words += convertLessThanThousand(afterThousands);
  }

  words = words.trim();
  
  // Add decimal part (paise)
  if (decimalPart > 0) {
    words += ' AND ' + convertLessThanHundred(decimalPart) + ' PAISE';
  }

  return words || 'ZERO';
}

// Format amount with words: ₹1,23,456.00 (Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six Only)
export function formatAmountWithWords(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  const words = numberToWords(amount);
  return `${formatted} (Rupees ${words} Only)`;
}

// Just the words portion: "Two Lakhs Fifteen Thousand Seven Hundred Only"
export function amountToWordsOnly(amount: number): string {
  const words = numberToWords(amount);
  // Convert to Title Case for readability
  const titleCase = words.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  return `Rupees ${titleCase} Only`;
}
