import data from "@/generated/glossary.json";
import type { GlossaryTerm, Language } from "./types";
export const glossary: GlossaryTerm[] = data;
import { glossaryParts as parseParts } from "@/generated/glossary-parser";
export const glossaryParts = parseParts as (game: string, text: string, lang: Language) => {text: string; term?: GlossaryTerm}[];
export function glossaryVocabulary(game: string): [string[], string[]][] {
  return glossary.filter(term => term.game === game).map(term => [
    [term.label.en, ...term.aliases.en], [term.label.es, ...term.aliases.es],
  ]);
}
