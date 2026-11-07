import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * NumberField Root - gerencia estado e contexto do campo numérico.
 */
export const NumberField = NumberFieldPrimitive.Root;

/**
 * Container agrupador para o input e botões de incremento/decremento.
 */
export function NumberFieldGroup({
  className,
  ...props
}: React.ComponentProps<typeof NumberFieldPrimitive.Group>) {
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      className={cn(
        "relative flex w-full items-center rounded-xl border-2 border-ink bg-paper shadow-neo-xs transition-[box-shadow,border-color] focus-within:ring-2 focus-within:ring-neo-blue overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

/**
 * Input numérico de alto contraste sem os spinbuttons nativos quebrados do navegador.
 */
export function NumberFieldInput({
  className,
  ...props
}: React.ComponentProps<typeof NumberFieldPrimitive.Input>) {
  return (
    <NumberFieldPrimitive.Input
      data-slot="number-field-input"
      className={cn(
        "w-full min-w-0 bg-transparent px-2.5 py-1 text-sm font-bold text-black placeholder:text-neutral-500 focus:outline-hidden text-center font-mono tabular-nums",
        // Suprime completamente os spinbuttons nativos do WebKit/Chromium/Firefox/WebKitGTK
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        className
      )}
      {...props}
    />
  );
}

/**
 * Botão de incremento com estilo neobrutalista.
 */
export function NumberFieldIncrement({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NumberFieldPrimitive.Increment>) {
  return (
    <NumberFieldPrimitive.Increment
      data-slot="number-field-increment"
      className={cn(
        "flex h-full items-center justify-center text-black hover:bg-neutral-100 dark:hover:bg-neutral-200 active:bg-neutral-200 transition-colors cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children || <Plus className="w-3 h-3 stroke-[2.5]" />}
    </NumberFieldPrimitive.Increment>
  );
}

/**
 * Botão de decremento com estilo neobrutalista.
 */
export function NumberFieldDecrement({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NumberFieldPrimitive.Decrement>) {
  return (
    <NumberFieldPrimitive.Decrement
      data-slot="number-field-decrement"
      className={cn(
        "flex h-full items-center justify-center text-black hover:bg-neutral-100 dark:hover:bg-neutral-200 active:bg-neutral-200 transition-colors cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children || <Minus className="w-3 h-3 stroke-[2.5]" />}
    </NumberFieldPrimitive.Decrement>
  );
}

export interface NumberInputProps {
  id?: string;
  value?: number | null;
  defaultValue?: number;
  onValueChange?: (val: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  smallStep?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
  /**
   * "stacked": botões de seta em cima/baixo no lado direito com divisor neobrutalista
   * "sides": botão de menos na esquerda e mais na direita
   * "none": apenas o input estilizado sem controles visuais
   */
  controls?: "stacked" | "sides" | "none";
}

/**
 * Componente pronto de Input Numérico Neobrutalista do Saruê UnB.
 * Resolve problemas de spinbutton nativo quebrado e suporte a decimais.
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 10,
  step = 0.5,
  smallStep = 0.1,
  placeholder = "Pendente",
  disabled = false,
  className,
  inputClassName,
  "aria-label": ariaLabel,
  controls = "stacked",
}) => {
  return (
    <NumberField
      id={id}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(val) => {
        onValueChange?.(val);
      }}
      min={min}
      max={max}
      step={step}
      smallStep={smallStep}
      disabled={disabled}
      className={cn("w-full", className)}
    >
      <NumberFieldGroup className="h-9 bg-paper">
        {controls === "sides" && (
          <NumberFieldDecrement
            className="w-8 border-r-2 border-ink bg-neutral-100 dark:bg-btn-raise text-black shrink-0"
            aria-label="Diminuir valor"
          >
            <Minus className="w-3 h-3 stroke-[2.5]" />
          </NumberFieldDecrement>
        )}

        <NumberFieldInput
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={inputClassName}
        />

        {controls === "sides" && (
          <NumberFieldIncrement
            className="w-8 border-l-2 border-ink bg-neutral-100 dark:bg-btn-raise text-black shrink-0"
            aria-label="Aumentar valor"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
          </NumberFieldIncrement>
        )}

        {controls === "stacked" && (
          <div className="flex flex-col h-full w-6 border-l-2 border-ink divide-y-2 divide-ink shrink-0 bg-neutral-100 dark:bg-btn-raise">
            <NumberFieldIncrement
              className="flex-1 w-full text-black hover:bg-neutral-200 dark:hover:bg-neutral-300"
              aria-label="Aumentar valor"
            >
              <ChevronUp className="w-3 h-3 stroke-[2.5]" />
            </NumberFieldIncrement>
            <NumberFieldDecrement
              className="flex-1 w-full text-black hover:bg-neutral-200 dark:hover:bg-neutral-300"
              aria-label="Diminuir valor"
            >
              <ChevronDown className="w-3 h-3 stroke-[2.5]" />
            </NumberFieldDecrement>
          </div>
        )}
      </NumberFieldGroup>
    </NumberField>
  );
};
