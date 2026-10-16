import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon: Icon,
  actions,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        className,
      )}
      {...props}
    >
      <div>
        <h2 className="text-2xl font-extrabold text-black tracking-tight flex items-center gap-2.5">
          {Icon ? (
            <Icon className="size-4 stroke-[2.5] shrink-0 text-neo-blue" />
          ) : null}
          <span>{title}</span>
        </h2>
      </div>
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
};
