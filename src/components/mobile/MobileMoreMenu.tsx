import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  UserCog, 
  Package, 
  Layers, 
  TrendingUp,
  Landmark,
  Heart,
  Shield,
  FileText,
  BookOpen,
  Calculator,
  PiggyBank,
  BarChart3,
  Settings,
  Printer,
  LogOut,
  ChevronRight
} from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileHeader from './MobileHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    title: 'Masters',
    items: [
      { icon: Users, label: 'Customers', path: '/customers' },
      { icon: Building2, label: 'Branches', path: '/branches' },
      { icon: UserCog, label: 'Users', path: '/users' },
      { icon: Package, label: 'Items', path: '/items' },
      { icon: Layers, label: 'Item Groups', path: '/item-groups' },
      { icon: TrendingUp, label: 'Market Rates', path: '/market-rates' },
      { icon: Landmark, label: 'Banks/NBFC', path: '/banks-nbfc' },
      { icon: Heart, label: 'Loyalties', path: '/loyalties' },
      { icon: Shield, label: 'Schemes', path: '/schemes' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: FileText, label: 'Agents', path: '/agents' },
      { icon: BookOpen, label: 'Gold Vault', path: '/gold-vault' },
      { icon: Calculator, label: 'Auction', path: '/auction' },
    ],
  },
  {
    title: 'Accounting',
    items: [
      { icon: PiggyBank, label: 'Chart of Accounts', path: '/accounts' },
      { icon: BookOpen, label: 'Vouchers', path: '/vouchers' },
      { icon: BookOpen, label: 'Day Book', path: '/day-book' },
      { icon: BarChart3, label: 'Trial Balance', path: '/trial-balance' },
      { icon: BarChart3, label: 'Profit & Loss', path: '/profit-loss' },
      { icon: BarChart3, label: 'Balance Sheet', path: '/balance-sheet' },
      { icon: FileText, label: 'Ledger Statement', path: '/ledger-statement' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: Printer, label: 'Print Setup', path: '/print-setup' },
    ],
  },
];

export default function MobileMoreMenu() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <MobileLayout>
      <MobileHeader title="More" />

      <div className="px-4 py-4 space-y-6 animate-fade-in">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {group.items.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 hover:bg-accent active:bg-accent/80 transition-colors animate-fade-in",
                    index !== group.items.length - 1 && "border-b border-border"
                  )}
                  style={{ animationDelay: `${(groupIndex * 50) + (index * 30)}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        {/* Spacer for bottom nav */}
        <div className="h-4" />
      </div>
    </MobileLayout>
  );
}
