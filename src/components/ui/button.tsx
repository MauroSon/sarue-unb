import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'accent' | 'yellow' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Efeito de botão neobrutalista press (escala 2px): repouso (2px 2px), hover afunda metade (+1px, sombra 1px — fica a 1px do papel), active afunda tudo (+2px, shadow-none)
    const baseStyles =
      'cursor-pointer inline-flex items-center justify-center gap-2 font-bold tracking-normal select-none border-2 border-black rounded-xl translate-x-0 translate-y-0 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_#000] disabled:active:translate-x-0 disabled:active:translate-y-0';

    const variantStyles = {
      default: 'bg-neo-blue text-white hover:bg-neo-blueHover',
      primary: 'bg-neo-blue text-white hover:bg-neo-blueHover',
      accent: 'bg-neo-green text-black hover:bg-neo-greenHover',
      yellow: 'bg-neo-yellow text-black hover:bg-neo-yellowHover',
      destructive: 'bg-neo-danger text-white hover:bg-neo-dangerHover',
      outline: 'bg-white text-black hover:bg-neutral-100',
      ghost:
        'bg-transparent text-black border-transparent shadow-none hover:bg-black/5 hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-[1px] active:translate-y-[1px]',
    };

    const sizeStyles = {
      sm: 'h-8 px-3.5 text-xs rounded-xl',
      md: 'h-10 px-5 text-sm rounded-2xl',
      lg: 'h-12 px-7 text-base rounded-2xl',
      icon: 'h-10 w-10 p-0 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block animate-spin border-2 border-current border-t-transparent rounded-full h-4 w-4" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
