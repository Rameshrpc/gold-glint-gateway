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
  const { user, client, hasRole, isPlatformAdmin } = useAuth();
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

  // GLOBAL RULE: Only tenant_admin and super_admin can edit or delete records
  // This is ENFORCED and cannot be overridden by user permissions
  const canEditDelete = useMemo((): boolean => {
    return hasRole('tenant_admin') || hasRole('super_admin') || isPlatformAdmin();
  }, [hasRole, isPlatformAdmin]);

  // Helper to show toast when edit/delete is blocked
  const attemptEditDelete = useCallback((action: 'edit' | 'delete' = 'edit'): boolean => {
    if (canEditDelete) return true;
    
    const actionText = action === 'delete' ? 'delete' : 'edit';
    toast.error(`Only tenant admin can ${actionText} transactions`);
    return false;
  }, [canEditDelete]);

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
    canEditDelete,
    attemptEditDelete,
    loading,
    refreshPermissions,
  };
}
