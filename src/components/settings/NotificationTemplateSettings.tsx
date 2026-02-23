import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Phone, Edit2, Save, Plus, Eye, Loader2, Variable } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { generateMessageFromTemplate } from '@/lib/notifications';

interface NotificationTemplate {
  id: string;
  template_code: string;
  template_name: string;
  channel: string;
  template_content: string;
  template_content_whatsapp: string | null;
  channel_type: string | null;
  variables: string[];
  days_before_due: number | null;
  is_active: boolean;
}

const SAMPLE_VARIABLES: Record<string, string> = {
  customer_name: 'Ravi Kumar',
  loan_number: 'GL250101-0001',
  amount_due: '1,500',
  due_date: '15/03/2026',
  total_due: '52,500',
  overdue_days: '15',
  company_name: 'Gold Finance Ltd',
  receipt_number: 'RCP2503150001',
  payment_date: '15/03/2026',
  amount: '50,000',
  interest_rate: '18',
  days: '30',
  auction_date: '15/04/2026',
  company_phone: '9876543210',
};

export function NotificationTemplateSettings() {
  const { client } = useAuth();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSmsContent, setEditSmsContent] = useState('');
  const [editWhatsappContent, setEditWhatsappContent] = useState('');
  const [editChannelType, setEditChannelType] = useState('both');
  const [editDaysBefore, setEditDaysBefore] = useState('');

  useEffect(() => {
    if (client?.id) fetchTemplates();
  }, [client?.id]);

  const fetchTemplates = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('client_id', client.id)
        .order('template_code');

      if (error) throw error;
      setTemplates((data || []) as NotificationTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setEditName(template.template_name);
    setEditSmsContent(template.template_content);
    setEditWhatsappContent(template.template_content_whatsapp || '');
    setEditChannelType(template.channel_type || 'both');
    setEditDaysBefore(template.days_before_due?.toString() || '');
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({
          template_name: editName,
          template_content: editSmsContent,
          template_content_whatsapp: editWhatsappContent || null,
          channel_type: editChannelType,
          days_before_due: editDaysBefore ? parseInt(editDaysBefore) : null,
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;
      toast.success('Template updated');
      setEditDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (template: NotificationTemplate) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t));
      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update template');
    }
  };

  const openPreview = (template: NotificationTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const getChannelBadge = (channelType: string | null) => {
    switch (channelType) {
      case 'sms':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">SMS Only</Badge>;
      case 'whatsapp':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">WhatsApp Only</Badge>;
      default:
        return <Badge variant="secondary">SMS + WhatsApp</Badge>;
    }
  };

  const insertVariable = (variable: string, target: 'sms' | 'whatsapp') => {
    const placeholder = `{{${variable}}}`;
    if (target === 'sms') {
      setEditSmsContent(prev => prev + placeholder);
    } else {
      setEditWhatsappContent(prev => prev + placeholder);
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
            <MessageSquare className="h-5 w-5" />
            Notification Templates
          </CardTitle>
          <CardDescription>
            Manage SMS and WhatsApp message templates for automated and manual notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No templates found. Templates are auto-created when notifications are enabled.
              </p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.template_name}</p>
                      {getChannelBadge(template.channel_type)}
                      {template.days_before_due && (
                        <Badge variant="outline" className="text-xs">
                          {template.days_before_due}d before due
                        </Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="destructive" className="text-xs">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate max-w-lg">
                      {template.template_content.slice(0, 100)}...
                    </p>
                    {template.variables && template.variables.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {template.variables.map((v) => (
                          <Badge key={v} variant="outline" className="text-xs font-mono">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => toggleActive(template)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openPreview(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={editChannelType} onValueChange={setEditChannelType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">SMS + WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editDaysBefore !== undefined && (
              <div className="space-y-2">
                <Label>Days Before Due (for automated reminders)</Label>
                <Input
                  type="number"
                  value={editDaysBefore}
                  onChange={(e) => setEditDaysBefore(e.target.value)}
                  placeholder="e.g. 7"
                />
              </div>
            )}

            {/* Variable chips */}
            {editingTemplate?.variables && editingTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Variable className="h-4 w-4" />
                  Available Variables (click to insert)
                </Label>
                <div className="flex gap-1 flex-wrap">
                  {editingTemplate.variables.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs font-mono"
                      onClick={() => insertVariable(v, editChannelType === 'whatsapp' ? 'whatsapp' : 'sms')}
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Tabs defaultValue="sms">
              <TabsList>
                {editChannelType !== 'whatsapp' && <TabsTrigger value="sms"><Phone className="h-4 w-4 mr-1" /> SMS</TabsTrigger>}
                {editChannelType !== 'sms' && <TabsTrigger value="whatsapp"><MessageSquare className="h-4 w-4 mr-1" /> WhatsApp</TabsTrigger>}
              </TabsList>
              {editChannelType !== 'whatsapp' && (
                <TabsContent value="sms" className="space-y-2">
                  <Label>SMS Content</Label>
                  <Textarea
                    value={editSmsContent}
                    onChange={(e) => setEditSmsContent(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{editSmsContent.length} characters</p>
                </TabsContent>
              )}
              {editChannelType !== 'sms' && (
                <TabsContent value="whatsapp" className="space-y-2">
                  <Label>WhatsApp Content</Label>
                  <Textarea
                    value={editWhatsappContent}
                    onChange={(e) => setEditWhatsappContent(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder="Use *bold* for emphasis in WhatsApp"
                  />
                  <p className="text-xs text-muted-foreground">{editWhatsappContent.length} characters</p>
                </TabsContent>
              )}
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <Tabs defaultValue="sms">
                <TabsList className="w-full">
                  <TabsTrigger value="sms" className="flex-1"><Phone className="h-4 w-4 mr-1" /> SMS</TabsTrigger>
                  <TabsTrigger value="whatsapp" className="flex-1"><MessageSquare className="h-4 w-4 mr-1" /> WhatsApp</TabsTrigger>
                </TabsList>
                <TabsContent value="sms">
                  <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {generateMessageFromTemplate(previewTemplate.template_content, SAMPLE_VARIABLES)}
                  </div>
                </TabsContent>
                <TabsContent value="whatsapp">
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm whitespace-pre-wrap border border-green-200 dark:border-green-800">
                    {generateMessageFromTemplate(
                      previewTemplate.template_content_whatsapp || previewTemplate.template_content,
                      SAMPLE_VARIABLES
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
