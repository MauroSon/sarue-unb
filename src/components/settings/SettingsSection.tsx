import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface SettingsSectionProps {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  /** Sem card: o conteúdo já é adesivo por si (ex.: accordion de contas). */
  bare?: boolean;
  className?: string;
}

/**
 * Seção de Configurações: rótulo gritado do design system (ícone Azul
 * Caneta + uppercase font-black, divisor interno) sobre um card de
 * conteúdo — ou sobre papel nu quando o conteúdo já é adesivo.
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  icon: Icon,
  label,
  children,
  bare = false,
  className,
}) => {
  const header = (
    <div className="flex items-center gap-2 mb-3 pb-2.5 border-b-2 border-ink/10">
      <Icon className="w-4 h-4 stroke-[2.5] text-blue-ink" />
      <h3 className="text-sm font-black uppercase tracking-tight text-black">
        {label}
      </h3>
    </div>
  );

  if (bare) {
    return (
      <section className={className}>
        {header}
        {children}
      </section>
    );
  }

  return (
    <Card className={cn("p-5", className)}>
      {header}
      {children}
    </Card>
  );
};
