import { cn } from '@/lib/utils';
import { 
  Users, 
  Building2, 
  Settings2, 
  FileText, 
  Printer, 
  Type, 
  FileEdit, 
  Image, 
  LayoutTemplate,
  GitBranch,
  ChevronDown,
  ChevronRight,
  FileStack,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

export type SettingsSection = 
  | 'user-rights' 
  | 'client-rights' 
  | 'approval-workflows'
  | 'print-loan-docs'
  | 'print-general' 
  | 'print-documents' 
  | 'print-terms' 
  | 'print-content' 
  | 'print-header-footer' 
  | 'print-templates' 
  | 'print-branches'
  | 'print-bill-of-sale';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  showClientRights: boolean;
}

interface MenuItem {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
  defaultOpen?: boolean;
}

export function SettingsSidebar({ activeSection, onSectionChange, showClientRights }: SettingsSidebarProps) {
  const [configOpen, setConfigOpen] = useState(true);
  const [printOpen, setPrintOpen] = useState(true);

  const configItems: MenuItem[] = [
    { id: 'user-rights', label: 'User Rights', icon: Users },
    ...(showClientRights ? [{ id: 'client-rights' as const, label: 'Client Rights', icon: Building2 }] : []),
    { id: 'approval-workflows', label: 'Approval Workflows', icon: ShieldCheck },
  ];

  const printItems: MenuItem[] = [
    { id: 'print-loan-docs', label: 'Loan Documents', icon: FileStack },
    { id: 'print-general', label: 'General', icon: Settings2 },
    { id: 'print-documents', label: 'Documents', icon: FileText },
    { id: 'print-bill-of-sale', label: 'Bill of Sale', icon: Scale },
    { id: 'print-terms', label: 'Terms & Conditions', icon: FileEdit },
    { id: 'print-content', label: 'Editable Content', icon: Type },
    { id: 'print-header-footer', label: 'Header & Footer', icon: Image },
    { id: 'print-templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'print-branches', label: 'Branch Settings', icon: GitBranch },
  ];

  const isConfigSection = (section: SettingsSection) => 
    section === 'user-rights' || section === 'client-rights' || section === 'approval-workflows';
  
  const isPrintSection = (section: SettingsSection) => 
    section.startsWith('print-');

  return (
    <div className="w-64 shrink-0 border-r bg-muted/30">
      <div className="p-4 space-y-2">
        {/* Configuration Section */}
        <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Configuration
            </div>
            {configOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1 pl-2">
            {configItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Print Setup Section */}
        <Collapsible open={printOpen} onOpenChange={setPrintOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Setup
            </div>
            {printOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1 pl-2">
            {printItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
