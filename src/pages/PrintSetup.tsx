import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, FileStack, Building2, Printer } from 'lucide-react';
import { BrandingTab } from '@/components/print/BrandingTab';
import { TemplatesTab } from '@/components/print/TemplatesTab';
import { BranchAssignmentsTab } from '@/components/print/BranchAssignmentsTab';
import { TestPrintTab } from '@/components/print/TestPrintTab';

export default function PrintSetup() {
  const [activeTab, setActiveTab] = useState('branding');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Print Setup</h1>
          <p className="text-muted-foreground">
            Configure receipt templates, branding, and branch-level print settings
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileStack className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="branches" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Branch Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Test Print</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="mt-6">
            <BrandingTab />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplatesTab />
          </TabsContent>

          <TabsContent value="branches" className="mt-6">
            <BranchAssignmentsTab />
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <TestPrintTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
