import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Estado do modo de seleção múltipla do feed (referência Gmail): entra por um
 * botão "Selecionar", vive dentro de uma página do feed e morre ao sair.
 *
 * A seleção nunca cruza página, filtro ou disciplina: qualquer mudança de
 * contexto chega como novo `resetKey` e derruba o modo com a seleção.
 * Atalhos de desktop: Ctrl/Cmd+A seleciona a página, Shift+clique seleciona
 * intervalo, Esc sai do modo.
 */
export function useFeedSelection(pageIds: string[], resetKey: string) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // pageIds muda a cada página/filtro: ref evita resinscrever os atalhos de teclado
  const pageIdsRef = useRef(pageIds);
  pageIdsRef.current = pageIds;

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exit = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  // Troca de filtro, página, disciplina ou sync: modo e seleção zeram
  useEffect(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, [resetKey]);

  const enter = useCallback(() => {
    setIsSelecting(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectRange = useCallback((targetId: string) => {
    setSelectedIds((prev) => {
      const ids = pageIdsRef.current;
      const next = new Set(prev);
      // Sem âncora na página (ou âncora já fora dela): comporta-se como seleção simples
      if (lastAnchorIdRef.current === null || !ids.includes(lastAnchorIdRef.current)) {
        next.add(targetId);
        return next;
      }
      const start = ids.indexOf(lastAnchorIdRef.current);
      const end = ids.indexOf(targetId);
      const [from, to] = start <= end ? [start, end] : [end, start];
      for (let i = from; i <= to; i++) next.add(ids[i]);
      return next;
    });
  }, []);

  // Âncora do Shift+clique: último id clicado sem Shift
  const lastAnchorIdRef = useRef<string | null>(null);

  const toggleAll = useCallback(() => {
    const ids = pageIdsRef.current;
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  }, []);

  /** Handler das linhas/checkboxes do feed: Shift+clique = intervalo, clique = alterna. */
  const handleToggleSelect = useCallback(
    (id: string, shiftKey: boolean) => {
      if (shiftKey) {
        selectRange(id);
      } else {
        lastAnchorIdRef.current = id;
        toggle(id);
      }
    },
    [selectRange, toggle],
  );

  // Atalhos de desktop (só com o modo ativo): Esc sai, Ctrl/Cmd+A seleciona a página
  useEffect(() => {
    if (!isSelecting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        exit();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        // Ctrl+A dentro de campo de texto continua selecionando o texto
        const el = document.activeElement;
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          (el instanceof HTMLElement && el.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleAll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSelecting, exit, toggleAll]);

  return {
    isSelecting,
    selectedIds,
    enter,
    exit,
    clear,
    toggleAll,
    handleToggleSelect,
  };
}
