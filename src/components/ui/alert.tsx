import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  variant?: 'yellow' | 'green' | 'blue' | 'neutral' | 'destructive';
  aside?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'yellow',
  className,
  children,
  aside,
  ...props
}) => {
  const variantStyles = {
    yellow: 'bg-pastel-yellow border-black text-black',
    green: 'bg-pastel-green border-black text-black',
    blue: 'bg-pastel-blue border-black text-black',
    neutral: 'bg-white border-black text-black',
    destructive: 'bg-pastel-red border-black text-black',
  };

  const iconStyles = {
    yellow: 'bg-white text-black',
    green: 'bg-white text-ink-success',
    blue: 'bg-white text-neo-blue',
    neutral: 'bg-white text-black',
    destructive: 'bg-neo-danger text-white',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3.5 p-4 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000]',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {Icon ? (
        <div
          className={cn(
            'p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0',
            iconStyles[variant]
          )}
        >
          <Icon className="w-4 h-4 stroke-[2.5]" />
        </div>
      ) : null}
      <div className="flex flex-col flex-1 min-w-0">
        <h4 className="text-sm font-bold tracking-tight text-black">{title}</h4>
        {description ? (
          typeof description === 'string' ? (
            <p className="text-xs font-semibold text-neutral-800 mt-1 leading-relaxed">{description}</p>
          ) : (
            <div className="text-xs font-semibold text-neutral-800 mt-1 leading-relaxed">{description}</div>
          )
        ) : null}
        {children}
      </div>
      {aside ? <div className="shrink-0 self-center">{aside}</div> : null}
    </div>
  );
};
