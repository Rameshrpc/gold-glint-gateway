

## Plan: Enhanced Indian Slab Interest Calculation with Jumping Rates & Penal Interest

### Current State

Your system already has a robust dual-rate interest engine in `src/lib/interestCalculations.ts` that handles:
- Shown rate vs effective rate (e.g., 18% shown, 30% effective)
- Advance interest deduction at loan creation
- Billable days logic (excluding advance interest period)
- Penalty rate (flat, applied after grace period)
- Rebate schedule for early closure

The `schemes` table stores a single `interest_rate`, `shown_rate`, `effective_rate`, and `penalty_rate` per scheme -- no slab/tier support.

### What Is Missing

Indian pawnbroker "slab interest" means the rate **changes** based on how long the loan has been outstanding (e.g., 1.5%/month for first 3 months, then jumps to 2%/month). Your current system uses a flat rate for the entire duration. Two enhancements are needed:

1. **Interest Rate Slabs** -- Time-based rate tiers per scheme (e.g., 0-90 days at 18% p.a., 91-180 days at 24% p.a., 181+ days at 30% p.a.)
2. **Retroactive vs Prospective application** -- Some NBFCs apply the higher slab retroactively from day 1; others apply it only going forward from the slab boundary

### Architecture

```text
schemes table
  └── interest_rate_slabs (JSONB)
        ├── { from_day: 0,  to_day: 90,  rate: 18 }
        ├── { from_day: 91, to_day: 180, rate: 24 }
        └── { from_day: 181, to_day: null, rate: 30 }
        + slab_mode: "prospective" | "retroactive"
```

---

### Step 1: Database -- Add slab columns to `schemes`

Add two new columns to the `schemes` table:

```sql
ALTER TABLE schemes
  ADD COLUMN IF NOT EXISTS interest_rate_slabs JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS slab_mode VARCHAR DEFAULT 'prospective'
    CHECK (slab_mode IN ('prospective', 'retroactive'));
```

`interest_rate_slabs` stores an array of `{ from_day, to_day, shown_rate, effective_rate }` objects. When empty, the existing flat `shown_rate`/`effective_rate` is used (backward compatible).

---

### Step 2: New utility function -- `calculateSlabInterest()`

Add to `src/lib/interestCalculations.ts`:

```typescript
interface InterestRateSlab {
  from_day: number;
  to_day: number | null; // null = open-ended
  shown_rate: number;    // annual %
  effective_rate: number; // annual %
}

function calculateSlabInterest(
  principal: number,
  disbursementDate: Date,
  currentDate: Date,
  slabs: InterestRateSlab[],
  slabMode: 'prospective' | 'retroactive',
  advanceInterestDays: number = 30
): { shownInterest: number; actualInterest: number; differential: number; totalDays: number; billableDays: number; slabBreakdown: SlabBreakdownEntry[] }
```

**Prospective mode**: Interest is calculated segment-by-segment. Days 0-90 at slab 1 rate, days 91-180 at slab 2 rate, etc. Each segment contributes independently.

**Retroactive mode**: The highest applicable slab rate is applied to ALL days from day 1. If the loan crosses 90 days, the 91-180 slab rate applies to the entire duration.

The function returns a `slabBreakdown` array showing each slab's contribution for transparency in receipts.

---

### Step 3: Update `calculateDualRateInterest()` to use slabs

Modify the existing function to accept an optional `slabs` parameter. If slabs are present (non-empty array), delegate to `calculateSlabInterest()`. Otherwise, use the current flat-rate logic. This ensures zero breaking changes.

```typescript
export function calculateDualRateInterest(
  actualPrincipal: number,
  scheme: Scheme & { interest_rate_slabs?: InterestRateSlab[]; slab_mode?: string },
  days: number,
  gracePeriodDays?: number,
  advanceInterestDays?: number
): DualRateInterest {
  // If scheme has slabs, use slab calculation
  if (scheme.interest_rate_slabs?.length) {
    return calculateSlabInterest(...);
  }
  // Otherwise, existing flat-rate logic (unchanged)
  ...
}
```

---

### Step 4: Update `Scheme` interface

Extend the TypeScript interface in `interestCalculations.ts`:

```typescript
export interface Scheme {
  // ... existing fields ...
  interest_rate_slabs?: InterestRateSlab[];
  slab_mode?: 'prospective' | 'retroactive';
}
```

---

### Step 5: Scheme Settings UI -- Slab Editor

Update the Schemes page (`src/pages/Schemes.tsx`) to add a slab configuration section when creating/editing a scheme:

- Toggle: "Use rate slabs" (checkbox)
- When enabled, show a table to add slab rows: From Day, To Day, Shown Rate, Effective Rate
- Radio: Prospective / Retroactive application mode
- Validation: slabs must be contiguous (no gaps), last slab must have `to_day = null`

---

### Step 6: Update downstream consumers

These pages/components read from `calculateDualRateInterest` and will automatically benefit once the function is updated:

| Consumer | Change Needed |
|----------|---------------|
| `src/pages/Interest.tsx` | Pass slabs from scheme to calculation -- minimal change |
| `src/pages/Redemption.tsx` | Same -- pass slabs through |
| `src/pages/Reloan.tsx` | Same |
| `src/pages/SaleRepurchase.tsx` | Same |
| `src/components/customer-portal/CustomerInterestDue.tsx` | Same |
| Interest receipts / PDFs | Add optional slab breakdown display |

---

### Step 7: Penal interest enhancement

The current `penalty_rate` is a single flat rate. Enhance to support tiered penalties:

```sql
ALTER TABLE schemes
  ADD COLUMN IF NOT EXISTS penalty_slabs JSONB DEFAULT '[]';
-- e.g., [{ from_day: 0, to_day: 30, rate: 2 }, { from_day: 31, to_day: null, rate: 3 }]
```

Update penalty calculation in `calculateDualRateInterest()` to use `penalty_slabs` when present, falling back to flat `penalty_rate`.

---

### Files Summary

| File | Action |
|------|--------|
| Database migration | Add `interest_rate_slabs`, `slab_mode`, `penalty_slabs` to `schemes` |
| `src/lib/interestCalculations.ts` | Add `calculateSlabInterest()`, update `Scheme` interface, modify `calculateDualRateInterest()` |
| `src/pages/Schemes.tsx` | Add slab editor UI in scheme form |
| `src/pages/Interest.tsx` | Pass slab data from scheme to calculator |
| `src/pages/Redemption.tsx` | Same |
| `src/pages/Reloan.tsx` | Same |
| `src/pages/SaleRepurchase.tsx` | Same |

### No Breaking Changes

- Empty `interest_rate_slabs` array = flat rate (current behavior)
- All existing loans and schemes continue to work identically
- Slab logic only activates when a scheme explicitly configures slabs

