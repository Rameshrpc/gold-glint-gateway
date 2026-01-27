

## Plan: Hide Repledge/Reloan and Differential Interest UI

### Overview

Add feature flags to conditionally hide advanced features like "Reloan" and "Differential Interest" from the UI. Even if someone tries to manipulate the app, these features will be completely hidden from view while keeping the underlying calculation logic intact for accounting purposes.

---

### Approach: Add Hidden Feature Flags

We'll add two new boolean flags to the `clients` table that control visibility:
- `show_reloan_module` - Controls whether Reloan menu item appears
- `show_differential_details` - Controls whether differential interest breakdown is shown in UI

These flags will default to `false` (hidden) so new clients won't see these advanced features.

---

### Files to Modify

#### 1. Database Migration - Add Feature Flags

Add two new columns to the `clients` table:

```sql
ALTER TABLE clients 
ADD COLUMN show_reloan_module boolean NOT NULL DEFAULT false,
ADD COLUMN show_differential_details boolean NOT NULL DEFAULT false;
```

---

#### 2. `src/components/layout/DashboardLayout.tsx` - Hide Reloan Menu

**Current State:**
- Reloan appears in the Operations menu unconditionally

**Changes:**
- Add `/reloan` to the list of items filtered by a client flag
- Update `filterMenuItem` to check `client?.show_reloan_module`

```typescript
const filterMenuItem = (item: MenuItem) => {
  // ... existing checks ...
  
  // Hide Reloan if show_reloan_module is false
  if (item.href === '/reloan' && client && !client.show_reloan_module) {
    return false;
  }
  
  // ... rest of logic
};
```

---

#### 3. `src/pages/Loans.tsx` - Hide Differential Details

**Hide in Loan Creation Form (lines ~1834-1840):**
```typescript
{client?.show_differential_details && loanCalculation.advanceCalc.differential > 0 && (
  <div className="flex justify-between text-amber-600">
    <span>Interest Adjustment</span>
    <span>+{formatIndianCurrency(loanCalculation.advanceCalc.differential)}</span>
  </div>
)}
```

**Hide in Loan Detail View (lines ~2570-2577):**
```typescript
{client?.show_differential_details && (viewingLoan.differential_capitalized || 0) > 0 && (
  <div className="flex justify-between text-amber-600">
    <span>Differential Added to Principal</span>
    <span>+{formatIndianCurrency(viewingLoan.differential_capitalized || 0)}</span>
  </div>
)}
```

Also hide the "Advance Interest (Actual)" line in the detail view since it reveals the dual-rate mechanism.

---

#### 4. `src/pages/Interest.tsx` - Hide Differential Details

Hide any differential interest breakdown in the interest payment details dialog.

---

#### 5. `src/components/customer-portal/OutstandingSummaryCard.tsx` - Hide Differential

**Current (lines 70-75):**
```typescript
{currentInterest.differential > 0 && (
  <div className="flex justify-between py-1 border-b border-amber-200/50">
    <span className="text-muted-foreground">Differential Interest</span>
    <span className="font-medium">{formatIndianCurrency(currentInterest.differential)}</span>
  </div>
)}
```

**Change to always hidden:**
Remove this entire block since customers should never see differential interest details.

---

#### 6. `src/integrations/supabase/types.ts` - Type Updates

The types file will auto-update after migration. Ensure the `client` type includes:
```typescript
show_reloan_module: boolean;
show_differential_details: boolean;
```

---

#### 7. `src/pages/Reloan.tsx` - Add Route Guard

Add a redirect check at the top of the component:
```typescript
useEffect(() => {
  if (client && !client.show_reloan_module) {
    navigate('/dashboard');
    toast.error('Reloan module is not enabled');
  }
}, [client]);
```

---

### Summary of Changes

| Location | What's Hidden | Condition |
|----------|---------------|-----------|
| Sidebar menu | Reloan menu item | `!client.show_reloan_module` |
| /reloan route | Entire page (redirects) | `!client.show_reloan_module` |
| Loan form | "Interest Adjustment" line | `!client.show_differential_details` |
| Loan details | "Differential Added to Principal" | `!client.show_differential_details` |
| Loan details | "Advance Interest (Actual)" | `!client.show_differential_details` |
| Customer Portal | "Differential Interest" row | Always hidden (customers never see) |

---

### What Stays the Same

- **Calculation logic** - Differential interest is still calculated and stored for accounting
- **Database records** - `differential_capitalized` is still saved to loans
- **Accounting vouchers** - Full dual-rate logic is preserved in books
- **Reports** - Internal reports can still show these if needed

---

### Implementation Sequence

1. Run database migration to add the two new columns
2. Update `DashboardLayout.tsx` to filter Reloan menu item
3. Update `Reloan.tsx` to redirect if module disabled
4. Update `Loans.tsx` to conditionally show differential details
5. Update `Interest.tsx` to hide differential breakdown
6. Update `OutstandingSummaryCard.tsx` to remove differential display entirely
7. (Optional) Add admin UI in Settings to toggle these flags per-client

---

### Default Behavior

All existing clients will have these flags set to `false`, meaning:
- Reloan will be **hidden** by default
- Differential interest details will be **hidden** by default

Platform admins can enable these for specific clients if needed.

