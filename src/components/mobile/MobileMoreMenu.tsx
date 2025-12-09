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
import MobileGradientHeader from './MobileGradientHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    title: 'Masters',
    items: [
      { icon: Users, label: 'Customers', path: '/customers', color: 'from-blue-500 to-blue-600' },
      { icon: Building2, label: 'Branches', path: '/branches', color: 'from-violet-500 to-purple-600' },
      { icon: UserCog, label: 'Users', path: '/users', color: 'from-slate-500 to-slate-600' },
      { icon: Package, label: 'Items', path: '/items', color: 'from-amber-500 to-orange-500' },
      { icon: Layers, label: 'Item Groups', path: '/item-groups', color: 'from-teal-500 to-emerald-500' },
      { icon: TrendingUp, label: 'Market Rates', path: '/market-rates', color: 'from-rose-500 to-pink-500' },
      { icon: Landmark, label: 'Banks/NBFC', path: '/banks-nbfc', color: 'from-cyan-500 to-blue-500' },
      { icon: Heart, label: 'Loyalties', path: '/loyalties', color: 'from-red-500 to-rose-500' },
      { icon: Shield, label: 'Schemes', path: '/schemes', color: 'from-indigo-500 to-violet-500' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: FileText, label: 'Agents', path: '/agents', color: 'from-emerald-500 to-green-500' },
      { icon: BookOpen, label: 'Gold Vault', path: '/gold-vault', color: 'from-yellow-500 to-amber-500' },
      { icon: Calculator, label: 'Auction', path: '/auction', color: 'from-orange-500 to-red-500' },
    ],
  },
  {
    title: 'Accounting',
    items: [
      { icon: PiggyBank, label: 'Chart of Accounts', path: '/accounts', color: 'from-green-500 to-emerald-500' },
      { icon: BookOpen, label: 'Vouchers', path: '/vouchers', color: 'from-blue-500 to-cyan-500' },
      { icon: BookOpen, label: 'Day Book', path: '/day-book', color: 'from-purple-500 to-violet-500' },
      { icon: BarChart3, label: 'Trial Balance', path: '/trial-balance', color: 'from-indigo-500 to-blue-500' },
      { icon: BarChart3, label: 'Profit & Loss', path: '/profit-loss', color: 'from-emerald-500 to-teal-500' },
      { icon: BarChart3, label: 'Balance Sheet', path: '/balance-sheet', color: 'from-sky-500 to-blue-500' },
      { icon: FileText, label: 'Ledger Statement', path: '/ledger-statement', color: 'from-slate-500 to-gray-500' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings', color: 'from-gray-500 to-slate-500' },
      { icon: Printer, label: 'Print Setup', path: '/settings/print', color: 'from-zinc-500 to-gray-500' },
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
      <MobileGradientHeader title="Menu" variant="minimal" />

      <div className="px-4 py-4 space-y-5 animate-fade-in">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title} className="animate-slide-up-fade" style={{ animationDelay: `${groupIndex * 100}ms` }}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-mobile-sm">
              {group.items.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 hover:bg-accent/50 active:bg-accent transition-colors tap-scale",
                    index !== group.items.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm",
                      item.color
                    )}>
                      <item.icon className="w-4 h-4 text-white" />
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
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 tap-scale transition-all animate-slide-up-fade"
          style={{ animationDelay: '400ms' }}
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
