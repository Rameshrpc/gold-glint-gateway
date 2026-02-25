import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Send, MessageSquare } from 'lucide-react';

export function WhatsAppSettings() {
  const { client } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [makeWebhookUrl, setMakeWebhookUrl] = useState('');
  const [wasenderApiKey, setWasenderApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    if (client?.id) fetchSettings();
  }, [client?.id]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_notification_settings')
        .select('make_webhook_url, wasender_api_key')
        .eq('client_id', client!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMakeWebhookUrl((data as any).make_webhook_url || '');
        setWasenderApiKey((data as any).wasender_api_key || '');
        setConnectionStatus(
          (data as any).make_webhook_url && (data as any).wasender_api_key ? 'connected' : 'disconnected'
        );
      }
    } catch (err) {
      console.error('Error fetching WhatsApp settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_notification_settings')
        .upsert({
          client_id: client.id,
          make_webhook_url: makeWebhookUrl || null,
          wasender_api_key: wasenderApiKey || null,
        } as any, { onConflict: 'client_id' });

      if (error) throw error;

      setConnectionStatus(makeWebhookUrl && wasenderApiKey ? 'connected' : 'disconnected');
      toast({ title: 'Settings saved', description: 'WhatsApp configuration updated successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!makeWebhookUrl) {
      toast({ title: 'Missing webhook URL', description: 'Enter a Make.com webhook URL first.', variant: 'destructive' });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: true,
          client_id: client?.id,
          message_text: 'Test connection from GLMS',
          phone: '0000000000',
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setConnectionStatus('connected');
        toast({ title: 'Connection successful', description: 'Make.com webhook responded successfully.' });
      } else {
        setConnectionStatus('disconnected');
        toast({ title: 'Connection failed', description: `Webhook returned status ${res.status}`, variant: 'destructive' });
      }
    } catch (err: any) {
      setConnectionStatus('disconnected');
      toast({ title: 'Connection failed', description: err.message, variant: 'destructive' });
    } finally {
      setTesting(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Connect WhatsApp via Wasender + Make.com for two-way messaging
              </CardDescription>
            </div>
            <Badge
              variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
              className={connectionStatus === 'connected' ? 'bg-green-600' : ''}
            >
              {connectionStatus === 'connected' ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
              ) : connectionStatus === 'disconnected' ? (
                <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
              ) : (
                'Unknown'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="make-webhook">Make.com Webhook URL</Label>
            <Input
              id="make-webhook"
              placeholder="https://hook.eu2.make.com/..."
              value={makeWebhookUrl}
              onChange={(e) => setMakeWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The webhook URL from your Make.com outbound scenario
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wasender-key">Wasender API Key</Label>
            <Input
              id="wasender-key"
              type="password"
              placeholder="Enter your Wasender API key..."
              value={wasenderApiKey}
              onChange={(e) => setWasenderApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your Wasender API key — used by Make.com to send messages
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">1. Outbound (Send messages)</p>
            <p>Create a Make.com scenario: Custom Webhook → HTTP POST to Wasender <code className="text-xs bg-muted px-1 rounded">/api/v1/send-text</code></p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">2. Inbound (Receive replies)</p>
            <p>Create a Make.com scenario: Wasender Webhook → HTTP POST to your inbound endpoint</p>
            <code className="block text-xs bg-muted px-2 py-1 rounded mt-1 break-all">
              {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-inbound`}
            </code>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">3. Delivery Status</p>
            <p>Optionally forward delivery receipts to:</p>
            <code className="block text-xs bg-muted px-2 py-1 rounded mt-1 break-all">
              {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-status-update`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
