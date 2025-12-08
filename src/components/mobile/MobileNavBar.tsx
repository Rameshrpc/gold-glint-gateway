import { Home, FileText, BarChart3, MoreHorizontal, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileNavBarProps {
  onQuickActionClick: () => void;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: FileText, label: 'Loans', path: '/loans' },
  { icon: null, label: 'Actions', path: null }, // FAB placeholder
  { icon: BarChart3, label: 'Reports', path: '/trial-balance' },
  { icon: MoreHorizontal, label: 'More', path: '/more' },
];

export default function MobileNavBar({ onQuickActionClick }: MobileNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          if (index === 2) {
            // FAB button
            return (
              <button
                key="fab"
                onClick={onQuickActionClick}
                className="relative -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform duration-200"
              >
                <Plus className="w-6 h-6" />
                <span className="absolute -bottom-5 text-[10px] font-medium text-muted-foreground">
                  Actions
                </span>
              </button>
            );
          }

          const isActive = location.pathname === item.path || 
            (item.path === '/more' && !['/dashboard', '/loans', '/trial-balance'].includes(location.pathname));
          const Icon = item.icon!;

          return (
            <button
              key={item.path}
              onClick={() => item.path && navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:bg-accent"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary animate-scale-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
