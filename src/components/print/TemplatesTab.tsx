import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, FileText, Receipt, Gavel, Undo2 } from 'lucide-react';
import { useTemplatesByType, PrintTemplate } from '@/hooks/usePrintTemplates';
import { usePrintSettings, useSavePrintSettings } from '@/hooks/usePrintSettings';
import { cn } from '@/lib/utils';

const receiptTypes = [
  { key: 'loan', label: 'Loan Disbursement', icon: FileText },
  { key: 'interest', label: 'Interest Receipt', icon: Receipt },
  { key: 'redemption', label: 'Redemption', icon: Undo2 },
  { key: 'auction', label: 'Auction Notice', icon: Gavel },
];

const languageColors: Record<string, string> = {
  english: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  tamil: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  bilingual: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const paperSizeLabels: Record<string, string> = {
  a4: 'A4',
  a5: 'A5',
  thermal_80: '80mm',
  thermal_58: '58mm',
};

interface TemplateCardProps {
  template: PrintTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{template.template_name}</h4>
            <p className="text-xs text-muted-foreground capitalize">
              {template.layout_style} Style
            </p>
          </div>
          {isSelected && (
            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Template Preview */}
        <div className="bg-muted/50 rounded-lg p-3 mb-3 aspect-[3/4] flex flex-col items-center justify-center border">
          <div className="w-full max-w-[80%] space-y-1">
            <div className="h-2 bg-muted-foreground/20 rounded w-1/2 mx-auto" />
            <div className="h-1.5 bg-muted-foreground/20 rounded w-3/4 mx-auto" />
            <div className="h-px bg-muted-foreground/10 my-2" />
            <div className="space-y-0.5">
              <div className="h-1 bg-muted-foreground/15 rounded w-full" />
              <div className="h-1 bg-muted-foreground/15 rounded w-5/6" />
              <div className="h-1 bg-muted-foreground/15 rounded w-4/6" />
            </div>
            {template.language === 'bilingual' && (
              <div className="mt-2 space-y-0.5">
                <div className="h-1 bg-purple-500/20 rounded w-full" />
                <div className="h-1 bg-purple-500/20 rounded w-5/6" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={languageColors[template.language]}>
            {template.language === 'bilingual' ? 'EN + தமிழ்' : 
             template.language === 'tamil' ? 'தமிழ்' : 'English'}
          </Badge>
          <Badge variant="outline" className="bg-muted">
            {paperSizeLabels[template.paper_size] || template.paper_size}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplatesTab() {
  const [activeType, setActiveType] = useState('loan');
  const { loanTemplates, interestTemplates, redemptionTemplates, auctionTemplates, isLoading } = useTemplatesByType();
  const { data: settings } = usePrintSettings();
  const saveMutation = useSavePrintSettings();

  const getTemplatesForType = (type: string): PrintTemplate[] => {
    switch (type) {
      case 'loan': return loanTemplates;
      case 'interest': return interestTemplates;
      case 'redemption': return redemptionTemplates;
      case 'auction': return auctionTemplates;
      default: return [];
    }
  };

  const getSelectedTemplateId = (type: string) => {
    const setting = settings?.find(s => s.receipt_type === type);
    return setting?.template_id;
  };

  const handleSelectTemplate = (templateId: string, receiptType: string) => {
    saveMutation.mutate({
      receipt_type: receiptType,
      template_id: templateId,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList className="grid w-full grid-cols-4">
          {receiptTypes.map(type => (
            <TabsTrigger key={type.key} value={type.key} className="flex items-center gap-2">
              <type.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{type.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {receiptTypes.map(type => (
          <TabsContent key={type.key} value={type.key}>
            <Card>
              <CardHeader>
                <CardTitle>{type.label} Templates</CardTitle>
                <CardDescription>
                  Select a template for {type.label.toLowerCase()} receipts. 
                  Bilingual templates show both English and Tamil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {getTemplatesForType(type.key).map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={getSelectedTemplateId(type.key) === template.id}
                      onSelect={() => handleSelectTemplate(template.id, type.key)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
