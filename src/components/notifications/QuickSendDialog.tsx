import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Edit2, Check, User } from 'lucide-react';
import { openSMS, openWhatsApp } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface QuickSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: {
    id?: string;
    name: string;
    phone: string;
  };
  message: string;
  templateType?: string;
  entityType?: string;
  entityId?: string;
}

export function QuickSendDialog({
  open,
  onOpenChange,
  recipient,
  message: initialMessage,
  templateType,
  entityType,
  entityId,
}: QuickSendDialogProps) {
  const { client, currentBranch } = useAuth();
  const [message, setMessage] = useState(initialMessage);
  const [isEditing, setIsEditing] = useState(false);

  const logNotification = async (channel: 'sms' | 'whatsapp') => {
    if (!client?.id) return;
    
    try {
      await supabase.from('notification_logs').insert({
        client_id: client.id,
        branch_id: currentBranch?.id || null,
        channel,
        recipient_type: 'customer',
        recipient_id: recipient.id || null,
        recipient_name: recipient.name,
        recipient_phone: recipient.phone,
        message_content: message,
        entity_type: entityType || null,
        entity_id: entityId || null,
        status: 'opened', // We can only track that the native app was opened
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  };

  const handleSendSMS = async () => {
    await logNotification('sms');
    openSMS(recipient.phone, message);
    toast.success('SMS app opened', { description: 'Complete sending in your messaging app' });
    onOpenChange(false);
  };

  const handleSendWhatsApp = async () => {
    await logNotification('whatsapp');
    openWhatsApp(recipient.phone, message);
    toast.success('WhatsApp opened', { description: 'Complete sending in WhatsApp' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message
          </DialogTitle>
          <DialogDescription>
            Choose SMS or WhatsApp to send the message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{recipient.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {recipient.phone}
              </p>
            </div>
            {templateType && (
              <Badge variant="secondary" className="text-xs">
                {templateType.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>

          {/* Message Preview/Edit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-7 text-xs"
              >
                {isEditing ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Done
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </>
                )}
              </Button>
            </div>
            
            {isEditing ? (
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
            ) : (
              <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                {message}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {message.length} characters
            </p>
          </div>

          {/* Send Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleSendSMS}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Send SMS
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This will open your device's native app to complete sending
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
