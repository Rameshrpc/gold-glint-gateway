import { Building2, Bell, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  onMenuClick: () => void;
  branchName?: string;
  userName?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export function MobileHeader({
  onMenuClick,
  branchName = 'Select Branch',
  userName = 'User',
  notificationCount = 0,
  onNotificationClick,
  onProfileClick,
}: MobileHeaderProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 safe-area-top">
      {/* Glassmorphic background */}
      <div className="glass-strong shadow-mobile-md">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Logo & Brand */}
          <button 
            onClick={onMenuClick}
            className="flex items-center gap-2 tap-scale"
          >
            <div className="w-9 h-9 gradient-gold rounded-xl flex items-center justify-center shadow-glow">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-sm text-foreground leading-tight">Zenith One</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Gold Finance</span>
            </div>
          </button>

          {/* Center: Branch Selector */}
          <button 
            onClick={onMenuClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 tap-scale"
          >
            <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
              {branchName}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button 
              onClick={onNotificationClick}
              className="relative p-2 rounded-full bg-secondary/50 tap-scale"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {notificationCount > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
                  "flex items-center justify-center",
                  "text-[10px] font-bold text-white",
                  "bg-status-error rounded-full",
                  "animate-bounce-in"
                )}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <button 
              onClick={onProfileClick}
              className="tap-scale"
            >
              <Avatar className="h-9 w-9 ring-2 ring-offset-1 ring-amber-500/30">
                <AvatarFallback className="gradient-gold text-white text-xs font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
