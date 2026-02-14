

## Plan: Professional SaaS Module Isolation & Plan-Based Access Control

### Overview

Transform the app into a properly isolated SaaS platform where every section is gated by the tenant's plan. Currently, only "Loans" and "Sale Agreements" have feature-flag guards. This plan extends that pattern to **every module group** -- Accounting, Reports, Gold Vault, Notifications, Agents, etc. -- so you can create plan tiers (Starter, Growth, Enterprise) and selectively enable/disable sections per client.

---

### What Changes

#### 1. Expand Feature Flags on the `clients` Table

Add new boolean columns for each major module group:

| New Column | Default | Controls |
|---|---|---|
| `supports_accounting` | `true` | Chart of Accounts, Day Book, Ledger, Trial Balance, P&L, Balance Sheet, Vouchers |
| `supports_reports` | `true` | MIS Reports, Activity Log, Audit Logs |
| `supports_notifications` | `true` | WhatsApp, SMS, Notification Logs |
| `supports_gold_vault` | `true` | Gold Vault page |
| `supports_agents` | `true` | Agents, Agent Commissions, Commission Reports |
| `supports_customer_portal` | `false` | Customer self-service portal |
| `supports_approvals` | `true` | Approval workflows |

#### 2. Upgrade `ProtectedRoute` Component

Expand `requiredFeature` from 2 options to cover all module groups:

```
'loans' | 'sale_agreements' | 'accounting' | 'reports' |
'notifications' | 'gold_vault' | 'agents' | 'customer_portal' | 'approvals'
```

#### 3. Apply Route Guards in `App.tsx`

Every route gets the appropriate `requiredFeature`:

| Routes | Feature Guard |
|---|---|
| `/loans`, `/interest`, `/redemption`, `/reloan`, `/auction` | `loans` |
| `/sale-agreements`, `/sale-margin-renewal`, `/sale-repurchase`, `/sale-schemes` | `sale_agreements` |
| `/accounts`, `/day-book`, `/ledger-statement`, `/trial-balance`, `/profit-loss`, `/balance-sheet`, `/vouchers` | `accounting` |
| `/mis-reports`, `/audit-logs`, `/activity-log` | `reports` |
| `/notifications`, `/whatsapp`, `/sms` | `notifications` |
| `/gold-vault` | `gold_vault` |
| `/agents`, `/agent-commissions`, `/commission-reports` | `agents` |
| `/approvals` | `approvals` |

#### 4. Update Sidebar Filtering (`DashboardLayout.tsx`)

Add feature flag checks for all new groups in `filterMenuGroup`:

- **Accounting** group: hidden if `!client.supports_accounting`
- **Reports & Comms** group: hidden if `!client.supports_reports && !client.supports_notifications`
- **Gold Vault**: hidden if `!client.supports_gold_vault`
- Individual items filtered by their module group

#### 5. Update Dashboard Quick Actions & Stats

- Hide accounting health widget when `!supports_accounting`
- Hide overdue analysis when `!supports_loans`
- Hide agent-related stats when `!supports_agents`

#### 6. Sync Feature Flags in `ClientRightsSheet`

Update the save handler to sync all new `supports_*` flags when toggling modules, just like `supports_loans` and `supports_sale_agreements` are synced today.

#### 7. Add Predefined Plan Templates

Add a "Plan Template" dropdown in `ClientRightsSheet` that auto-fills modules:

| Plan | Modules Included |
|---|---|
| **Starter** | Loans, Customers, Dashboard, Settings |
| **Growth** | Everything in Starter + Accounting, Reports, Agents, Gold Vault, Notifications |
| **Enterprise** | All modules + Sale Agreements, Customer Portal, Approvals |

This is a UI-only convenience -- the actual toggles still control access.

---

### Files to Create/Modify

| File | Change |
|---|---|
| Database Migration | Add 7 new `supports_*` boolean columns to `clients` table |
| `src/components/ProtectedRoute.tsx` | Expand `requiredFeature` union type; add checks for all new flags |
| `src/App.tsx` | Add `requiredFeature` prop to all route guards |
| `src/components/layout/DashboardLayout.tsx` | Add feature flag filtering for Accounting, Reports, Gold Vault, Agents groups |
| `src/pages/Dashboard.tsx` | Conditionally show widgets based on feature flags |
| `src/components/settings/ClientRightsSheet.tsx` | Sync all `supports_*` flags on save; add plan template dropdown |
| `src/hooks/useAuth.tsx` | Ensure new `supports_*` fields are included in client type |
| `src/lib/modules.ts` | Add `featureFlag` mapping to each module definition |

---

### Security

- Route guards prevent URL-based bypass (typing `/accounting` when disabled)
- Sidebar hides disabled sections (UI-level)
- Database `client_modules` table provides server-side validation
- RLS policies already scope all data to `client_id`

### No Breaking Changes

All new columns default to `true`, so existing clients retain full access. Only new clients or explicitly updated ones will have restricted access.

