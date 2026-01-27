

## Plan: Add Business Type Selection During Client Creation

### Overview

Add a "Business Type" selection field when creating a new client that allows platform admins to choose whether the client supports:
- **Loans Only** - Traditional gold loan operations
- **Sale Agreements Only** - Trading format operations  
- **Both** - Full access to both modules

Based on this selection, the system will automatically configure:
1. The `supports_loans` and `supports_sale_agreements` feature flags
2. The initial `client_modules` entries
3. Gold Vault access (always enabled for both types since it's shared infrastructure)

---

### UI Design

**Client Creation Dialog Changes:**

Add a new "Business Type" field with radio buttons:

```text
┌──────────────────────────────────────────────┐
│ Add New Client                               │
├──────────────────────────────────────────────┤
│ Client Code *        [GOLD01          ]      │
│ Company Name *       [Company name    ]      │
│                                              │
│ Business Type *                              │
│ ○ Loans Only                                 │
│   Traditional gold loan operations           │
│                                              │
│ ○ Sale Agreements Only                       │
│   Trading format (purchase/repurchase)       │
│                                              │
│ ○ Both Loans & Sale Agreements               │
│   Full access to all modules                 │
│                                              │
│ Email               [contact@company.com]    │
│ Phone               [+91 9876543210    ]     │
│ Address             [Business address  ]     │
│                                              │
│ Active Status                      [Toggle]  │
│                                              │
│ [Cancel]                    [Create]         │
└──────────────────────────────────────────────┘
```

---

### Files to Modify

#### 1. `src/pages/Clients.tsx`

**Add new state for business type:**
```typescript
type BusinessType = 'loans' | 'sale_agreements' | 'both';
const [businessType, setBusinessType] = useState<BusinessType>('loans');
```

**Add business type selection UI in the form (after Company Name field):**
```typescript
<div className="space-y-2">
  <Label>Business Type *</Label>
  <RadioGroup 
    value={businessType} 
    onValueChange={(value) => setBusinessType(value as BusinessType)}
  >
    <div className="flex items-start space-x-2">
      <RadioGroupItem value="loans" id="type-loans" />
      <div>
        <Label htmlFor="type-loans" className="font-normal cursor-pointer">
          Loans Only
        </Label>
        <p className="text-xs text-muted-foreground">
          Traditional gold loan operations
        </p>
      </div>
    </div>
    <div className="flex items-start space-x-2">
      <RadioGroupItem value="sale_agreements" id="type-sale" />
      <div>
        <Label htmlFor="type-sale" className="font-normal cursor-pointer">
          Sale Agreements Only
        </Label>
        <p className="text-xs text-muted-foreground">
          Trading format (purchase/repurchase)
        </p>
      </div>
    </div>
    <div className="flex items-start space-x-2">
      <RadioGroupItem value="both" id="type-both" />
      <div>
        <Label htmlFor="type-both" className="font-normal cursor-pointer">
          Both Loans & Sale Agreements
        </Label>
        <p className="text-xs text-muted-foreground">
          Full access to all modules
        </p>
      </div>
    </div>
  </RadioGroup>
</div>
```

**Update the create client logic to include feature flags:**
```typescript
// Determine feature flags based on business type
const supportsLoans = businessType === 'loans' || businessType === 'both';
const supportsSaleAgreements = businessType === 'sale_agreements' || businessType === 'both';

// Create new client with feature flags
const { data: newClient, error } = await supabase
  .from('clients')
  .insert({
    client_code: clientCode.toUpperCase(),
    company_name: companyName,
    email: email || null,
    phone: phone || null,
    address: address || null,
    is_active: isActive,
    supports_loans: supportsLoans,              // NEW
    supports_sale_agreements: supportsSaleAgreements,  // NEW
  })
  .select()
  .single();
```

**After creating the client, insert default client_modules:**
```typescript
// Create default client modules based on business type
const defaultModules = getDefaultModulesForBusinessType(businessType);
await supabase.from('client_modules').insert(
  defaultModules.map(moduleKey => ({
    client_id: newClient.id,
    module_key: moduleKey,
    is_enabled: true,
  }))
);
```

**Add helper function to determine default modules:**
```typescript
const getDefaultModulesForBusinessType = (type: BusinessType): string[] => {
  // Common modules for all types
  const commonModules = [
    'dashboard', 'quick_view', 'customers', 'agents', 
    'notifications', 'reports', 'accounting', 'settings'
  ];

  // Loan-specific modules
  const loanModules = ['loans', 'interest', 'redemption', 'repledge', 'takeover'];

  // Sale agreement modules
  const saleModules = ['sale_agreements', 'sale_margin', 'sale_repurchase', 'sale_schemes'];

  switch (type) {
    case 'loans':
      return [...commonModules, ...loanModules];
    case 'sale_agreements':
      return [...commonModules, ...saleModules];
    case 'both':
      return [...commonModules, ...loanModules, ...saleModules];
  }
};
```

**Update resetForm to include businessType:**
```typescript
const resetForm = () => {
  // ... existing resets
  setBusinessType('loans');  // Default to loans
};
```

**Add import for RadioGroup:**
```typescript
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
```

---

### Module Visibility Matrix

| Business Type | Loans Menu | Sale Agreements Menu | Gold Vault |
|---------------|------------|---------------------|------------|
| Loans Only | Visible | Hidden | Visible |
| Sale Agreements Only | Hidden | Visible | Visible |
| Both | Visible | Visible | Visible |

**Note:** Gold Vault is part of the "Operations" menu group but is shared infrastructure used by both loan collateral and purchased goods. The current code shows/hides the entire Operations group based on `supports_loans`. We need to ensure Gold Vault remains accessible even when only Sale Agreements are enabled.

---

### Additional Fix Required: Gold Vault Visibility

Currently, Gold Vault is inside the "Operations" group which is hidden when `supports_loans = false`. For Sale Agreements-only clients, Gold Vault should still be accessible.

**Option A (Recommended):** Move Gold Vault to its own menu group or make it always visible.

**Modify `DashboardLayout.tsx` filterMenuGroup logic:**
```typescript
const filterMenuGroup = (group: MenuGroup) => {
  // Feature flag checks for entire menu groups
  if (group.title === 'Operations') {
    // Show Operations if either loans OR sale agreements is enabled
    if (client && !client.supports_loans && !client.supports_sale_agreements) {
      return false;
    }
  }
  if (group.title === 'Sale Agreements' && client && !client.supports_sale_agreements) {
    return false;
  }
  // ... rest of logic
};
```

And filter individual items within Operations based on feature flags:
```typescript
// In filterMenuItem, add checks for loan-specific items
const filterMenuItem = (item: MenuItem) => {
  // Hide loan-specific items if loans not supported
  const loanOnlyItems = ['/loans', '/interest', '/redemption', '/reloan', '/auction'];
  if (loanOnlyItems.includes(item.href) && client && !client.supports_loans) {
    return false;
  }
  // ... rest of existing logic
};
```

---

### Implementation Sequence

1. **Update `src/pages/Clients.tsx`:**
   - Add `businessType` state with type definition
   - Add RadioGroup UI for business type selection
   - Update `handleSubmit` to set feature flags based on selection
   - Insert default `client_modules` entries after client creation
   - Update `resetForm` to reset business type

2. **Update `src/components/layout/DashboardLayout.tsx`:**
   - Modify `filterMenuGroup` to show Operations when either feature is enabled
   - Modify `filterMenuItem` to hide loan-specific items when loans not supported

---

### Technical Notes

- The `RadioGroup` component is already available at `src/components/ui/radio-group.tsx`
- Feature flags (`supports_loans`, `supports_sale_agreements`) are already columns in the `clients` table
- The `client_modules` table already exists and is used for granular module control
- Gold Vault uses `vaultViewMode` toggle to switch between "Loan Collateral" and "Purchased Goods" terminology

