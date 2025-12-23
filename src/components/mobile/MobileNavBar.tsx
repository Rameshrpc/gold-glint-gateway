import { Home, FileText, Users, Grid3X3, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileNavBarProps {
  onQuickActionClick: () => void;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: FileText, label: 'Loans', path: '/loans' },
  { icon: null, label: 'Actions', path: null }, // FAB placeholder
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Grid3X3, label: 'Menu', path: '/more' },
];

export default function MobileNavBar({ onQuickActionClick }: MobileNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="bg-card border-t border-border">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item, index) => {
            if (index === 2) {
              // FAB button in center
              return (
                <div key="fab" className="relative -mt-4">
                  <button
                    onClick={onQuickActionClick}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
                    aria-label="Quick Actions"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              );
            }

            const Icon = item.icon!;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => item.path && navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[64px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5",
                    active && "stroke-[2.5px]"
                  )} 
                />
                <span className={cn(
                  "text-[11px]",
                  active ? "font-semibold" : "font-medium"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
