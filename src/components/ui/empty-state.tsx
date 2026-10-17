import React from "react";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  /** Ícone principal do estado vazio (lucide-react). */
  icon: LucideIcon;
  /** Título curto em negrito. */
  title: string;
  /** Texto de apoio: explica o estado e aponta o próximo passo. */
  description?: React.ReactNode;
  /** Ação opcional exibida abaixo da descrição (ex: botão). */
  action?: React.ReactNode;
  /** Fundo e cor do quadro do ícone. Padrão: destaque amarelo-pastel. */
  iconClassName?: string;
  /** Classes extras no container (ex: margens externas). */
  className?: string;
}

/**
 * Estado vazio padronizado do mural (@DESIGN.md): card branco com borda
 * preta, sombra dura e ícone em quadro de material escolar.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  iconClassName = "bg-pastel-yellow text-black",
  className = "",
}) => {
  return (
    <div
      className={`bg-white border-2 border-black rounded-xl p-8 text-center shadow-neo ${className}`}
    >
      <div
        className={`w-12 h-12 border-2 border-black rounded-xl flex items-center justify-center mx-auto mb-3 shadow-neo-sm ${iconClassName}`}
      >
        <Icon className="w-6 h-6 stroke-[2.5]" />
      </div>

      <h3 className="text-base font-black text-black mb-1.5">{title}</h3>

      {description ? (
        <p className="text-xs font-bold text-neutral-600 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};
