/* Game-scoped terminology; source sections are recorded in docs/glossary-sources.md. */
const CONTEXTUAL_GLOSSARY = [
  {
    "game": "skull_king",
    "id": "trick",
    "label": {
      "en": "trick",
      "es": "baza"
    },
    "definition": {
      "en": "One set of played cards: each player plays one card. Resolve it before starting the next trick; some special cards can leave it without a winner.",
      "es": "Un conjunto de cartas jugadas: cada persona juega una carta. Se resuelve antes de empezar la próxima baza; algunas cartas especiales pueden dejarla sin ganador."
    },
    "aliases": {
      "en": [
        "tricks"
      ],
      "es": [
        "bazas"
      ]
    },
    "rule": "tricks"
  },
  {
    "game": "skull_king",
    "id": "trump",
    "label": {
      "en": "trump",
      "es": "triunfo"
    },
    "definition": {
      "en": "The black numbered suit. It beats the other numbered suits, but character cards can beat it.",
      "es": "El palo de las cartas numeradas negras. Supera los otros palos numéricos, pero los personajes pueden vencerlo."
    },
    "aliases": {
      "en": [],
      "es": []
    },
    "rule": "hierarchy"
  },
  {
    "game": "skull_king",
    "id": "bid",
    "label": {
      "en": "bid",
      "es": "apuesta"
    },
    "definition": {
      "en": "Your prediction of how many tricks you will win this round. Scoring compares this number with the tricks you actually win.",
      "es": "Tu predicción de cuántas bazas ganarás en esta ronda. La puntuación compara ese número con las bazas que realmente ganas."
    },
    "aliases": {
      "en": [
        "bids",
        "bidding"
      ],
      "es": [
        "apuestas"
      ]
    },
    "rule": "scoring"
  },
  {
    "game": "coup",
    "id": "influence",
    "label": {
      "en": "influence",
      "es": "influencia"
    },
    "definition": {
      "en": "Each face-down character card is one influence. Losing influence means choosing one to turn face up permanently; losing both eliminates you.",
      "es": "Cada carta de personaje boca abajo es una influencia. Perder influencia significa elegir una y dejarla boca arriba para siempre; perder las dos te elimina."
    },
    "aliases": {
      "en": [
        "influences"
      ],
      "es": [
        "influencias"
      ]
    },
    "rule": "setup"
  },
  {
    "game": "coup",
    "id": "challenge",
    "label": {
      "en": "challenge",
      "es": "desafío"
    },
    "definition": {
      "en": "A demand to prove a claimed character. Whoever loses the challenge loses one influence.",
      "es": "Un pedido de demostrar el personaje declarado. Quien pierde el desafío pierde una influencia."
    },
    "aliases": {
      "en": [
        "challenges"
      ],
      "es": [
        "desafíos"
      ]
    },
    "rule": "challenges"
  },
  {
    "game": "coup",
    "id": "block",
    "label": {
      "en": "block",
      "es": "bloqueo"
    },
    "definition": {
      "en": "A character claim that stops a permitted action if it stands. A block can itself be challenged.",
      "es": "Una declaración de personaje que detiene una acción que admite ese bloqueo, si la declaración se sostiene. El bloqueo también puede ser desafiado."
    },
    "aliases": {
      "en": [
        "blocks"
      ],
      "es": [
        "bloqueos"
      ]
    },
    "rule": "turn"
  },
  {
    "game": "avalon",
    "id": "quest",
    "label": {
      "en": "quest",
      "es": "misión"
    },
    "definition": {
      "en": "An approved team secretly plays quest cards. Their combined result determines whether this mission succeeds or fails.",
      "es": "Un equipo aprobado juega cartas de misión en secreto. El resultado conjunto determina si esta misión tiene éxito o fracasa."
    },
    "aliases": {
      "en": [
        "quests"
      ],
      "es": [
        "misiones"
      ]
    },
    "rule": "quests"
  },
  {
    "game": "avalon",
    "id": "leader",
    "label": {
      "en": "Leader",
      "es": "Líder"
    },
    "definition": {
      "en": "The player who proposes the quest team. Everyone votes on that proposal; being Leader does not mean choosing the result.",
      "es": "La persona que propone el equipo de la misión. Todos votan esa propuesta; ser Líder no significa elegir el resultado."
    },
    "aliases": {
      "en": [
        "leader"
      ],
      "es": [
        "líder"
      ]
    },
    "rule": "teams"
  },
  {
    "game": "truco",
    "id": "muestra",
    "label": {
      "en": "muestra",
      "es": "muestra"
    },
    "definition": {
      "en": "The card revealed beneath the deck after dealing. Its suit determines which cards are pieces for this hand.",
      "es": "La carta revelada debajo del mazo después de repartir. Su palo determina cuáles son las piezas de esta mano."
    },
    "aliases": {
      "en": [],
      "es": []
    },
    "rule": "setup"
  },
  {
    "game": "truco",
    "id": "mano",
    "label": {
      "en": "mano",
      "es": "mano"
    },
    "definition": {
      "en": "As a player: the person to the dealer’s right who leads first and has tie priority. In “the hand”, hand means the deal of three cards per player, with up to three tricks.",
      "es": "Como jugador: la persona a la derecha de quien reparte, que sale primero y tiene prioridad en los empates. En «la mano», mano significa el reparto de tres cartas por persona, con hasta tres bazas."
    },
    "aliases": {
      "en": [],
      "es": []
    },
    "rule": "setup"
  },
  {
    "game": "truco",
    "id": "trick",
    "label": {
      "en": "trick",
      "es": "baza"
    },
    "definition": {
      "en": "One play of a card by each player. The hand contains up to three tricks; the ranking decides each winner.",
      "es": "Una jugada de una carta por persona. La mano tiene hasta tres bazas; la jerarquía decide quién gana cada una."
    },
    "aliases": {
      "en": [
        "tricks"
      ],
      "es": [
        "bazas"
      ]
    },
    "rule": "tricks"
  },
  {
    "game": "catan",
    "id": "longest-road",
    "label": {
      "en": "Longest Road",
      "es": "Camino más largo"
    },
    "definition": {
      "en": "A two-point award, first claimed with at least five connected roads. Another player needs a longer eligible route to take it; branches do not all add together.",
      "es": "Un premio de dos puntos que se obtiene primero con al menos cinco caminos conectados. Para quitarlo hay que tener una ruta válida más larga; las ramificaciones no se suman todas."
    },
    "aliases": {
      "en": [],
      "es": [
        "Gran Ruta Comercial",
        "Ruta comercial más larga"
      ]
    },
    "rule": "building"
  },
  {
    "game": "catan",
    "id": "largest-army",
    "label": {
      "en": "Largest Army",
      "es": "Gran ejército"
    },
    "definition": {
      "en": "A two-point award, first claimed by playing three Knight cards. Another player must play more Knights to take it.",
      "es": "Un premio de dos puntos que se obtiene primero al jugar tres cartas de Caballero. Para quitarlo, otra persona debe jugar más Caballeros."
    },
    "aliases": {
      "en": [],
      "es": []
    },
    "rule": "building"
  }
];
// Annotate plain strings, never HTML. Each term is explained once per passage.
function glossaryParts(game, text, lang) {
 const candidates = CONTEXTUAL_GLOSSARY.filter(term => term.game === game);
 const parts = []; const seen = new Set();
 const words = /[\p{L}\p{N}]/u;
 let cursor = 0;
 while (cursor < text.length) {
  let best = null;
  for (const term of candidates) {
   if (seen.has(term.id)) continue;
   for (const label of [term.label[lang], ...term.aliases[lang]]) {
    let index = text.toLocaleLowerCase().indexOf(label.toLocaleLowerCase(), cursor);
    while (index >= 0 && ((index > 0 && words.test(text[index-1])) || words.test(text[index+label.length] || ''))) index = text.toLocaleLowerCase().indexOf(label.toLocaleLowerCase(), index+1);
    if (index >= 0 && (!best || index < best.index || (index === best.index && label.length > best.label.length))) best = {index,label,term};
   }
  }
  if (!best) {parts.push({text:text.slice(cursor)});break;}
  if (best.index > cursor) parts.push({text:text.slice(cursor,best.index)});
  parts.push({text:text.slice(best.index,best.index+best.label.length),term:best.term});
  seen.add(best.term.id);cursor=best.index+best.label.length;
 }
 return parts;
}
function glossaryText(game, text) {
 return glossaryParts(game,text,state.lang).map(part => part.term ? `<span class="glossary-term" data-glossary-term="${part.term.id}"><dfn>${escapeHTML(part.text)}</dfn><span class="glossary-definition"> (${escapeHTML(part.term.definition[state.lang])})</span></span>` : escapeHTML(part.text)).join('');
}
