import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Tooltip nativo explicando o que o segmento escolhe. */
  title?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onValueChange: (value: T) => void;
  /** Nome do grupo para leitores de tela. */
  ariaLabel: string;
  className?: string;
}

/**
 * Alternador de segmentos no padrão "Lista | Mapa" do design system:
 * cavidade branca (borda preta 2px, raio 12px, sem sombra) com o
 * thumb-adesivo Azul Caneta deslizando entre os segmentos via transform
 * em 150ms ease-out. O thumb é decorativo — o estado vive nos botões
 * (`aria-pressed`), e o foco via teclado usa o ring padrão do sistema.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const count = options.length;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "relative grid gap-0.5 p-0.5 bg-white border-2 border-black rounded-xl",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {/* Thumb-adesivo: pill Azul Caneta que desliza até a cavidade ativa.
          Largura = célula (padding-box menos paddings e gaps, por coluna);
          passo de deslize = largura da própria pill + gap de 2px. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0.5 left-0.5 rounded-lg bg-neo-blue transition-transform duration-150 ease-out"
        style={{
          width: `calc(${100 / count}% - ${(2 * (count - 1) + 4) / count}px)`,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))`,
        }}
      />
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            aria-pressed={isActive}
            title={option.title}
            className={cn(
              "relative cursor-pointer flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-black transition-colors duration-150 active:translate-y-px focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2",
              isActive ? "text-white" : "text-black hover:bg-neutral-100",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
