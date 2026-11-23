import { useEffect, useState } from "react";

export interface KeyboardViewportState {
  isKeyboardOpen: boolean;
  viewportHeight: number | null;
}

function isEditableElement(el: Element | null): el is HTMLElement {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = ((el as HTMLInputElement).type || "text").toLowerCase();
    return !["button", "submit", "reset", "checkbox", "radio", "file", "hidden"].includes(type);
  }
  return (el as HTMLElement).isContentEditable;
}

export function useKeyboardViewport(): KeyboardViewportState {
  const [state, setState] = useState<KeyboardViewportState>({
    isKeyboardOpen: false,
    viewportHeight: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;
    let baseWidth = vv ? vv.width : window.innerWidth;
    let baseHeight = vv ? vv.height : window.innerHeight;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    let scrollFollowTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      const curWidth = vv ? vv.width : window.innerWidth;
      const curHeight = vv ? vv.height : window.innerHeight;

      if (Math.abs(curWidth - baseWidth) > 60) {
        baseWidth = curWidth;
        baseHeight = curHeight;
      } else if (curHeight > baseHeight) {
        baseHeight = curHeight;
      }

      const deltaFromBase = baseHeight - curHeight;
      const deltaFromWindow = window.innerHeight - curHeight;
      const keyboardOpen = deltaFromBase > 120 || deltaFromWindow > 120;

      setState((prev) => {
        const nextHeight = keyboardOpen ? curHeight : null;
        if (prev.isKeyboardOpen === keyboardOpen && prev.viewportHeight === nextHeight) {
          return prev;
        }
        return { isKeyboardOpen: keyboardOpen, viewportHeight: nextHeight };
      });
    };

    const scrollFocusedIntoView = (target?: Element | null) => {
      const el = target ?? document.activeElement;
      if (!isEditableElement(el)) return;
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } catch {
        // ignore unsupported options
      }
    };

    const onViewportResize = () => {
      measure();
      if (isEditableElement(document.activeElement)) {
        if (scrollFollowTimer) clearTimeout(scrollFollowTimer);
        scrollFollowTimer = setTimeout(() => {
          scrollFocusedIntoView(document.activeElement);
        }, 60);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Element | null;
      if (!isEditableElement(target)) return;
      if (scrollTimer) clearTimeout(scrollTimer);
      if (scrollFollowTimer) clearTimeout(scrollFollowTimer);
      scrollTimer = setTimeout(() => {
        measure();
        scrollFocusedIntoView(target);
      }, 180);
      scrollFollowTimer = setTimeout(() => {
        measure();
        scrollFocusedIntoView(target);
      }, 380);
    };

    const onFocusOut = () => {
      setTimeout(measure, 120);
    };

    measure();
    vv?.addEventListener("resize", onViewportResize);
    window.addEventListener("resize", onViewportResize);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      if (scrollFollowTimer) clearTimeout(scrollFollowTimer);
      vv?.removeEventListener("resize", onViewportResize);
      window.removeEventListener("resize", onViewportResize);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return state;
}
