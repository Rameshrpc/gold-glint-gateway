
## Plan: Ensure All Schemes Have Valid Version References

### Problem Summary

Currently, 2 schemes have `null` `current_version_id`:
- `PURE24` (id: `cb67ce00-f99b-4bcf-9953-767d1a7ac300`)
- `SLAE01` (id: `c400c7d7-b487-4911-b068-a66d604312c3`)

When a loan is created with these schemes, the `scheme_version_id` on the loan becomes `null`, which breaks the immutable rate tracking for interest calculations.

---

### Solution Overview

We will implement a multi-layered validation approach:

1. **Data Migration** - Backfill missing versions for existing schemes
2. **Frontend Validation** - Filter schemes dropdown to only show schemes with valid versions
3. **Backend Validation** - Block loan creation if the scheme has no current version
4. **Creation Fix** - Ensure SaleSchemes page creates initial versions (like Schemes page does)

---

### Changes Required

#### 1. Database Migration - Backfill Missing Versions

Create `scheme_versions` records for the 2 schemes with `null` `current_version_id`:

```sql
-- Create version for PURE24 scheme (cb67ce00-f99b-4bcf-9953-767d1a7ac300)
WITH scheme_data AS (
  SELECT * FROM schemes WHERE id = 'cb67ce00-f99b-4bcf-9953-767d1a7ac300'
),
new_version AS (
  INSERT INTO scheme_versions (
    scheme_id, client_id, version_number, effective_from, change_reason,
    interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months,
    rate_per_gram, rate_18kt, rate_22kt, min_amount, max_amount,
    min_tenure_days, max_tenure_days, ltv_percentage, processing_fee_percentage,
    document_charges, penalty_rate, grace_period_days
  )
  SELECT 
    id, client_id, 1, CURRENT_DATE, 'Backfill initial version',
    interest_rate, shown_rate, effective_rate, minimum_days, advance_interest_months,
    rate_per_gram, rate_18kt, rate_22kt, min_amount, max_amount,
    min_tenure_days, max_tenure_days, ltv_percentage, processing_fee_percentage,
    document_charges, penalty_rate, grace_period_days
  FROM scheme_data
  RETURNING id
)
UPDATE schemes SET current_version_id = (SELECT id FROM new_version)
WHERE id = 'cb67ce00-f99b-4bcf-9953-767d1a7ac300';

-- Repeat for SLAE01 scheme (c400c7d7-b487-4911-b068-a66d604312c3)
-- Similar INSERT/UPDATE pattern
```

---

#### 2. Modify `src/pages/Loans.tsx` - Filter Schemes Dropdown

**File:** `src/pages/Loans.tsx`

**Current code (fetchSchemes, ~line 349):**
```typescript
const fetchSchemes = async () => {
  if (!client) return;
  const { data } = await supabase
    .from('schemes')
    .select('id, scheme_code, ...')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .order('scheme_name');
  setSchemes(data || []);
};
```

**Change:** Add `current_version_id` to the select and filter to only show schemes with version:

```typescript
const fetchSchemes = async () => {
  if (!client) return;
  const { data } = await supabase
    .from('schemes')
    .select('id, scheme_code, scheme_name, ..., current_version_id')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .not('current_version_id', 'is', null)  // Only schemes with versions
    .neq('scheme_type', 'sale_agreement')    // Exclude sale agreement schemes from loan form
    .order('scheme_name');
  setSchemes(data || []);
};
```

---

#### 3. Modify `src/pages/Loans.tsx` - Add Validation Before Submit

**File:** `src/pages/Loans.tsx`

**Location:** `handleCreateLoan` function (~line 732)

**Current code:**
```typescript
const { data: schemeWithVersion } = await supabase
  .from('schemes')
  .select('current_version_id')
  .eq('id', selectedSchemeId)
  .single();

const loanData = {
  ...
  scheme_version_id: schemeWithVersion?.current_version_id || null,
  ...
};
```

**Change:** Add validation to block if no version exists:

```typescript
const { data: schemeWithVersion } = await supabase
  .from('schemes')
  .select('current_version_id')
  .eq('id', selectedSchemeId)
  .single();

// Block loan creation if scheme has no version
if (!schemeWithVersion?.current_version_id) {
  toast.error('Selected scheme is not properly configured. Please contact admin.', {
    description: 'Scheme is missing version data required for loan creation.'
  });
  setSubmitting(false);
  return;
}

const loanData = {
  ...
  scheme_version_id: schemeWithVersion.current_version_id,  // Now guaranteed non-null
  ...
};
```

---

#### 4. Modify `src/pages/SaleSchemes.tsx` - Create Initial Version on Scheme Creation

**File:** `src/pages/SaleSchemes.tsx`

**Current code (handleSubmit, ~line 201):**
```typescript
} else {
  const { error } = await supabase
    .from('schemes')
    .insert(schemeData);
  if (error) throw error;
  toast.success('Scheme created successfully');
}
```

**Change:** After creating scheme, create initial version (matching Schemes.tsx pattern):

```typescript
} else {
  // Create new scheme
  const { data: newScheme, error: schemeError } = await supabase
    .from('schemes')
    .insert(schemeData)
    .select()
    .single();

  if (schemeError) throw schemeError;

  // Create initial version
  const { data: newVersion, error: versionError } = await supabase
    .from('scheme_versions')
    .insert({
      scheme_id: newScheme.id,
      client_id: client.id,
      version_number: 1,
      effective_from: new Date().toISOString().split('T')[0],
      change_reason: 'Initial version',
      interest_rate: schemeData.interest_rate,
      shown_rate: schemeData.shown_rate,
      effective_rate: schemeData.effective_rate,
      minimum_days: schemeData.minimum_days,
      advance_interest_months: schemeData.advance_interest_months,
      rate_18kt: schemeData.rate_18kt,
      rate_22kt: schemeData.rate_22kt,
      min_amount: schemeData.min_amount,
      max_amount: schemeData.max_amount,
      min_tenure_days: schemeData.min_tenure_days,
      max_tenure_days: schemeData.max_tenure_days,
      ltv_percentage: schemeData.ltv_percentage,
      processing_fee_percentage: schemeData.processing_fee_percentage,
      document_charges: schemeData.document_charges,
    })
    .select()
    .single();

  if (versionError) throw versionError;

  // Update scheme with current version id
  await supabase
    .from('schemes')
    .update({ current_version_id: newVersion.id })
    .eq('id', newScheme.id);

  toast.success('Scheme created successfully');
}
```

---

#### 5. Modify `src/pages/Reloan.tsx` - Same Validation (Consistency)

**File:** `src/pages/Reloan.tsx`

Apply the same filtering for schemes dropdown and validation before loan creation as Loans.tsx.

---

#### 6. Modify `src/pages/SaleAgreements.tsx` - Same Validation

**File:** `src/pages/SaleAgreements.tsx`

Apply the same filtering (only `scheme_type = 'sale_agreement'` with valid `current_version_id`).

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Loans.tsx` | Filter schemes dropdown, add validation before submit |
| `src/pages/Reloan.tsx` | Filter schemes dropdown, add validation before submit |
| `src/pages/SaleAgreements.tsx` | Filter schemes dropdown, add validation before submit |
| `src/pages/SaleSchemes.tsx` | Create initial version when creating new sale agreement scheme |

### Database Migration

Backfill `scheme_versions` for the 2 schemes with `null` `current_version_id`.

---

### Validation Flow Diagram

```text
User selects scheme in dropdown
         │
         ▼
┌────────────────────────────────┐
│ Frontend Filter (fetchSchemes) │
│ - is_active = true             │
│ - current_version_id IS NOT NULL │
│ - scheme_type matches form type │
└────────────────────────────────┘
         │
         ▼
User submits loan form
         │
         ▼
┌────────────────────────────────┐
│ handleCreateLoan Validation    │
│ - Fetch scheme's current_version_id │
│ - If null → Show error, abort  │
└────────────────────────────────┘
         │ (version exists)
         ▼
┌────────────────────────────────┐
│ Insert loan with               │
│ scheme_version_id (guaranteed) │
└────────────────────────────────┘
```

---

### Expected Outcome

1. Schemes dropdown only shows schemes with valid version configuration
2. Loan creation is blocked with clear error message if scheme somehow lacks version
3. New sale agreement schemes automatically get initial version
4. Existing schemes are fixed via database migration
5. All new loans will have a valid `scheme_version_id` for accurate interest calculations
