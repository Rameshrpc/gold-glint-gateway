import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Loader2 } from 'lucide-react';

export function SaleAgreementSettings() {
  const { settings, loading, updateSettings } = usePrintSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sale Agreement Settings</CardTitle>
        <CardDescription>
          Configure settings specific to Sale Agreement (Trading Format) documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Company Name for Sale Agreements</Label>
          <Input
            value={settings.sale_agreement_company_name || ''}
            onChange={(e) => updateSettings({ 
              sale_agreement_company_name: e.target.value || null 
            })}
            placeholder="e.g., ZAMIN GOLD (leave empty to use main company name)"
          />
          <p className="text-sm text-muted-foreground">
            This name will appear on Sale Agreement documents as the buyer (e.g., "M/s. ZAMIN GOLD"). 
            If left empty, the main company name will be used.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Company Address for Sale Agreements</Label>
          <Input
            value={settings.sale_agreement_company_address || ''}
            onChange={(e) => updateSettings({ 
              sale_agreement_company_address: e.target.value || null 
            })}
            placeholder="Enter the full address for ZAMIN GOLD"
          />
          <p className="text-sm text-muted-foreground">
            This address will appear on Sale Agreement documents. 
            If left empty, the main company address will be used.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
