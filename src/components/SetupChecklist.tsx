"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readStored, writeStored } from "@/lib/browser-storage";
import type { Language, Translation } from "@/lib/types";
export function SetupChecklist({
  id,
  lang,
  steps,
  signature,
  ready,
}: {
  id: string;
  lang: Language;
  steps: Translation[];
  signature: string;
  ready: boolean;
}) {
  const [checked, setChecked] = useState<boolean[]>(steps.map(() => false)),
    [saveError, setSaveError] = useState(false);
  const tr = (en: string, es: string) => (lang === "es" ? es : en),
    key = `tablefolk-setup-checklist-${id}`;
  useEffect(() => {
    if (!ready) return;
    const saved = readStored<{ signature?: string; checked?: unknown }>(
      key,
      {},
    );
    setChecked(
      saved.signature === signature &&
        Array.isArray(saved.checked) &&
        saved.checked.length === steps.length &&
        saved.checked.every((value) => typeof value === "boolean")
        ? saved.checked
        : steps.map(() => false),
    );
    if (saved.signature && saved.signature !== signature)
      setSaveError(
        !writeStored(key, { signature, checked: steps.map(() => false) }),
      );
  }, [key, signature, steps.length, ready]);
  const save = (next: boolean[]) => {
    setChecked(next);
    setSaveError(!writeStored(key, { signature, checked: next }));
  };
  const done = checked.filter(Boolean).length;
  return (
    <div className="setup-checklist">
      <div className="checklist-heading">
        <h3>{tr("Before you begin", "Antes de comenzar")}</h3>
        <span role="status" aria-atomic="true">
          {done} / {steps.length} {tr("checked", "listos")}
        </span>
      </div>
      <ol>
        {steps.map((step, i) => (
          <li key={i} className={checked[i] ? "checked" : ""}>
            <label>
              <input
                type="checkbox"
                disabled={!ready}
                id={`setup-check-${i}`}
                checked={checked[i] || false}
                onChange={(event) =>
                  save(
                    steps.map((_, j) =>
                      j === i ? event.target.checked : checked[j] || false,
                    ),
                  )
                }
              />
              <span>
                <span className="setup-step-number" aria-hidden="true">
                  {i + 1}.
                </span>{" "}
                {step[lang]}
              </span>
            </label>
          </li>
        ))}
      </ol>
      {saveError ? (
        <p role="status">
          {tr(
            "The checklist could not be saved on this device.",
            "No se pudo guardar la lista en este dispositivo.",
          )}
        </p>
      ) : null}
      <div className="checklist-actions">
        <Link
          prefetch={false}
          id="setup-ready"
          className="accent-button"
          href={`/${lang}/${id}/play/`}
        >
          {tr("Ready to play", "Listo para jugar")}{" "}
          <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          disabled={!ready}
          onClick={() => save(steps.map(() => false))}
        >
          {tr("Clear checklist", "Limpiar lista")}
        </button>
      </div>
    </div>
  );
}
