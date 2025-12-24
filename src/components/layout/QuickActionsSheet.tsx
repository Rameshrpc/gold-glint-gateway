import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, CreditCard, Wallet, Users, 
  RefreshCw, TrendingUp, Calculator, Settings 
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

interface QuickAction {
  icon: typeof FileText;
  label: string;
  sublabel: string;
  href: string;
  color: string;
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    icon: FileText,
    label: 'New Loan',
    sublabel: 'Create loan',
    href: '/loans?action=new',
    color: 'text-amber-600',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: CreditCard,
    label: 'Interest',
    sublabel: 'Collect payment',
    href: '/interest',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500/20 to-green-500/20',
  },
  {
    icon: Wallet,
    label: 'Redemption',
    sublabel: 'Close loan',
    href: '/redemption',
    color: 'text-blue-600',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Users,
    label: 'Customer',
    sublabel: 'Add new',
    href: '/customers?action=new',
    color: 'text-purple-600',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: RefreshCw,
    label: 'Reloan',
    sublabel: 'Renew loan',
    href: '/reloan',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500/20 to-violet-500/20',
  },
  {
    icon: TrendingUp,
    label: 'Rates',
    sublabel: 'Market rates',
    href: '/market-rates',
    color: 'text-rose-600',
    gradient: 'from-rose-500/20 to-red-500/20',
  },
  {
    icon: Calculator,
    label: 'Day Book',
    sublabel: 'Transactions',
    href: '/day-book',
    color: 'text-teal-600',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
  {
    icon: Settings,
    label: 'Settings',
    sublabel: 'Configure',
    href: '/settings',
    color: 'text-slate-600',
    gradient: 'from-slate-500/20 to-gray-500/20',
  },
];

interface QuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionsSheet({ open, onOpenChange }: QuickActionsSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAction = (action: QuickAction) => {
    triggerHaptic('medium');
    onOpenChange(false);
    
    // Small delay for animation
    setTimeout(() => {
      navigate(action.href);
    }, 150);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-lg font-semibold">
            Quick Actions
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-8 safe-area-inset-bottom">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isActive = location.pathname === action.href.split('?')[0];
              
              return (
                <button
                  key={action.href}
                  onClick={() => handleAction(action)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl",
                    "bg-gradient-to-br",
                    action.gradient,
                    "tap-scale transition-all duration-200",
                    "animate-slide-up-fade",
                    isActive && "ring-2 ring-primary/30"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    "bg-background/80 shadow-sm"
                  )}>
                    <Icon className={cn("h-6 w-6", action.color)} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {action.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {action.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Bottom handle indicator */}
          <div className="mt-6 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
