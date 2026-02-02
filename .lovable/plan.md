

## Plan: Add Active/Inactive Toggle & Delete Buttons to Sale Schemes

### Current State
The Sale Agreement Schemes page currently shows:
- Code, Name, Monthly Margin, 22KT Rate, Tenure, Status columns
- Status badge showing "Active" or "Inactive" 
- Only an Edit button (pencil icon) in the Actions column

### What We'll Add

| Feature | Description |
|---------|-------------|
| **Status Toggle** | Replace static badge with a clickable Switch component to toggle active/inactive |
| **Delete Button** | Add a Trash icon button next to the Edit button |
| **Confirmation Dialog** | Show confirmation before deleting a scheme |

---

### Technical Changes

#### File: `src/pages/SaleSchemes.tsx`

**1. Add Imports (line 11)**
```typescript
import { Plus, Pencil, Calculator, Info, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
```

**2. Add State for Delete Confirmation (around line 54)**
```typescript
const [schemeToDelete, setSchemeToDelete] = useState<SaleScheme | null>(null);
```

**3. Add Toggle Status Handler**
```typescript
const handleToggleStatus = async (scheme: SaleScheme) => {
  try {
    const { error } = await supabase
      .from('schemes')
      .update({ is_active: !scheme.is_active })
      .eq('id', scheme.id);
    
    if (error) throw error;
    toast.success(`Scheme ${!scheme.is_active ? 'activated' : 'deactivated'}`);
    fetchSchemes();
  } catch (error: any) {
    toast.error('Failed to update scheme status');
  }
};
```

**4. Add Delete Handler**
```typescript
const handleDelete = async () => {
  if (!schemeToDelete) return;
  
  try {
    // First delete any versions
    await supabase
      .from('scheme_versions')
      .delete()
      .eq('scheme_id', schemeToDelete.id);
    
    // Then delete the scheme
    const { error } = await supabase
      .from('schemes')
      .delete()
      .eq('id', schemeToDelete.id);
    
    if (error) throw error;
    toast.success('Scheme deleted successfully');
    setSchemeToDelete(null);
    fetchSchemes();
  } catch (error: any) {
    toast.error('Failed to delete scheme');
  }
};
```

**5. Update Status Cell (around line 374-378)**

Replace the static Badge:
```tsx
<TableCell className="text-center">
  <Badge variant={scheme.is_active ? 'default' : 'secondary'}>
    {scheme.is_active ? 'Active' : 'Inactive'}
  </Badge>
</TableCell>
```

With an interactive Switch:
```tsx
<TableCell className="text-center">
  <div className="flex items-center justify-center gap-2">
    <Switch
      checked={scheme.is_active}
      onCheckedChange={() => handleToggleStatus(scheme)}
    />
    <span className={cn(
      "text-xs font-medium",
      scheme.is_active ? "text-green-600" : "text-muted-foreground"
    )}>
      {scheme.is_active ? 'Active' : 'Inactive'}
    </span>
  </div>
</TableCell>
```

**6. Update Actions Cell (around line 379-383)**

Add Delete button next to Edit:
```tsx
<TableCell className="text-right">
  <div className="flex items-center justify-end gap-1">
    <Button variant="ghost" size="icon" onClick={() => handleEdit(scheme)}>
      <Pencil className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => setSchemeToDelete(scheme)}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

**7. Add Delete Confirmation Dialog (before closing DashboardLayout)**
```tsx
<AlertDialog open={!!schemeToDelete} onOpenChange={(open) => !open && setSchemeToDelete(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Scheme</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{schemeToDelete?.scheme_name}"? 
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### UI Preview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Code    │ Name   │ Monthly Margin │ 22KT Rate │ Tenure   │ Status │ Actions │
├──────────────────────────────────────────────────────────────────────────────┤
│ SALE-01 │ Std    │ ₹1,500/L/mo   │ ₹6,500    │ 30-90    │ [🔘] Active │ ✏️ 🗑️ │
│ SALE-02 │ Prem   │ ₹2,000/L/mo   │ ₹6,500    │ 15-60    │ [○] Inactive│ ✏️ 🗑️ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/SaleSchemes.tsx` | Add Switch toggle, Delete button, confirmation dialog |

---

### Dependencies
No new dependencies needed - uses existing UI components:
- `Switch` from `@/components/ui/switch`
- `AlertDialog` components from `@/components/ui/alert-dialog`

