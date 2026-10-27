import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-xs font-bold text-neutral-800">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            id={inputId}
            type={inputType}
            ref={ref}
            className={cn(
              'w-full bg-paper dark:bg-[#0f1420] px-4 py-2.5 text-sm font-medium text-black dark:text-slate-50 placeholder:text-neutral-500 dark:placeholder:text-slate-400 border-2 border-ink rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neo-blue dark:focus:border-[#3b82f6] transition-[box-shadow,border-color] disabled:opacity-50 disabled:bg-neutral-100',
              isPassword && 'pr-11',
              error && 'border-neo-danger ring-neo-danger',
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 cursor-pointer text-neutral-600 hover:text-black rounded-lg transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Eye className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          ) : null}
        </div>
        {error ? <span className="text-xs font-bold text-ink-error mt-0.5">{error}</span> : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
