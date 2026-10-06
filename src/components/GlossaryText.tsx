"use client";
import { useId, useRef, useState } from "react";
import { glossaryParts } from "@/lib/glossary";
import type { GlossaryTerm, Language } from "@/lib/types";
function Term({text, term, lang, explain}: {text: string; term: GlossaryTerm; lang: Language; explain: boolean}) {
  const [open,setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => {setOpen(false);trigger.current?.focus();};
  if (explain) return <span className="glossary-term" data-glossary-term={term.id}><dfn>{text}</dfn><span className="glossary-definition"> ({term.definition[lang]})</span></span>;
  return <span className="glossary-term" data-glossary-term={term.id} onKeyDown={event => {if(event.key === "Escape" && open){event.stopPropagation();close();}}}>
    <button type="button" className="glossary-trigger" ref={trigger} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{text}</button>
    <span id={id} className={`glossary-disclosure ${open ? "is-open" : ""}`}>
      <span className="glossary-definition"> ({term.definition[lang]})</span>
      <button type="button" className="glossary-close" onClick={close}>{lang === "es" ? "Cerrar definición" : "Close definition"}</button>
    </span>
  </span>;
}
export function GlossaryText({game, text, lang, explain = true}: {game: string; text: string; lang: Language; explain?: boolean}) {
  return <>{glossaryParts(game,text,lang).map((part,index)=>part.term ? <Term key={`${lang}-${part.term.id}-${text}`} text={part.text} term={part.term} lang={lang} explain={explain}/> : <span key={index}>{part.text}</span>)}</>;
}
