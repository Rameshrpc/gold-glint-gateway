
## Plan: Enable Both Loans and Sale Agreements for Tenants

### Current State

| Client | supports_loans | supports_sale_agreements |
|--------|----------------|-------------------------|
| Platform Administration | **false** | true |
| Zenith Finance | true | **false** |
| tect co | true | **false** |

### Required State

For both menus to be visible, both flags must be `true`:

| Client | supports_loans | supports_sale_agreements |
|--------|----------------|-------------------------|
| Platform Administration | **true** | **true** |
| Zenith Finance | **true** | **true** |
| tect co | **true** | **true** |

---

### Solution

Run a database update to set both feature flags to `true` for all clients (or specific ones as needed):

```sql
UPDATE clients 
SET supports_loans = true, 
    supports_sale_agreements = true 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',  -- Platform Administration
  '2abc571d-ce56-4e32-ac8e-0761fafe8999',  -- Zenith Finance
  '3cc2f723-041d-415d-a9c0-d6b3cf98ae4b'   -- tect co
);
```

---

### Result

After the update:
- **Operations** menu (containing Loans, Interest, Redemption, etc.) will be visible
- **Sale Agreements** menu (containing Agreements, Margin Renewal, Repurchase, Sale Schemes) will be visible
- Both menus appear side by side in the sidebar

---

### Going Forward

When you toggle modules in Client Rights Settings, the code changes we made earlier will automatically sync these flags. This data update is a one-time fix for existing clients that were configured before the sync logic was added.
