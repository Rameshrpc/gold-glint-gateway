import { Bell, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface MobileHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export default function MobileHeader({ title, showSearch = false, onSearchClick }: MobileHeaderProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">Z1</span>
          </div>
          {title ? (
            <h1 className="text-lg font-semibold">{title}</h1>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <p className="text-sm font-semibold line-clamp-1">
                {profile?.full_name || 'User'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              onClick={onSearchClick}
              className="p-2 rounded-full hover:bg-accent active:scale-95 transition-all duration-200"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-full hover:bg-accent active:scale-95 transition-all duration-200"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-full hover:bg-accent active:scale-95 transition-all duration-200"
          >
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
