import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  minWidth?: string;
  className?: string;
}

export function ResponsiveTable({ 
  children, 
  minWidth = "800px",
  className 
}: ResponsiveTableProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      // Initial check after render
      const timer = setTimeout(checkScroll, 100);
      
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [checkScroll]);

  return (
    <div className={cn("relative", className)}>
      {/* Left fade indicator */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )} 
      />
      
      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ minWidth }}>
          {children}
        </div>
      </div>
      
      {/* Right fade indicator */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0"
        )} 
      />
      
      {/* Mobile scroll hint */}
      <div 
        className={cn(
          "md:hidden text-center text-xs text-muted-foreground py-2 transition-opacity duration-200",
          canScrollRight || canScrollLeft ? "opacity-100" : "opacity-0"
        )}
      >
        ← Swipe to see all columns →
      </div>
    </div>
  );
}
