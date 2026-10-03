"use client";
import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/types";
export function ShareDialog({
  open,
  onClose,
  href,
  title,
  edition,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  href: string;
  title: string;
  edition: string;
  lang: Language;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    field = useRef<HTMLTextAreaElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const [link, setLink] = useState(""),
    [status, setStatus] = useState(""),
    [qr, setQR] = useState(""),
    [loading, setLoading] = useState(false),
    [native, setNative] = useState(false);
  const generation = useRef(0);
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  useEffect(() => {
    generation.current++;
    setLink(new URL(href, location.origin).href);
    setStatus("");
    setQR("");
    setLoading(false);
    setNative(typeof navigator.share === "function");
  }, [open, href]);
  useEffect(() => {
    const node = dialog.current!;
    if (open && !node.open) {
      opener.current = document.activeElement as HTMLElement;
      node.showModal();
    } else if (!open && node.open) {
      node.close();
      opener.current?.focus({ preventScroll: true });
    }
    return () => {
      generation.current++;
    };
  }, [open]);
  useEffect(() => {
    if (qr)
      requestAnimationFrame(() =>
        dialog.current
          ?.querySelector(".share-code")
          ?.scrollIntoView({ block: "nearest", behavior: "instant" }),
      );
  }, [qr]);
  const copy = async () => {
    const current = generation.current;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Unavailable");
      await navigator.clipboard.writeText(link);
      if (generation.current === current)
        setStatus(tr("Link copied", "Enlace copiado"));
    } catch {
      if (generation.current !== current) return;
      field.current?.focus();
      field.current?.select();
      setStatus(
        tr(
          "Link selected. Press Ctrl/Cmd+C to copy, or touch and hold the link.",
          "Enlace seleccionado. Pulsa Ctrl/Cmd+C para copiar o mantén presionado el enlace.",
        ),
      );
    }
  };
  const showQR = async () => {
    const current = generation.current;
    setLoading(true);
    setStatus("");
    try {
      const { toDataURL } = await import("qrcode");
      const code = await toDataURL(link, {
        width: 320,
        margin: 4,
        errorCorrectionLevel: "M",
      });
      if (generation.current === current) setQR(code);
    } catch {
      if (generation.current === current)
        setStatus(
          tr(
            "QR code unavailable. Use the link above.",
            "Código QR no disponible. Usa el enlace de arriba.",
          ),
        );
    } finally {
      if (generation.current === current) setLoading(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      id="share-dialog"
      className="share-dialog"
      aria-labelledby="share-title"
      aria-describedby="share-edition"
      onCancel={onClose}
      onClose={() => {
        onClose();
        opener.current?.focus({ preventScroll: true });
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="share-title">
          {tr("Share", "Compartir")} · {title}
        </h2>
        <button
          type="button"
          aria-label={tr("Close sharing", "Cerrar opciones para compartir")}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p id="share-edition">
        <strong>{tr("Shared edition", "Edición compartida")}: </strong>
        {edition}
      </p>
      <label htmlFor="share-link">
        {tr("Link to this guide or rule", "Enlace a esta guía o regla")}
      </label>
      <textarea
        id="share-link"
        ref={field}
        readOnly
        value={link}
        rows={3}
        onFocus={(event) => event.target.select()}
      />
      <div className="share-actions">
        <button
          type="button"
          id="copy-rule-link"
          disabled={!link}
          onClick={copy}
        >
          {tr("Copy link", "Copiar enlace")}
        </button>
        {native ? (
          <button
            type="button"
            id="native-share"
            onClick={async () => {
              const current = generation.current;
              try {
                await navigator.share({
                  title: `${title} · ${edition}`,
                  url: link,
                });
                if (generation.current === current)
                  setStatus(tr("Shared", "Compartido"));
              } catch (error) {
                if (generation.current !== current) return;
                setStatus(
                  error instanceof Error && error.name === "AbortError"
                    ? tr("Sharing canceled", "Se canceló el envío")
                    : tr(
                        "Use Copy link to share this rule.",
                        "Usa Copiar enlace para compartir esta regla.",
                      ),
                );
              }
            }}
          >
            {tr("Share with…", "Compartir con…")}
          </button>
        ) : null}
        <button
          type="button"
          id="show-qr"
          disabled={loading || !!qr}
          onClick={showQR}
        >
          {loading
            ? tr("Generating QR…", "Generando QR…")
            : tr("Show QR code", "Mostrar código QR")}
        </button>
      </div>
      <p role="status" aria-live="polite">
        {status}
      </p>
      {qr ? (
        <figure className="share-code" id="share-code">
          <img
            className="share-qr"
            src={qr}
            width={320}
            height={320}
            alt={tr(
              `QR code for ${title}, ${edition}`,
              `Código QR de ${title}, ${edition}`,
            )}
          />
          <figcaption>{edition}</figcaption>
        </figure>
      ) : null}
    </dialog>
  );
}
