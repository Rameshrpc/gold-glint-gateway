import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { MODULES, MODULE_KEYS } from '@/lib/modules';
import { toast } from 'sonner';
import { Loader2, Building2, AlertTriangle } from 'lucide-react';

interface ClientData {
  id: string;
  client_code: string;
  company_name: string;
  plan_name: string | null;
  max_branches: number | null;
  max_users: number | null;
  is_active: boolean | null;
}

interface ClientRightsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
  onSave?: () => void;
}

interface ModuleState {
  [key: string]: boolean;
}

export function ClientRightsSheet({ open, onOpenChange, client, onSave }: ClientRightsSheetProps) {
  const [modules, setModules] = useState<ModuleState>({});
  const [maxBranches, setMaxBranches] = useState<number>(5);
  const [maxUsers, setMaxUsers] = useState<number>(50);
  const [planName, setPlanName] = useState<string>('Growth');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchCount, setBranchCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (client && open) {
      loadClientModules();
      loadClientStats();
      setMaxBranches(client.max_branches ?? 5);
      setMaxUsers(client.max_users ?? 50);
      setPlanName(client.plan_name ?? 'Growth');
    }
  }, [client, open]);

  const loadClientModules = async () => {
    if (!client) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('client_modules')
      .select('module_key, is_enabled')
      .eq('client_id', client.id);

    if (error) {
      console.error('Error loading modules:', error);
      setLoading(false);
      return;
    }

    // Initialize with defaults (all enabled) then apply saved settings
    const defaultModules: ModuleState = {};
    MODULE_KEYS.forEach(key => {
      defaultModules[key] = true;
    });

    if (data) {
      data.forEach(mod => {
        defaultModules[mod.module_key] = mod.is_enabled;
      });
    }

    setModules(defaultModules);
    setLoading(false);
  };

  const loadClientStats = async () => {
    if (!client) return;

    // Get branch count
    const { count: branches } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id);

    // Get user count
    const { count: users } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id);

    setBranchCount(branches ?? 0);
    setUserCount(users ?? 0);
  };

  const handleToggle = (moduleKey: string, enabled: boolean) => {
    setModules(prev => ({
      ...prev,
      [moduleKey]: enabled,
    }));
  };

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);

    try {
      // Update client limits
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          max_branches: maxBranches,
          max_users: maxUsers,
          plan_name: planName,
        })
        .eq('id', client.id);

      if (clientError) throw clientError;

      // Delete existing modules for this client
      await supabase
        .from('client_modules')
        .delete()
        .eq('client_id', client.id);

      // Insert new modules
      const modulesToInsert = MODULE_KEYS.map(key => ({
        client_id: client.id,
        module_key: key,
        is_enabled: modules[key] ?? true,
      }));

      const { error: modulesError } = await supabase
        .from('client_modules')
        .insert(modulesToInsert);

      if (modulesError) throw modulesError;

      toast.success('Client rights saved successfully');
      onSave?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving client rights:', error);
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(modules).filter(Boolean).length;
  const totalCount = MODULE_KEYS.length;

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-left">{client.company_name}</SheetTitle>
              <SheetDescription className="text-left">
                {client.client_code}
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{planName}</Badge>
            <Badge variant="outline">{enabledCount}/{totalCount} modules</Badge>
            {!client.is_active && (
              <Badge variant="destructive">Suspended</Badge>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Modules</h3>
              <div className="space-y-3">
                {MODULES.map(module => (
                  <div
                    key={module.key}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <module.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor={`client-${module.key}`} className="font-normal cursor-pointer">
                          {module.label}
                        </Label>
                        {module.enterpriseOnly && (
                          <p className="text-xs text-muted-foreground">Enterprise only</p>
                        )}
                      </div>
                    </div>
                    <Switch
                      id={`client-${module.key}`}
                      checked={modules[module.key] ?? true}
                      onCheckedChange={(checked) => handleToggle(module.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-4">Limits</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan Name</Label>
                  <Input
                    id="plan"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g., Growth, Enterprise"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="max-branches">Max Branches</Label>
                    <span className="text-sm text-muted-foreground">
                      {branchCount} / {maxBranches}
                    </span>
                  </div>
                  <Input
                    id="max-branches"
                    type="number"
                    min={1}
                    value={maxBranches}
                    onChange={(e) => setMaxBranches(parseInt(e.target.value) || 5)}
                  />
                  {branchCount >= maxBranches && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Branch limit reached
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="max-users">Max Users</Label>
                    <span className="text-sm text-muted-foreground">
                      {userCount} / {maxUsers}
                    </span>
                  </div>
                  <Input
                    id="max-users"
                    type="number"
                    min={1}
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(parseInt(e.target.value) || 50)}
                  />
                  {userCount >= maxUsers && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      User limit reached
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Client Rights
              </Button>
              {client.is_active ? (
                <Button variant="outline" className="w-full text-destructive border-destructive/50">
                  Suspend Client
                </Button>
              ) : (
                <Button variant="outline" className="w-full">
                  Reactivate Client
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
