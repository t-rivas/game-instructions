"use client";
import { useEffect } from "react";

/** Match scroll clearance to the actual toolbar, including wrapped translations. */
export function useReadingInsets(route: string, focused: boolean) {
  useEffect(() => {
    const main = document.getElementById("main");
    const toolbar = main?.querySelector<HTMLElement>(focused ? ".play-toolbar" : ".detail-controls");
    if (!main || !toolbar) return;
    const sync = () => {
      const style = getComputedStyle(toolbar);
      const inset = style.position === "sticky"
        ? Math.ceil(toolbar.getBoundingClientRect().height + (parseFloat(style.top) || 0)) + 12 : 12;
      main.style.setProperty("--sticky-inset", `${inset}px`);
      if (!focused) document.documentElement.style.setProperty("--guide-inset", `${inset}px`);
    };
    const observer = new ResizeObserver(sync);
    observer.observe(toolbar);
    window.addEventListener("resize", sync);
    sync();
    return () => { observer.disconnect(); window.removeEventListener("resize", sync); };
  }, [route, focused]);
}
