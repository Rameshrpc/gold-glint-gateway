import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutTemplate, GitBranch, Palette, Layers } from 'lucide-react';
import TemplatesGallery from './TemplatesGallery';
import BranchAssignments from './BranchAssignments';
import BrandingManager from './BrandingManager';
import PrintProfilesManager from './PrintProfilesManager';

export default function PrintSetupTab() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Print Setup</CardTitle>
          <CardDescription>
            Configure print templates, profiles, assign them to branches, and customize branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="profiles" className="gap-2">
                <Layers className="h-4 w-4" />
                Print Profiles
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Branch Assignments
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <TemplatesGallery />
            </TabsContent>

            <TabsContent value="profiles">
              <PrintProfilesManager />
            </TabsContent>

            <TabsContent value="assignments">
              <BranchAssignments />
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
