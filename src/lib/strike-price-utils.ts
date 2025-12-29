// Strike Price Calculation Utilities for Bill of Sale & Repurchase Option Agreement
// This reframes loan transactions as trading transactions under Sale of Goods Act, 1930

import { addDays, format } from 'date-fns';

export interface StrikePriceRow {
  periodLabel: string;           // "0 - 30 Days"
  periodLabelTamil: string;      // Tamil translation
  periodDays: { from: number; to: number };
  strikePrice: number;           // Total buyback amount (bundled)
  status: 'active' | 'future';
  expiryDate: string;
}

export interface StrikePriceCalculation {
  spotPurchasePrice: number;     // Principal amount (what buyer pays seller)
  strikePrices: StrikePriceRow[];
  expiryDate: string;            // Final expiry after which option expires
  agreementRef: string;          // Agreement reference number
}

/**
 * Calculate strike prices for Bill of Sale document
 * 
 * The strike price bundles:
 * - Original purchase price (principal)
 * - Trade margin (interest component)
 * - Admin fee (processing fee - first month only)
 * 
 * Customer sees only the final strike price, not the breakdown.
 * 
 * @param principal - The spot purchase price (loan principal)
 * @param monthlyInterestRate - Interest rate per month (e.g., 2 for 2%)
 * @param processingFeePercentage - One-time processing fee (e.g., 1 for 1%)
 * @param loanDate - Date of the transaction
 * @param tenureDays - Total option period in days (default 90)
 */
export function calculateStrikePrices(
  principal: number,
  monthlyInterestRate: number,
  processingFeePercentage: number = 0,
  loanDate: string,
  tenureDays: number = 90
): StrikePriceCalculation {
  const startDate = new Date(loanDate);
  
  // Calculate monthly trade margin (hidden as "interest")
  const monthlyMargin = Math.round(principal * (monthlyInterestRate / 100));
  
  // One-time admin fee (processing fee)
  const adminFee = Math.round(principal * (processingFeePercentage / 100));
  
  // Calculate strike prices for each 30-day period
  const strikePrices: StrikePriceRow[] = [];
  
  // 0-30 Days: Principal + 1 month margin + admin fee
  const price30 = principal + monthlyMargin + adminFee;
  strikePrices.push({
    periodLabel: '0 - 30 Days',
    periodLabelTamil: '0 - 30 நாட்கள்',
    periodDays: { from: 0, to: 30 },
    strikePrice: price30,
    status: 'active',
    expiryDate: format(addDays(startDate, 30), 'dd/MM/yyyy'),
  });
  
  // 31-60 Days: Previous + 1 month margin
  const price60 = price30 + monthlyMargin;
  strikePrices.push({
    periodLabel: '31 - 60 Days',
    periodLabelTamil: '31 - 60 நாட்கள்',
    periodDays: { from: 31, to: 60 },
    strikePrice: price60,
    status: 'future',
    expiryDate: format(addDays(startDate, 60), 'dd/MM/yyyy'),
  });
  
  // 61-90 Days: Previous + 1 month margin
  const price90 = price60 + monthlyMargin;
  strikePrices.push({
    periodLabel: '61 - 90 Days',
    periodLabelTamil: '61 - 90 நாட்கள்',
    periodDays: { from: 61, to: 90 },
    strikePrice: price90,
    status: 'future',
    expiryDate: format(addDays(startDate, 90), 'dd/MM/yyyy'),
  });
  
  // If tenure is longer than 90 days, add additional periods
  if (tenureDays > 90) {
    const additionalMonths = Math.ceil((tenureDays - 90) / 30);
    let previousPrice = price90;
    
    for (let i = 0; i < additionalMonths; i++) {
      const startDay = 91 + (i * 30);
      const endDay = Math.min(startDay + 29, tenureDays);
      const newPrice = previousPrice + monthlyMargin;
      
      strikePrices.push({
        periodLabel: `${startDay} - ${endDay} Days`,
        periodLabelTamil: `${startDay} - ${endDay} நாட்கள்`,
        periodDays: { from: startDay, to: endDay },
        strikePrice: newPrice,
        status: 'future',
        expiryDate: format(addDays(startDate, endDay), 'dd/MM/yyyy'),
      });
      
      previousPrice = newPrice;
    }
  }
  
  const expiryDate = format(addDays(startDate, tenureDays), 'dd/MM/yyyy');
  
  return {
    spotPurchasePrice: principal,
    strikePrices,
    expiryDate,
    agreementRef: '', // Will be set by the caller using loan number
  };
}

/**
 * Generate agreement reference from loan number
 * Format: ZG/YEAR/XXXX
 */
export function generateAgreementRef(loanNumber: string, companyPrefix: string = 'ZG'): string {
  const year = new Date().getFullYear();
  // Extract numeric part from loan number
  const numericPart = loanNumber.replace(/\D/g, '').slice(-4).padStart(4, '0');
  return `${companyPrefix}/${year}/${numericPart}`;
}

/**
 * Format currency for Bill of Sale (without "Loan" terminology)
 */
export function formatCurrencyForSale(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
