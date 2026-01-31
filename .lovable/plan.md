

## Plan: Fix Scheme Selection Dropdown for Sale Agreements

### Problem Analysis

The scheme dropdown is empty because:

1. **Wrong scheme type**: The user's client has 2 schemes (`SALE13000`, `SALE15000`), but they were created with `scheme_type: 'loan'` instead of `scheme_type: 'sale_agreement'`
2. **Query filter**: The SaleAgreements page correctly filters for `scheme_type = 'sale_agreement'`, but no schemes match

The schemes were likely created from the **Loan Schemes** page (`/schemes`) instead of the **Sale Agreement Schemes** page (`/sale-schemes`).

### Solution

#### 1. Database Fix - Update Existing Schemes
Update the wrongly-typed schemes for this client to have the correct `scheme_type`:

```sql
UPDATE schemes 
SET scheme_type = 'sale_agreement' 
WHERE client_id = 'ec647f3c-96df-4424-99b0-64db54b575df' 
AND scheme_code IN ('SALE13000', 'SALE15000');
```

#### 2. UI Improvement - Empty State Message
Add a helpful empty state message in the scheme dropdown to guide users when no sale schemes exist.

**File: `src/pages/SaleAgreements.tsx`**

Update the SelectContent to show a helpful message when no schemes are available:

```tsx
<SelectContent className="bg-background z-50">
  {schemes.length === 0 ? (
    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
      No sale schemes configured. 
      <br />
      Go to Settings → Sale Schemes to create one.
    </div>
  ) : (
    schemes.map((scheme) => (
      <SelectItem key={scheme.id} value={scheme.id}>
        {scheme.scheme_name} ({scheme.scheme_code}) - {scheme.shown_rate}% | LTV {scheme.ltv_percentage}% | 22KT: ₹{scheme.rate_22kt}/g
      </SelectItem>
    ))
  )}
</SelectContent>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| Database migration | Update existing wrongly-typed schemes to `sale_agreement` type |
| `src/pages/SaleAgreements.tsx` | Add empty state message in scheme dropdown |

---

### Expected Outcome

- The existing `SALE13000` and `SALE15000` schemes will appear in the Sale Agreement scheme dropdown
- Users will see a helpful message if no sale schemes are configured, directing them to the correct page
- The dropdown will work properly for admin users

