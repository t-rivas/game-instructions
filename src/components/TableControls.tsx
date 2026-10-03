"use client";
import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/types";
type WakeState =
  "off" | "requesting" | "active" | "released" | "denied" | "unsupported";
export function TableControls({
  lang,
  chess,
  orientation,
  onOrientation,
  help,
  onHelp,
}: {
  lang: Language;
  chess: boolean;
  orientation: boolean;
  onOrientation: (value: boolean) => void;
  help: boolean;
  onHelp: (value: boolean) => void;
}) {
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  const [enabled, setEnabled] = useState(false),
    [status, setStatus] = useState<WakeState>("off"),
    [supported, setSupported] = useState(false);
  const lock = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    const available = !!navigator.wakeLock?.request && window.isSecureContext;
    setSupported(available);
    if (!available) setStatus("unsupported");
  }, []);
  useEffect(() => {
    if (!supported || !enabled) {
      if (supported) setStatus("off");
      return;
    }
    let live = true,
      pending = false;
    const release = () => {
      const held = lock.current;
      lock.current = null;
      if (held) void held.release().catch(() => {});
    };
    const acquire = async () => {
      if (
        !live ||
        pending ||
        (lock.current && !lock.current.released) ||
        document.visibilityState !== "visible"
      )
        return;
      pending = true;
      setStatus("requesting");
      try {
        const held = await navigator.wakeLock.request("screen");
        if (!live || document.visibilityState !== "visible") {
          await held.release();
          return;
        }
        lock.current = held;
        held.addEventListener(
          "release",
          () => {
            if (live && lock.current === held) {
              lock.current = null;
              setStatus("released");
            }
          },
          { once: true },
        );
        setStatus(held.released ? "released" : "active");
      } catch {
        if (live) setStatus("denied");
      } finally {
        pending = false;
      }
    };
    const visibility = () => {
      if (document.visibilityState === "visible") void acquire();
      else {
        release();
        if (live) setStatus("released");
      }
    };
    const pagehide = () => {
      release();
      if (live) setStatus("released");
    };
    void acquire();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      release();
    };
  }, [enabled, supported]);
  const messages: Record<WakeState, string> = {
    off: tr("Screen awake: off", "Pantalla activa: no"),
    requesting: tr(
      "Requesting screen wake lock…",
      "Solicitando mantener la pantalla activa…",
    ),
    active: tr("Screen is being kept awake", "La pantalla se mantiene activa"),
    released: tr("Screen wake lock released", "Se liberó la pantalla activa"),
    denied: tr(
      "Could not keep the screen awake",
      "No se pudo mantener la pantalla activa",
    ),
    unsupported: tr(
      "Screen wake lock is unavailable",
      "No se puede mantener la pantalla activa",
    ),
  };
  return (
    <div className="table-controls">
      <div className="table-control-buttons">
        {chess ? (
          <button
            type="button"
            id="clock-orientation"
            aria-pressed={orientation}
            onClick={() => onOrientation(!orientation)}
          >
            {tr("Opponent-facing clock", "Reloj de frente al rival")}
          </button>
        ) : null}
        <button
          type="button"
          id="keep-awake"
          disabled={!supported}
          aria-pressed={enabled}
          aria-describedby="wake-status"
          onClick={() => setEnabled(!enabled)}
        >
          {tr("Keep screen awake", "Mantener pantalla activa")}
        </button>
        <button
          type="button"
          id="table-help"
          aria-expanded={help}
          aria-controls="play-tools"
          onClick={() => onHelp(!help)}
        >
          {help
            ? tr("Hide help", "Ocultar ayuda")
            : tr("Show help", "Mostrar ayuda")}
        </button>
      </div>
      <span
        id="wake-status"
        role="status"
        aria-atomic="true"
        data-status={status}
      >
        {messages[status]}
      </span>
    </div>
  );
}
