import { useCallback, useRef } from "react";

export function useScrollRestore() {
  const savedTopRef = useRef(0);

  const save = useCallback(() => {
    const mainEl = document.querySelector("main");
    savedTopRef.current = mainEl ? mainEl.scrollTop : window.scrollY;
  }, []);

  const restore = useCallback(() => {
    const target = savedTopRef.current;
    const apply = () => {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTo({ top: target, behavior: "instant" });
      }
      window.scrollTo({ top: target, behavior: "instant" });
    };
    apply();
    requestAnimationFrame(apply);
  }, []);

  const reset = useCallback(() => {
    savedTopRef.current = 0;
  }, []);

  return { save, restore, reset, savedTopRef };
}
