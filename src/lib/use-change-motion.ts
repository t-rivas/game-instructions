"use client";
import { useLayoutEffect, useRef, type RefObject } from "react";

// Presentation only: commit the new content and focus before animating it.
// Never retain an old view, remount a tool, or wait for an animation to finish.
export function useChangeMotion(ref: RefObject<HTMLElement | null>, value: string | number, kind: "step" | "feedback" = "feedback") {
  const previous = useRef(value);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = value;
    const node = ref.current;
    if (!node || before === value) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !node.getClientRects().length || node.closest("[hidden], details:not([open]) > :not(summary)")) return;
    const targets = kind === "step"
      ? [...node.querySelectorAll<HTMLElement>(":scope > .lesson-copy, :scope > .lesson-cards")]
      : [node];
    const direction = typeof before === "number" && typeof value === "number" && value < before ? -1 : 1;
    const animations = targets.map(target => target.animate(
      kind === "step" && target.classList.contains("lesson-cards")
        ? [{opacity: .75, transform: `translateX(${direction * 6}px)`}, {opacity: 1, transform: "none"}]
        : [{opacity: .75}, {opacity: 1}],
      {duration: 180, easing: "cubic-bezier(.2,.7,.2,1)"},
    ));
    const cancel = () => animations.forEach(animation => animation.cancel());
    const changed = () => { if (preference.matches) cancel(); };
    preference.addEventListener("change", changed);
    return () => { cancel(); preference.removeEventListener("change", changed); };
  }, [ref, value, kind]);
}
