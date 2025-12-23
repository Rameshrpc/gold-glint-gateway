import { useState, ReactNode } from 'react';
import MobileNavBar from './MobileNavBar';
import QuickActionsSheet from './QuickActionsSheet';
import OfflineIndicator from './OfflineIndicator';
import { MobileErrorBoundary } from './MobileErrorBoundary';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  className?: string;
}

export default function MobileLayout({ children, hideNav = false, className }: MobileLayoutProps) {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <MobileErrorBoundary>
      <div className={cn(
        "min-h-screen bg-background",
        !hideNav && "pb-20",
        className
      )}>
        <OfflineIndicator />
        {children}
        
        {!hideNav && (
          <>
            <MobileNavBar onQuickActionClick={() => setIsQuickActionsOpen(true)} />
            <QuickActionsSheet 
              isOpen={isQuickActionsOpen} 
              onClose={() => setIsQuickActionsOpen(false)} 
            />
          </>
        )}
      </div>
    </MobileErrorBoundary>
  );
}
