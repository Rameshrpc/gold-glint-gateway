import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

interface FloatingActionButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function FloatingActionButton({ onClick, isOpen = false }: FloatingActionButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  const handlePressStart = () => {
    setIsPressed(true);
    triggerHaptic('light');
  };

  const handlePressEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      className={cn(
        "lg:hidden fixed z-50",
        "bottom-6 right-4",
        "w-14 h-14 rounded-full",
        "gradient-gold shadow-lg shadow-amber-500/30",
        "flex items-center justify-center",
        "transition-all duration-300 ease-out",
        "safe-area-inset-bottom",
        // Pressed state
        isPressed && "scale-90",
        // Open state
        isOpen && "rotate-45 bg-foreground shadow-xl",
        // Pulse animation when closed
        !isOpen && "animate-pulse-glow"
      )}
      style={{
        marginBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className={cn(
        "transition-transform duration-300",
        isOpen && "rotate-90"
      )}>
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </div>
      
      {/* Ripple effect ring */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full animate-pulse-ring opacity-50" />
      )}
    </button>
  );
}
