# Memory: calculations/loan-calculation-formulas
Updated: 2026-01-21

## Loan Calculation Formulas (Updated)

The loan calculation logic uses the following formulas, all based on **Total Appraised Value**:

### Core Formulas

| Field | Formula |
|-------|---------|
| **Interest Adjustment** | `(Effective Rate - Shown Rate) × Total Appraised Value × Tenure / 365` |
| **Principal on Record** | `Total Appraised Value + Interest Adjustment` |
| **Approved Loan Amount** | Defaults to Principal on Record (editable up to +10%) |
| **Advance Interest** | `Shown Rate × Total Appraised Value × Advance Days / 365` |
| **Document Charges** | `Doc Charge % × Approved Loan Amount` |
| **Net Cash to Customer** | `Total Appraised Value - Advance Interest - Document Charges` |

### Implementation Details

- `calculateAdvanceInterest()` in `src/lib/interestCalculations.ts` takes `appraisedValue` as the first parameter
- The function calculates Interest Adjustment for the **full tenure** (not tenure - advance days)
- `loanCalculation` useMemo in `Loans.tsx` and `newLoanCalc` in `Reloan.tsx` use these formulas
- Document charges are now calculated on the **Approved Loan Amount** (not Principal on Record)

### Example Calculation (P30 Scheme: 30% effective, 18% shown)

| Field | Formula | Value |
|-------|---------|-------|
| Total Appraised Value | (Input) | ₹10,80,000 |
| Interest Adjustment | 12% × 10,80,000 × 90 / 365 | ₹31,956 |
| Principal on Record | 10,80,000 + 31,956 | ₹11,11,956 |
| Advance Interest (1 mo) | 18% × 10,80,000 × 30 / 365 | ₹15,978 |
| Document Charges | 1% × 11,11,956 | ₹11,120 |
| **Net Cash** | 10,80,000 - 15,978 - 11,120 | **₹10,52,902** |
