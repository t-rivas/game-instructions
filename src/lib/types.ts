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
export interface GameCardData {
  id: string;
  game: Pick<
    Game,
    "name" | "category" | "description" | "players" | "time" | "color"
  >;
  cover: Artwork;
}
export type ToolKind = "play" | "helper" | "setup" | "sources";
export interface ToolState {
  exchange: "ambassador" | "inquisitor";
  reformation: boolean;
  skullExpansion: boolean;
  players: number;
  avalonMode: string;
  optional: string[];
  lady: boolean;
}
export interface ToolRuntime {
  state: ToolState;
  setRoute(lang: Language, game: string, view: View): void;
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
