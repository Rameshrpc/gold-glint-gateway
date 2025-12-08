import { Bell, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MobileGradientHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
  variant?: 'default' | 'minimal';
}

export default function MobileGradientHeader({ 
  title, 
  showSearch = false, 
  onSearchClick,
  variant = 'default'
}: MobileGradientHeaderProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="relative">
      {/* Gradient Background with Curve */}
      <div 
        className={cn(
          "gradient-gold relative overflow-hidden",
          variant === 'default' ? "pb-8" : "pb-4"
        )}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-5 -left-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        
        {/* Header Content */}
        <div className="relative z-10 safe-area-top">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="text-white font-semibold text-lg tracking-tight">
                Zenith One
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {showSearch && (
                <button 
                  onClick={onSearchClick}
                  className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center tap-scale"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              )}
              
              <button 
                className="relative w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center tap-scale"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-5 h-5 text-white" />
                {/* Notification Badge */}
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse-ring">
                  3
                </span>
              </button>
              
              <button 
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center tap-scale overflow-hidden border-2 border-white/30"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Greeting Section */}
          {variant === 'default' && (
            <div className="px-4 pt-2 pb-4">
              <p className="text-white/80 text-sm font-medium">
                {getGreeting()},
              </p>
              <h1 className="text-white text-2xl font-bold tracking-tight">
                {title || firstName} 👋
              </h1>
            </div>
          )}

          {/* Title for minimal variant */}
          {variant === 'minimal' && title && (
            <div className="px-4 pb-3">
              <h1 className="text-white text-xl font-bold tracking-tight">
                {title}
              </h1>
            </div>
          )}
        </div>

        {/* Curved Bottom SVG */}
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-6 text-background"
          viewBox="0 0 1440 48" 
          fill="none" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0 48h1440V24C1200 44 960 48 720 48S240 44 0 24v24z" 
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
