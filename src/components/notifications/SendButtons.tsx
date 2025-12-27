import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSquare, Phone } from 'lucide-react';
import { QuickSendDialog } from './QuickSendDialog';
import { generateMessageFromTemplate, DEFAULT_TEMPLATES, TemplateType, getLoanVariables } from '@/lib/notifications';
import { useAuth } from '@/hooks/useAuth';

interface SendButtonsProps {
  recipient: {
    id?: string;
    name: string;
    phone: string;
  };
  loan?: {
    id: string;
    loan_number: string;
    principal_amount: number;
    interest_rate: number;
    loan_date: string;
    maturity_date: string;
  };
  templateType?: TemplateType;
  customMessage?: string;
  variant?: 'default' | 'compact' | 'icon-only';
  entityType?: string;
  entityId?: string;
  extraVariables?: Record<string, string | number>;
}

export function SendButtons({
  recipient,
  loan,
  templateType = 'interest_reminder',
  customMessage,
  variant = 'default',
  entityType,
  entityId,
  extraVariables = {},
}: SendButtonsProps) {
  const { client } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'whatsapp'>('whatsapp');

  const generateMessage = () => {
    if (customMessage) return customMessage;
    
    const template = DEFAULT_TEMPLATES[templateType];
    const baseTemplate = template?.whatsapp || template?.sms || '';
    
    let variables: Record<string, string | number> = {
      customer_name: recipient.name,
      company_name: client?.company_name || 'Our Company',
      ...extraVariables,
    };

    if (loan) {
      variables = {
        ...variables,
        ...getLoanVariables(
          { ...loan, customer: { full_name: recipient.name, phone: recipient.phone } },
          client?.company_name || 'Our Company'
        ),
      };
    }

    return generateMessageFromTemplate(baseTemplate, variables);
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  if (variant === 'icon-only') {
    return (
      <>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenDialog}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send SMS</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleOpenDialog}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send WhatsApp</TooltipContent>
          </Tooltip>
        </div>
        
        <QuickSendDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          recipient={recipient}
          message={generateMessage()}
          templateType={templateType}
          entityType={entityType || 'loan'}
          entityId={entityId || loan?.id}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleOpenDialog}
          >
            <Phone className="h-3 w-3 mr-1" />
            SMS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleOpenDialog}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            WhatsApp
          </Button>
        </div>
        
        <QuickSendDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          recipient={recipient}
          message={generateMessage()}
          templateType={templateType}
          entityType={entityType || 'loan'}
          entityId={entityId || loan?.id}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
        >
          <Phone className="h-4 w-4 mr-2" />
          SMS
        </Button>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          onClick={handleOpenDialog}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>
      
      <QuickSendDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipient={recipient}
        message={generateMessage()}
        templateType={templateType}
        entityType={entityType || 'loan'}
        entityId={entityId || loan?.id}
      />
    </>
  );
}
