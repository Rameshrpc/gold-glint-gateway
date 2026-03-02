import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Send, MessageSquare, Copy, Check } from 'lucide-react';

export function WhatsAppSettings() {
  const { client } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [wahaApiUrl, setWahaApiUrl] = useState('');
  const [wahaApiKey, setWahaApiKey] = useState('');
  const [wahaSessionName, setWahaSessionName] = useState('default');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  useEffect(() => {
    if (client?.id) fetchSettings();
  }, [client?.id]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_notification_settings')
        .select('waha_api_url, waha_api_key, waha_session_name')
        .eq('client_id', client!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWahaApiUrl((data as any).waha_api_url || '');
        setWahaApiKey((data as any).waha_api_key || '');
        setWahaSessionName((data as any).waha_session_name || 'default');
        setConnectionStatus((data as any).waha_api_url ? 'connected' : 'disconnected');
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
          waha_api_url: wahaApiUrl || null,
          waha_api_key: wahaApiKey || null,
          waha_session_name: wahaSessionName || 'default',
        } as any, { onConflict: 'client_id' });

      if (error) throw error;

      setConnectionStatus(wahaApiUrl ? 'connected' : 'disconnected');
      toast({ title: 'Settings saved', description: 'WAHA configuration updated successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!wahaApiUrl) {
      toast({ title: 'Missing WAHA URL', description: 'Enter your WAHA API URL first.', variant: 'destructive' });
      return;
    }
    setTesting(true);
    try {
      const url = wahaApiUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (wahaApiKey) headers['X-Api-Key'] = wahaApiKey;

      const res = await fetch(`${url}/api/sessions/`, { method: 'GET', headers });

      if (res.ok) {
        setConnectionStatus('connected');
        toast({ title: 'Connection successful', description: 'WAHA API is reachable and responding.' });
      } else {
        setConnectionStatus('disconnected');
        toast({ title: 'Connection failed', description: `WAHA returned status ${res.status}`, variant: 'destructive' });
      }
    } catch (err: any) {
      setConnectionStatus('disconnected');
      toast({ title: 'Connection failed', description: err.message, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const inboundUrl = `https://${projectId}.supabase.co/functions/v1/whatsapp-inbound?client_id=${client?.id || ''}`;
  const statusUrl = `https://${projectId}.supabase.co/functions/v1/whatsapp-status-update`;

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
                WhatsApp Integration (WAHA)
              </CardTitle>
              <CardDescription>
                Connect WhatsApp via WAHA (WhatsApp HTTP API) for two-way messaging
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
            <Label htmlFor="waha-url">WAHA API URL</Label>
            <Input
              id="waha-url"
              placeholder="http://your-server:3000"
              value={wahaApiUrl}
              onChange={(e) => setWahaApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The base URL of your self-hosted WAHA instance (e.g. http://localhost:3000)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waha-key">WAHA API Key</Label>
            <Input
              id="waha-key"
              type="password"
              placeholder="Enter your WAHA API key..."
              value={wahaApiKey}
              onChange={(e) => setWahaApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional — set if you configured an API key on your WAHA server
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waha-session">Session Name</Label>
            <Input
              id="waha-session"
              placeholder="default"
              value={wahaSessionName}
              onChange={(e) => setWahaSessionName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              WAHA session name — use "default" unless you run multiple sessions
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
          <CardTitle className="text-base">WAHA Webhook Setup</CardTitle>
          <CardDescription>Configure these webhook URLs in your WAHA session to receive messages and delivery updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground mb-1">1. Inbound Messages (message event)</p>
            <p className="text-muted-foreground mb-2">Set this URL as the webhook for the <code className="text-xs bg-muted px-1 rounded">message</code> event in your WAHA session config:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded break-all">
                {inboundUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(inboundUrl, 'inbound')}
              >
                {copiedField === 'inbound' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">2. Delivery Status (message.ack event)</p>
            <p className="text-muted-foreground mb-2">Set this URL as the webhook for the <code className="text-xs bg-muted px-1 rounded">message.ack</code> event:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded break-all">
                {statusUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(statusUrl, 'status')}
              >
                {copiedField === 'status' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-foreground mb-2">Example WAHA Session Config</p>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{`POST /api/sessions/
{
  "name": "${wahaSessionName || 'default'}",
  "config": {
    "metadata": {
      "client_id": "${client?.id || 'your-client-id'}"
    },
    "webhooks": [
      {
        "url": "${inboundUrl}",
        "events": ["message"]
      },
      {
        "url": "${statusUrl}",
        "events": ["message.ack"]
      }
    ]
  }
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
