import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { vibrateLight } from '@/lib/haptics';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    isLoading = false, 
    loadingText,
    className,
    disabled,
    onClick,
    variant = 'default',
    size = 'default',
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isLoading && !disabled) {
        vibrateLight();
        onClick?.(e);
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "relative transition-all",
          isLoading && "cursor-not-allowed",
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;
