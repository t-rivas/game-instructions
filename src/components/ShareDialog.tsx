"use client";
import { trapDialogTab } from "@/lib/dialog-focus";
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
    [copying, setCopying] = useState(false),
    [feedback, setFeedback] = useState<"success" | "notice" | "error">("notice"),
    [native, setNative] = useState(false);
  const generation = useRef(0), handledCloses = useRef(0);
  const tr = (en: string, es: string) => (lang === "es" ? es : en);
  useEffect(() => {
    generation.current++;
    setLink(new URL(href, location.origin).href);
    setStatus("");
    setQR("");
    setLoading(false);
    setCopying(false);
    setFeedback("notice");
    setNative(typeof navigator.share === "function");
  }, [open, href]);
  useEffect(() => {
    const node = dialog.current!;
    if (open && !node.open) {
      opener.current = document.activeElement as HTMLElement;
      node.showModal();
      node.scrollTop = 0;
      node.querySelector<HTMLButtonElement>("#copy-rule-link")?.focus({ preventScroll: true });
    } else if (!open && node.open) {
      handledCloses.current++;
      node.close();
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
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
    setCopying(true);
    setStatus("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Unavailable");
      await navigator.clipboard.writeText(link);
      if (generation.current === current) {
        setFeedback("success");
        setStatus(tr("Link copied", "Enlace copiado"));
      }
    } catch {
      if (generation.current !== current) return;
      setFeedback("notice");
      field.current?.focus();
      field.current?.select();
      setStatus(
        tr(
          "Link selected. Press Ctrl/Cmd+C to copy, or touch and hold the link.",
          "Enlace seleccionado. Pulsa Ctrl/Cmd+C para copiar o mantén presionado el enlace.",
        ),
      );
    } finally {
      if (generation.current === current) setCopying(false);
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
      if (generation.current === current) {
        setFeedback("error");
        setStatus(
          tr(
            "QR code unavailable. Use the link above.",
            "Código QR no disponible. Usa el enlace de arriba.",
          ),
        );
      }
    } finally {
      if (generation.current === current) setLoading(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      inert={!open}
      onKeyDown={(event) => trapDialogTab(event.currentTarget, event)}
      id="share-dialog"
      className="share-dialog"
      aria-labelledby="share-title"
      aria-describedby="share-context share-edition"
      onCancel={(event) => {
        event.preventDefault();
        handledCloses.current++;
        event.currentTarget.inert = true;
        event.currentTarget.close();
        onClose();
      }}
      onClose={(event) => {
        // Owned close requests already updated React. Consume their queued native
        // events even if a new opening has committed before showModal runs.
        if (handledCloses.current) { handledCloses.current--; return; }
        if (event.currentTarget.open) return;
        onClose();
        if (opener.current?.isConnected && (document.activeElement === document.body || event.currentTarget.contains(document.activeElement))) opener.current.focus({ preventScroll: true });
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="share-title">
          {tr("Share link", "Compartir enlace")}
        </h2>
        <button
          type="button"
          aria-label={tr("Close sharing", "Cerrar opciones para compartir")}
          className="dialog-close"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
          <span>{tr("Close", "Cerrar")}</span>
        </button>
      </div>
      <p id="share-context">{title}</p>
      <p id="share-edition">
        <strong>{tr("Shared edition", "Edición compartida")}: </strong>
        {edition}
      </p>
      <label htmlFor="share-link">
        {tr("Guide or rule link", "Enlace de la guía o regla")}
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
          className="accent-button"
          disabled={!link || copying}
          aria-busy={copying}
          onClick={copy}
        >
          {copying ? tr("Copying…", "Copiando…") : tr("Copy link", "Copiar enlace")}
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
                if (generation.current === current) {
                  setFeedback("success");
                  setStatus(tr("Shared", "Compartido"));
                }
              } catch (error) {
                if (generation.current !== current) return;
                setFeedback("notice");
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
          aria-busy={loading}
          onClick={showQR}
        >
          {loading
            ? tr("Creating QR…", "Creando QR…")
            : tr("Show QR", "Mostrar QR")}
        </button>
      </div>
      <p className="share-feedback" data-tone={feedback} role="status" aria-live="polite" aria-atomic="true">
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
