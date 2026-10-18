import React from "react";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  /** Ícone opcional do estado vazio (lucide-react). */
  icon?: LucideIcon;
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
  /** Se o mascote Saruê em dúvida deve ser exibido. Padrão: true. */
  showMascot?: boolean;
  /** Caminho da imagem do mascote. Padrão: /sarue-doubt.png. */
  mascotSrc?: string;
}

/**
 * Estado vazio padronizado do mural (@DESIGN.md): card branco com borda
 * preta, sombra dura, mascote Saruê em dúvida e ícone contextual.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  iconClassName = "bg-pastel-yellow text-black",
  className = "",
  showMascot = true,
  mascotSrc = "/sarue-doubt.png",
}) => {
  return (
    <div
      className={`bg-white border-2 border-black rounded-xl p-8 text-center shadow-neo ${className}`}
    >
      {showMascot ? (
        <div className="relative mx-auto mb-4 flex items-center justify-center">
          <img
            src={mascotSrc}
            alt="Mascote Saruê em dúvida"
            className="w-36 h-36 md:w-44 md:h-44 object-contain select-none pointer-events-none"
          />
        </div>
      ) : null}

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
