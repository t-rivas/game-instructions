"use client";
import { GlossaryText } from "./GlossaryText";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readStored, writeStored } from "@/lib/browser-storage";
import type { Artwork, Language, Translation } from "@/lib/types";
import { SetupDiagram } from "./SetupDiagram";
export function SetupChecklist({
  id,
  lang,
  steps,
  signature,
  ready,
  activeIndices,
  showActions = true,
  guided = false,
  temporary = false,
  readyHref,
  onContinue,
  artwork = {},
  players,
}: {
  id: string;
  lang: Language;
  steps: Translation[];
  signature: string;
  ready: boolean;
  activeIndices?: number[];
  showActions?: boolean;
  guided?: boolean;
  temporary?: boolean;
  readyHref?: string;
  onContinue?: () => void;
  artwork?: Record<string, Artwork>;
  players?: number | null;
}) {
  const [checked, setChecked] = useState<boolean[]>(steps.map(() => false)),
    [saveError, setSaveError] = useState(false);
  const [examplePlayers, setExamplePlayers] = useState(4);
  const tr = (en: string, es: string) => (lang === "es" ? es : en),
    key = `tablefolk-setup-checklist-${id}`;
  useEffect(() => {
    if (!ready) return;
    if (temporary) {
      setChecked(steps.map(() => false));
      return;
    }
    const saved = readStored<{ signature?: string; checked?: unknown }>(
      key,
      {},
    );
    setChecked(
      saved.signature === signature &&
        Array.isArray(saved.checked) &&
        (saved.checked.length === steps.length ||
          (id === "avalon" && saved.checked.length === steps.length - 1)) &&
        saved.checked.every((value) => typeof value === "boolean")
        ? steps.map((_, i) => (saved.checked as boolean[])[i] || false)
        : steps.map(() => false),
    );
    if (saved.signature && saved.signature !== signature)
      setSaveError(
        !writeStored(key, { signature, checked: steps.map(() => false) }),
      );
  }, [key, signature, steps.length, ready, temporary]);
  const save = (next: boolean[]) => {
    setChecked(next);
    if (!temporary)
      setSaveError(!writeStored(key, { signature, checked: next }));
  };
  const done = checked.filter(Boolean).length;
  return (
    <div className="setup-checklist">
      <div className="checklist-heading">
        {!guided ? <h3>{tr("Before you begin", "Antes de comenzar")}</h3> : null}
        <span role="status" aria-atomic="true">
          {done} / {steps.length} {tr("checked", "listos")}
        </span>
      </div>
      <ol>
        {steps.map((step, i) => (
          <li
            key={i}
            hidden={activeIndices ? !activeIndices.includes(i) : false}
            className={checked[i] ? "checked" : ""}
          >
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
                {<GlossaryText game={id} text={step[lang]} lang={lang} />}
              </span>
            </label>
            {id === "sushi_go_party" && i === 2 && !players ? <div className="setup-example-picker">
              <label htmlFor="setup-example-players">{tr("Players in this example", "Personas en este ejemplo")}</label>
              <select id="setup-example-players" value={examplePlayers} onChange={event => setExamplePlayers(Number(event.target.value))}>
                {[2,3,4,5,6,7,8].map(count => <option value={count} key={count}>{count}</option>)}
              </select>
            </div> : null}
            <SetupDiagram game={id} index={i} lang={lang} players={players || examplePlayers} artwork={artwork} />
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
      {showActions ? (
        <details className="setup-secondary" open={guided ? undefined : true}>
          <summary>{tr("Checklist options", "Opciones de la lista")}</summary>
        <div className="checklist-actions">
          {onContinue && !guided ? <button type="button" id="setup-ready" className="accent-button" onClick={onContinue}>
            {tr("Continue learning", "Seguir aprendiendo")} →
          </button> : null}
          <Link prefetch={false} href={readyHref || `/${lang}/${id}/play/`}>
            {tr("Go straight to the table", "Ir directo a la mesa")} →
          </Link>
          <button
            type="button"
            disabled={!ready}
            onClick={() => save(steps.map(() => false))}
          >
            {tr("Clear checklist", "Limpiar lista")}
          </button>
        </div>
        </details>
      ) : null}
    </div>
  );
}
