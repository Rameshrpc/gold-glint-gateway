import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshContainerProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export default function PullToRefreshContainer({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshContainerProps) {
  const { isRefreshing, pullDistance, containerRef, isPulling } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  const progress = Math.min(pullDistance / 80, 1);
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{
        transform: showIndicator ? `translateY(${Math.min(pullDistance, 80)}px)` : undefined,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity z-10",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: -60,
          height: 60,
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
      </div>

      {children}
    </div>
  );
}
