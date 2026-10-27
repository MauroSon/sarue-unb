import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Slider do design system Saruê (adaptado do registro neobrutalism):
 * trilho-cavidade (Cinza Papel, borda preta 2px) com preenchimento Azul
 * Caneta Ação e thumb-adesivo branco (borda 2px, Micro-adesivo 1px).
 * Foco via teclado usa o ring padrão do sistema.
 */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      className={cn(
        "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full border-2 border-ink bg-neutral-200 select-none data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:w-full"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-neo-blue select-none data-[orientation=horizontal]:h-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block size-5 shrink-0 rounded-full border-2 border-ink bg-white dark:bg-slate-300 shadow-[1px_1px_0px_0px_var(--neo-shadow)] transition-colors select-none has-focus-visible:outline-none has-focus-visible:ring-2 has-focus-visible:ring-neo-blue has-focus-visible:ring-offset-2 data-disabled:pointer-events-none data-disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
