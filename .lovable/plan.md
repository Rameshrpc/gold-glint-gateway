
# Feature Flag System for Tenants & Sale Agreement Logic

## Overview

This plan implements a tenant-level feature flag system to control visibility and access to "Loans" and "Sale Agreements" modules. The flags will dynamically show/hide menu sections and dashboard widgets based on tenant configuration.

---

## Current State Analysis

### What Already Exists:
1. **Sale Agreements Module** - Fully implemented in `src/pages/SaleAgreements.tsx` (2213 lines) with:
   - Same form structure as Loans (customer, branch, agent, scheme, gold items)
   - Dual-rate margin calculation (shown_rate vs effective_rate)
   - Multiple payment entries with source tracking
   - Approval workflow integration
   - Voucher generation

2. **Sale Margin Renewal** - `src/pages/SaleMarginRenewal.tsx` (808 lines) mirrors Interest page

3. **Sale Repurchase** - `src/pages/SaleRepurchase.tsx` (848 lines) mirrors Redemption page

4. **Sidebar Structure** - `src/components/layout/DashboardLayout.tsx` has separate menu groups:
   - "Operations" group with Loans, Interest, Redemption, Reloan, Auction, Gold Vault, Approvals
   - "Sale Agreements" group with Agreements, Margin Renewal, Repurchase, Sale Schemes

5. **Dashboard** - `src/pages/Dashboard.tsx` shows loan-centric widgets

6. **Clients Table** - Currently has no feature flag columns

---

## Implementation Plan

### Phase 1: Database Schema Update

**Add feature flags to `clients` table:**

```sql
ALTER TABLE public.clients
ADD COLUMN supports_loans BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN supports_sale_agreements BOOLEAN NOT NULL DEFAULT false;

-- Update existing clients to enable loans by default
UPDATE public.clients SET supports_loans = true WHERE supports_loans IS NULL;
```

---

### Phase 2: Auth Context Enhancement

**File: `src/hooks/useAuth.tsx`**

Update the `Client` interface and fetch logic:

```typescript
interface Client {
  id: string;
  client_code: string;
  company_name: string;
  supports_loans: boolean;        // NEW
  supports_sale_agreements: boolean;  // NEW
}
```

Update `fetchUserData` to include the new fields in the client query:

```typescript
const { data: clientData } = await supabase
  .from('clients')
  .select('id, client_code, company_name, supports_loans, supports_sale_agreements')
  .eq('id', profileData.client_id)
  .maybeSingle();
```

---

### Phase 3: Sidebar Dynamic Filtering

**File: `src/components/layout/DashboardLayout.tsx`**

1. Add feature flag checks to `filterMenuGroup` function:

```typescript
const filterMenuGroup = (group: MenuGroup) => {
  // Feature flag checks for entire groups
  if (group.title === 'Operations' && client && !client.supports_loans) {
    return false;
  }
  if (group.title === 'Sale Agreements' && client && !client.supports_sale_agreements) {
    return false;
  }
  // ... existing role checks
};
```

2. For shared items (Gold Vault, Approvals, Customers), keep them visible if EITHER module is enabled.

**Updated Menu Group Structure:**

| Group | Visibility Condition |
|-------|---------------------|
| Dashboard | Always visible |
| Administration | Role-based (unchanged) |
| Masters | Always visible (Customers, Schemes shared) |
| Operations (Loans) | `client.supports_loans === true` |
| Sale Agreements | `client.supports_sale_agreements === true` |
| Accounting | Always visible |
| Reports & Comms | Always visible |
| Configuration | Role-based (unchanged) |

---

### Phase 4: Dashboard Updates

**File: `src/pages/Dashboard.tsx`**

1. Read feature flags from `useAuth()`:

```typescript
const { profile, client, currentBranch, roles, hasRole } = useAuth();
const supportsLoans = client?.supports_loans ?? true;
const supportsSaleAgreements = client?.supports_sale_agreements ?? false;
```

2. **Conditional Quick Actions:**

```typescript
const quickActions = [
  ...(supportsLoans ? [
    { title: 'New Loan', icon: Plus, href: '/loans?action=new', color: 'bg-green-600 hover:bg-green-700' },
    { title: 'Interest', icon: CreditCard, href: '/interest', color: 'bg-blue-600 hover:bg-blue-700' },
    { title: 'Redemption', icon: Wallet, href: '/redemption', color: 'bg-purple-600 hover:bg-purple-700' },
    { title: 'Reloan', icon: RefreshCw, href: '/reloan', color: 'bg-amber-600 hover:bg-amber-700' },
  ] : []),
  ...(supportsSaleAgreements ? [
    { title: 'New Agreement', icon: Plus, href: '/sale-agreements?action=new', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { title: 'Margin Payment', icon: CreditCard, href: '/sale-margin-renewal', color: 'bg-teal-600 hover:bg-teal-700' },
    { title: 'Repurchase', icon: Wallet, href: '/sale-repurchase', color: 'bg-cyan-600 hover:bg-cyan-700' },
  ] : []),
];
```

3. **Dashboard Stats Labels:**
   - When only Sale Agreements: "Active Agreements" instead of "Active Loans"
   - When both: Show combined or separate sections

---

### Phase 5: Dashboard Data Hook Update

**File: `src/hooks/useDashboardData.tsx`**

1. Pass feature flags to the hook:

```typescript
export function useDashboardData(filters?: { 
  includeLoans?: boolean; 
  includeSaleAgreements?: boolean; 
}): DashboardData
```

2. Filter loans query by `transaction_type`:

```typescript
// Build transaction type filter
const transactionTypes: string[] = [];
if (includeLoans) transactionTypes.push('loan');
if (includeSaleAgreements) transactionTypes.push('sale_agreement');

const loansQuery = supabase
  .from('loans')
  .select('id, branch_id, principal_amount, status, maturity_date, loan_date, net_disbursed, transaction_type')
  .eq('client_id', profile.client_id)
  .in('transaction_type', transactionTypes.length > 0 ? transactionTypes : ['loan']);
```

3. Update stat labels dynamically:

```typescript
export interface DashboardStats {
  totalCustomers: number;
  activeLoans: number;
  activeSaleAgreements: number;  // NEW - separate count
  totalAUM: number;
  monthlyCollection: number;
  overdueLoans: number;
  overdueSaleAgreements: number;  // NEW
}
```

---

### Phase 6: Route Protection (Optional Enhancement)

**File: `src/App.tsx`**

Add route guards to prevent navigation to disabled modules:

```typescript
// Wrap loan routes
<Route path="/loans" element={
  <ProtectedRoute requiredFeature="loans">
    <Loans />
  </ProtectedRoute>
} />

// Wrap sale agreement routes
<Route path="/sale-agreements" element={
  <ProtectedRoute requiredFeature="sale_agreements">
    <SaleAgreements />
  </ProtectedRoute>
} />
```

Update `ProtectedRoute` component to check feature flags.

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Add `supports_loans` and `supports_sale_agreements` columns to `clients` |
| `src/hooks/useAuth.tsx` | Update Client interface, fetch new fields |
| `src/components/layout/DashboardLayout.tsx` | Add feature flag checks to `filterMenuGroup` |
| `src/pages/Dashboard.tsx` | Conditional quick actions based on flags |
| `src/hooks/useDashboardData.tsx` | Filter by transaction_type, add separate stats |
| `src/components/ProtectedRoute.tsx` | Add feature flag validation (optional) |

---

## Data Model

```text
clients table:
┌─────────────────────────────┐
│ id                          │
│ client_code                 │
│ company_name                │
│ ...existing fields...       │
│ supports_loans (NEW)        │  ← boolean, default true
│ supports_sale_agreements    │  ← boolean, default false
│ (NEW)                       │
└─────────────────────────────┘
```

---

## UI Behavior Matrix

| Tenant Config | Sidebar Shows | Dashboard Shows |
|---------------|---------------|-----------------|
| Loans Only | Operations menu | Loan quick actions, loan stats |
| Sale Agreements Only | Sale Agreements menu | Agreement quick actions, agreement stats |
| Both | Both menus | Combined quick actions, all stats |

---

## Implementation Order

1. **Database migration** - Add columns to `clients` table
2. **Auth hook update** - Fetch and expose feature flags
3. **Sidebar filtering** - Hide/show menu groups
4. **Dashboard quick actions** - Conditional rendering
5. **Dashboard data filtering** - Filter by transaction_type
6. **Route protection** - Redirect if feature disabled (optional)

---

## Notes

- The Sale Agreements module is already fully implemented and mirrors the Loans logic
- No code duplication needed - the modules are already separate
- This plan focuses on the **visibility/access control layer**
- Existing RLS policies don't need changes since the data is already isolated by `client_id`
