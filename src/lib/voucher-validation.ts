/**
 * Voucher Validation Utilities
 * Pre-insert validation to ensure accounting integrity
 */

export interface VoucherEntry {
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

/**
 * Validates that voucher entries are balanced (total debits = total credits)
 * Allows a tolerance of ₹0.01 for rounding errors
 */
export function validateVoucherBalance(entries: VoucherEntry[]): ValidationResult {
  const TOLERANCE = 0.01; // 1 paisa tolerance for rounding

  const totalDebit = entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);

  if (difference > TOLERANCE) {
    return {
      valid: false,
      error: `Voucher imbalance: Debit ₹${totalDebit.toFixed(2)} ≠ Credit ₹${totalCredit.toFixed(2)}. Difference: ₹${difference.toFixed(2)}`,
      totalDebit,
      totalCredit,
      difference,
    };
  }

  return {
    valid: true,
    totalDebit,
    totalCredit,
    difference,
  };
}

/**
 * VoucherBuilder - Type-safe voucher entry builder
 * Ensures proper double-entry bookkeeping structure
 */
export class VoucherBuilder {
  private entries: VoucherEntry[] = [];

  /**
   * Add a debit entry
   */
  debit(accountCode: string, amount: number, narration?: string): this {
    if (amount > 0) {
      this.entries.push({
        accountCode,
        debitAmount: amount,
        creditAmount: 0,
        narration,
      });
    }
    return this;
  }

  /**
   * Add a credit entry
   */
  credit(accountCode: string, amount: number, narration?: string): this {
    if (amount > 0) {
      this.entries.push({
        accountCode,
        debitAmount: 0,
        creditAmount: amount,
        narration,
      });
    }
    return this;
  }

  /**
   * Get all entries
   */
  getEntries(): VoucherEntry[] {
    return [...this.entries];
  }

  /**
   * Validate and build the entries
   */
  build(): { entries: VoucherEntry[]; isBalanced: boolean; validation: ValidationResult } {
    const validation = validateVoucherBalance(this.entries);
    return {
      entries: this.entries,
      isBalanced: validation.valid,
      validation,
    };
  }

  /**
   * Clear all entries
   */
  clear(): this {
    this.entries = [];
    return this;
  }

  /**
   * Get current balance status
   */
  getBalance(): { totalDebit: number; totalCredit: number; difference: number } {
    const totalDebit = this.entries.reduce((sum, e) => sum + e.debitAmount, 0);
    const totalCredit = this.entries.reduce((sum, e) => sum + e.creditAmount, 0);
    return {
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit,
    };
  }
}

/**
 * Create a new VoucherBuilder instance
 */
export function createVoucherBuilder(): VoucherBuilder {
  return new VoucherBuilder();
}

/**
 * Round to 2 decimal places for currency
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
