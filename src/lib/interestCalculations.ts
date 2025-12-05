// Interest Calculation Utilities for Dual-Rate NBFC Logic
// 18% shown rate to customer, 24-36% effective rate internally

export interface Scheme {
  id: string;
  scheme_name: string;
  shown_rate: number;       // 18% p.a. (customer sees this)
  effective_rate: number;   // 24-36% p.a. (actual internal rate)
  minimum_days: number;     // Min days for rebate eligibility
  advance_interest_months: number;
  penalty_rate?: number;
  grace_period_days?: number;
}

export interface Loan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  shown_principal: number;
  actual_principal: number;
  advance_interest_shown: number;
  advance_interest_actual: number;
  differential_capitalized: number;
  tenure_days: number;
  maturity_date: string;
  next_interest_due_date: string | null;
  last_interest_paid_date: string | null;
  total_interest_paid: number;
  status: string;
}

export interface DualRateInterest {
  shownInterest: number;      // 18% portion (on receipt)
  actualInterest: number;     // Effective rate portion
  differential: number;       // To be capitalized
  penalty: number;            // Overdue penalty
  totalDue: number;           // Amount customer should pay
  days: number;
}

export interface AdvanceInterestCalculation {
  shownInterest: number;      // Shown on receipt
  actualInterest: number;     // Internal calculation
  differential: number;       // Added to principal
  netCashToCustomer: number;
  actualPrincipal: number;    // Principal + differential
}

export interface PaymentAllocation {
  shownInterest: number;
  actualInterest: number;
  differentialCapitalized: number;
  principalReduction: number;
  penalty: number;
  change: number;
  newActualPrincipal: number;
}

export interface RebateCalculation {
  eligible: boolean;
  usedDays: number;
  unusedDays: number;
  rebateAmount: number;
  reason: string;
}

/**
 * Calculate simple interest for exact days
 */
export function calculateInterest(
  principal: number,
  annualRate: number,
  days: number
): number {
  return (principal * annualRate * days) / (100 * 365);
}

/**
 * Calculate advance interest for loan creation (dual-rate)
 */
export function calculateAdvanceInterest(
  principal: number,
  scheme: Scheme
): AdvanceInterestCalculation {
  const months = scheme.advance_interest_months;
  const days = months * 30;
  
  // Shown interest (18% or shown_rate)
  const shownInterest = calculateInterest(principal, scheme.shown_rate, days);
  
  // Actual interest (effective rate)
  const actualInterest = calculateInterest(principal, scheme.effective_rate, days);
  
  // Differential = Actual - Shown (silently capitalized)
  const differential = actualInterest - shownInterest;
  
  // Customer sees net cash = principal - shown interest
  const netCashToCustomer = principal - shownInterest;
  
  // Actual principal = original + differential capitalized
  const actualPrincipal = principal + differential;
  
  return {
    shownInterest: Math.round(shownInterest),
    actualInterest: Math.round(actualInterest),
    differential: Math.round(differential),
    netCashToCustomer: Math.round(netCashToCustomer),
    actualPrincipal: Math.round(actualPrincipal),
  };
}

/**
 * Calculate interest due with dual-rate system
 * Customer pays based on shown rate, differential is capitalized
 */
export function calculateDualRateInterest(
  actualPrincipal: number,
  scheme: Scheme,
  days: number,
  gracePeriodDays: number = 7
): DualRateInterest {
  // Calculate on actual principal (includes capitalized differential)
  const shownInterest = calculateInterest(actualPrincipal, scheme.shown_rate, days);
  const actualInterest = calculateInterest(actualPrincipal, scheme.effective_rate, days);
  const differential = actualInterest - shownInterest;
  
  // Penalty if overdue (beyond grace period)
  let penalty = 0;
  const overdueDays = Math.max(0, days - 30 - gracePeriodDays);
  if (overdueDays > 0 && scheme.penalty_rate) {
    penalty = calculateInterest(actualPrincipal, scheme.penalty_rate * 12, overdueDays);
  }
  
  // Customer pays shown interest + penalty
  // But actual accounting includes differential capitalization
  const totalDue = shownInterest + penalty;
  
  return {
    shownInterest: Math.round(shownInterest),
    actualInterest: Math.round(actualInterest),
    differential: Math.round(differential),
    penalty: Math.round(penalty),
    totalDue: Math.round(totalDue),
    days,
  };
}

/**
 * Process interest payment and allocate funds
 * Returns receipt amounts (shown rate only) and internal accounting
 */
export function processInterestPayment(
  amountPaid: number,
  interestDue: DualRateInterest,
  currentActualPrincipal: number
): PaymentAllocation {
  let remaining = amountPaid;
  let penalty = 0;
  let shownInterest = 0;
  let principalReduction = 0;
  
  // First: Pay penalty (if any)
  if (interestDue.penalty > 0 && remaining > 0) {
    penalty = Math.min(interestDue.penalty, remaining);
    remaining -= penalty;
  }
  
  // Second: Pay shown interest
  if (remaining > 0) {
    shownInterest = Math.min(interestDue.shownInterest, remaining);
    remaining -= shownInterest;
  }
  
  // Third: Any excess goes to principal reduction
  if (remaining > 0) {
    principalReduction = remaining;
    remaining = 0;
  }
  
  // Differential is always capitalized (hidden from customer)
  const differentialCapitalized = interestDue.differential;
  
  // New actual principal = current + differential - principal reduction
  const newActualPrincipal = currentActualPrincipal + differentialCapitalized - principalReduction;
  
  return {
    shownInterest: Math.round(shownInterest),
    actualInterest: Math.round(interestDue.actualInterest),
    differentialCapitalized: Math.round(differentialCapitalized),
    principalReduction: Math.round(principalReduction),
    penalty: Math.round(penalty),
    change: Math.round(remaining),
    newActualPrincipal: Math.round(newActualPrincipal),
  };
}

/**
 * Calculate rebate for early redemption
 * Rebate ONLY on unused differential portion (never on 18% part)
 * No rebate if redeemed before minimum days
 */
export function calculateRebate(
  scheme: Scheme,
  usedDays: number,
  totalTenureDays: number,
  actualPrincipal: number
): RebateCalculation {
  // Check minimum days requirement
  if (usedDays < scheme.minimum_days) {
    return {
      eligible: false,
      usedDays,
      unusedDays: 0,
      rebateAmount: 0,
      reason: `Minimum ${scheme.minimum_days} days required for rebate. Only ${usedDays} days used.`,
    };
  }
  
  const unusedDays = Math.max(0, totalTenureDays - usedDays);
  
  if (unusedDays <= 0) {
    return {
      eligible: false,
      usedDays,
      unusedDays: 0,
      rebateAmount: 0,
      reason: 'No unused days for rebate',
    };
  }
  
  // Differential rate = effective - shown (e.g., 30% - 18% = 12%)
  const differentialRate = scheme.effective_rate - scheme.shown_rate;
  
  // Rebate = unused differential interest only
  const rebateAmount = calculateInterest(actualPrincipal, differentialRate, unusedDays);
  
  return {
    eligible: true,
    usedDays,
    unusedDays,
    rebateAmount: Math.round(rebateAmount),
    reason: `Rebate on ${unusedDays} unused days (differential rate ${differentialRate}%)`,
  };
}

/**
 * Calculate full redemption amount
 */
export function calculateRedemptionAmount(
  actualPrincipal: number,
  scheme: Scheme,
  daysSinceLoan: number,
  totalTenureDays: number
): {
  principalDue: number;
  interestDue: DualRateInterest;
  rebate: RebateCalculation;
  totalPayable: number;
  breakdown: {
    principal: number;
    interest: number;
    penalty: number;
    rebate: number;
    total: number;
  };
} {
  const interestDue = calculateDualRateInterest(
    actualPrincipal,
    scheme,
    daysSinceLoan,
    scheme.grace_period_days || 7
  );
  
  const rebate = calculateRebate(scheme, daysSinceLoan, totalTenureDays, actualPrincipal);
  
  // Total = actual principal + actual interest - rebate
  const grossPayable = actualPrincipal + interestDue.actualInterest + interestDue.penalty;
  const totalPayable = grossPayable - rebate.rebateAmount;
  
  return {
    principalDue: Math.round(actualPrincipal),
    interestDue,
    rebate,
    totalPayable: Math.round(totalPayable),
    breakdown: {
      principal: Math.round(actualPrincipal),
      interest: Math.round(interestDue.actualInterest),
      penalty: Math.round(interestDue.penalty),
      rebate: Math.round(rebate.rebateAmount),
      total: Math.round(totalPayable),
    },
  };
}

/**
 * Get days between two dates
 */
export function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format currency in Indian format
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
