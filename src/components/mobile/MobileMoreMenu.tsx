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
  LogOut,
  ChevronRight
} from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    title: 'Masters',
    items: [
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
      <MobileSimpleHeader title="Menu" />

      <div className="px-4 py-4 space-y-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {group.items.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 active:bg-muted transition-colors",
                    index !== group.items.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
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
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}
