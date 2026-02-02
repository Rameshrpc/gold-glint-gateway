
## Plan: Simplified Sale Agreement Calculation System

### Overview
Create a brand-new, simplified calculation system for Sale Agreements that is completely separate from the loan calculation logic. The key changes are:

1. **Separate Schemes**: Sale Agreement schemes will have a simpler structure
2. **Monthly Margin**: Calculate trade margin as a fixed amount per month (not based on annual percentage rates)
3. **No Differential Interest**: Remove the dual-rate (shown vs effective) complexity
4. **15-Day Tenure Multiples**: Tenure restricted to multiples of 15 days (15, 30, 45, 60, 75, 90, etc.)

---

### Current State Analysis

**Current Sale Agreement Scheme Fields** (in `SaleSchemes.tsx`):
- `shown_rate` (% p.a.) - Customer-visible annual rate
- `effective_rate` (% p.a.) - Internal annual rate for differential calculation
- `minimum_days`, `advance_interest_months`, `ltv_percentage`
- `strike_periods` - JSONB array for repurchase price periods
- Processing fee, document charges, gold rates

**Current Calculation Flow** (in `SaleAgreements.tsx`):
- Uses `calculateAdvanceInterest()` which calculates differential interest
- Uses `calculateRebateSchedule()` for rebate on early redemption
- Uses `calculateStrikePrices()` for repurchase pricing

**Problems**:
1. Too complex - mirrors loan logic unnecessarily
2. Annual rates are confusing for trading terminology
3. Differential interest adds accounting complexity
4. Strike periods don't align with 15-day intervals

---

### New Simplified Model

#### Terminology Mapping
| Loan Term | Sale Agreement Term |
|-----------|---------------------|
| Principal | Spot Purchase Price |
| Interest Rate | Margin Rate (₹ per month per ₹1 lakh) |
| Advance Interest | Advance Margin |
| Differential | *(removed)* |
| Rebate Schedule | Early Repurchase Discount |

#### New Scheme Structure

```typescript
interface SimpleSaleScheme {
  scheme_code: string;
  scheme_name: string;
  
  // Gold Rates
  rate_22kt: number;      // ₹ per gram for 22KT gold
  rate_18kt: number;      // ₹ per gram for 18KT gold
  
  // Margin Configuration
  margin_per_month: number;  // ₹ per month per ₹1 lakh purchase (e.g., ₹1,500)
  // This equals ~18% p.a. annual rate but presented as monthly flat amount
  
  // Tenure
  min_tenure_days: number;   // Minimum: 15, 30, 45...
  max_tenure_days: number;   // Maximum: 90, 180...
  tenure_step: 15;           // Fixed at 15-day increments
  
  // Advance & Fees
  advance_margin_months: number; // 1 or 2 months collected upfront
  processing_fee_percentage: number;
  document_charges: number;
  
  // Strike periods for Bill of Sale (simplified)
  strike_periods: {
    days: number;        // 15, 30, 45, 60, 75, 90
    label_en: string;
    label_ta: string;
  }[];
}
```

---

### New Calculation Formulas

#### At Agreement Creation

| Field | Formula |
|-------|---------|
| **Spot Purchase Price** | Sum of all gold items' appraised values |
| **Monthly Margin** | `Spot Price × (margin_per_month / 100000)` |
| **Advance Margin** | `Monthly Margin × advance_margin_months` |
| **Processing Fee** | `Spot Price × (processing_fee_% / 100)` |
| **Document Charges** | `Spot Price × (doc_charges_% / 100)` |
| **Net Cash to Seller** | `Spot Price - Advance Margin - Processing Fee - Doc Charges` |
| **Price on Record** | `Spot Price` *(no differential added)* |

#### Strike Price Calculation (Repurchase)

```
Strike Price at Day N = Spot Price + (Monthly Margin × ceil(N / 30))
```

Example with ₹1,00,000 spot price and ₹1,500/month margin:
- Days 0-15: ₹1,01,500 (1 month margin)
- Days 16-30: ₹1,01,500 (1 month margin)
- Days 31-45: ₹1,03,000 (2 months margin)
- Days 46-60: ₹1,03,000 (2 months margin)
- Days 61-75: ₹1,04,500 (3 months margin)
- Days 76-90: ₹1,04,500 (3 months margin)

#### Margin Renewal (Monthly Payment)

Simple monthly margin payment - no differential, no penalty complexity:
```
Margin Due = Monthly Margin × number of months since last payment
```

---

### Database Changes

#### New Columns for `schemes` Table

```sql
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS margin_per_month NUMERIC DEFAULT 0;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS tenure_step INTEGER DEFAULT 30;

COMMENT ON COLUMN public.schemes.margin_per_month IS 'Trade margin in ₹ per month per ₹1 lakh for sale agreements';
COMMENT ON COLUMN public.schemes.tenure_step IS 'Tenure increment in days (15 for sale agreements, 30 for loans)';
```

---

### Files to Modify

| File | Changes |
|------|---------|
| **Database Migration** | Add `margin_per_month`, `tenure_step` columns |
| **src/pages/SaleSchemes.tsx** | Redesign UI for simplified scheme fields |
| **src/pages/SaleAgreements.tsx** | Replace calculation logic with new simplified model |
| **src/pages/SaleMarginRenewal.tsx** | Simplify margin calculation (no differential) |
| **src/pages/SaleRepurchase.tsx** | Use new strike price formula |
| **src/lib/saleAgreementCalculations.ts** (NEW) | New calculation utilities for sale agreements |
| **src/lib/strike-price-utils.ts** | Update to use simplified formula |

---

### Implementation Phases

#### Phase 1: New Calculation Module
Create `src/lib/saleAgreementCalculations.ts` with:
- `calculateSaleAgreementMargin()` - Monthly margin calculation
- `calculateSimpleStrikePrices()` - 15-day interval strike prices
- `calculateMarginRenewal()` - Simple monthly payment

#### Phase 2: Update Sale Schemes Page
- Remove `shown_rate`, `effective_rate` fields from UI
- Add `margin_per_month` input (₹ per month per ₹1 lakh)
- Add tenure step selector (locked at 15 days)
- Auto-generate strike periods based on tenure

#### Phase 3: Update Sale Agreements Page
- Replace `agreementCalculation` useMemo with new formulas
- Remove rebate schedule (no differential to rebate)
- Update tenure selector to 15-day multiples
- Simplify net cash calculation

#### Phase 4: Update Margin Renewal
- Remove differential tracking
- Simple: collect monthly margin × months overdue

#### Phase 5: Update Repurchase
- Use new strike price formula
- Remove rebate calculation (no differential)

---

### UI Changes for Sale Schemes

**Current Fields** (to remove):
- Trade Margin (Shown) %
- Effective Rate (Internal) %
- Minimum Days
- Advance Interest Months

**New Fields**:
```
┌─────────────────────────────────────────────────────────────┐
│ SCHEME CONFIGURATION                                        │
├─────────────────────────────────────────────────────────────┤
│ Scheme Code: [SALE-01]    Scheme Name: [Standard Sale]     │
├─────────────────────────────────────────────────────────────┤
│ GOLD RATES                                                  │
│ 22KT Rate: [₹ 6,500/gram]    18KT Rate: [₹ 4,875/gram]     │
├─────────────────────────────────────────────────────────────┤
│ MARGIN CONFIGURATION                                        │
│ Monthly Margin: [₹ 1,500] per ₹1 lakh purchase             │
│ (Equivalent to ~18% p.a.)                                   │
│                                                             │
│ Advance Margin: [1] month(s) collected upfront             │
├─────────────────────────────────────────────────────────────┤
│ TENURE (Option Period)                                      │
│ Minimum: [15] days   Maximum: [90] days                     │
│ Increments: 15 days (fixed)                                 │
│                                                             │
│ Available: ○ 15 ○ 30 ○ 45 ○ 60 ○ 75 ○ 90 days              │
├─────────────────────────────────────────────────────────────┤
│ FEES                                                        │
│ Processing Fee: [1]%    Document Charges: [₹ 100]          │
└─────────────────────────────────────────────────────────────┘
```

---

### Sale Agreement Creation Flow (New)

```text
┌─────────────────────────────────────────────────────────────┐
│ NEW SALE AGREEMENT                                          │
├─────────────────────────────────────────────────────────────┤
│ Gold Items Added:                                           │
│ - 22KT Chain: 10g @ ₹6,500 = ₹65,000                       │
│ - 22KT Bangle: 15g @ ₹6,500 = ₹97,500                      │
│ ──────────────────────────────────────────────────         │
│ Total Spot Purchase Price: ₹1,62,500                        │
├─────────────────────────────────────────────────────────────┤
│ Scheme: SALE-01 (₹1,500 margin per ₹1L/month)              │
│ Option Period: [60 days ▼]  (15 | 30 | 45 | 60 | 75 | 90)   │
├─────────────────────────────────────────────────────────────┤
│ CALCULATION                                                 │
│ Monthly Margin: ₹1,62,500 × 1,500/1,00,000 = ₹2,438        │
│ Advance Margin (1 mo): ₹2,438                               │
│ Processing Fee (1%): ₹1,625                                 │
│ Document Charges: ₹100                                      │
│ ──────────────────────────────────────────────────         │
│ Net Cash to Seller: ₹1,62,500 - 2,438 - 1,625 - 100        │
│                   = ₹1,58,337                               │
├─────────────────────────────────────────────────────────────┤
│ REPURCHASE PRICE SCHEDULE                                   │
│ Days 0-15:  ₹1,64,938 (1 mo margin)                         │
│ Days 16-30: ₹1,64,938                                       │
│ Days 31-45: ₹1,67,376 (2 mo margin)                         │
│ Days 46-60: ₹1,67,376                                       │
└─────────────────────────────────────────────────────────────┘
```

---

### Backward Compatibility

**Existing Sale Agreements**: Will continue using the old calculation stored in their records (`differential_capitalized`, `advance_interest_actual`, etc.)

**New Sale Agreements**: Will have:
- `differential_capitalized = 0`
- `advance_interest_shown = advance_interest_actual` (same value)
- New `margin_per_month` stored for reference

**Scheme Type Distinction**: The `scheme_type = 'sale_agreement'` filter already separates these from loans.

---

### Expected Outcome

1. **Simpler Schemes**: Admin configures monthly margin in ₹, not annual rates
2. **No Differential**: Eliminates rebate tracking and accounting complexity
3. **15-Day Tenures**: Clean options at 15, 30, 45, 60, 75, 90 days
4. **Clear Strike Prices**: Monthly-based pricing easy to explain to customers
5. **Separate Codepaths**: Sale agreements use new calculation functions entirely
