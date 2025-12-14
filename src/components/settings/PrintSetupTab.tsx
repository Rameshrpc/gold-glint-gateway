import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Palette, GitBranch } from 'lucide-react';
import { TemplatesManager } from './TemplatesManager';
import { BrandingManager } from './BrandingManager';
import { TemplateAssignments } from './TemplateAssignments';
import { usePrintSettings } from '@/hooks/usePrintSettings';

export function PrintSetupTab() {
  const [activeTab, setActiveTab] = useState('templates');
  const printSettings = usePrintSettings();

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <TemplatesManager {...printSettings} />
        </TabsContent>

        <TabsContent value="branding" className="mt-4">
          <BrandingManager {...printSettings} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <TemplateAssignments {...printSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
