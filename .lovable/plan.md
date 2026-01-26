

## Plan: Fix Sale Agreements Menu Not Appearing

### Problem Analysis

The Sale Agreements menu is not appearing despite being enabled in Client Rights Settings. After investigation, I found:

**Database State (Platform Administration client):**
| Column | Value |
|--------|-------|
| `supports_loans` | `false` |
| `supports_sale_agreements` | `true` |
| `client_modules.loans` | `false` |
| `client_modules.sale_agreements` | `true` |

**Expected Behavior:**
- Operations menu group should be **HIDDEN** (since `supports_loans: false`)
- Sale Agreements menu group should be **VISIBLE** (since `supports_sale_agreements: true`)

**Actual Behavior (from screenshot):**
- Operations menu IS visible (but missing "Loans" item)
- Sale Agreements menu is NOT visible

---

### Root Cause

The **`client` object from `useAuth()` is stale** (cached from login time). The `usePermissions` hook fetches fresh `client_modules` data, but `useAuth` does NOT refetch the `client` data when it changes.

The filtering logic in `DashboardLayout.tsx` relies on `client.supports_sale_agreements`, which still has the old value from when the user logged in.

---

### Solution

Add a mechanism to refresh the client data when the user navigates or when module permissions are fetched. We'll update `useAuth` to expose a `refreshClient` function and call it from `usePermissions`.

---

### Files to Modify

#### 1. `src/hooks/useAuth.tsx`

Add a `refreshClient` function that re-fetches client data:

```typescript
// Add to AuthContextType interface
refreshClient: () => Promise<void>;

// Add implementation
const refreshClient = async () => {
  if (!profile?.client_id) return;
  
  const { data: clientData } = await supabase
    .from('clients')
    .select('id, client_code, company_name, supports_loans, supports_sale_agreements')
    .eq('id', profile.client_id)
    .maybeSingle();

  if (clientData) {
    setClient({
      ...clientData,
      supports_loans: clientData.supports_loans ?? true,
      supports_sale_agreements: clientData.supports_sale_agreements ?? false,
    });
  }
};

// Export in context value
return { ..., refreshClient };
```

---

#### 2. `src/hooks/usePermissions.tsx`

Call `refreshClient` when fetching permissions:

```typescript
const { user, client, hasRole, isPlatformAdmin, refreshClient } = useAuth();

useEffect(() => {
  const loadPermissions = async () => {
    setLoading(true);
    // Refresh client data to get latest feature flags
    await refreshClient();
    await Promise.all([
      fetchUserPermissions(),
      fetchClientModules(),
    ]);
    setLoading(false);
  };

  loadPermissions();
}, [fetchUserPermissions, fetchClientModules, refreshClient]);
```

---

### Implementation Steps

1. **Update `useAuth.tsx`**: Add `refreshClient` function to re-fetch client data with latest feature flags
2. **Update `usePermissions.tsx`**: Call `refreshClient` when loading permissions to ensure feature flags are current
3. **Test**: Navigate between pages and verify Sale Agreements menu appears without requiring logout/login

---

### Immediate Workaround

Until the fix is deployed, the user can **log out and log back in** to refresh the client data.

---

### Technical Details

The fix ensures that whenever the `usePermissions` hook loads (which happens on component mount/navigation), it also refreshes the client feature flags. This keeps the sidebar in sync with the latest Client Rights Settings without requiring a full logout/login cycle.

**Data flow after fix:**
```text
User navigates → usePermissions loads → refreshClient() called 
→ Fresh client.supports_* fetched → filterMenuGroup uses latest values 
→ Correct menus shown
```

