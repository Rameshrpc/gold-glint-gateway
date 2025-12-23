import { X, FileText, Banknote, RefreshCw, Award, UserPlus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickActions = [
  { icon: FileText, label: 'New Loan', path: '/new-loan' },
  { icon: Banknote, label: 'Interest', path: '/interest' },
  { icon: Award, label: 'Redemption', path: '/redemption' },
  { icon: RefreshCw, label: 'Reloan', path: '/reloan' },
  { icon: UserPlus, label: 'New Customer', path: '/customers' },
  { icon: BookOpen, label: 'Day Book', path: '/day-book' },
];

export default function QuickActionsSheet({ isOpen, onClose }: QuickActionsSheetProps) {
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl shadow-2xl safe-area-bottom animate-slide-up">
        <div className="p-5">
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => handleAction(action.path)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 active:bg-muted transition-colors"
                )}
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
