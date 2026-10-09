import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-xs font-bold text-neutral-800">
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full bg-white px-4 text-sm font-medium text-black placeholder:text-neutral-500 border-2 border-black rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neo-blue transition-[box-shadow,border-color] disabled:opacity-50 disabled:bg-neutral-100',
            error && 'border-neo-danger ring-neo-danger',
            className
          )}
          {...props}
        />
        {error ? <span className="text-xs font-bold text-ink-error mt-0.5">{error}</span> : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
