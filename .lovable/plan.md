

## Plan: Replace Approved Loan Amount with Editable Loan Amount (LTV)

### Overview

Currently, the loan form has:
1. **Loan Amount (LTV)** - Display-only, calculated as `Total Appraised Value × LTV%`
2. **Approved Loan Amount** - Editable input field, can go up to +10% above Principal on Record

The request is to:
1. **Remove** the "Approved Loan Amount" field entirely
2. **Make "Loan Amount (LTV)" editable** - this becomes the editable appraised amount
3. **Constrain it to not exceed Market Value** (sum of all gold items' market values)
4. **Recalculate all loan values** based on the changed amount

---

### Current Calculation Flow

```text
Total Appraised Value (from gold items) 
    → Loan Amount (LTV) = Appraised × LTV%
    → Interest Adjustment = (Effective - Shown Rate) × Appraised × Tenure / 365
    → Principal on Record = Appraised + Interest Adjustment
    → Approved Loan Amount = User input (default: Principal on Record)
```

### New Calculation Flow

```text
Total Market Value (from gold items)
    → Loan Amount (LTV) = User Editable (max: Market Value)
    → Interest Adjustment = (Effective - Shown Rate) × Loan Amount × Tenure / 365
    → Principal on Record = Loan Amount + Interest Adjustment
    → (No Approved Loan Amount - removed)
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Loans.tsx` | Remove `approvedLoanAmount` state, add `editableLoanAmount` state, update UI and calculations |
| `src/lib/interestCalculations.ts` | No changes needed - already accepts appraised value as parameter |

---

### Detailed Changes in Loans.tsx

#### 1. State Changes (Lines 235-237)

**Remove:**
```typescript
const [approvedLoanAmount, setApprovedLoanAmount] = useState('');
```

**Add:**
```typescript
const [editableLoanAmount, setEditableLoanAmount] = useState('');
```

#### 2. Loan Calculation (Lines 548-618)

Update the `useMemo` calculation:

**Current:**
- Uses `totalAppraisedValue` for all calculations
- `loanAmount = totalAppraisedValue × LTV%`
- `finalApprovedAmount` comes from user input or defaults to `principalOnRecord`

**New:**
- Calculate `totalMarketValue` from gold items (sum of `market_value`)
- Use `editableLoanAmount` if set, otherwise default to current `loanAmount` calculation
- Cap `editableLoanAmount` at `totalMarketValue`
- Use `editableLoanAmount` (instead of `totalAppraisedValue`) for interest calculations

```typescript
const totalMarketValue = goldItems.reduce((sum, item) => sum + (item.market_value || item.appraised_value), 0);
const defaultLoanAmount = Math.round(totalAppraisedValue * (scheme.ltv_percentage / 100));
const userLoanAmount = editableLoanAmount ? parseFloat(editableLoanAmount) : defaultLoanAmount;
const cappedLoanAmount = Math.min(userLoanAmount, totalMarketValue);

// Use cappedLoanAmount for interest calculations
const advanceCalc = calculateAdvanceInterest(cappedLoanAmount, scheme, selectedTenure);
```

#### 3. Reset Form (Lines 420-445)

Reset `editableLoanAmount` when form is reset:
```typescript
setEditableLoanAmount('');
```

#### 4. UI Changes - Loan Amount Approval Section (Lines 1706-1747)

**Remove:**
- The entire "Approved Loan Amount" input field and its validation

**Modify:**
- Change "Loan Amount (LTV)" from display-only to an editable input
- Add validation to show error when amount exceeds Market Value
- Add display of "Total Market Value" for reference

**New UI structure:**
```
┌────────────────────────────────────────────────────────────────────┐
│ Loan Amount Approval                                               │
├────────────────────────────────────────────────────────────────────┤
│ Market Value           Loan Amount (LTV)*        Principal on Rec. │
│ ₹70,00,000             [₹61,74,000    ]         ₹64,48,024         │
│                        Max: ₹70,00,000                              │
└────────────────────────────────────────────────────────────────────┘
```

#### 5. Validation (Lines 658-662)

**Remove:**
- Validation against `maxApprovedAmount` (+10% above Principal)

**Add:**
- Validation that `editableLoanAmount` does not exceed `totalMarketValue`

```typescript
if (loanCalculation.cappedLoanAmount > loanCalculation.totalMarketValue) {
  toast.error(`Loan amount cannot exceed Market Value of ${formatIndianCurrency(loanCalculation.totalMarketValue)}`);
  return;
}
```

#### 6. Loan Calculation Display (Lines 1758-1780)

Update the display to reflect new structure:
- Show "Loan Amount" (editable value) instead of "Loan Amount (@ LTV%)"
- Remove "Approved Loan Amount" line
- Keep "Principal on Record" calculation (now based on editable loan amount)

---

### Summary of Changes

| Item | Current | New |
|------|---------|-----|
| Approved Loan Amount | Editable input | **Removed** |
| Loan Amount (LTV) | Display-only | **Editable input** |
| Maximum constraint | Principal on Record + 10% | **Market Value** |
| Calculation base | Total Appraised Value | **Editable Loan Amount** |

---

### Technical Notes

1. **Interest Adjustment** will now be calculated on the editable loan amount
2. **Principal on Record** = Editable Loan Amount + Interest Adjustment
3. **Net Cash to Customer** = Editable Loan Amount - Advance Interest - Document Charges
4. **Document Charges** calculated on Principal on Record (unchanged)
5. The `calculateAdvanceInterest` function already accepts any value as the first parameter, so no changes needed there

---

### Impact on Other Modules

No changes required in other modules. The loan is saved with:
- `principal_amount` = Principal on Record
- `shown_principal` = Editable Loan Amount (the base before interest adjustment)
- All downstream calculations (interest, redemption) use stored values

