import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Loader2 } from 'lucide-react';

export function DocumentsSettings() {
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
        <CardTitle>Document Defaults</CardTitle>
        <CardDescription>Set default copies and inclusion for each document type</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead className="w-24 text-center">Include</TableHead>
              <TableHead className="w-32 text-center">Copies</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <div>
                  <p className="font-medium">Loan Receipt</p>
                  <p className="text-sm text-muted-foreground">கடன் ரசீது</p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={settings.include_loan_receipt} 
                  onCheckedChange={(checked) => updateSettings({ include_loan_receipt: checked })}
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={settings.loan_receipt_copies}
                  onChange={(e) => updateSettings({ loan_receipt_copies: parseInt(e.target.value) || 1 })}
                  className="w-20 mx-auto text-center"
                />
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell>
                <div>
                  <p className="font-medium">KYC Documents</p>
                  <p className="text-sm text-muted-foreground">கேஒய்சி ஆவணங்கள்</p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={settings.include_kyc_documents} 
                  onCheckedChange={(checked) => updateSettings({ include_kyc_documents: checked })}
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={settings.kyc_documents_copies}
                  onChange={(e) => updateSettings({ kyc_documents_copies: parseInt(e.target.value) || 1 })}
                  className="w-20 mx-auto text-center"
                />
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell>
                <div>
                  <p className="font-medium">Jewel Image</p>
                  <p className="text-sm text-muted-foreground">நகை படம்</p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={settings.include_jewel_image} 
                  onCheckedChange={(checked) => updateSettings({ include_jewel_image: checked })}
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={settings.jewel_image_copies}
                  onChange={(e) => updateSettings({ jewel_image_copies: parseInt(e.target.value) || 1 })}
                  className="w-20 mx-auto text-center"
                />
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell>
                <div>
                  <p className="font-medium">Gold Declaration</p>
                  <p className="text-sm text-muted-foreground">தங்க அறிவிப்பு</p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={settings.include_gold_declaration} 
                  onCheckedChange={(checked) => updateSettings({ include_gold_declaration: checked })}
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={settings.gold_declaration_copies}
                  onChange={(e) => updateSettings({ gold_declaration_copies: parseInt(e.target.value) || 1 })}
                  className="w-20 mx-auto text-center"
                />
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell>
                <div>
                  <p className="font-medium">Terms & Conditions</p>
                  <p className="text-sm text-muted-foreground">விதிமுறைகள்</p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch 
                  checked={settings.include_terms_conditions} 
                  onCheckedChange={(checked) => updateSettings({ include_terms_conditions: checked })}
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={settings.terms_conditions_copies}
                  onChange={(e) => updateSettings({ terms_conditions_copies: parseInt(e.target.value) || 1 })}
                  className="w-20 mx-auto text-center"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
