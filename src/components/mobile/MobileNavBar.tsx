import { Home, FileText, BarChart3, MoreHorizontal, Plus, Wallet, TrendingUp, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface MobileNavBarProps {
  onQuickActionClick: () => void;
}

const navItems = [
  { icon: Home, iconFilled: Home, label: 'Home', path: '/dashboard' },
  { icon: FileText, iconFilled: FileText, label: 'Loans', path: '/loans' },
  { icon: null, label: 'Actions', path: null }, // FAB placeholder
  { icon: BarChart3, iconFilled: BarChart3, label: 'Reports', path: '/trial-balance' },
  { icon: Menu, iconFilled: Menu, label: 'More', path: '/more' },
];

export default function MobileNavBar({ onQuickActionClick }: MobileNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fabPressed, setFabPressed] = useState(false);

  // Calculate active index based on current path
  useEffect(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    if (index !== -1 && index !== 2) {
      setActiveIndex(index);
    } else if (!['/dashboard', '/loans', '/trial-balance', '/more'].includes(location.pathname)) {
      setActiveIndex(4); // Default to "More" for other pages
    }
  }, [location.pathname]);

  // Calculate pill position based on active index
  const getPillPosition = () => {
    // Account for the FAB taking center position
    const positions = [0, 1, null, 2, 3]; // Skip index 2 for FAB
    const adjustedIndex = positions[activeIndex];
    if (adjustedIndex === null) return 0;
    
    // Each item takes ~20% of width, pill width is about 48px
    // Position calculation: item center - pill half width
    const itemWidth = 100 / 5; // 5 items including FAB space
    const baseOffset = itemWidth / 2;
    
    if (adjustedIndex < 2) {
      return `calc(${adjustedIndex * itemWidth + baseOffset}% - 24px)`;
    } else {
      // Account for FAB space in center
      return `calc(${(adjustedIndex + 1) * itemWidth + baseOffset}% - 24px)`;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 glass-strong border-t border-border/50" />
      
      {/* Pill indicator */}
      <div 
        className="absolute top-1 h-1 w-12 rounded-full bg-gradient-to-r from-[hsl(var(--gradient-primary-start))] to-[hsl(var(--gradient-primary-end))] transition-all duration-300 ease-out"
        style={{ left: getPillPosition() }}
      />
      
      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          if (index === 2) {
            // FAB button
            return (
              <div key="fab" className="relative -mt-6">
                {/* Glow effect */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full gradient-gold blur-lg transition-opacity duration-300",
                    fabPressed ? "opacity-60" : "opacity-30"
                  )} 
                />
                
                <button
                  onClick={() => {
                    setFabPressed(true);
                    setTimeout(() => setFabPressed(false), 150);
                    onQuickActionClick();
                  }}
                  className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-full gradient-gold shadow-lg transition-all duration-200",
                    fabPressed ? "scale-90" : "scale-100 hover:scale-105"
                  )}
                >
                  <Plus className={cn(
                    "w-7 h-7 text-white transition-transform duration-200",
                    fabPressed && "rotate-45"
                  )} />
                </button>
                
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                  Actions
                </span>
              </div>
            );
          }

          const isActive = activeIndex === index;
          const Icon = item.icon!;

          return (
            <button
              key={item.path}
              onClick={() => item.path && navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 tap-scale min-w-[56px]",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative transition-all duration-200",
                isActive && "animate-icon-pop"
              )}>
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive && "stroke-[2.5px]"
                  )} 
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.1 : 0}
                />
              </div>
              
              <span className={cn(
                "text-[10px] transition-all duration-200",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
