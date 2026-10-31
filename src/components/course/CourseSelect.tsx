import React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Check, ChevronDown, Search } from 'lucide-react';

// Busca sem sensibilidade a acentos, maiúsculas ou pontuação ("computaçao" acha "Computação")
const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export interface CourseOption {
  name: string;
  /** Códigos das matrizes do curso — a busca também acha pelo código (ex: 6360). */
  codes?: string[];
}

export interface CourseSelectProps {
  courses: CourseOption[];
  value: string | null;
  onChange: (name: string) => void;
  placeholder?: string;
}

/**
 * Seletor de curso com busca interna — mesma receita do DepartmentSelect
 * (grade): gatilho estilo SelectTrigger + popup de papel com campo de
 * pesquisa e lista filtrável navegável por setas.
 */
export const CourseSelect: React.FC<CourseSelectProps> = ({
  courses,
  value,
  onChange,
  placeholder = 'Selecione o curso',
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  // Navegação por setas: índice ativo da lista filtrável (padrão combobox)
  const [activeIndex, setActiveIndex] = React.useState(0);
  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const filtered = React.useMemo(() => {
    const q = normalizeText(query);
    if (!q) return courses;
    return courses.filter(
      (c) =>
        normalizeText(c.name).includes(q) ||
        (c.codes ?? []).some((code) => normalizeText(code).includes(q))
    );
  }, [courses, query]);

  const selectedName = React.useMemo(
    () => courses.find((c) => c.name === value)?.name,
    [courses, value]
  );

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}>
      <Popover.Trigger
        className="flex w-full h-10 items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-black rounded-xl border-2 border-ink bg-paper dark:bg-neutral-200 dark:text-slate-50 dark:hover:bg-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-neo-blue transition-[box-shadow,border-color,background-color] cursor-pointer select-none"
        aria-label="Selecionar curso da UnB"
      >
        <span className="truncate text-left">{selectedName ?? placeholder}</span>
        <ChevronDown className={`w-4 h-4 stroke-[2.5] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="isolate z-50">
          <Popover.Popup className="relative z-50 w-max min-w-[280px] max-w-[520px] rounded-lg border-2 border-ink bg-canvas text-black outline-hidden origin-(--transform-origin)">
            {/* Busca interna */}
            <div className="p-2 border-b-2 border-ink/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveIndex((i) => Math.max(i - 1, 0));
                    } else if (e.key === 'Home' && filtered.length > 0) {
                      e.preventDefault();
                      setActiveIndex(0);
                    } else if (e.key === 'End' && filtered.length > 0) {
                      e.preventDefault();
                      setActiveIndex(filtered.length - 1);
                    } else if (e.key === 'Enter' && filtered[activeIndex]) {
                      e.preventDefault();
                      pick(filtered[activeIndex].name);
                    }
                  }}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={open ? 'course-listbox' : undefined}
                  aria-activedescendant={open ? `course-option-${filtered[activeIndex]?.name}` : undefined}
                  autoFocus
                  placeholder="Pesquisar curso…"
                  className="w-full h-8 bg-paper pl-9 pr-3 text-xs font-semibold text-black rounded-lg border-2 border-ink focus:outline-hidden focus:ring-2 focus:ring-neo-blue placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* Lista filtrável (listbox navegável por setas) */}
            <div id="course-listbox" role="listbox" className="p-1 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-xs font-semibold text-neutral-600">
                  Nenhum curso encontrado para "{query}"
                </p>
              ) : (
                filtered.map((course, index) => {
                  const isSelected = course.name === value;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={course.name}
                      id={`course-option-${course.name}`}
                      ref={(el) => {
                        if (el && isActive) {
                          el.scrollIntoView({ block: 'nearest' });
                        }
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => pick(course.name)}
                      onMouseMove={() => setActiveIndex(index)}
                      className={`relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-1.5 pr-8 pl-2.5 text-xs font-bold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-inset hover:bg-neo-blue hover:text-white data-[active=true]:bg-neo-blue data-[active=true]:text-white data-[selected=true]:font-extrabold transition-colors`}
                      data-active={isActive}
                    >
                      <span className="truncate text-left">{course.name}</span>
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[2.5] absolute right-2" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
