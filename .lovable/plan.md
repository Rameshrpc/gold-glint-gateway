

## Plan: Gold Valuation -- Only 22KT Gets Maximum Rate, Below 22KT Uses 18KT Rate

### Business Rule

Currently, purities like 20k and 14k are valued by interpolating from the 22kt rate (e.g., 20k = 22kt rate x 20/22). This is incorrect.

**New rule:**
- **22kt and above (22k, 24k):** Use their respective rates (22kt rate, or 22kt x 24/22 for 24k)
- **Below 22kt (20k, 18k, 14k):** All use the **18kt rate** -- no interpolation

### Technical Changes

The `getRateForPurity` function is duplicated in 3 files. All 3 will be updated identically:

| Purity | Current Logic | New Logic |
|--------|--------------|-----------|
| 24k | 22kt rate x 24/22 | 22kt rate x 24/22 (unchanged) |
| 22k | 22kt rate | 22kt rate (unchanged) |
| 20k | 22kt rate x 20/22 | **18kt rate** |
| 18k | 18kt rate | 18kt rate (unchanged) |
| 14k | 22kt rate x 14/22 | **18kt rate** |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Loans.tsx` (line ~463) | Update `getRateForPurity`: 20k and 14k return `scheme.rate_18kt` instead of interpolated values |
| `src/pages/SaleAgreements.tsx` (line ~450) | Same change |
| `src/pages/Reloan.tsx` (line ~337) | Same change |

### Example Impact

With 22kt rate = 11,500 and 18kt rate = 9,500:

| Purity | Before | After |
|--------|--------|-------|
| 22k | 11,500/g | 11,500/g |
| 20k | 10,454/g (interpolated) | **9,500/g** (18kt rate) |
| 14k | 7,318/g (interpolated) | **9,500/g** (18kt rate) |
| 18k | 9,500/g | 9,500/g |

This is a simple, 3-file change affecting only the `getRateForPurity` function in each.

