import {
  LayoutDashboard,
  Eye,
  FileText,
  CreditCard,
  Wallet,
  RefreshCw,
  ArrowRightLeft,
  Users,
  UserCog,
  Gift,
  UserCheck,
  Bell,
  BarChart3,
  Calculator,
  Settings,
  Percent,
  type LucideIcon,
} from 'lucide-react';

export type FeatureFlag = 'loans' | 'sale_agreements' | 'accounting' | 'reports' | 'notifications' | 'gold_vault' | 'agents' | 'customer_portal' | 'approvals';

export interface ModuleDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  enterpriseOnly?: boolean;
  featureFlag?: FeatureFlag;
}

export const MODULES: ModuleDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Main dashboard overview' },
  { key: 'quick_view', label: 'Quick View', icon: Eye, description: 'Quick loan status lookup', featureFlag: 'gold_vault' },
  { key: 'loans', label: 'Loans / Pledges', icon: FileText, description: 'Create and manage loans', featureFlag: 'loans' },
  { key: 'interest', label: 'Interest Payment', icon: CreditCard, description: 'Collect interest payments', featureFlag: 'loans' },
  { key: 'redemption', label: 'Redemption', icon: Wallet, description: 'Close loans and release gold', featureFlag: 'loans' },
  { key: 'repledge', label: 'Re-pledge Module', icon: RefreshCw, description: 'Renew existing loans', featureFlag: 'loans' },
  { key: 'takeover', label: 'Takeover', icon: ArrowRightLeft, description: 'Takeover loans from other lenders', featureFlag: 'loans' },
  { key: 'customers', label: 'Customers 360', icon: Users, description: 'Customer management' },
  { key: 'agents', label: 'Agents', icon: UserCog, description: 'Agent management', featureFlag: 'agents' },
  { key: 'loyalties', label: 'Loyalties', icon: Gift, description: 'Loyalty programs' },
  { key: 'team_board', label: 'Team Board', icon: UserCheck, description: 'Team performance' },
  { key: 'notifications', label: 'Notifications', icon: Bell, description: 'System notifications', featureFlag: 'notifications' },
  { key: 'reports', label: 'Reports', icon: BarChart3, description: 'Analytics and reports', featureFlag: 'reports' },
  { key: 'accounting', label: 'Accounting', icon: Calculator, description: 'Financial accounting', featureFlag: 'accounting' },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'System settings' },
  { key: 'sale_agreements', label: 'Sale Agreements', icon: FileText, description: 'Create and manage sale agreements', featureFlag: 'sale_agreements' },
  { key: 'sale_margin', label: 'Margin Renewal', icon: CreditCard, description: 'Collect margin payments', featureFlag: 'sale_agreements' },
  { key: 'sale_repurchase', label: 'Repurchase', icon: Wallet, description: 'Process agreement buybacks', featureFlag: 'sale_agreements' },
  { key: 'sale_schemes', label: 'Sale Schemes', icon: Percent, description: 'Manage sale agreement schemes', featureFlag: 'sale_agreements' },
];

export const MODULE_KEYS = MODULES.map(m => m.key);

export const getModuleByKey = (key: string): ModuleDefinition | undefined => {
  return MODULES.find(m => m.key === key);
};
