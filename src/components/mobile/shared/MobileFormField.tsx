import { ReactNode, forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

const MobileFormField = forwardRef<HTMLInputElement, MobileFormFieldProps>(
  ({ label, error, icon, clearable, onClear, className, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            value={value}
            className={cn(
              'w-full h-12 rounded-xl bg-card border text-base transition-all duration-200',
              'focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none',
              'placeholder:text-muted-foreground/60',
              icon ? 'pl-12 pr-4' : 'px-4',
              clearable && hasValue && 'pr-10',
              error
                ? 'border-destructive focus:ring-destructive/20 focus:border-destructive/30'
                : 'border-border',
              className
            )}
            {...props}
          />
          {clearable && hasValue && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center tap-scale"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

MobileFormField.displayName = 'MobileFormField';

interface MobileTextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const MobileTextareaField = forwardRef<HTMLTextAreaElement, MobileTextareaFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <textarea
          ref={ref}
          className={cn(
            'w-full min-h-[100px] rounded-xl bg-card border px-4 py-3 text-base transition-all duration-200',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none',
            'placeholder:text-muted-foreground/60 resize-none',
            error
              ? 'border-destructive focus:ring-destructive/20 focus:border-destructive/30'
              : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

MobileTextareaField.displayName = 'MobileTextareaField';

interface MobileSelectFieldProps {
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  icon?: ReactNode;
}

export function MobileSelectField({
  label,
  error,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  icon,
}: MobileSelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full h-12 rounded-xl bg-card border text-base transition-all duration-200 appearance-none',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none',
            icon ? 'pl-12 pr-10' : 'pl-4 pr-10',
            !value && 'text-muted-foreground/60',
            error
              ? 'border-destructive focus:ring-destructive/20 focus:border-destructive/30'
              : 'border-border'
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

export default MobileFormField;
