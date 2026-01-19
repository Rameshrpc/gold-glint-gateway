import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MODULE_KEYS } from '@/lib/modules';
import { toast } from 'sonner';

interface UserPermission {
  module_key: string;
  is_enabled: boolean;
  can_approve_high_value: boolean;
}

interface ClientModule {
  module_key: string;
  is_enabled: boolean;
}

export function usePermissions() {
  const auth = useAuth();
  const { user, client, hasRole, isPlatformAdmin } = auth;
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [clientModules, setClientModules] = useState<ClientModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_permissions')
      .select('module_key, is_enabled, can_approve_high_value')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user permissions:', error);
      return;
    }

    // If no permissions exist, all modules are enabled by default
    if (!data || data.length === 0) {
      setUserPermissions(MODULE_KEYS.map(key => ({
        module_key: key,
        is_enabled: true,
        can_approve_high_value: false,
      })));
    } else {
      // Merge with defaults for missing modules
      const existingKeys = new Set(data.map(p => p.module_key));
      const merged = [
        ...data,
        ...MODULE_KEYS
          .filter(key => !existingKeys.has(key))
          .map(key => ({ module_key: key, is_enabled: true, can_approve_high_value: false })),
      ];
      setUserPermissions(merged);
    }
  }, [user?.id]);

  const fetchClientModules = useCallback(async () => {
    if (!client?.id) return;

    const { data, error } = await supabase
      .from('client_modules')
      .select('module_key, is_enabled')
      .eq('client_id', client.id);

    if (error) {
      console.error('Error fetching client modules:', error);
      return;
    }

    // If no modules exist, all modules are enabled by default
    if (!data || data.length === 0) {
      setClientModules(MODULE_KEYS.map(key => ({
        module_key: key,
        is_enabled: true,
      })));
    } else {
      // Merge with defaults for missing modules
      const existingKeys = new Set(data.map(m => m.module_key));
      const merged = [
        ...data,
        ...MODULE_KEYS
          .filter(key => !existingKeys.has(key))
          .map(key => ({ module_key: key, is_enabled: true })),
      ];
      setClientModules(merged);
    }
  }, [client?.id]);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserPermissions(),
        fetchClientModules(),
      ]);
      setLoading(false);
    };

    loadPermissions();
  }, [fetchUserPermissions, fetchClientModules]);

  const hasModuleAccess = useCallback((moduleKey: string): boolean => {
    const clientModule = clientModules.find(m => m.module_key === moduleKey);
    const userPermission = userPermissions.find(p => p.module_key === moduleKey);

    // Both client and user must have module enabled
    const clientEnabled = clientModule?.is_enabled ?? true;
    const userEnabled = userPermission?.is_enabled ?? true;

    return clientEnabled && userEnabled;
  }, [clientModules, userPermissions]);

  const canApproveHighValue = useCallback((): boolean => {
    const perm = userPermissions.find(p => p.can_approve_high_value);
    return !!perm;
  }, [userPermissions]);

  // EDIT permission: tenant_admin, super_admin, platform admin, branch_manager, AND loan_officer
  const canEdit = useMemo((): boolean => {
    return hasRole('tenant_admin') || hasRole('super_admin') || 
           hasRole('branch_manager') || hasRole('loan_officer') || 
           isPlatformAdmin();
  }, [hasRole, isPlatformAdmin]);

  // DELETE permission: ONLY tenant_admin, super_admin, platform admin (NO branch_manager)
  const canDelete = useMemo((): boolean => {
    return hasRole('tenant_admin') || hasRole('super_admin') || isPlatformAdmin();
  }, [hasRole, isPlatformAdmin]);

  // Legacy combined permission (for backwards compatibility)
  const canEditDelete = canDelete;

  // Helper to show toast when edit is blocked
  const attemptEdit = useCallback((): boolean => {
    if (canEdit) return true;
    toast.error('Only tenant admin or branch manager can edit transactions');
    return false;
  }, [canEdit]);

  // Helper to show toast when delete is blocked
  const attemptDelete = useCallback((): boolean => {
    if (canDelete) return true;
    toast.error('Only tenant admin can delete transactions');
    return false;
  }, [canDelete]);

  // Legacy helper (for backwards compatibility)
  const attemptEditDelete = useCallback((action: 'edit' | 'delete' = 'edit'): boolean => {
    if (action === 'delete') return attemptDelete();
    return attemptEdit();
  }, [attemptEdit, attemptDelete]);

  const refreshPermissions = useCallback(async () => {
    await Promise.all([
      fetchUserPermissions(),
      fetchClientModules(),
    ]);
  }, [fetchUserPermissions, fetchClientModules]);

  return {
    userPermissions,
    clientModules,
    hasModuleAccess,
    canApproveHighValue,
    canEdit,
    canDelete,
    canEditDelete, // Legacy
    attemptEdit,
    attemptDelete,
    attemptEditDelete, // Legacy
    loading,
    refreshPermissions,
  };
}
