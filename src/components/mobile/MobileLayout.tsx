import { useState, ReactNode } from 'react';
import MobileNavBar from './MobileNavBar';
import QuickActionsSheet from './QuickActionsSheet';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export default function MobileLayout({ children, hideNav = false }: MobileLayoutProps) {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-background ${hideNav ? '' : 'pb-20'}`}>
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
  );
}
