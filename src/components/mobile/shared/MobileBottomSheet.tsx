import { ReactNode, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  snapPoints?: ('half' | 'full')[];
  showHandle?: boolean;
  className?: string;
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  snapPoints = ['half'],
  showHandle = true,
  className,
}: MobileBottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState<'half' | 'full'>(snapPoints[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startOffset = useRef(0);

  const getSnapHeight = (snap: 'half' | 'full') => {
    return snap === 'full' ? '90vh' : '50vh';
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentSnap(snapPoints[0]);
      setDragOffset(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, snapPoints]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showHandle) return;
    startY.current = e.touches[0].clientY;
    startOffset.current = dragOffset;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY.current;
    const newOffset = Math.max(0, startOffset.current + deltaY);
    setDragOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 100;

    if (dragOffset > threshold) {
      if (currentSnap === 'full' && snapPoints.includes('half')) {
        setCurrentSnap('half');
        setDragOffset(0);
      } else {
        onClose();
      }
    } else if (dragOffset < -threshold && snapPoints.includes('full') && currentSnap === 'half') {
      setCurrentSnap('full');
      setDragOffset(0);
    } else {
      setDragOffset(0);
    }
  };

  if (!isOpen) return null;

  // Calculate content height based on header and footer presence
  const headerHeight = title ? 60 : 20;
  const footerHeight = footer ? 80 : 0;
  const contentHeight = `calc(100% - ${headerHeight + footerHeight}px)`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl transition-all safe-area-bottom flex flex-col',
          isDragging ? 'transition-none' : 'duration-300 ease-out',
          className
        )}
        style={{
          height: getSnapHeight(currentSnap),
          transform: `translateY(${dragOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center tap-scale"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-auto flex-1"
          style={{ height: contentHeight }}
        >
          {children}
        </div>

        {/* Footer - Outside scrollable area */}
        {footer && (
          <div className="flex-shrink-0 p-4 bg-background border-t border-border safe-area-inset-bottom">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
