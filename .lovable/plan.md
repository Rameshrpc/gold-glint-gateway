

## Plan: Show Spot Price as Ornament Value in Sale Agreement PDF

### Problem

Currently, the "Value" column in the ornaments table and "Total Value of Ornaments" in the summary section show the **Price on Record** (1,76,136) which includes interest adjustment. They should show the **Spot Price** (1,62,750) -- the actual appraised value of the gold.

### What Changes

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

1. **"Total Value of Ornaments" in summary table (line 512)**
   - Change from `totals.value` to `loan.total_appraised_value`
   - This shows the Spot Price (1,62,750) instead of Price on Record (1,76,136)

2. **Individual item "Value" in ornaments details table (line 572)**
   - Each item's value needs to be proportionally scaled from Price on Record down to Spot Price
   - Formula: `item.appraised_value * (loan.total_appraised_value / totals.value)`
   - This ensures individual items sum up to the Spot Price total

3. **TOTAL row in ornaments table (line 583)**
   - Change from `totals.value` to `loan.total_appraised_value`

### Example (from your screenshots)

| Field | Before (wrong) | After (correct) |
|-------|----------------|-----------------|
| Total Value of Ornaments | 1,76,136 | 1,62,750 |
| Item 1 Value | 1,76,136 | 1,62,750 |
| TOTAL Value | 1,76,136 | 1,62,750 |

### Technical Detail

- `loan.total_appraised_value` = Spot Price (actual gold value based on weight x rate)
- `item.appraised_value` = includes interest adjustment baked in (Price on Record)
- The proportional scaling handles multi-item agreements correctly

