import { useState, ReactNode } from 'react';
import MobileNavBar from './MobileNavBar';
import QuickActionsSheet from './QuickActionsSheet';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      
      <MobileNavBar onQuickActionClick={() => setIsQuickActionsOpen(true)} />
      
      <QuickActionsSheet 
        isOpen={isQuickActionsOpen} 
        onClose={() => setIsQuickActionsOpen(false)} 
      />
    </div>
  );
}
