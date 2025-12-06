import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NavLink } from '@/components/NavLink';
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Wallet,
  Package,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Building,
  UserCog,
  Gavel,
  Bell,
  BarChart3,
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

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', moduleKey: 'dashboard' },
  { title: 'Clients', icon: Building2, href: '/clients', roles: ['super_admin', 'moderator'] },
  { title: 'Users', icon: User, href: '/users', roles: ['super_admin', 'moderator', 'tenant_admin'] },
  { title: 'Branches', icon: Building, href: '/branches', roles: ['super_admin', 'moderator', 'tenant_admin'] },
  { title: 'Customers', icon: Users, href: '/customers', moduleKey: 'customers' },
  { title: 'Loans', icon: FileText, href: '/loans', moduleKey: 'loans' },
  { title: 'Interest', icon: CreditCard, href: '/interest', moduleKey: 'interest' },
  { title: 'Redemption', icon: Wallet, href: '/redemption', moduleKey: 'redemption' },
  { title: 'Agents', icon: UserCog, href: '/agents', moduleKey: 'agents' },
  { title: 'Auction', icon: Gavel, href: '/auction' },
  { title: 'Schemes', icon: Package, href: '/schemes', roles: ['super_admin', 'moderator', 'tenant_admin', 'branch_manager'] },
  { title: 'Reports', icon: BarChart3, href: '/reports', roles: ['super_admin', 'moderator', 'tenant_admin', 'branch_manager', 'auditor'], moduleKey: 'reports' },
  { title: 'Notifications', icon: Bell, href: '/notifications', moduleKey: 'notifications' },
  { title: 'Settings', icon: Settings, href: '/settings', roles: ['super_admin', 'moderator', 'tenant_admin'], moduleKey: 'settings' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, roles, client, branches, currentBranch, setCurrentBranch, signOut, hasRole, isPlatformAdmin } = useAuth();
  const { hasModuleAccess } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredMenuItems = menuItems.filter(item => {
    // Check module access first (if moduleKey is defined)
    if (item.moduleKey && !hasModuleAccess(item.moduleKey)) {
      return false;
    }

    // Then check role-based access
    if (!item.roles) return true;
    if (isPlatformAdmin()) return true;
    return item.roles.some(role => hasRole(role));
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    if (hasRole('super_admin')) return 'Super Admin';
    if (hasRole('moderator')) return 'Moderator';
    if (hasRole('tenant_admin')) return 'Admin';
    if (hasRole('branch_manager')) return 'Manager';
    if (hasRole('loan_officer')) return 'Officer';
    if (hasRole('appraiser')) return 'Appraiser';
    if (hasRole('collection_agent')) return 'Collection';
    if (hasRole('auditor')) return 'Auditor';
    return 'User';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-white flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-amber-600 mr-2" />
          <span className="font-bold text-amber-600">Zenith One</span>
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
        "fixed top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-amber-900 via-amber-800 to-orange-900 text-white transition-transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-amber-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">Zenith One</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Branch Selector */}
        {branches.length > 0 && (
          <div className="px-3 py-3 border-b border-amber-700/50">
            <Select
              value={currentBranch?.id || ''}
              onValueChange={(value) => {
                const branch = branches.find(b => b.id === value);
                setCurrentBranch(branch || null);
              }}
            >
              <SelectTrigger className="bg-white/10 border-amber-700/50 text-white">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 h-[calc(100vh-14rem)]">
          <nav className="p-3 space-y-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-100/80 hover:bg-white/10 hover:text-white transition-colors"
                activeClassName="bg-white/20 text-white font-medium"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-amber-700/50 bg-amber-900/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-white/10 h-auto py-2">
                <Avatar className="h-9 w-9 bg-white/20">
                  <AvatarFallback className="bg-amber-600 text-white text-sm">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-amber-200/70">{getRoleBadge()}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-amber-200/70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  {client && (
                    <p className="text-xs text-muted-foreground mt-1">{client.company_name}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
