import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  School,
  MessageSquare,
  AlertCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";

export type PlatformBadgeVariant = "sigaa" | "aprender3" | "teams";
export type BadgeTypeVariant =
  | PlatformBadgeVariant
  | "assignment"
  | "post"
  | "urgent"
  | "neutral"
  | "success"
  | "primary"
  | "outline"
  | "purple"
  | "yellow";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeTypeVariant;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  showIcon = false,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeTypeVariant, string> = {
    // Adesivos de verdade nos dois temas: fundo cheio, tinta fixa de texto e
    // borda de tinta. No escuro as tintas de ação ficam nas versões vivas
    // (menta, ouro) remapadas no bloco .dark — nunca vazadas.
    sigaa: "bg-platform-sigaa text-ink border-2 border-ink",
    aprender3: "bg-platform-aprender3 text-ink border-2 border-ink",
    teams: "bg-platform-teams text-white border-2 border-ink",
    assignment: "bg-neo-yellow text-ink border-2 border-ink",
    post: "bg-slate-200 text-black border-2 border-ink",
    urgent: "bg-neo-danger text-white border-2 border-ink",
    neutral: "bg-paper text-black border-2 border-ink dark:bg-neutral-300 dark:text-slate-50",
    success: "bg-neo-green text-ink border-2 border-ink",
    primary: "bg-neo-blue text-white border-2 border-ink",
    outline: "bg-paper text-black border-2 border-ink dark:bg-neutral-300 dark:text-slate-50",
    purple: "bg-neo-purple text-ink border-2 border-ink",
    yellow: "bg-neo-yellow text-ink border-2 border-ink",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] leading-4 rounded-full",
    md: "px-3 py-0.5 text-xs rounded-full",
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    const iconClass =
      size === "sm"
        ? "w-3 h-3 shrink-0 stroke-[2.5]"
        : "w-3.5 h-3.5 shrink-0 stroke-[2.5]";

    switch (variant) {
      case "sigaa":
        return <School className={iconClass} />;
      case "aprender3":
        return <BookOpen className={iconClass} />;
      case "teams":
        return <MessageSquare className={iconClass} />;
      case "assignment":
        return <CheckCircle2 className={iconClass} />;
      case "post":
        return <FileText className={iconClass} />;
      case "urgent":
        return <AlertCircle className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold select-none tracking-normal",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {renderIcon()}
      {children}
    </span>
  );
};
