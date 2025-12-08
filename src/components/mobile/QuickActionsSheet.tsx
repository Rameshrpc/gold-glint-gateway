import { X, FileText, Banknote, RefreshCw, Award, UserPlus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickActions = [
  { icon: FileText, label: 'New Loan', path: '/loans', color: 'bg-blue-500' },
  { icon: Banknote, label: 'Collect Interest', path: '/interest', color: 'bg-green-500' },
  { icon: Award, label: 'Redeem Loan', path: '/redemption', color: 'bg-amber-500' },
  { icon: RefreshCw, label: 'Reloan', path: '/reloan', color: 'bg-purple-500' },
  { icon: UserPlus, label: 'New Customer', path: '/customers', color: 'bg-pink-500' },
  { icon: BookOpen, label: 'Day Book', path: '/day-book', color: 'bg-indigo-500' },
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
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-3xl shadow-2xl animate-slide-up safe-area-bottom">
        <div className="p-6">
          {/* Handle */}
          <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-6" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Quick Actions</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {quickActions.map((action, index) => (
              <button
                key={action.path}
                onClick={() => handleAction(action.path)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl bg-accent/50 hover:bg-accent active:scale-95 transition-all duration-200",
                  "animate-scale-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                  action.color
                )}>
                  <action.icon className="w-6 h-6" />
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
