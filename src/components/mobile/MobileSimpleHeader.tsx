import { ArrowLeft, Search, Plus, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileSimpleHeaderProps {
  title: string;
  showBack?: boolean;
  onBackClick?: () => void;
  showSearch?: boolean;
  onSearchClick?: () => void;
  showAdd?: boolean;
  onAddClick?: () => void;
  showMore?: boolean;
  onMoreClick?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export default function MobileSimpleHeader({ 
  title,
  showBack = false,
  onBackClick,
  showSearch = false,
  onSearchClick,
  showAdd = false,
  onAddClick,
  showMore = false,
  onMoreClick,
  rightContent,
  className
}: MobileSimpleHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 bg-card border-b border-border safe-area-top",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBack && (
            <button 
              onClick={handleBack}
              className="flex-shrink-0 w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {rightContent}
          
          {showSearch && (
            <button 
              onClick={onSearchClick}
              className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          
          {showAdd && (
            <button 
              onClick={onAddClick}
              className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted transition-colors"
              aria-label="Add"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          
          {showMore && (
            <button 
              onClick={onMoreClick}
              className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
