export type Language = "en" | "es";
export type View = "learn" | "play" | "rules";
export type Translation = Record<Language, string>;
export interface RuleSection {
  id: string;
  title: Translation;
  paragraphs: Translation[];
}
export interface Game {
  name: Translation;
  subtitle: Translation;
  category: Translation;
  description: Translation;
  goal: Translation;
  reminder: Translation;
  players: string;
  time: string;
  icon: string;
  color: string;
  basics: Translation[];
  lessonTitles?: Translation[];
  sections: RuleSection[];
  sources: [Translation | string, string][];
  caption?: Translation;
  edition?: Translation;
  expansionBasics?: Translation[];
  expansionLessonTitles?: Translation[];
  expansionSections?: RuleSection[];
}
export interface Artwork {
  src: string;
  width: number;
  height: number;
  title: Translation;
  officialId?: string;
}
export interface LessonCard {
  id: string;
  art: Artwork;
  name?: Translation;
  effect: Translation;
  when: Translation;
  rule: string;
  note?: Translation;
  exchange?: "ambassador" | "inquisitor";
  expansion?: boolean;
  role?: string;
}
export interface SkullTrickTeaching {
  copy: Record<string, Translation>;
  cards: Record<string, { name: Translation; art?: string; rank?: number; suit?: Translation; declaration?: Translation }>;
  artwork: Record<string, Artwork>;
  scenarios: {
    id: string; title: Translation; group: "base" | "options" | "powers" | "expansion";
    lead: Translation; plays: string[]; hand: {card: string; legal: boolean; why: Translation}[];
    winner: number | null; next: number; reasons: Translation[]; after: Translation;
    source: string; sourceUrl: string; rule: string;
  }[];
}
export interface ScoringTeaching {
  title: Translation; intro: Translation; ending: Translation;
  scenarios: {
    id: string; title: Translation; context: Translation; control: Translation; rule: string;
    source: {url: string; section: string};
    states: {
      label: Translation; condition: Translation; explanation: Translation;
      cards: {label: Translation; art?: string | null; count: number; note?: Translation | null}[];
      votes?: {player: string; card: number}[];
      rows: {label: Translation; terms: {label: Translation; expression: string; value: number}[]}[];
    }[];
  }[];
}
export interface LessonCardTeaching {
  comparisons?: LessonComparison[];
  comparisonArtwork?: Record<string, Artwork>;
  setupArtwork?: Record<string, Artwork>;
  practice: PracticeDecision[];
  scoring?: ScoringTeaching;
  scoringArtwork?: Record<string, Artwork>;
  components?: Artwork;
  pieces?: Record<string, Artwork>;
  avalon?: AvalonTeaching;
  tricks?: SkullTrickTeaching;
  coup?: CoupTeaching;
  steps: string[][];
  cards: Record<string, LessonCard>;
}
export interface LessonComparison {
  id: string; lessons: string[]; basic: number; rule: string;
  question: Translation; context: Translation; difference: Translation; exception: Translation;
  source: {url: string; section: Translation};
  situations: {
    label: Translation; fact: Translation; result: string; outcome: Translation; explanation: Translation;
    groups: {
      label: Translation; quantity?: Translation; after?: boolean;
      items: {label?: Translation; name: Translation; art?: string; rank?: number; suit?: Translation;
        symbol?: string; symbolLabel?: Translation; changed?: boolean; compact?: boolean; note?: Translation}[];
    }[];
  }[];
}
export interface PracticeDecision {
  id: string; lessons: string[]; optionIds: string[]; cards?: string[];
  question: Translation; choices: Translation[]; answer: number;
  explanation: Translation; feedback: Translation[]; section: string;
  revisit: string; example?: string; exampleFact?: number;
}
export interface CoupTeaching {
  copy: Record<string, Translation>;
  roles: { id: string; exchange?: "ambassador" | "inquisitor"; action: Translation; block: Translation }[];
  scenarios: { id: string; start: string; art: string }[];
  nodes: Record<string, {
    phase: string; title: Translation; explanation: Translation;
    players: { name: string; coins: number; hidden: number; lost: string[]; proof: string | null }[];
    choices: { to: string; label: Translation }[];
    next: number | null;
  }>;
}
export interface GameCardData {
  id: string;
  game: Pick<
    Game,
    "name" | "category" | "description" | "players" | "time" | "color"
  >;
  cover: Artwork;
}
export type ToolKind =
  | "lesson-helper"
  | "practice-helper"
  | "play"
  | "helper"
  | "setup"
  | "sources"
  | "setup-roles"
  | "setup-components"
  | "setup-script";
export interface ToolState {
  game?: string;
  exchange: "ambassador" | "inquisitor";
  reformation: boolean;
  skullExpansion: boolean;
  guidePlayers?: number | null;
  players: number;
  avalonMode: string;
  optional: string[];
  lady: boolean;
}
export interface ToolRuntime {
  state: ToolState;
  setRoute(lang: Language, game: string, view: View, choices?: Partial<ToolState> | null): void;
  update(patch: Partial<ToolState>): void;
  subscribe(notify: () => void): () => void;
  view(kind: ToolKind): string;
  bind(kind: ToolKind): void;
  lessonSteps(): Translation[];
  savedGames(): SavedGame[];
  playStatus(): { active: boolean; storage: boolean };
}

export interface SavedGame {
  id: string;
  phase?: string;
  players?: { name: string; score: number }[];
  completed?: number;
  goal?: number;
  remaining?: number[];
}

export interface AvalonTeaching {
  setups: Record<number, {good: number; evil: number; quests: number[]}>;
  roles: {id: string; side: string; name: Translation; text: Translation}[];
  generic: Record<string, {id: string; side: string; name: Translation; text: Translation}>;
  unknown: Record<string, Translation>;
  copy: Record<string, Translation>;
}

export interface GlossaryTerm {
  game: string; id: string; label: Translation; definition: Translation;
  aliases: Record<Language, string[]>; rule: string;
}
