import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { vibrateSuccess } from '@/lib/haptics';

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
  duration?: number;
}

export default function SuccessAnimation({
  isVisible,
  onComplete,
  message = "Success!",
  duration = 2000,
}: SuccessAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      vibrateSuccess();
      
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        {/* Animated checkmark circle */}
        <div className="relative">
          {/* Outer ring animation */}
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-emerald-500/30 animate-ping" />
          
          {/* Main circle */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <Check className="w-12 h-12 text-white animate-scale-in" style={{ animationDelay: '150ms' }} />
          </div>
        </div>

        {/* Success message */}
        <p className="text-lg font-semibold text-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
          {message}
        </p>

        {/* Confetti dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full",
                i % 3 === 0 ? "bg-emerald-400" : i % 3 === 1 ? "bg-amber-400" : "bg-blue-400"
              )}
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 40}%`,
                animation: `confetti-fall ${0.8 + Math.random() * 0.4}s ease-out forwards`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100px) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}
