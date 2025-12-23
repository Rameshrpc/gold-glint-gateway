import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, Lock, Bell, Printer, Moon, Sun, LogOut, ChevronRight, 
  Building2, Users, Shield, HelpCircle 
} from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface SettingItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  path?: string;
  action?: () => void;
  danger?: boolean;
  value?: React.ReactNode;
}

export default function MobileSettings() {
  const navigate = useNavigate();
  const { profile, client, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: 'Edit your personal information',
          path: '/profile',
        },
        {
          icon: Lock,
          label: 'Security',
          description: 'Change password',
          path: '/profile',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: isDark ? Sun : Moon,
          label: 'Theme',
          description: isDark ? 'Dark mode' : 'Light mode',
          action: toggleTheme,
          value: (
            <div className={cn(
              "w-12 h-7 rounded-full p-1 transition-colors",
              isDark ? "bg-primary" : "bg-muted"
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full bg-white shadow transition-transform",
                isDark ? "translate-x-5" : "translate-x-0"
              )} />
            </div>
          ),
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage alerts and reminders',
          path: '/notifications',
        },
        {
          icon: Printer,
          label: 'Print Setup',
          description: 'Configure print templates',
          path: '/settings',
        },
      ],
    },
    {
      title: 'Organization',
      items: [
        {
          icon: Building2,
          label: 'Company',
          description: client?.company_name,
        },
        {
          icon: Users,
          label: 'Users',
          description: 'Manage team members',
          path: '/users',
        },
        {
          icon: Shield,
          label: 'Permissions',
          description: 'User rights & access',
          path: '/settings',
        },
      ],
    },
    {
      title: '',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Support',
          description: 'Get help with the app',
        },
        {
          icon: LogOut,
          label: 'Logout',
          description: 'Sign out of your account',
          action: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <MobileLayout hideNav>
      <MobileSimpleHeader title="Settings" showBack />

      <div className="px-4 py-4 space-y-6 animate-fade-in">
        {/* User Card */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{profile?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-full bg-muted tap-scale"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            {section.title && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {section.title}
              </h3>
            )}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => {
                    if (item.action) item.action();
                    else if (item.path) navigate(item.path);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors tap-scale",
                    itemIndex !== section.items.length - 1 && "border-b border-border",
                    item.danger ? "hover:bg-destructive/5" : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    item.danger ? "bg-destructive/10 text-destructive" : "bg-muted"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      item.danger && "text-destructive"
                    )}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  {item.value ? (
                    item.value
                  ) : (item.path || item.action) && !item.danger ? (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          Version 1.0.0
        </p>

        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}
