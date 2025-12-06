import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MODULES, MODULE_KEYS } from '@/lib/modules';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, ShieldAlert, Lock, UserCog } from 'lucide-react';

const AVAILABLE_ROLES = [
  { value: 'tenant_admin', label: 'Admin' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'loan_officer', label: 'Loan Officer' },
  { value: 'appraiser', label: 'Appraiser' },
  { value: 'collection_agent', label: 'Collection Agent' },
  { value: 'auditor', label: 'Auditor' },
];

interface UserWithProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  branch_id: string | null;
  branch?: { branch_name: string } | null;
  roles?: { role: string }[];
}

interface UserRightsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
  onSave?: () => void;
}

interface PermissionState {
  [key: string]: boolean;
}

export function UserRightsSheet({ open, onOpenChange, user, onSave }: UserRightsSheetProps) {
  const { isPlatformAdmin, hasRole } = useAuth();
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [canApproveHighValue, setCanApproveHighValue] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const canAssignRoles = isPlatformAdmin() || hasRole('super_admin') || hasRole('tenant_admin');

  useEffect(() => {
    if (user && open) {
      loadUserPermissions();
    }
  }, [user, open]);

  const loadUserPermissions = async () => {
    if (!user) return;
    setLoading(true);

    // Set current role
    const currentRole = user.roles?.[0]?.role || '';
    setSelectedRole(currentRole);

    const { data, error } = await supabase
      .from('user_permissions')
      .select('module_key, is_enabled, can_approve_high_value')
      .eq('user_id', user.user_id);

    if (error) {
      console.error('Error loading permissions:', error);
      setLoading(false);
      return;
    }

    // Initialize with defaults (all enabled) then apply saved permissions
    const defaultPerms: PermissionState = {};
    MODULE_KEYS.forEach(key => {
      defaultPerms[key] = true;
    });

    let hasHighValueApproval = false;
    if (data) {
      data.forEach(perm => {
        defaultPerms[perm.module_key] = perm.is_enabled;
        if (perm.can_approve_high_value) hasHighValueApproval = true;
      });
    }

    setPermissions(defaultPerms);
    setCanApproveHighValue(hasHighValueApproval);
    setLoading(false);
  };

  const handleToggle = (moduleKey: string, enabled: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: enabled,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update role if changed (and user has permission to assign roles)
      const currentRole = user.roles?.[0]?.role || '';
      if (canAssignRoles && selectedRole && selectedRole !== currentRole) {
        // Delete existing roles for this user
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id);

        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{ user_id: user.user_id, role: selectedRole as any }]);

        if (roleError) throw roleError;
      }

      // Delete existing permissions for this user
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', user.user_id);

      // Insert new permissions
      const permissionsToInsert = MODULE_KEYS.map(key => ({
        user_id: user.user_id,
        module_key: key,
        is_enabled: permissions[key] ?? true,
        can_approve_high_value: key === 'loans' ? canApproveHighValue : false,
      }));

      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (error) throw error;

      toast.success('User rights saved successfully');
      onSave?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;
  const totalCount = MODULE_KEYS.length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (roles?: { role: string }[]) => {
    if (!roles || roles.length === 0) return 'User';
    const roleMap: Record<string, string> = {
      super_admin: 'Super Admin',
      moderator: 'Moderator',
      tenant_admin: 'Admin',
      branch_manager: 'Branch Manager',
      loan_officer: 'Loan Officer',
      appraiser: 'Appraiser',
      collection_agent: 'Collection Agent',
      auditor: 'Auditor',
    };
    return roleMap[roles[0].role] || roles[0].role;
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left">{user.full_name}</SheetTitle>
              <SheetDescription className="text-left">
                {user.branch?.branch_name || 'No branch assigned'}
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{getRoleBadge(user.roles)}</Badge>
            <Badge variant="outline">{enabledCount}/{totalCount} modules</Badge>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Role Assignment - Only for admins */}
            {canAssignRoles && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Assign Role</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Change the user's role. This affects their base permissions.
                  </p>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
              </>
            )}

            {/* Global Rule - Locked Section */}
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600">Global Rule (Locked)</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground mt-1">
                Only <span className="font-semibold">tenant_admin</span> can EDIT or DELETE any transaction.
                All other roles can only VIEW + ADD in their permitted modules.
              </AlertDescription>
            </Alert>

            <div>
              <h3 className="text-sm font-semibold mb-4">Module Access</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Control which modules this user can access. Users can VIEW + ADD NEW in enabled modules.
              </p>
              <div className="space-y-3">
                {MODULES.map(module => (
                  <div
                    key={module.key}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <module.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor={module.key} className="font-normal cursor-pointer">
                          {module.label}
                        </Label>
                        {permissions[module.key] && (
                          <span className="text-[10px] text-muted-foreground ml-2">View + Add</span>
                        )}
                      </div>
                    </div>
                    <Switch
                      id={module.key}
                      checked={permissions[module.key] ?? true}
                      onCheckedChange={(checked) => handleToggle(module.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-4">Special Permissions</h3>
              
              {/* High Value Approval - Toggleable */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="high-value" className="font-normal cursor-pointer">
                    Can approve loans {">"} ₹5 lakh
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Grant high-value loan approval rights
                  </p>
                </div>
                <Switch
                  id="high-value"
                  checked={canApproveHighValue}
                  onCheckedChange={setCanApproveHighValue}
                />
              </div>

              <Separator className="my-3" />

              {/* Locked Permissions - Cannot be changed */}
              <div className="space-y-3 opacity-60">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <Label className="font-normal text-muted-foreground">
                        Can edit/delete old loans
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Locked to tenant_admin only
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <Label className="font-normal text-muted-foreground">
                        Can edit/delete receipts
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Locked to tenant_admin only
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Rights
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
