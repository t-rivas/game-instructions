"use client";
import { selectedSetup, setupSummary } from "@/generated/setup-context";
import type { Game, Language, ToolState } from "@/lib/types";
export function GuideSetupContext({id, game, lang, options, ready, onChange}: {
  id: string; game: Game; lang: Language; options: ToolState; ready: boolean;
  onChange: (players: number | null) => void;
}) {
  const copy = selectedSetup(id, options);
  if (!copy.length) return null;
  const tr = (en: string, es: string) => lang === "es" ? es : en;
  const max = id === "coup" ? 10 : id === "sushi_go_party" ? 8 : 0;
  const sections = [...game.sections, ...(game.expansionSections || [])].filter(section =>
    ["setup", "menu", "deal", "base-options", "pirate-powers", "expansion-setup"].includes(section.id));
  return <section className="block guide-setup-context" aria-labelledby="guide-setup-title">
    <h2 id="guide-setup-title">{tr("Rules for your setup", "Reglas para tu preparación")}</h2>
    {max ? <div className="field">
      <label htmlFor="guide-player-count">{tr("Guide player count (optional)", "Jugadores en la guía (opcional)")}</label>
      <select id="guide-player-count" disabled={!ready} value={options.guidePlayers || ""}
        onChange={event => onChange(event.target.value ? Number(event.target.value) : null)}>
        <option value="">{tr("Not chosen · general guidance", "Sin elegir · orientación general")}</option>
        {Array.from({length:max-1}, (_,i)=>i+2).map(n=><option key={n} value={n}>{n}</option>)}
      </select>
    </div> : null}
    <p role="status" aria-atomic="true">{setupSummary(id, options)[lang]}</p>
    <details><summary>{tr("Setup details for this choice", "Detalles de esta preparación")}</summary>
      {copy.map((p,i)=><p key={i}>{p[lang]}</p>)}
    </details>
    <details><summary>{tr("Other player counts / variants", "Otras cantidades de jugadores / variantes")}</summary>
      {sections.map(section => <div key={section.id}><h3>{section.title[lang]}</h3>{section.paragraphs.map((p,i)=><p key={i}>{p[lang]}</p>)}</div>)}
    </details>
  </section>;
}
