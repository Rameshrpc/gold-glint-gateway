import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface CustomerPortalLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export function CustomerPortalLayout({ children, title, showBackButton }: CustomerPortalLayoutProps) {
  const { session, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/customer-portal');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="mr-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-lg font-semibold truncate">
                {title || 'Customer Portal'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {session && (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">{session.customerName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 pb-20">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sm:hidden">
        <div className="flex items-center justify-around h-16">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-full rounded-none flex-1"
            onClick={() => navigate('/customer-portal/dashboard')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-xs">Home</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-full rounded-none flex-1"
            onClick={() => navigate('/customer-portal/loans')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            <span className="text-xs">Loans</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-full rounded-none flex-1"
            onClick={() => navigate('/customer-portal/payments')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
              <path d="M2 9v1c0 1.1.9 2 2 2h1" />
              <path d="M16 11h0" />
            </svg>
            <span className="text-xs">Payments</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-full rounded-none flex-1"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
