import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Building2, LayoutDashboard, Users, FileText, CreditCard, Wallet, Package, 
  Settings, X, ChevronDown, ChevronRight, LogOut, User, Building, UserCog, 
  Gavel, Bell, BarChart3, Calculator, MessageCircle, Send, RefreshCw, Layers,
  Landmark, Gift, Vault, Receipt, Coins, Database, TrendingUp, Menu, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

type AppRole = 'super_admin' | 'moderator' | 'tenant_admin' | 'branch_manager' | 'loan_officer' | 'appraiser' | 'collection_agent' | 'auditor';

interface MenuItem {
  title: string;
  icon: typeof LayoutDashboard;
  href: string;
  roles?: AppRole[];
  moduleKey?: string;
}

interface MenuGroup {
  title: string;
  icon: typeof LayoutDashboard;
  items: MenuItem[];
  roles?: AppRole[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }
    ]
  },
  {
    title: 'Administration',
    icon: Building2,
    roles: ['super_admin', 'moderator', 'tenant_admin'],
    items: [
      { title: 'Clients', icon: Building2, href: '/clients', roles: ['super_admin', 'moderator'] },
      { title: 'Users', icon: User, href: '/users', roles: ['super_admin', 'moderator', 'tenant_admin'] },
      { title: 'Branches', icon: Building, href: '/branches', roles: ['super_admin', 'moderator', 'tenant_admin'] },
    ]
  },
  {
    title: 'Masters',
    icon: Package,
    items: [
      { title: 'Customers', icon: Users, href: '/customers', moduleKey: 'customers' },
      { title: 'Schemes', icon: FileText, href: '/schemes', roles: ['super_admin', 'moderator', 'tenant_admin', 'branch_manager'] },
      { title: 'Market Rates', icon: TrendingUp, href: '/market-rates', roles: ['super_admin', 'moderator', 'tenant_admin', 'branch_manager'] },
      { title: 'Agents', icon: UserCog, href: '/agents', moduleKey: 'agents' },
      { title: 'Items', icon: Package, href: '/items' },
      { title: 'Item Groups', icon: Layers, href: '/item-groups' },
      { title: 'Bank/NBFC', icon: Landmark, href: '/banks-nbfc', roles: ['super_admin', 'moderator', 'tenant_admin'] },
      { title: 'Loyalties', icon: Gift, href: '/loyalties', roles: ['super_admin', 'moderator', 'tenant_admin'] },
    ]
  },
  {
    title: 'Operations',
    icon: Wallet,
    items: [
      { title: 'Loans', icon: FileText, href: '/loans', moduleKey: 'loans' },
      { title: 'Interest', icon: CreditCard, href: '/interest', moduleKey: 'interest' },
      { title: 'Redemption', icon: Wallet, href: '/redemption', moduleKey: 'redemption' },
      { title: 'Reloan', icon: RefreshCw, href: '/reloan' },
      { title: 'Auction', icon: Gavel, href: '/auction' },
      { title: 'Gold Vault', icon: Vault, href: '/gold-vault' },
      { title: 'Approvals', icon: Bell, href: '/approvals' },
    ]
  },
  {
    title: 'Sale Agreements',
    icon: Receipt,
    items: [
      { title: 'Agreements', icon: FileText, href: '/sale-agreements' },
      { title: 'Margin Renewal', icon: CreditCard, href: '/sale-margin-renewal' },
      { title: 'Repurchase', icon: Wallet, href: '/sale-repurchase' },
      { title: 'Sale Schemes', icon: Coins, href: '/sale-schemes', roles: ['super_admin', 'moderator', 'tenant_admin'] },
    ]
  },
  {
    title: 'Accounting',
    icon: Calculator,
    items: [
      { title: 'Chart of Accounts', icon: Calculator, href: '/accounts' },
      { title: 'Day Book', icon: FileText, href: '/day-book' },
      { title: 'Ledger Statement', icon: FileText, href: '/ledger-statement' },
      { title: 'Trial Balance', icon: BarChart3, href: '/trial-balance' },
      { title: 'Profit & Loss', icon: BarChart3, href: '/profit-loss' },
      { title: 'Balance Sheet', icon: BarChart3, href: '/balance-sheet' },
      { title: 'Vouchers', icon: Receipt, href: '/vouchers' },
      { title: 'Agent Commissions', icon: Coins, href: '/agent-commissions' },
      { title: 'Commission Reports', icon: BarChart3, href: '/commission-reports' },
    ]
  },
  {
    title: 'Reports & Comms',
    icon: BarChart3,
    items: [
      { title: 'MIS Reports', icon: BarChart3, href: '/mis-reports', roles: ['super_admin', 'moderator', 'tenant_admin', 'branch_manager', 'auditor'], moduleKey: 'reports' },
      { title: 'Activity Log', icon: Activity, href: '/activity-log', roles: ['tenant_admin'] },
      { title: 'Audit Logs', icon: Database, href: '/audit-logs', roles: ['super_admin', 'moderator', 'tenant_admin', 'auditor'] },
      { title: 'Notifications', icon: Bell, href: '/notifications', moduleKey: 'notifications' },
      { title: 'WhatsApp', icon: MessageCircle, href: '/whatsapp' },
      { title: 'SMS', icon: Send, href: '/sms' },
    ]
  },
  {
    title: 'Configuration',
    icon: Settings,
    roles: ['super_admin', 'moderator', 'tenant_admin', 'branch_manager'],
    items: [
      { title: 'Settings', icon: Settings, href: '/settings', roles: ['super_admin', 'moderator', 'tenant_admin'], moduleKey: 'settings' },
      { title: 'Backfill Vouchers', icon: Database, href: '/backfill-vouchers', roles: ['super_admin', 'moderator', 'tenant_admin'] },
    ]
  }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    profile,
    roles,
    client,
    branches,
    currentBranch,
    setCurrentBranch,
    signOut,
    hasRole,
    isPlatformAdmin
  } = useAuth();
  const { hasModuleAccess } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Dashboard', 'Operations']);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  // Loan-specific menu items that should be hidden when loans not supported
  const loanOnlyItems = ['/loans', '/interest', '/redemption', '/reloan', '/auction'];

  const filterMenuItem = (item: MenuItem) => {
    if (item.moduleKey && !hasModuleAccess(item.moduleKey)) {
      return false;
    }
    // Hide loan-specific items if loans not supported
    if (loanOnlyItems.includes(item.href) && client && !client.supports_loans) {
      return false;
    }
    if (!item.roles) return true;
    if (isPlatformAdmin()) return true;
    return item.roles.some(role => hasRole(role));
  };

  const filterMenuGroup = (group: MenuGroup) => {
    // Feature flag checks for entire menu groups
    // Show Operations if either loans OR sale agreements is enabled (for Gold Vault access)
    if (group.title === 'Operations') {
      if (client && !client.supports_loans && !client.supports_sale_agreements) {
        return false;
      }
    }
    if (group.title === 'Sale Agreements' && client && !client.supports_sale_agreements) {
      return false;
    }
    
    // Role-based checks
    if (group.roles) {
      if (!isPlatformAdmin() && !group.roles.some(role => hasRole(role))) {
        return false;
      }
    }
    const filteredItems = group.items.filter(filterMenuItem);
    return filteredItems.length > 0;
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => location.pathname === item.href);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = () => {
    if (hasRole('super_admin')) return { label: 'Super Admin', color: 'text-red-400' };
    if (hasRole('moderator')) return { label: 'Moderator', color: 'text-orange-400' };
    if (hasRole('tenant_admin')) return { label: 'Admin', color: 'text-amber-300' };
    if (hasRole('branch_manager')) return { label: 'Manager', color: 'text-green-400' };
    if (hasRole('loan_officer')) return { label: 'Officer', color: 'text-blue-400' };
    if (hasRole('appraiser')) return { label: 'Appraiser', color: 'text-purple-400' };
    if (hasRole('collection_agent')) return { label: 'Collection', color: 'text-cyan-400' };
    if (hasRole('auditor')) return { label: 'Auditor', color: 'text-gray-400' };
    // No roles assigned - this is a problem
    if (roles.length === 0) return { label: '⚠️ No Role', color: 'text-red-500' };
    return { label: 'User', color: 'text-amber-200/70' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b flex items-center px-4 justify-between">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Branch Selector */}
        {branches.length > 0 && (
          <Select 
            value={currentBranch?.id || ''} 
            onValueChange={value => {
              const branch = branches.find(b => b.id === value);
              setCurrentBranch(branch || null);
            }}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* User Avatar */}
          <Avatar className="h-9 w-9 cursor-pointer" onClick={() => navigate('/profile')}>
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 transition-transform lg:translate-x-0",
        "bg-gradient-to-b from-amber-900 via-amber-800 to-orange-900 text-white",
        "dark:from-[hsl(222,47%,8%)] dark:via-[hsl(222,40%,10%)] dark:to-[hsl(222,35%,12%)] dark:text-amber-50",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-amber-700/50 dark:border-amber-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white dark:text-amber-400" />
            </div>
            <span className="font-bold text-lg text-white dark:text-amber-50">Zenith One</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-white hover:bg-white/10 dark:hover:bg-amber-500/10" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Branch Selector */}
        {branches.length > 0 && (
          <div className="px-3 py-3 border-b border-amber-700/50 dark:border-amber-900/50">
            <Select 
              value={currentBranch?.id || ''} 
              onValueChange={value => {
                const branch = branches.find(b => b.id === value);
                setCurrentBranch(branch || null);
              }}
            >
              <SelectTrigger className="bg-white/10 dark:bg-amber-500/10 border-amber-700/50 dark:border-amber-800/50 text-white dark:text-amber-50">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation with Collapsible Groups */}
        <ScrollArea className="flex-1 h-[calc(100vh-14rem)]">
          <nav className="p-3 space-y-1">
            {menuGroups.filter(filterMenuGroup).map(group => {
              const filteredItems = group.items.filter(filterMenuItem);
              const isOpen = openGroups.includes(group.title) || isGroupActive(group);
              
              // For Dashboard, render as single item without collapsible
              if (group.title === 'Dashboard') {
                return (
                  <NavLink 
                    key={group.title}
                    to="/dashboard" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-100/80 dark:text-amber-200/70 hover:bg-white/10 dark:hover:bg-amber-500/10 hover:text-white dark:hover:text-amber-50 transition-colors"
                    activeClassName="bg-white/20 dark:bg-amber-500/20 text-white dark:text-amber-50 font-medium"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </NavLink>
                );
              }

              return (
                <Collapsible 
                  key={group.title} 
                  open={isOpen}
                  onOpenChange={() => toggleGroup(group.title)}
                >
                  <CollapsibleTrigger className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-amber-100/80 dark:text-amber-200/70 hover:bg-white/10 dark:hover:bg-amber-500/10 hover:text-white dark:hover:text-amber-50 transition-colors">
                    <group.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{group.title}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-90"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1 space-y-1">
                    {filteredItems.map(item => (
                      <NavLink 
                        key={item.href}
                        to={item.href} 
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-amber-100/70 dark:text-amber-200/60 hover:bg-white/10 dark:hover:bg-amber-500/10 hover:text-white dark:hover:text-amber-50 transition-colors text-sm"
                        activeClassName="bg-white/15 dark:bg-amber-500/15 text-white dark:text-amber-50 font-medium"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-amber-700/50 dark:border-amber-900/50 bg-amber-900/50 dark:bg-black/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-white dark:text-amber-50 hover:bg-white/10 dark:hover:bg-amber-500/10 h-auto py-2"
              >
                <Avatar className="h-9 w-9 bg-white/20 dark:bg-amber-500/20">
                  <AvatarFallback className="bg-amber-600 dark:bg-amber-700 text-white text-sm">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate text-white dark:text-amber-50">{profile?.full_name || 'User'}</p>
                  <p className={`text-xs ${roleBadge.color}`}>{roleBadge.label}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-amber-200/70 dark:text-amber-400/70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  {client && <p className="text-xs text-muted-foreground mt-1">{client.company_name}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        {/* Desktop Header - Theme Toggle */}
        <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-3">
          <ThemeToggle />
        </div>

        {/* No Role Warning Banner */}
        {roles.length === 0 && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
            <p className="text-sm text-destructive text-center">
              ⚠️ Your account has no roles assigned. Please contact an administrator to get proper access.
            </p>
          </div>
        )}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
