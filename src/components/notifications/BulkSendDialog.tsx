import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Phone, Users, ChevronRight, Loader2 } from 'lucide-react';
import { openSMS, openWhatsApp, generateMessageFromTemplate, DEFAULT_TEMPLATES, TemplateType } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatIndianCurrency } from '@/lib/interestCalculations';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  loanNumber?: string;
  amount?: number;
  status?: string;
}

interface BulkSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  companyName: string;
}

export function BulkSendDialog({
  open,
  onOpenChange,
  recipients,
  companyName,
}: BulkSendDialogProps) {
  const { client, currentBranch } = useAuth();
  const [templateType, setTemplateType] = useState<TemplateType>('interest_reminder');
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set(recipients.map(r => r.id)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const template = DEFAULT_TEMPLATES[templateType];
  
  const generateMessage = (recipient: Recipient, channel: 'sms' | 'whatsapp') => {
    const baseTemplate = channel === 'whatsapp' ? template.whatsapp : template.sms;
    return generateMessageFromTemplate(baseTemplate, {
      customer_name: recipient.name,
      loan_number: recipient.loanNumber || 'N/A',
      amount: recipient.amount?.toLocaleString('en-IN') || '0',
      company_name: companyName,
      due_date: new Date().toLocaleDateString('en-IN'),
    });
  };

  const toggleRecipient = (id: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecipients(newSelected);
  };

  const toggleAll = () => {
    if (selectedRecipients.size === recipients.length) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(recipients.map(r => r.id)));
    }
  };

  const logNotification = async (recipient: Recipient, channel: 'sms' | 'whatsapp', message: string) => {
    if (!client?.id) return;
    
    try {
      await supabase.from('notification_logs').insert({
        client_id: client.id,
        branch_id: currentBranch?.id || null,
        channel,
        recipient_type: 'customer',
        recipient_id: recipient.id,
        recipient_name: recipient.name,
        recipient_phone: recipient.phone,
        message_content: message,
        entity_type: 'loan',
        status: 'opened',
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  };

  const handleSendNext = async (channel: 'sms' | 'whatsapp') => {
    const selectedList = recipients.filter(r => selectedRecipients.has(r.id));
    if (currentIndex >= selectedList.length) {
      toast.success('All messages sent!');
      onOpenChange(false);
      return;
    }

    const recipient = selectedList[currentIndex];
    const message = generateMessage(recipient, channel);
    
    await logNotification(recipient, channel, message);
    
    if (channel === 'sms') {
      openSMS(recipient.phone, message);
    } else {
      openWhatsApp(recipient.phone, message);
    }

    setCurrentIndex(prev => prev + 1);
    
    if (currentIndex + 1 >= selectedList.length) {
      toast.success('All messages opened!', { description: 'Complete sending in your messaging apps' });
    } else {
      toast.info(`Sent to ${recipient.name}`, { description: `${selectedList.length - currentIndex - 1} remaining` });
    }
  };

  const selectedList = recipients.filter(r => selectedRecipients.has(r.id));
  const currentRecipient = selectedList[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Send Messages
          </DialogTitle>
          <DialogDescription>
            Send messages to {selectedRecipients.size} selected recipients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Select value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interest_reminder">Interest Reminder</SelectItem>
                <SelectItem value="overdue_notice">Overdue Notice</SelectItem>
                <SelectItem value="payment_received">Payment Received</SelectItem>
                <SelectItem value="auction_notice">Auction Notice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Recipients ({selectedRecipients.size}/{recipients.length})</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="h-7 text-xs">
                {selectedRecipients.size === recipients.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-1">
                {recipients.map((recipient, index) => (
                  <div
                    key={recipient.id}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                      currentIndex === index && isSending ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={selectedRecipients.has(recipient.id)}
                      onCheckedChange={() => toggleRecipient(recipient.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">{recipient.phone}</p>
                    </div>
                    {recipient.loanNumber && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {recipient.loanNumber}
                      </Badge>
                    )}
                    {recipient.amount && (
                      <span className="text-xs font-medium shrink-0">
                        {formatIndianCurrency(recipient.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Current Message Preview */}
          {currentRecipient && currentIndex < selectedList.length && (
            <div className="space-y-2">
              <Label>Current Message (for {currentRecipient.name})</Label>
              <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                {generateMessage(currentRecipient, 'whatsapp')}
              </div>
            </div>
          )}

          {/* Progress */}
          {currentIndex > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {currentIndex}/{selectedList.length} sent
              </Badge>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(currentIndex / selectedList.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Send Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleSendNext('sms')}
              disabled={selectedRecipients.size === 0 || currentIndex >= selectedList.length}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              {currentIndex === 0 ? 'Start SMS' : 'Next SMS'}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSendNext('whatsapp')}
              disabled={selectedRecipients.size === 0 || currentIndex >= selectedList.length}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageSquare className="h-4 w-4" />
              {currentIndex === 0 ? 'Start WhatsApp' : 'Next WhatsApp'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Click repeatedly to open each message in your device's native app
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
