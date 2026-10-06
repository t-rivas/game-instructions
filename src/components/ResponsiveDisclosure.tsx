"use client";
import { useEffect, useState, type ReactNode } from "react";

/** Secondary controls stay mounted when the available reading space changes. */
export function ResponsiveDisclosure({ id, label, children, className = "", storageKey }: {
  id: string; label: ReactNode; children: ReactNode; className?: string; storageKey?: string;
}) {
  const [wide, setWide] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (storageKey) {
      try { setExpanded(sessionStorage.getItem(storageKey) === "true"); } catch {}
    }
    const media = window.matchMedia("(min-width: 48rem)");
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [storageKey]);
  return <details id={id} className={`responsive-disclosure ${className}`} open={wide || expanded}
    onToggle={event => {
      if (wide) return;
      const open = event.currentTarget.open;
      setExpanded(open);
      if (storageKey) { try { sessionStorage.setItem(storageKey, String(open)); } catch {} }
    }}>
    <summary>{label}<span className="disclosure-chevron" aria-hidden="true">⌄</span></summary>
    <div className="disclosure-body">{children}</div>
  </details>;
}
