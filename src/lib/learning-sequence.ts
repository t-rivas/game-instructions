import type { Game, ToolState, Translation } from "./types";
const lessonTitles: Record<string, Translation[]> = {
  coup: [
    { en: "Set the table", es: "Prepara la mesa" },
    { en: "Make your move", es: "Haz tu jugada" },
    { en: "Challenge a character", es: "Desafía un personaje" },
    { en: "Stay in the game", es: "Sigue en la partida" },
    { en: "Change sides", es: "Cambia de bando" },
  ],
  avalon: [
    { en: "Deal secret roles", es: "Reparte personajes" },
    { en: "Propose a team", es: "Propón un equipo" },
    { en: "Vote together", es: "Voten juntos" },
    { en: "Go on the quest", es: "Completen la misión" },
    { en: "Protect Merlin", es: "Protejan a Merlín" },
  ],
  poker: [
    { en: "Cards, chips & blinds", es: "Cartas, fichas y ciegas" },
    { en: "Make your first bet", es: "Haz tu primera apuesta" },
    { en: "Reveal the shared cards", es: "Muestra las cartas compartidas" },
    { en: "Find the winning hand", es: "Encuentra la mano ganadora" },
  ],
  moth: [
    { en: "Meet the guard", es: "Conoce al guardián" },
    { en: "Play your card", es: "Juega tu carta" },
    { en: "Be a little sneaky", es: "Haz una pequeña trampa" },
    { en: "When the guard catches you", es: "Cuando el guardián te descubre" },
  ],
  dixit: [
    { en: "Deal the pictures", es: "Reparte las imágenes" },
    { en: "Give a clue", es: "Da una pista" },
    {
      en: "Find the storyteller’s card",
      es: "Encuentra la carta del narrador",
    },
    { en: "Count the points", es: "Cuenta los puntos" },
    { en: "Start the next round", es: "Empieza la siguiente ronda" },
  ],
};

export type LearningStage = "objective" | "components" | "setup" | "turn" | "end";
export interface LearningStep {
  id: string; stage: LearningStage; title: Translation; text?: Translation;
  basic?: number; card?: string; art?: string; rule?: string;
}
export const stageLabels: Record<LearningStage, Translation> = {
  objective: {en:"Objective", es:"Objetivo"}, components: {en:"Components", es:"Componentes"},
  setup: {en:"Setup", es:"Preparación"}, turn: {en:"Play a turn", es:"Cómo jugar"}, end: {en:"End & win", es:"Final y victoria"},
};
// Semantic identities for the old numeric lessons. Never derive persistence from display order.
const basicIds: Record<string, string[]> = {
  coup: ["deal", "action", "challenge", "influence", "reformation"],
  avalon: ["roles", "team", "vote", "quest", "assassination"],
  poker: ["deal", "bet", "streets", "showdown"], moth: ["guard", "discard", "cheat", "accusation"],
  dixit: ["deal", "clue", "vote", "score", "next-round"], catan: ["settle", "produce", "build", "victory"],
  secret_hitler: ["roles", "elect", "legislate", "powers"], el_camarero: ["orders", "serve", "correct", "score"],
  monopoly: ["bank", "roll", "build", "bankruptcy"], chess: ["board", "move", "check", "special"],
  burako: ["deal", "draw-meld-discard", "canasta", "close"], truco: ["deal", "flor-envido", "trick", "raise"],
  skull_king: ["deal", "bid", "trick", "score", "expansion"], sushi_go: ["deal", "draft", "combinations", "score"],
  sushi_go_party: ["menu", "deal", "draft", "score"],
};
export function migratedLesson(id: string, value: string | null): string {
  if (value === null) return "objective";
  if (/^\d+$/.test(value)) {
    const legacy = basicIds[id]?.[Number(value)];
    return legacy ? `basic-${legacy}` : "objective";
  }
  return value;
}
const componentNames: Record<string, Translation> = {
  coup: {en:"Character cards · coins · face-down influence", es:"Personajes · monedas · influencias boca abajo"},
  avalon: {en:"Secret roles · team votes · quest cards", es:"Personajes secretos · votos de equipo · cartas de misión"},
  poker: {en:"Private cards · community cards · chips · dealer button", es:"Cartas propias · cartas comunitarias · fichas · botón"},
  moth: {en:"Number cards · insect cards · Guard Bug", es:"Cartas numeradas · insectos · chinche guardiana"},
  dixit: {en:"Picture cards · voting pieces · rabbit markers", es:"Cartas ilustradas · fichas de voto · conejos"},
  catan: {en:"Hexes · resources · roads · settlements · cities", es:"Hexágonos · recursos · caminos · poblados · ciudades"},
  secret_hitler: {en:"Secret roles · party cards · policies · ballots", es:"Personajes secretos · partidos · políticas · votos"},
  el_camarero: {en:"Orders · food cards · bell · complaints", es:"Pedidos · platos · campana · quejas"},
  monopoly: {en:"Tokens · money · deeds · houses · hotels", es:"Peones · dinero · títulos · casas · hoteles"},
  chess: {en:"King · queen · rook · bishop · knight · pawn", es:"Rey · dama · torre · alfil · caballo · peón"},
  burako: {en:"Numbered tiles · jokers · racks · dead piles", es:"Fichas numeradas · comodines · atriles · muertos"},
  truco: {en:"Spanish deck · three-card hands · muestra", es:"Baraja española · manos de tres cartas · muestra"},
  skull_king: {en:"Numbered suits · special cards · bids", es:"Palos numerados · cartas especiales · apuestas"},
  sushi_go: {en:"Food cards · chopsticks · pudding", es:"Platos · palillos · pudín"},
  sushi_go_party: {en:"Menu tiles · food cards · desserts · score track", es:"Fichas de menú · platos · postres · marcador"},
};
const L = (en: string, es: string): Translation => ({en,es});
// Movement text is a focused restatement of new-games.js / chess / pieces.
export const chessPieces = [
  ["king", L("Move the king", "Mueve el rey"), L("Move one square in any direction. Never move into check.", "Mueve una casilla en cualquier dirección. Nunca lo dejes en jaque.")],
  ["queen", L("Move the queen", "Mueve la dama"), L("Move along a row, column or diagonal. Stop before your own pieces; capture an opponent by landing on its square. You cannot jump.", "Avanza por una fila, columna o diagonal. Detente antes de tus piezas; captura una rival al ocupar su casilla. No puedes saltar.")],
  ["rook", L("Move a rook", "Mueve una torre"), L("Move along a row or column, without jumping over pieces.", "Avanza por una fila o columna, sin saltar piezas.")],
  ["bishop", L("Move a bishop", "Mueve un alfil"), L("Move diagonally without jumping. A bishop stays on the same square color.", "Avanza en diagonal sin saltar. El alfil permanece en casillas del mismo color.")],
  ["knight", L("Move a knight", "Mueve un caballo"), L("Move in an L: two squares one way and one perpendicular. You can jump over pieces.", "Mueve en L: dos casillas en un sentido y una perpendicular. Puedes saltar piezas.")],
  ["pawn", L("Move a pawn", "Mueve un peón"), L("Advance one empty square; from its starting square, two if both are empty. Capture diagonally forward. Never move backward.", "Avanza una casilla vacía; desde el inicio, dos si ambas están libres. Captura en diagonal hacia delante. Nunca retrocede.")],
] as const;
const endBasics: Record<string, number[]> = {coup:[3],avalon:[4],poker:[3],dixit:[3,4],catan:[3],el_camarero:[3],monopoly:[3],chess:[3],burako:[3],skull_king:[3],sushi_go:[3],sushi_go_party:[3]};
export function learningSteps(id: string, game: Game, basics: Translation[], options: ToolState): LearningStep[] {
  const titles = lessonTitles[id] || [...(game.lessonTitles || []), ...(options.skullExpansion ? game.expansionLessonTitles || [] : [])];
  const old = basics.map((text, basic): LearningStep => ({id:`basic-${basicIds[id][basic]}`, stage: basic === 0 || (id === "sushi_go_party" && basic === 1) ? "setup" : endBasics[id]?.includes(basic) ? "end" : "turn", title:titles[basic], text, basic}));
  const pieces: LearningStep[] = id === "chess" ? chessPieces.map(([piece,title,text]) => ({id:`piece-${piece}`,stage:"components",title,text,art:`chess-${piece}`,rule:"pieces"})) : [];
  return [
    {id:"objective",stage:"objective",title:L("Your goal", "Tu objetivo"),text:game.goal},
    {id:"components",stage:"components",title:L("Recognize what is on the table", "Reconoce lo que hay en la mesa"),text:componentNames[id]},
    ...pieces,
    ...old.filter(s=>s.stage === "setup"),
    ...(id === "avalon" ? [
      {id:"avalon-prepare",stage:"setup" as const,title:L("Prepare and deal", "Prepara y reparte")},
      {id:"avalon-opening",stage:"setup" as const,title:L("Read the opening script", "Lee el guion inicial")},
    ] : []),
    ...old.filter(s=>s.stage === "turn"),
    ...(["coup","avalon","skull_king"].includes(id) ? [{id:"example",stage:"turn" as const,title:L("See what happens and why", "Mira qué pasa y por qué")}] : []),
    ...old.filter(s=>s.stage === "end"),
    {id:"finish",stage:"end",title:L("At the table", "En la mesa"),text:game.reminder},
  ];
}
