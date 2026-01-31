

## Plan: Add Sale Agreement Settings Section

### Problem Identified

The Sale Agreement Company Name setting was added to `PrintSettingsTab.tsx`, but the Settings page now uses a different component structure with `GeneralPrintSettings.tsx`. The setting field is not accessible in the current Settings page.

### Solution

Add a dedicated "Sale Agreement" section in the Print Setup sidebar with the company name setting, making it easy to find and configure.

---

### Technical Changes

#### 1. Add New Settings Section Type
**File: `src/components/settings/SettingsSidebar.tsx`**

- Add `'print-sale-agreement'` to the `SettingsSection` type
- Add a new sidebar item for "Sale Agreement" in the Print Setup section

```typescript
export type SettingsSection = 
  | 'user-rights' 
  // ... existing sections ...
  | 'print-sale-agreement';  // ADD

const printItems: MenuItem[] = [
  // ... existing items ...
  { id: 'print-sale-agreement', label: 'Sale Agreement', icon: Scale },  // ADD
];
```

---

#### 2. Create Sale Agreement Settings Component
**File: `src/components/print/SaleAgreementSettings.tsx`** (NEW)

Create a dedicated settings component for Sale Agreement configuration:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Loader2 } from 'lucide-react';

export function SaleAgreementSettings() {
  const { settings, loading, updateSettings } = usePrintSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sale Agreement Settings</CardTitle>
        <CardDescription>
          Configure settings specific to Sale Agreement (Trading Format) documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Company Name for Sale Agreements</Label>
          <Input
            value={settings.sale_agreement_company_name || ''}
            onChange={(e) => updateSettings({ 
              sale_agreement_company_name: e.target.value || null 
            })}
            placeholder="e.g., ZAMIN GOLD (leave empty to use main company name)"
          />
          <p className="text-sm text-muted-foreground">
            This name will appear on Sale Agreement documents as the buyer (e.g., "M/s. ZAMIN GOLD"). 
            If left empty, the main company name will be used.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

#### 3. Add Section to Settings Page
**File: `src/pages/Settings.tsx`**

- Import the new `SaleAgreementSettings` component
- Add case for `'print-sale-agreement'` in `renderContent()`

```typescript
import { SaleAgreementSettings } from '@/components/print/SaleAgreementSettings';

// In renderContent():
case 'print-sale-agreement':
  return <SaleAgreementSettings />;
```

---

### Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/settings/SettingsSidebar.tsx` | Modify | Add `print-sale-agreement` section type and menu item |
| `src/components/print/SaleAgreementSettings.tsx` | Create | New component with Sale Agreement company name input |
| `src/pages/Settings.tsx` | Modify | Import and render `SaleAgreementSettings` |

---

### Navigation Path After Implementation

**Settings → Print Setup → Sale Agreement**

The user will find the "Sale Agreement" option in the sidebar under "Print Setup" section, making it easy to locate and configure the company name.

---

### Expected Outcome

- New "Sale Agreement" menu item appears in Settings → Print Setup sidebar
- Clicking it shows a dedicated settings card with the "Company Name for Sale Agreements" input
- When user types "ZAMIN GOLD" and navigates away, the setting is saved
- Sale Agreement PDFs will display "M/s. ZAMIN GOLD" as the buyer
- Works even if no print_settings record exists yet (creates on first save)

