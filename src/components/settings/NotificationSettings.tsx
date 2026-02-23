import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings2, Save, Loader2, MessageSquare, Phone, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationConfig {
  id: string;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  msg91_auth_key: string | null;
  msg91_sender_id: string | null;
  msg91_dlt_entity_id: string | null;
  whatsapp_template_namespace: string | null;
  daily_sms_limit: number | null;
  monthly_sms_limit: number | null;
  sms_sent_today: number | null;
  sms_sent_this_month: number | null;
  default_send_time: string | null;
}

export function NotificationSettings() {
  const { client } = useAuth();
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [authKey, setAuthKey] = useState('');
  const [senderId, setSenderId] = useState('');
  const [dltEntityId, setDltEntityId] = useState('');
  const [whatsappNamespace, setWhatsappNamespace] = useState('');
  const [dailyLimit, setDailyLimit] = useState('100');
  const [monthlyLimit, setMonthlyLimit] = useState('3000');
  const [defaultSendTime, setDefaultSendTime] = useState('09:00');

  useEffect(() => {
    if (client?.id) fetchConfig();
  }, [client?.id]);

  const fetchConfig = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_notification_settings')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const c = data as NotificationConfig;
        setConfig(c);
        setSmsEnabled(c.sms_enabled || false);
        setWhatsappEnabled(c.whatsapp_enabled || false);
        setAuthKey(c.msg91_auth_key || '');
        setSenderId(c.msg91_sender_id || '');
        setDltEntityId(c.msg91_dlt_entity_id || '');
        setWhatsappNamespace(c.whatsapp_template_namespace || '');
        setDailyLimit((c.daily_sms_limit || 100).toString());
        setMonthlyLimit((c.monthly_sms_limit || 3000).toString());
        setDefaultSendTime(c.default_send_time || '09:00');
      }
    } catch (error) {
      console.error('Error fetching notification config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client?.id) return;
    setSaving(true);
    try {
      const payload = {
        client_id: client.id,
        sms_enabled: smsEnabled,
        whatsapp_enabled: whatsappEnabled,
        msg91_auth_key: authKey || null,
        msg91_sender_id: senderId || null,
        msg91_dlt_entity_id: dltEntityId || null,
        whatsapp_template_namespace: whatsappNamespace || null,
        daily_sms_limit: parseInt(dailyLimit) || 100,
        monthly_sms_limit: parseInt(monthlyLimit) || 3000,
        default_send_time: defaultSendTime || '09:00',
      };

      if (config?.id) {
        const { error } = await supabase
          .from('client_notification_settings')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_notification_settings')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Notification settings saved');
      fetchConfig();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Notification Configuration
          </CardTitle>
          <CardDescription>
            Configure MSG91 API credentials and notification channel settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel Toggles */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Channels</h3>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Send via MSG91 SMS API</p>
                </div>
              </div>
              <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">WhatsApp Notifications</p>
                  <p className="text-sm text-muted-foreground">Send via MSG91 WhatsApp Business API</p>
                </div>
              </div>
              <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
            </div>
          </div>

          <Separator />

          {/* MSG91 Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              MSG91 API Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>MSG91 Auth Key</Label>
                <Input
                  type="password"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="Enter MSG91 auth key"
                />
              </div>
              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="e.g. GOLDLN"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>DLT Entity ID</Label>
                <Input
                  value={dltEntityId}
                  onChange={(e) => setDltEntityId(e.target.value)}
                  placeholder="DLT registration entity ID"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Template Namespace</Label>
                <Input
                  value={whatsappNamespace}
                  onChange={(e) => setWhatsappNamespace(e.target.value)}
                  placeholder="MSG91 WhatsApp namespace"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rate Limits */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Rate Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Daily Message Limit</Label>
                <Input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Message Limit</Label>
                <Input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Send Time (IST)</Label>
                <Input
                  type="time"
                  value={defaultSendTime}
                  onChange={(e) => setDefaultSendTime(e.target.value)}
                />
              </div>
            </div>

            {/* Usage Stats */}
            {config && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Sent Today</p>
                  <p className="text-2xl font-bold">{config.sms_sent_today || 0} / {config.daily_sms_limit || 100}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sent This Month</p>
                  <p className="text-2xl font-bold">{config.sms_sent_this_month || 0} / {config.monthly_sms_limit || 3000}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
