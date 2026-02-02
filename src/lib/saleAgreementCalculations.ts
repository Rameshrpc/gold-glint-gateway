/**
 * Sale Agreement Calculation Utilities
 * 
 * Simplified calculation system for Sale Agreements (Bill of Sale & Repurchase Option)
 * - Monthly Margin: Fixed ₹ per month per ₹1 lakh purchase
 * - No Differential Interest: Single rate system
 * - 15-Day Tenure Multiples: Option periods in 15-day increments
 */

import { addDays, format, differenceInDays, parseISO } from 'date-fns';

export interface SaleAgreementScheme {
  id: string;
  scheme_name: string;
  margin_per_month: number;       // ₹ per month per ₹1 lakh
  advance_interest_months: number; // months collected upfront
  min_tenure_days: number;
  max_tenure_days: number;
  tenure_step: number;            // 15 days
  processing_fee_percentage: number;
  document_charges: number;       // percentage
  rate_22kt: number;
  rate_18kt: number;
  ltv_percentage: number;
}

export interface StrikePriceRow {
  periodLabel: string;           // "0 - 15 Days"
  periodLabelTamil: string;      // Tamil translation
  periodDays: { from: number; to: number };
  strikePrice: number;           // Repurchase price at this period
  monthsMargin: number;          // Number of months margin included
  expiryDate: string;
}

export interface SaleAgreementCalculation {
  spotPurchasePrice: number;           // Total appraised value (= purchase price with 100% LTV)
  monthlyMargin: number;               // ₹ margin per month for this purchase
  advanceMarginMonths: number;         // Number of months collected upfront
  advanceMargin: number;               // Total advance margin collected
  processingFee: number;               // One-time processing fee
  documentCharges: number;             // Document charges
  netCashToSeller: number;             // Net amount seller receives
  strikePrices: StrikePriceRow[];      // Repurchase price schedule
  expiryDate: string;                  // Final option expiry date
  tenureDays: number;
}

export interface MarginRenewalCalc {
  agreementId: string;
  spotPurchasePrice: number;
  monthlyMargin: number;
  daysSinceLastPayment: number;
  monthsDue: number;                   // ceil(daysSinceLastPayment / 30)
  marginDue: number;                   // monthsDue × monthlyMargin
  penaltyDays: number;
  penaltyAmount: number;
  totalDue: number;
}

export interface RepurchaseCalc {
  agreementId: string;
  spotPurchasePrice: number;
  monthlyMargin: number;
  daysSinceAgreement: number;
  monthsMargin: number;                // ceil(daysSinceAgreement / 30)
  totalMargin: number;                 // monthsMargin × monthlyMargin
  strikePrice: number;                 // spotPurchasePrice + totalMargin
  advanceMarginPaid: number;           // Already paid upfront
  netDue: number;                      // strikePrice - advanceMarginPaid (if any margin remaining)
}

/**
 * Calculate monthly margin amount for a given purchase price
 * Formula: Spot Price × (margin_per_month / 100,000)
 */
export function calculateMonthlyMargin(spotPrice: number, marginPerMonth: number): number {
  return Math.round(spotPrice * (marginPerMonth / 100000));
}

/**
 * Calculate advance margin collected at agreement creation
 */
export function calculateAdvanceMargin(
  spotPrice: number,
  marginPerMonth: number,
  advanceMonths: number
): number {
  const monthlyMargin = calculateMonthlyMargin(spotPrice, marginPerMonth);
  return monthlyMargin * advanceMonths;
}

/**
 * Generate 15-day interval strike price schedule
 * Strike Price at Day N = Spot Price + (Monthly Margin × ceil(N / 30))
 */
export function calculateSimpleStrikePrices(
  spotPrice: number,
  marginPerMonth: number,
  agreementDate: string,
  tenureDays: number,
  tenureStep: number = 15
): StrikePriceRow[] {
  const monthlyMargin = calculateMonthlyMargin(spotPrice, marginPerMonth);
  const startDate = new Date(agreementDate);
  const strikePrices: StrikePriceRow[] = [];
  
  let currentDay = tenureStep;
  let previousDay = 0;
  
  while (currentDay <= tenureDays) {
    // Months of margin = ceiling of days / 30
    const monthsMargin = Math.ceil(currentDay / 30);
    const totalMargin = monthlyMargin * monthsMargin;
    const strikePrice = spotPrice + totalMargin;
    
    const periodLabel = previousDay === 0 
      ? `0 - ${currentDay} Days`
      : `${previousDay + 1} - ${currentDay} Days`;
    
    const periodLabelTamil = previousDay === 0
      ? `0 - ${currentDay} நாட்கள்`
      : `${previousDay + 1} - ${currentDay} நாட்கள்`;
    
    strikePrices.push({
      periodLabel,
      periodLabelTamil,
      periodDays: { from: previousDay, to: currentDay },
      strikePrice,
      monthsMargin,
      expiryDate: format(addDays(startDate, currentDay), 'dd/MM/yyyy'),
    });
    
    previousDay = currentDay;
    currentDay += tenureStep;
  }
  
  // Ensure final period covers up to tenure
  if (previousDay < tenureDays) {
    const monthsMargin = Math.ceil(tenureDays / 30);
    const totalMargin = monthlyMargin * monthsMargin;
    const strikePrice = spotPrice + totalMargin;
    
    strikePrices.push({
      periodLabel: `${previousDay + 1} - ${tenureDays} Days`,
      periodLabelTamil: `${previousDay + 1} - ${tenureDays} நாட்கள்`,
      periodDays: { from: previousDay, to: tenureDays },
      strikePrice,
      monthsMargin,
      expiryDate: format(addDays(startDate, tenureDays), 'dd/MM/yyyy'),
    });
  }
  
  return strikePrices;
}

/**
 * Full sale agreement calculation at creation time
 */
export function calculateSaleAgreement(
  totalAppraisedValue: number,
  scheme: SaleAgreementScheme,
  tenureDays: number,
  agreementDate: string = format(new Date(), 'yyyy-MM-dd')
): SaleAgreementCalculation {
  // With 100% LTV, spot purchase price = appraised value
  const spotPurchasePrice = Math.round(totalAppraisedValue * (scheme.ltv_percentage / 100));
  
  // Monthly margin based on scheme rate
  const monthlyMargin = calculateMonthlyMargin(spotPurchasePrice, scheme.margin_per_month);
  
  // Advance margin collected upfront
  const advanceMargin = monthlyMargin * scheme.advance_interest_months;
  
  // Fees
  const processingFee = Math.round(spotPurchasePrice * (scheme.processing_fee_percentage / 100));
  const documentCharges = Math.round(spotPurchasePrice * (scheme.document_charges / 100));
  
  // Net cash to seller
  const netCashToSeller = spotPurchasePrice - advanceMargin - processingFee - documentCharges;
  
  // Strike price schedule
  const strikePrices = calculateSimpleStrikePrices(
    spotPurchasePrice,
    scheme.margin_per_month,
    agreementDate,
    tenureDays,
    scheme.tenure_step || 15
  );
  
  // Final expiry date
  const expiryDate = format(addDays(new Date(agreementDate), tenureDays), 'dd/MM/yyyy');
  
  return {
    spotPurchasePrice,
    monthlyMargin,
    advanceMarginMonths: scheme.advance_interest_months,
    advanceMargin,
    processingFee,
    documentCharges,
    netCashToSeller,
    strikePrices,
    expiryDate,
    tenureDays,
  };
}

/**
 * Calculate margin renewal payment
 * Simple monthly margin × months since last payment
 */
export function calculateMarginRenewal(
  spotPurchasePrice: number,
  marginPerMonth: number,
  lastPaymentDate: string,
  gracePeriodDays: number = 7,
  penaltyRateMonthly: number = 2  // 2% per month penalty
): MarginRenewalCalc {
  const monthlyMargin = calculateMonthlyMargin(spotPurchasePrice, marginPerMonth);
  const today = new Date();
  const lastPaid = parseISO(lastPaymentDate);
  const daysSinceLastPayment = differenceInDays(today, lastPaid);
  
  // Months due = ceiling of days / 30
  const monthsDue = Math.max(1, Math.ceil(daysSinceLastPayment / 30));
  const marginDue = monthlyMargin * monthsDue;
  
  // Penalty for days beyond grace period
  const penaltyDays = Math.max(0, daysSinceLastPayment - 30 - gracePeriodDays);
  const penaltyAmount = penaltyDays > 0 
    ? Math.round(spotPurchasePrice * (penaltyRateMonthly / 100) * Math.ceil(penaltyDays / 30))
    : 0;
  
  return {
    agreementId: '',
    spotPurchasePrice,
    monthlyMargin,
    daysSinceLastPayment,
    monthsDue,
    marginDue,
    penaltyDays,
    penaltyAmount,
    totalDue: marginDue + penaltyAmount,
  };
}

/**
 * Calculate repurchase (exercise option) amount
 * Strike Price at Day N = Spot Price + (Monthly Margin × ceil(N / 30))
 */
export function calculateRepurchase(
  spotPurchasePrice: number,
  marginPerMonth: number,
  agreementDate: string,
  advanceMarginMonths: number = 1
): RepurchaseCalc {
  const monthlyMargin = calculateMonthlyMargin(spotPurchasePrice, marginPerMonth);
  const today = new Date();
  const agreementStart = parseISO(agreementDate);
  const daysSinceAgreement = differenceInDays(today, agreementStart);
  
  // Months of margin = ceiling of days / 30 (minimum 1)
  const monthsMargin = Math.max(1, Math.ceil(daysSinceAgreement / 30));
  const totalMargin = monthlyMargin * monthsMargin;
  
  // Strike price = spot + total margin
  const strikePrice = spotPurchasePrice + totalMargin;
  
  // Advance margin already paid
  const advanceMarginPaid = monthlyMargin * advanceMarginMonths;
  
  // Net due = strike price (advance margin is already factored in the net disbursed)
  // The customer pays full strike price on repurchase
  const netDue = strikePrice;
  
  return {
    agreementId: '',
    spotPurchasePrice,
    monthlyMargin,
    daysSinceAgreement,
    monthsMargin,
    totalMargin,
    strikePrice,
    advanceMarginPaid,
    netDue,
  };
}

/**
 * Generate tenure options in 15-day intervals
 */
export function generateTenureOptions(
  minDays: number,
  maxDays: number,
  step: number = 15
): number[] {
  const options: number[] = [];
  
  // Ensure min is at least the step
  const effectiveMin = Math.max(step, Math.ceil(minDays / step) * step);
  
  let current = effectiveMin;
  while (current <= maxDays) {
    options.push(current);
    current += step;
  }
  
  return options;
}

/**
 * Convert monthly margin to equivalent annual rate (for display)
 * Formula: (margin_per_month × 12) / 1000 = annual rate %
 * e.g., ₹1,500/month per ₹1L = ₹1,500 × 12 / 1,000 = 18% p.a.
 */
export function marginToAnnualRate(marginPerMonth: number): number {
  return (marginPerMonth * 12) / 1000;
}

/**
 * Convert annual rate to monthly margin (for migration)
 * Formula: (annual_rate × 1000) / 12 = margin per month
 * e.g., 18% p.a. = (18 × 1000) / 12 = ₹1,500/month per ₹1L
 */
export function annualRateToMargin(annualRate: number): number {
  return Math.round((annualRate * 1000) / 12);
}

/**
 * Format currency in Indian style
 */
export function formatSaleAgreementCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
