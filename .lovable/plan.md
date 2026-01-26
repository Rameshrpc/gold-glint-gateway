

## Plan: Sync Feature Flags with Module Toggles in Client Rights Settings

### Problem
The Sale Agreements module is enabled in Client Rights Settings (via the `client_modules` table), but the sidebar doesn't show it because:
1. **Sidebar filtering** checks `clients.supports_sale_agreements` column (currently `false`)
2. **Module toggles** only update the `client_modules` table
3. These two systems are **not synchronized**

### Current Database State

| Client | supports_loans | supports_sale_agreements |
|--------|----------------|-------------------------|
| Platform Administration | true | **false** |
| Zenith Finance | true | **false** |
| tect co | true | **false** |

Even though you enabled Sale Agreements modules in the toggle list, the `supports_sale_agreements` column remains `false`.

---

### Solution
When saving Client Rights, also update the `supports_loans` and `supports_sale_agreements` columns based on module toggle states.

---

### File to Modify

**File: `src/components/settings/ClientRightsSheet.tsx`**

Update the `handleSave` function to sync feature flags:

**Lines 116-127** - Add feature flag sync:

```typescript
// Determine feature flag states from module toggles
const supportsLoans = modules['loans'] ?? true;
const supportsSaleAgreements = modules['sale_agreements'] ?? false;

// Update client limits AND feature flags
const { error: clientError } = await supabase
  .from('clients')
  .update({
    max_branches: maxBranches,
    max_users: maxUsers,
    plan_name: planName,
    supports_loans: supportsLoans,              // NEW
    supports_sale_agreements: supportsSaleAgreements,  // NEW
  })
  .eq('id', client.id);
```

---

### Logic Mapping

| Module Toggle State | Feature Flag Updated |
|---------------------|---------------------|
| `loans` = true | `supports_loans` = true |
| `loans` = false | `supports_loans` = false |
| `sale_agreements` = true | `supports_sale_agreements` = true |
| `sale_agreements` = false | `supports_sale_agreements` = false |

---

### Impact

After implementation:
1. When you toggle "Loans" ON/OFF → `clients.supports_loans` updates
2. When you toggle "Sale Agreements" ON/OFF → `clients.supports_sale_agreements` updates
3. Sidebar dynamically shows/hides menu groups based on these flags
4. Dashboard quick actions also respect these flags

---

### Immediate Fix (for existing clients)

After code deployment, you'll need to save the Client Rights again to sync the flags. Alternatively, we can run a one-time data fix:

```sql
-- Update Zenith Finance to enable Sale Agreements
UPDATE clients 
SET supports_sale_agreements = true 
WHERE client_code = 'ZENITH01';
```

---

### Result

| Before | After |
|--------|-------|
| Toggle Sale Agreements ON in settings | Sidebar shows Sale Agreements menu |
| Toggle Sale Agreements OFF in settings | Sidebar hides Sale Agreements menu |
| Toggle Loans OFF in settings | Sidebar hides Operations menu |

