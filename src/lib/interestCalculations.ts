// Interest Calculation Utilities for Dual-Rate NBFC Logic
// 18% shown rate to customer, 24-36% effective rate internally
// Differential is added to principal at creation, debited as part payment when interest is paid

export interface InterestRateSlab {
  from_day: number;
  to_day: number | null; // null = open-ended (last slab)
  shown_rate: number;    // annual %
  effective_rate: number; // annual %
}

export interface PenaltySlab {
  from_day: number;
  to_day: number | null;
  rate: number; // monthly %
}

export interface SlabBreakdownEntry {
  fromDay: number;
  toDay: number;
  days: number;
  shownRate: number;
  effectiveRate: number;
  shownInterest: number;
  actualInterest: number;
}

export interface Scheme {
  id: string;
  scheme_name: string;
  shown_rate: number;       // 18% p.a. (customer sees this)
  effective_rate: number;   // 24-36% p.a. (actual internal rate)
  minimum_days: number;     // Min days for rebate eligibility
  advance_interest_months: number;
  penalty_rate?: number;
  grace_period_days?: number;
  interest_rate_slabs?: InterestRateSlab[];
  slab_mode?: 'prospective' | 'retroactive';
  penalty_slabs?: PenaltySlab[];
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
  shownInterest: number;      // 18% portion (on receipt as Interest)
  actualInterest: number;     // Effective rate portion (internal)
  differential: number;       // Part payment (reduces principal)
  penalty: number;            // Overdue penalty
  totalDue: number;           // Amount customer should pay
  days: number;               // Total days since last payment
  billableDays: number;       // Days actually charged (excluding advance interest period)
}

export interface AdvanceInterestCalculation {
  shownInterest: number;      // Shown on receipt (deducted from disbursement)
  actualInterest: number;     // Internal calculation
  differential: number;       // Differential for full tenure (added to principal)
  differentialForAdvance: number; // Differential for advance months only
  netCashToCustomer: number;  // Principal - shown interest
  actualPrincipal: number;    // Principal + differential (books entry)
}

export interface PaymentAllocation {
  interestPaid: number;       // 18% interest (shown on receipt)
  partPayment: number;        // Differential as principal reduction
  penalty: number;            // Overdue penalty
  excessPaid: number;         // Extra amount towards principal
  totalPrincipalReduction: number;  // Part payment + excess
  newActualPrincipal: number;
}

export interface RebateCalculation {
  eligible: boolean;
  usedDays: number;
  unusedDays: number;
  rebateAmount: number;
  percentage: number;
  reason: string;
}

export interface RebateSlot {
  dayRange: string;
  percentage: number;
  rebateAmount: number;
}

export interface RebateSchedule {
  differentialAmount: number;
  slots: RebateSlot[];
}

export interface ClosureScheduleEntry {
  dayRange: string;
  daysFromLoan: number;
  principalOutstanding: number;
  interestAccrued: number;
  rebateAmount: number;
  totalClosureAmount: number;
}

export interface ClosureSchedule {
  principalOnRecord: number;
  shownRate: number;
  entries: ClosureScheduleEntry[];
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
 * Calculate rebate schedule for loan agreement display
 * Shows rebate amounts (not percentages) for each time slab
 * Updated schedule: 1-15d = 66.67%, 16-30d = 66.67%, 31-45d = 50%, 46-60d = 33.33%, 61-75d = 16.67%, after 75d = 0%
 */
export function calculateRebateSchedule(differentialAmount: number): RebateSchedule {
  return {
    differentialAmount,
    slots: [
      { dayRange: 'Within 1-15 days', percentage: 66.67, rebateAmount: Math.round(differentialAmount * 0.6667) },
      { dayRange: 'Within 16-30 days', percentage: 66.67, rebateAmount: Math.round(differentialAmount * 0.6667) },
      { dayRange: 'Within 31-45 days', percentage: 50, rebateAmount: Math.round(differentialAmount * 0.50) },
      { dayRange: 'Within 46-60 days', percentage: 33.33, rebateAmount: Math.round(differentialAmount * 0.3333) },
      { dayRange: 'Within 61-75 days', percentage: 16.67, rebateAmount: Math.round(differentialAmount * 0.1667) },
      { dayRange: 'After 75 days', percentage: 0, rebateAmount: 0 },
    ],
  };
}

/**
 * Calculate loan closure schedule showing total payable at various intervals
 * Shows principal, interest accrued, rebate, and total closure amount
 */
export function calculateClosureSchedule(
  principalOnRecord: number,
  shownRate: number,
  tenureDays: number,
  differentialAmount: number = 0
): ClosureSchedule {
  // Standard intervals: 15, 30, 45, 60, 75, 90 days (synced with rebate slabs)
  const standardIntervals = [15, 30, 45, 60, 75, 90];
  const intervals = standardIntervals.filter(d => d <= tenureDays);
  
  // Add tenure if not already in the list
  if (!intervals.includes(tenureDays) && tenureDays > 0) {
    intervals.push(tenureDays);
    intervals.sort((a, b) => a - b);
  }
  
  const entries: ClosureScheduleEntry[] = intervals.map(days => {
    // Interest accrued at shown rate for customer transparency
    // For first 30 days, advance interest is already paid, so interest accrued = 0
    const interestAccrued = days <= 30 
      ? 0 
      : calculateInterest(principalOnRecord, shownRate, days - 30); // Exclude advance interest period
    
    // Get rebate based on day range (using existing rebate logic)
    const rebate = calculateRebateAtRedemption(days, differentialAmount);
    
    // Total = Principal + Interest - Rebate
    const totalClosureAmount = principalOnRecord + interestAccrued - rebate.rebateAmount;
    
    return {
      dayRange: `${days} days`,
      daysFromLoan: days,
      principalOutstanding: principalOnRecord,
      interestAccrued: Math.round(interestAccrued),
      rebateAmount: rebate.rebateAmount,
      totalClosureAmount: Math.round(totalClosureAmount),
    };
  });
  
  return { principalOnRecord, shownRate, entries };
}

/**
 * Calculate rebate at redemption based on days since loan
 * Updated slab-based percentages: 1-15d = 66.67%, 16-30d = 66.67%, 31-45d = 50%, 46-60d = 33.33%, 61-75d = 16.67%, after 75d = 0%
 */
export function calculateRebateAtRedemption(
  daysSinceLoan: number,
  differentialAmount: number
): RebateCalculation {
  // Within 1-15 days: 66.67% rebate
  if (daysSinceLoan >= 1 && daysSinceLoan <= 15) {
    return {
      eligible: true,
      usedDays: daysSinceLoan,
      unusedDays: 0,
      rebateAmount: Math.round(differentialAmount * 0.6667),
      percentage: 66.67,
      reason: 'Early release benefit (Within 1-15 days)',
    };
  } 
  // Within 16-30 days: 66.67% rebate
  else if (daysSinceLoan >= 16 && daysSinceLoan <= 30) {
    return {
      eligible: true,
      usedDays: daysSinceLoan,
      unusedDays: 0,
      rebateAmount: Math.round(differentialAmount * 0.6667),
      percentage: 66.67,
      reason: 'Early release benefit (Within 16-30 days)',
    };
  } 
  // Within 31-45 days: 50% rebate
  else if (daysSinceLoan >= 31 && daysSinceLoan <= 45) {
    return {
      eligible: true,
      usedDays: daysSinceLoan,
      unusedDays: 0,
      rebateAmount: Math.round(differentialAmount * 0.50),
      percentage: 50,
      reason: 'Early release benefit (Within 31-45 days)',
    };
  } 
  // Within 46-60 days: 33.33% rebate
  else if (daysSinceLoan >= 46 && daysSinceLoan <= 60) {
    return {
      eligible: true,
      usedDays: daysSinceLoan,
      unusedDays: 0,
      rebateAmount: Math.round(differentialAmount * 0.3333),
      percentage: 33.33,
      reason: 'Early release benefit (Within 46-60 days)',
    };
  } 
  // Within 61-75 days: 16.67% rebate
  else if (daysSinceLoan >= 61 && daysSinceLoan <= 75) {
    return {
      eligible: true,
      usedDays: daysSinceLoan,
      unusedDays: 0,
      rebateAmount: Math.round(differentialAmount * 0.1667),
      percentage: 16.67,
      reason: 'Early release benefit (Within 61-75 days)',
    };
  }
  // After 75 days: No rebate
  return {
    eligible: false,
    usedDays: daysSinceLoan,
    unusedDays: 0,
    rebateAmount: 0,
    percentage: 0,
    reason: 'No early release benefit after 75 days',
  };
}

/**
 * Calculate advance interest for loan creation (dual-rate)
 * 
 * NEW FORMULAS:
 * - Interest Adjustment = (Effective Rate - Shown Rate) × Appraised Value × Tenure / 365
 * - Principal on Record = Appraised Value + Interest Adjustment
 * - Advance Interest = Shown Rate × Appraised Value × Advance Days / 365
 * - Net Cash = Appraised Value - Advance Interest - Document Charges (calculated separately)
 */
export function calculateAdvanceInterest(
  appraisedValue: number,  // Total appraised value (not loan amount)
  scheme: Scheme,
  tenureDays: number = 90
): AdvanceInterestCalculation {
  const months = scheme.advance_interest_months;
  const advanceDays = months * 30;
  
  // Differential rate = Effective - Shown
  const differentialRate = scheme.effective_rate - scheme.shown_rate;
  
  // Interest Adjustment = (Effective - Shown) × Appraised Value × Full Tenure / 365
  const interestAdjustment = calculateInterest(appraisedValue, differentialRate, tenureDays);
  
  // Advance Interest (1 month) = Shown Rate × Appraised Value × Advance Days / 365
  const shownInterest = calculateInterest(appraisedValue, scheme.shown_rate, advanceDays);
  
  // Actual interest for advance months (for internal records)
  const actualInterest = calculateInterest(appraisedValue, scheme.effective_rate, advanceDays);
  
  // Differential for advance months only (for reference)
  const differentialForAdvance = calculateInterest(appraisedValue, differentialRate, advanceDays);
  
  // Principal on Record = Appraised Value + Interest Adjustment
  const principalOnRecord = appraisedValue + interestAdjustment;
  
  // Net Cash (before doc charges) = Appraised Value - Advance Interest
  // Document charges are deducted separately in the calling code
  const netCashToCustomer = appraisedValue - shownInterest;
  
  return {
    shownInterest: Math.round(shownInterest),       // Advance Interest (deducted from disbursement)
    actualInterest: Math.round(actualInterest),     // Internal calculation
    differential: Math.round(interestAdjustment),   // Interest Adjustment (full tenure)
    differentialForAdvance: Math.round(differentialForAdvance),
    netCashToCustomer: Math.round(netCashToCustomer),
    actualPrincipal: Math.round(principalOnRecord), // Principal on Record
  };
}

/**
 * Calculate interest due with dual-rate system
 * Customer pays: shown interest (18%) + penalty
 * Differential is shown as part payment reducing principal
 * 
 * IMPORTANT: Advance interest for first 30 days (or advance_interest_months * 30) 
 * is already deducted at loan creation. So we only charge for days BEYOND that period.
 */
/**
 * Calculate slab-based interest for a given number of billable days.
 * Prospective: each slab's rate applies only to its own day range.
 * Retroactive: the highest reached slab rate applies to ALL days.
 */
export function calculateSlabInterest(
  principal: number,
  billableDays: number,
  slabs: InterestRateSlab[],
  slabMode: 'prospective' | 'retroactive'
): { shownInterest: number; actualInterest: number; differential: number; slabBreakdown: SlabBreakdownEntry[] } {
  if (billableDays <= 0 || slabs.length === 0) {
    return { shownInterest: 0, actualInterest: 0, differential: 0, slabBreakdown: [] };
  }

  // Sort slabs by from_day ascending
  const sorted = [...slabs].sort((a, b) => a.from_day - b.from_day);

  if (slabMode === 'retroactive') {
    // Find the highest slab the loan has reached
    let applicableSlab = sorted[0];
    for (const slab of sorted) {
      if (billableDays >= slab.from_day) {
        applicableSlab = slab;
      }
    }
    // Apply that single rate to all billable days
    const shownInterest = calculateInterest(principal, applicableSlab.shown_rate, billableDays);
    const actualInterest = calculateInterest(principal, applicableSlab.effective_rate, billableDays);
    return {
      shownInterest,
      actualInterest,
      differential: actualInterest - shownInterest,
      slabBreakdown: [{
        fromDay: 0,
        toDay: billableDays,
        days: billableDays,
        shownRate: applicableSlab.shown_rate,
        effectiveRate: applicableSlab.effective_rate,
        shownInterest,
        actualInterest,
      }],
    };
  }

  // Prospective: calculate segment-by-segment
  let totalShown = 0;
  let totalActual = 0;
  const breakdown: SlabBreakdownEntry[] = [];

  for (const slab of sorted) {
    const slabEnd = slab.to_day != null ? slab.to_day : Infinity;
    if (billableDays <= slab.from_day) break;

    const segStart = slab.from_day;
    const segEnd = Math.min(billableDays, slabEnd);
    const segDays = segEnd - segStart;

    if (segDays <= 0) continue;

    const shown = calculateInterest(principal, slab.shown_rate, segDays);
    const actual = calculateInterest(principal, slab.effective_rate, segDays);
    totalShown += shown;
    totalActual += actual;

    breakdown.push({
      fromDay: segStart,
      toDay: segEnd,
      days: segDays,
      shownRate: slab.shown_rate,
      effectiveRate: slab.effective_rate,
      shownInterest: shown,
      actualInterest: actual,
    });
  }

  return {
    shownInterest: totalShown,
    actualInterest: totalActual,
    differential: totalActual - totalShown,
    slabBreakdown: breakdown,
  };
}

/**
 * Calculate penalty using tiered penalty slabs.
 * Each slab specifies a monthly penalty rate for a day range of overdue days.
 */
export function calculateSlabPenalty(
  principal: number,
  overdueDays: number,
  penaltySlabs: PenaltySlab[]
): number {
  if (overdueDays <= 0 || penaltySlabs.length === 0) return 0;

  const sorted = [...penaltySlabs].sort((a, b) => a.from_day - b.from_day);
  let totalPenalty = 0;

  for (const slab of sorted) {
    const slabEnd = slab.to_day != null ? slab.to_day : Infinity;
    if (overdueDays <= slab.from_day) break;

    const segStart = slab.from_day;
    const segEnd = Math.min(overdueDays, slabEnd);
    const segDays = segEnd - segStart;
    if (segDays <= 0) continue;

    // rate is monthly %, convert to annual for calculateInterest
    totalPenalty += calculateInterest(principal, slab.rate * 12, segDays);
  }

  return totalPenalty;
}

export function calculateDualRateInterest(
  actualPrincipal: number,
  scheme: Scheme,
  days: number,
  gracePeriodDays: number = 7,
  advanceInterestDays: number = 30
): DualRateInterest {
  // Exclude advance interest days from billable period
  const billableDays = Math.max(0, days - advanceInterestDays);

  let shownInterest: number;
  let actualInterest: number;
  let differential: number;
  let slabBreakdown: SlabBreakdownEntry[] | undefined;

  // Use slab calculation if slabs are configured
  if (scheme.interest_rate_slabs && scheme.interest_rate_slabs.length > 0) {
    const slabResult = calculateSlabInterest(
      actualPrincipal,
      billableDays,
      scheme.interest_rate_slabs,
      scheme.slab_mode || 'prospective'
    );
    shownInterest = slabResult.shownInterest;
    actualInterest = slabResult.actualInterest;
    differential = slabResult.differential;
    slabBreakdown = slabResult.slabBreakdown;
  } else {
    // Flat-rate logic (existing behavior)
    shownInterest = calculateInterest(actualPrincipal, scheme.shown_rate, billableDays);
    actualInterest = calculateInterest(actualPrincipal, scheme.effective_rate, billableDays);
    differential = actualInterest - shownInterest;
  }

  // Penalty calculation
  let penalty = 0;
  const overdueDays = Math.max(0, billableDays - 30 - gracePeriodDays);

  if (overdueDays > 0) {
    if (scheme.penalty_slabs && scheme.penalty_slabs.length > 0) {
      penalty = calculateSlabPenalty(actualPrincipal, overdueDays, scheme.penalty_slabs);
    } else if (scheme.penalty_rate) {
      penalty = calculateInterest(actualPrincipal, scheme.penalty_rate * 12, overdueDays);
    }
  }

  const totalDue = shownInterest + differential + penalty;

  return {
    shownInterest: Math.round(shownInterest),
    actualInterest: Math.round(actualInterest),
    differential: Math.round(differential),
    penalty: Math.round(penalty),
    totalDue: Math.round(totalDue),
    days,
    billableDays,
  };
}

/**
 * Process interest payment and allocate funds
 * Receipt shows: Interest (18%) + Part Payment (differential) + Penalty
 */
export function processInterestPayment(
  amountPaid: number,
  interestDue: DualRateInterest,
  currentActualPrincipal: number
): PaymentAllocation {
  let remaining = amountPaid;
  let penalty = 0;
  let interestPaid = 0;
  let partPayment = 0;
  let excessPaid = 0;
  
  // First: Pay penalty (if any)
  if (interestDue.penalty > 0 && remaining > 0) {
    penalty = Math.min(interestDue.penalty, remaining);
    remaining -= penalty;
  }
  
  // Second: Pay shown interest (18%)
  if (remaining > 0) {
    interestPaid = Math.min(interestDue.shownInterest, remaining);
    remaining -= interestPaid;
  }
  
  // Third: Pay differential as part payment (reduces principal)
  if (remaining > 0) {
    partPayment = Math.min(interestDue.differential, remaining);
    remaining -= partPayment;
  }
  
  // Fourth: Any excess goes to additional principal reduction
  if (remaining > 0) {
    excessPaid = remaining;
    remaining = 0;
  }
  
  // Total principal reduction = part payment + excess
  const totalPrincipalReduction = partPayment + excessPaid;
  
  // New actual principal = current - total principal reduction
  const newActualPrincipal = currentActualPrincipal - totalPrincipalReduction;
  
  return {
    interestPaid: Math.round(interestPaid),
    partPayment: Math.round(partPayment),
    penalty: Math.round(penalty),
    excessPaid: Math.round(excessPaid),
    totalPrincipalReduction: Math.round(totalPrincipalReduction),
    newActualPrincipal: Math.round(newActualPrincipal),
  };
}

/**
 * Calculate rebate for early redemption - DEPRECATED, use calculateRebateAtRedemption
 * Kept for backward compatibility
 */
export function calculateRebate(
  scheme: Scheme,
  usedDays: number,
  totalTenureDays: number,
  actualPrincipal: number,
  differentialCapitalized?: number
): RebateCalculation {
  // Use new slab-based calculation if differential is provided
  if (differentialCapitalized !== undefined && differentialCapitalized > 0) {
    return calculateRebateAtRedemption(usedDays, differentialCapitalized);
  }
  
  // Legacy calculation for backward compatibility
  if (usedDays < scheme.minimum_days) {
    return {
      eligible: false,
      usedDays,
      unusedDays: 0,
      rebateAmount: 0,
      percentage: 0,
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
      percentage: 0,
      reason: 'No unused days for rebate',
    };
  }
  
  // Differential rate = effective - shown
  const differentialRate = scheme.effective_rate - scheme.shown_rate;
  
  // Rebate = unused differential interest only
  const rebateAmount = calculateInterest(actualPrincipal, differentialRate, unusedDays);
  
  return {
    eligible: true,
    usedDays,
    unusedDays,
    rebateAmount: Math.round(rebateAmount),
    percentage: 0,
    reason: `Rebate on ${unusedDays} unused days (differential rate ${differentialRate}%)`,
  };
}

/**
 * Calculate full redemption amount
 * 
 * @param actualPrincipal - Current principal with differential capitalized
 * @param scheme - Loan scheme with rates
 * @param daysSinceLastPayment - Days since last interest payment (for interest calculation)
 * @param daysSinceLoan - Days since loan creation (for rebate calculation)
 * @param totalTenureDays - Total tenure in days
 * @param differentialCapitalized - Differential amount capitalized at creation (for rebate)
 * @param advanceInterestDays - Days covered by advance interest (default 30)
 */
export function calculateRedemptionAmount(
  actualPrincipal: number,
  scheme: Scheme,
  daysSinceLastPayment: number,
  daysSinceLoan: number,
  totalTenureDays: number,
  differentialCapitalized?: number,
  advanceInterestDays: number = 30
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
  // Calculate interest due with advance days excluded
  const interestDue = calculateDualRateInterest(
    actualPrincipal,
    scheme,
    daysSinceLastPayment,
    scheme.grace_period_days || 7,
    advanceInterestDays
  );
  
  // Use new slab-based rebate based on days since LOAN creation (not last payment)
  const rebate = differentialCapitalized && differentialCapitalized > 0
    ? calculateRebateAtRedemption(daysSinceLoan, differentialCapitalized)
    : calculateRebate(scheme, daysSinceLoan, totalTenureDays, actualPrincipal);
  
  // Total = actual principal + interest due - rebate
  const grossPayable = actualPrincipal + interestDue.totalDue;
  const totalPayable = grossPayable - rebate.rebateAmount;
  
  return {
    principalDue: Math.round(actualPrincipal),
    interestDue,
    rebate,
    totalPayable: Math.round(totalPayable),
    breakdown: {
      principal: Math.round(actualPrincipal),
      interest: Math.round(interestDue.totalDue),
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
