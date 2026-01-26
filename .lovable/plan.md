

## Plan: Add Sale Agreement Modules to Client Rights Settings

### Problem
The Modules toggle list in Client Rights Settings is missing the Sale Agreement-related modules. Currently, it only shows 15 modules related to Loans and general features, but the Sale Agreement module and its sub-modules (Margin Renewal, Repurchase, Sale Schemes) are not available for toggling.

---

### Root Cause
The `MODULES` array in `src/lib/modules.ts` only defines 15 modules. It does not include:
- Sale Agreements
- Margin Renewal (Sale)
- Repurchase (Sale)
- Sale Schemes

---

### Solution
Add the Sale Agreement-related modules to the `MODULES` array in `src/lib/modules.ts`.

---

### File to Modify

**File: `src/lib/modules.ts`**

Add 4 new module definitions to the `MODULES` array:

| Module Key | Label | Icon | Description |
|------------|-------|------|-------------|
| `sale_agreements` | Sale Agreements | FileText | Create and manage sale agreements |
| `sale_margin` | Margin Renewal | CreditCard | Collect margin payments |
| `sale_repurchase` | Repurchase | Wallet | Process agreement buybacks |
| `sale_schemes` | Sale Schemes | Percent | Manage sale agreement schemes |

**Updated MODULES array (after line 43):**

```typescript
{ key: 'sale_agreements', label: 'Sale Agreements', icon: FileText, description: 'Create and manage sale agreements' },
{ key: 'sale_margin', label: 'Margin Renewal', icon: CreditCard, description: 'Collect margin payments' },
{ key: 'sale_repurchase', label: 'Repurchase', icon: Wallet, description: 'Process agreement buybacks' },
{ key: 'sale_schemes', label: 'Sale Schemes', icon: Percent, description: 'Manage sale agreement schemes' },
```

---

### Impact

After implementation:
- Client Rights Settings will show **19 modules** (15 existing + 4 new Sale Agreement modules)
- Platform admins can toggle Sale Agreement modules on/off for each client
- The module count display will update to "X/19 modules"

---

### Result

The Modules section in Client Rights will display:

| # | Module | Toggle |
|---|--------|--------|
| 1 | Dashboard | ✓ |
| 2 | Quick View | ✓ |
| 3 | Loans / Pledges | ✓ |
| 4 | Interest Payment | ✓ |
| 5 | Redemption | ✓ |
| 6 | Re-pledge Module | ✓ |
| 7 | Takeover | ✓ |
| 8 | Customers 360 | ✓ |
| 9 | Agents | ✓ |
| 10 | Loyalties | ✓ |
| 11 | Team Board | ✓ |
| 12 | Notifications | ✓ |
| 13 | Reports | ✓ |
| 14 | Accounting | ✓ |
| 15 | Settings | ✓ |
| **16** | **Sale Agreements** | **NEW** |
| **17** | **Margin Renewal** | **NEW** |
| **18** | **Repurchase** | **NEW** |
| **19** | **Sale Schemes** | **NEW** |

