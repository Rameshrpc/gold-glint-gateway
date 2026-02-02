

## Plan: Separate Gold Vault as Standalone Main Menu Item

### Current State
The Gold Vault is currently nested under the "Operations" menu group at line 83 in `DashboardLayout.tsx`. This creates confusion since the Gold Vault is shared infrastructure used by both:
- **Loans/Operations** (Loan Collateral)
- **Sale Agreements** (Purchased Goods)

### Solution
Move Gold Vault out of Operations and make it a top-level menu item (like Dashboard), visible whenever either loans OR sale agreements is enabled.

---

### Technical Changes

#### File: `src/components/layout/DashboardLayout.tsx`

**1. Remove Gold Vault from Operations group (line 83)**

Current Operations items:
```typescript
{
  title: 'Operations',
  icon: Wallet,
  items: [
    { title: 'Loans', icon: FileText, href: '/loans', moduleKey: 'loans' },
    { title: 'Interest', icon: CreditCard, href: '/interest', moduleKey: 'interest' },
    { title: 'Redemption', icon: Wallet, href: '/redemption', moduleKey: 'redemption' },
    { title: 'Reloan', icon: RefreshCw, href: '/reloan' },
    { title: 'Auction', icon: Gavel, href: '/auction' },
    { title: 'Gold Vault', icon: Vault, href: '/gold-vault' },  // REMOVE
    { title: 'Approvals', icon: Bell, href: '/approvals' },
  ]
},
```

**2. Add Gold Vault as standalone menu group after Dashboard (line 49)**

Insert new menu group:
```typescript
{
  title: 'Gold Vault',
  icon: Vault,
  items: [
    { title: 'Gold Vault', icon: Vault, href: '/gold-vault' }
  ]
},
```

**3. Update filterMenuGroup function (lines 182-202)**

Add visibility logic for Gold Vault - show if either loans OR sale agreements is enabled:
```typescript
// Gold Vault is shared - show if either feature is enabled
if (group.title === 'Gold Vault') {
  if (client && !client.supports_loans && !client.supports_sale_agreements) {
    return false;
  }
}
```

**4. Render Gold Vault like Dashboard (single item without collapsible)**

In the navigation render section (around line 336), add handling for Gold Vault similar to Dashboard:
```typescript
if (group.title === 'Gold Vault') {
  return (
    <NavLink 
      key={group.title}
      to="/gold-vault" 
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-100/80 dark:text-amber-200/70 hover:bg-white/10 dark:hover:bg-amber-500/10 hover:text-white dark:hover:text-amber-50 transition-colors"
      activeClassName="bg-white/20 dark:bg-amber-500/20 text-white dark:text-amber-50 font-medium"
      onClick={() => setSidebarOpen(false)}
    >
      <Vault className="h-5 w-5" />
      <span>Gold Vault</span>
    </NavLink>
  );
}
```

---

### Navigation Structure After Change

| Menu Item | Type | Visibility |
|-----------|------|------------|
| Dashboard | Top-level | Always |
| **Gold Vault** | **Top-level (NEW)** | **Loans OR Sale Agreements enabled** |
| Administration | Collapsible group | Admin roles |
| Masters | Collapsible group | All |
| Operations | Collapsible group | Loans enabled |
| Sale Agreements | Collapsible group | Sale Agreements enabled |
| Accounting | Collapsible group | All |
| Reports & Comms | Collapsible group | All |
| Configuration | Collapsible group | Admin roles |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/DashboardLayout.tsx` | Move Gold Vault to top-level, add visibility logic |

---

### Expected Outcome

- Gold Vault appears as a standalone menu item below Dashboard
- Visible when either Loans OR Sale Agreements is enabled
- No longer nested under Operations
- Same styling as Dashboard (single item, no collapsible submenu)

