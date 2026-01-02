// Strike Price Calculation Utilities for Bill of Sale & Repurchase Option Agreement
// This reframes loan transactions as trading transactions under Sale of Goods Act, 1930

import { addDays, format } from 'date-fns';
import { calculateInterest } from './interestCalculations';

export interface StrikePeriodConfig {
  days: number;
  labelEnglish: string;
  labelTamil: string;
}

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
 * Parse strike period from content block format
 * Format: "0-30 Days|0-30 நாட்கள்|30" 
 */
export function parseStrikePeriod(contentEnglish: string | null, contentTamil: string | null): StrikePeriodConfig | null {
  if (!contentEnglish) return null;
  
  const parts = contentEnglish.split('|');
  if (parts.length >= 3) {
    const days = parseInt(parts[2], 10);
    if (!isNaN(days)) {
      return {
        labelEnglish: parts[0],
        labelTamil: parts[1] || contentTamil || parts[0],
        days,
      };
    }
  }
  
  // Fallback: try to extract days from label
  const match = contentEnglish.match(/(\d+)\s*-?\s*(\d+)?\s*Days?/i);
  if (match) {
    const endDays = match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
    return {
      labelEnglish: contentEnglish,
      labelTamil: contentTamil || contentEnglish,
      days: endDays,
    };
  }
  
  return null;
}

/**
 * Calculate strike prices for Bill of Sale document
 * Uses the same interest calculation logic as interest payments:
 * Interest = (Principal × Rate × Days) / (100 × 365)
 * 
 * The strike price bundles:
 * - Original purchase price (principal)
 * - Trade margin at shown rate (visible component)
 * - Differential margin (effective_rate - shown_rate) 
 * - Processing fee (first period only)
 * 
 * @param principal - The spot purchase price (loan principal)
 * @param annualShownRate - Shown rate per annum (e.g., 18 for 18% p.a.)
 * @param annualEffectiveRate - Effective rate per annum (e.g., 36 for 36% p.a.)
 * @param processingFeePercentage - One-time processing fee (e.g., 1 for 1%)
 * @param loanDate - Date of the transaction
 * @param tenureDays - Total option period in days (default 90)
 * @param customPeriods - Custom strike periods from settings
 */
export function calculateStrikePrices(
  principal: number,
  annualShownRate: number,
  annualEffectiveRate: number = annualShownRate,
  processingFeePercentage: number = 0,
  loanDate: string,
  tenureDays: number = 90,
  customPeriods?: StrikePeriodConfig[]
): StrikePriceCalculation {
  const startDate = new Date(loanDate);
  
  // One-time processing fee (added to first period only)
  const processingFee = Math.round(principal * (processingFeePercentage / 100));
  
  const strikePrices: StrikePriceRow[] = [];
  
  // Use custom periods if provided, otherwise use default 30-day intervals
  const periods = customPeriods && customPeriods.length > 0
    ? [...customPeriods].sort((a, b) => a.days - b.days)
    : getDefaultPeriods(tenureDays);
  
  let previousDays = 0;
  
  periods.forEach((period, index) => {
    // Calculate trade margin for the cumulative days using interest formula
    // Trade Margin = (Principal × Rate × Days) / (100 × 365)
    const cumulativeDays = period.days;
    
    // Calculate shown margin (customer sees this rate)
    const shownMargin = calculateInterest(principal, annualShownRate, cumulativeDays);
    
    // Calculate differential margin (hidden component: effective - shown)
    const differentialRate = annualEffectiveRate - annualShownRate;
    const differentialMargin = differentialRate > 0 
      ? calculateInterest(principal, differentialRate, cumulativeDays) 
      : 0;
    
    // Total trade margin = shown + differential
    const totalTradeMargin = shownMargin + differentialMargin;
    
    // Strike Price = Principal + Total Trade Margin + Processing Fee (first period only)
    const strikePrice = principal + Math.round(totalTradeMargin) + (index === 0 ? processingFee : processingFee);
    
    strikePrices.push({
      periodLabel: period.labelEnglish,
      periodLabelTamil: period.labelTamil,
      periodDays: { from: previousDays, to: period.days },
      strikePrice: Math.round(strikePrice),
      status: index === 0 ? 'active' : 'future',
      expiryDate: format(addDays(startDate, period.days), 'dd/MM/yyyy'),
    });
    
    previousDays = period.days;
  });
  
  const finalExpiry = periods.length > 0 
    ? periods[periods.length - 1].days 
    : tenureDays;
  const expiryDate = format(addDays(startDate, finalExpiry), 'dd/MM/yyyy');
  
  return {
    spotPurchasePrice: principal,
    strikePrices,
    expiryDate,
    agreementRef: '', // Will be set by the caller using loan number
  };
}

/**
 * Get default strike periods based on tenure
 */
function getDefaultPeriods(tenureDays: number): StrikePeriodConfig[] {
  const periods: StrikePeriodConfig[] = [];
  
  // Standard 30-day intervals up to tenure
  let currentDays = 30;
  let periodNum = 1;
  
  while (currentDays <= tenureDays && periodNum <= 6) {
    const startDay = (periodNum - 1) * 30 + 1;
    if (periodNum === 1) {
      periods.push({
        labelEnglish: `0 - ${currentDays} Days`,
        labelTamil: `0 - ${currentDays} நாட்கள்`,
        days: currentDays,
      });
    } else {
      periods.push({
        labelEnglish: `${startDay} - ${currentDays} Days`,
        labelTamil: `${startDay} - ${currentDays} நாட்கள்`,
        days: currentDays,
      });
    }
    currentDays += 30;
    periodNum++;
  }
  
  // If tenure doesn't align with 30-day intervals, add final period
  if (tenureDays > 0 && periods.length === 0) {
    periods.push({
      labelEnglish: `0 - ${tenureDays} Days`,
      labelTamil: `0 - ${tenureDays} நாட்கள்`,
      days: tenureDays,
    });
  }
  
  return periods;
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

/**
 * Parse scheme strike periods from JSONB format
 */
export function parseSchemeStrikePeriods(strikePeriods: unknown): StrikePeriodConfig[] | undefined {
  if (!strikePeriods || !Array.isArray(strikePeriods)) {
    return undefined;
  }
  
  return strikePeriods
    .map((period: any) => ({
      days: typeof period.days === 'number' ? period.days : parseInt(period.days, 10),
      labelEnglish: period.label_en || period.labelEnglish || `0-${period.days} Days`,
      labelTamil: period.label_ta || period.labelTamil || `0-${period.days} நாட்கள்`,
    }))
    .filter(p => !isNaN(p.days) && p.days > 0)
    .sort((a, b) => a.days - b.days);
}
