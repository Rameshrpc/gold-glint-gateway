import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, LayoutTemplate, Palette } from 'lucide-react';
import TemplatesGallery from './TemplatesGallery';
import BrandingManager from './BrandingManager';
import PrintProfilesManager from './PrintProfilesManager';

export default function PrintSetupTab() {
  const [activeTab, setActiveTab] = useState('profiles');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Print Setup</CardTitle>
          <CardDescription>
            Configure print sets, view templates, and customize branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="profiles" className="gap-2">
                <Layers className="h-4 w-4" />
                Print Sets
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profiles">
              <PrintProfilesManager />
            </TabsContent>

            <TabsContent value="templates">
              <TemplatesGallery />
            </TabsContent>

            <TabsContent value="branding">
              <BrandingManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
