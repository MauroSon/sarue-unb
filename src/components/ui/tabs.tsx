import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className }) => {
  return (
    <div className={cn('flex flex-wrap gap-2.5', className)}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-xl border-2 border-ink select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out translate-x-0 translate-y-0',
              isActive
                ? 'bg-neo-blue text-white shadow-[2px_2px_0px_0px_var(--neo-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                : 'bg-paper text-neutral-800 hover:bg-neutral-50 shadow-[2px_2px_0px_0px_var(--neo-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${isActive ? 'bg-paper text-blue-ink' : 'bg-neo-blue text-white'}`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
