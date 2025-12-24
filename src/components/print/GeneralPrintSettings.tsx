import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Loader2 } from 'lucide-react';

export function GeneralPrintSettings() {
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
        <CardTitle>General Print Settings</CardTitle>
        <CardDescription>Configure default print options for all documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Language / மொழி</Label>
            <Select 
              value={settings.language} 
              onValueChange={(val: 'bilingual' | 'english' | 'tamil') => updateSettings({ language: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bilingual">Bilingual (English + Tamil)</SelectItem>
                <SelectItem value="english">English Only</SelectItem>
                <SelectItem value="tamil">Tamil Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Paper Size</Label>
            <Select 
              value={settings.paper_size} 
              onValueChange={(val: 'A4' | 'Legal' | 'Letter') => updateSettings({ paper_size: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select 
              value={settings.font_family} 
              onValueChange={(val) => updateSettings({ font_family: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Noto Sans">Noto Sans</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
