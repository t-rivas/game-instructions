import { selectedSetup } from "@/generated/setup-context";
import type { ToolState, Translation } from "./types";
const step = (en: string, es: string): Translation => ({ en, es });
const steps: Record<string, Translation[]> = {
  coup: [
    step(
      "Choose five character types and set aside extra copies. Use 3 copies each for 2–6 players, 4 for 7–8, or 5 for 9–10.",
      "Elige cinco tipos de personaje y aparta las copias extra. Usa 3 copias de cada uno para 2–6 jugadores, 4 para 7–8 o 5 para 9–10.",
    ),
    step(
      "Deal 2 secret cards and give 2 coins to each player. Keep the remaining deck and coins in the center.",
      "Reparte 2 cartas secretas y entrega 2 monedas a cada persona. Deja el mazo y las monedas restantes en el centro.",
    ),
    step(
      "Choose who starts. With two players, the starting player receives only 1 coin.",
      "Elijan quién empieza. Con dos jugadores, quien empieza recibe solo 1 moneda.",
    ),
  ],
  avalon: [
    step(
      "Use the board for your player count and place the quest and rejection markers at their starting positions.",
      "Usa el tablero para la cantidad de jugadores y coloca los marcadores de misión y rechazo en sus posiciones iniciales.",
    ),
    step(
      "Give everyone Approve and Reject tokens, then deal the selected secret roles face down. Keep quest cards and result markers nearby.",
      "Entrega las fichas de Aprobar y Rechazar y reparte los personajes elegidos boca abajo. Deja cerca las cartas de misión y los marcadores de resultado.",
    ),
    step(
      "Choose the first Leader randomly and read the opening script for the selected roles. Keep every character secret.",
      "Elijan al azar al primer Líder y lean el guion inicial para los personajes elegidos. Mantengan cada personaje en secreto.",
    ),
  ],
  poker: [
    step(
      "Agree on chip values, starting chips, blinds and when the session ends. For a tournament, also agree on the blind schedule and entry rules.",
      "Acuerden el valor y la cantidad inicial de fichas, las ciegas y cuándo termina la sesión. Para un torneo, acuerden también el programa de ciegas y las reglas de entrada.",
    ),
    step(
      "Shuffle a standard 52-card deck. Choose the dealer button and post the small and big blinds.",
      "Mezcla un mazo estándar de 52 cartas. Elijan el botón del repartidor y coloquen las ciegas pequeña y grande.",
    ),
    step(
      "Deal 2 private cards to each player. Keep space for 5 shared cards and the pot.",
      "Reparte 2 cartas privadas a cada persona. Deja lugar para 5 cartas compartidas y el pozo.",
    ),
  ],
  moth: [
    step(
      "Give the Guard Bug to the oldest player. Set it apart from the hand cards.",
      "Entrega la Chinche Guardiana a la persona de más edad. Sepárala de las cartas de mano.",
    ),
    step(
      "Shuffle the other cards and deal 8 to each player. Place the rest as a draw pile.",
      "Mezcla las demás cartas y reparte 8 a cada persona. Deja el resto como mazo para robar.",
    ),
    step(
      "Reveal the top card to start the discard pile. Use its number only; ignore its action. The guard starts.",
      "Revela la carta superior para iniciar el descarte. Usa solo su número; ignora su acción. Empieza el guardián.",
    ),
  ],
  dixit: [
    step(
      "Choose colors, place the rabbits at 0 and shuffle the illustrated cards.",
      "Elijan colores, coloquen los conejos en 0 y mezclen las cartas ilustradas.",
    ),
    step(
      "Deal 6 cards each, or 7 with three players. Keep a draw pile and space for numbered face-up cards.",
      "Reparte 6 cartas a cada persona, o 7 con tres jugadores. Deja un mazo para robar y espacio para las cartas numeradas boca arriba.",
    ),
    step(
      "Give everyone their voting dial. The first person ready with a clue becomes the storyteller.",
      "Entrega los diales de votación. La primera persona que tenga una pista preparada será narradora.",
    ),
  ],
  catan: [
    step(
      "Build the beginner board or arrange the terrain, number tokens and sea frame. Put the robber on the desert.",
      "Arma el tablero inicial o distribuye los terrenos, números y marco de mar. Coloca al ladrón en el desierto.",
    ),
    step(
      "Sort resource and development cards. Put Longest Road and Largest Army within reach.",
      "Separa las cartas de recursos y desarrollo. Deja a mano Camino más largo y Gran ejército.",
    ),
    step(
      "For a custom layout, place one settlement and adjacent road clockwise, then the second pair in reverse order. Keep neighboring intersections empty. Take resources from the second settlement. For the fixed beginner layout, follow your box’s positions and starting resources.",
      "Con un mapa propio, coloquen un poblado y un camino adyacente en sentido horario y el segundo par en orden inverso. Dejen libres las intersecciones vecinas. Reciban recursos del segundo poblado. Para el mapa inicial fijo, sigan las posiciones y recursos de su caja.",
    ),
  ],
  secret_hitler: [
    step(
      "Choose the boards and role distribution for your player count. Pair each secret role with its party card, place them in envelopes and deal one each.",
      "Elige los tableros y la distribución de personajes según la cantidad de jugadores. Junta cada personaje con su partido, colócalos en sobres y reparte uno a cada persona.",
    ),
    step(
      "Give everyone voting cards, prepare the policy deck and set the election tracker to 0. Choose the first Presidential candidate.",
      "Entrega las cartas de votación, prepara el mazo de políticas y coloca el contador electoral en 0. Elijan al primer candidato a Presidente.",
    ),
    step(
      "Follow the opening recognition procedure for your player count. Hitler keeps eyes closed with 7–10 players.",
      "Sigan el procedimiento inicial de reconocimiento según la cantidad de jugadores. Hitler mantiene los ojos cerrados con 7–10 jugadores.",
    ),
  ],
  el_camarero: [
    step(
      "Separate the order cards into drink, starter, main dish, side and dessert. Give everyone one card from each category.",
      "Separa los pedidos en bebida, entrada, plato principal, guarnición y postre. Entrega a cada persona una carta de cada categoría.",
    ),
    step(
      "Choose a variant on each card, announce the whole order and place the cards face down with the chosen variant toward you.",
      "Elige una variante de cada carta, anuncia el pedido completo y colócalas boca abajo con la variante elegida hacia ti.",
    ),
    step(
      "Listen to and memorize everyone’s order. Once the order round ends, leave the cards face down.",
      "Escucha y memoriza todos los pedidos. Al terminar la ronda de pedidos, deja las cartas boca abajo.",
    ),
  ],
  monopoly: [
    step(
      "Lay out the board and shuffle Chance and Community Chest. Everyone chooses a token and starts on GO.",
      "Coloca el tablero y mezcla Suerte y Caja de Comunidad. Cada persona elige una ficha y empieza en SALIDA.",
    ),
    step(
      "Choose a Banker. Give each player 1500 in classic play; follow your box if its edition differs. Keep bank assets separate.",
      "Elijan un Banquero. Entrega 1500 a cada persona en el juego clásico; sigue la caja si tu edición es distinta. Mantén separados los bienes del banco.",
    ),
    step(
      "Roll to choose the first player: the highest roll starts. Continue clockwise.",
      "Tiren los dados para elegir quién empieza: comienza la tirada más alta. Continúen en sentido horario.",
    ),
  ],
  chess: [
    step(
      "Place the board with a light square in the near-right corner.",
      "Coloca el tablero con una casilla clara en la esquina derecha más cercana.",
    ),
    step(
      "Place rooks, knights, bishops, queen, king, bishop, knight and rook along the back rank. Queens start on their own color; add the pawns in front.",
      "Coloca torre, caballo, alfil, dama, rey, alfil, caballo y torre en la fila del fondo. Cada dama empieza en su color; coloca los peones delante.",
    ),
    step(
      "Choose colors. White moves first. If using the clock, agree on time and increment before starting.",
      "Elijan colores. Empiezan las blancas. Si usan el reloj, acuerden el tiempo y el incremento antes de comenzar.",
    ),
  ],
  burako: [
    step(
      "Prepare the 106 tiles: two sets of 1–13 in four colors and 2 jokers. At four players, partners sit opposite.",
      "Prepara las 106 fichas: dos juegos de 1–13 en cuatro colores y 2 comodines. Con cuatro jugadores, las parejas se sientan enfrentadas.",
    ),
    step(
      "Deal 22 tiles each for two players, or 11 each for four. Prepare two separate dead piles of 11 tiles.",
      "Reparte 22 fichas a cada persona con dos jugadores, u 11 con cuatro. Prepara dos muertos separados de 11 fichas.",
    ),
    step(
      "Make the draw and discard piles. Choose a first player and agree on the target score and stated rules variant.",
      "Prepara el montón para robar y el descarte. Elijan quién empieza y acuerden el puntaje objetivo y la variante de reglas indicada.",
    ),
  ],
  truco: [
    step(
      "Sit as two people or two partnerships with partners opposite. Use a 40-card Spanish deck without 8s and 9s.",
      "Siéntense como dos personas o dos parejas enfrentadas. Usa un mazo español de 40 cartas sin 8 ni 9.",
    ),
    step(
      "Agree on the score target, whether flor is active and your table’s calling conventions.",
      "Acuerden el puntaje objetivo, si se juega con flor y las convenciones de canto de la mesa.",
    ),
    step(
      "Deal 3 cards each and reveal the muestra beneath the deck. Mano, to the dealer’s right, leads.",
      "Reparte 3 cartas a cada persona y revela la muestra debajo del mazo. Empieza la mano, a la derecha de quien reparte.",
    ),
  ],
  skull_king: [
    step(
      "Prepare the deck for the selected edition and give out player aids. Check the setup notes for optional cards.",
      "Prepara el mazo de la edición elegida y entrega las ayudas de juego. Consulta las notas de preparación para las cartas opcionales.",
    ),
    step(
      "Prepare the score sheet with everyone’s name. Play 10 rounds using classic scoring.",
      "Prepara la planilla con todos los nombres. Jueguen 10 rondas con puntuación clásica.",
    ),
    step(
      "Shuffle and deal 1 card each for round 1. Everyone chooses a bid, then reveals it together before the first trick.",
      "Mezcla y reparte 1 carta a cada persona para la ronda 1. Cada persona elige una apuesta y todos la revelan a la vez antes de la primera baza.",
    ),
  ],
  sushi_go: [
    step(
      "Shuffle the 108-card deck and choose a scorekeeper.",
      "Mezcla el mazo de 108 cartas y elijan quién anota los puntos.",
    ),
    step(
      "Deal 10 cards each at two players, 9 at three, 8 at four or 7 at five. Keep hands secret.",
      "Reparte 10 cartas a cada persona con dos jugadores, 9 con tres, 8 con cuatro o 7 con cinco. Mantengan las manos en secreto.",
    ),
    step(
      "Keep the remaining draw pile nearby. Prepare space for played cards and puddings kept between the three rounds.",
      "Deja cerca el mazo restante. Prepara espacio para las cartas jugadas y los pudines que se conservan entre las tres rondas.",
    ),
  ],
  sushi_go_party: [
    step(
      "Choose a suggested menu or one roll, three appetizers, two specials and one dessert, plus Nigiri. Check the player-count restrictions in the setup notes.",
      "Elige un menú sugerido o un rollo, tres aperitivos, dos especiales y un postre, además de Nigiri. Revisa las restricciones por cantidad de jugadores en las notas.",
    ),
    step(
      "Place the matching menu tiles on the board and the player pawns near 0. Set aside cards outside the chosen menu.",
      "Coloca las fichas del menú en el tablero y los peones cerca de 0. Aparta las cartas que no forman parte del menú.",
    ),
    step(
      "For round 1, shuffle in 5 desserts with 2–5 players or 7 with 6–8. Deal 10 cards each at 2–3 players, 9 at 4–5, 8 at 6–7 or 7 at 8.",
      "Para la ronda 1, mezcla 5 postres con 2–5 jugadores o 7 con 6–8. Reparte 10 cartas a cada persona con 2–3 jugadores, 9 con 4–5, 8 con 6–7 o 7 con 8.",
    ),
  ],
};
export function setupSteps(id: string, options: ToolState): Translation[] {
  return [
    ...steps[id].map((text, i) => {
      const selected = selectedSetup(id, options);
      if (id === "coup" && i === 0) return selected[0];
      if (id === "coup" && i === 1) return selected[1];
      if (id === "coup" && i === 2 && options.guidePlayers && options.guidePlayers !== 2) return step("Choose who starts.", "Elijan quién empieza.");
      if (id === "sushi_go_party" && i === 0) return {en: selected[0].en + " " + selected[2].en, es: selected[0].es + " " + selected[2].es};
      if (id === "sushi_go_party" && i === 2) return selected[1];
      if (id === "skull_king" && i === 0) return selected[0];
      return text;
    }),
    ...(id === "coup" && options.reformation
      ? [
          step(
            "Alternate Loyalist and Reformist sides. Place an empty Treasury Reserve in the center, separate from the bank.",
            "Alterna los bandos Leal y Reformista. Coloca en el centro una Reserva del Tesoro vacía, separada del banco.",
          ),
        ]
      : []),
  ];
}
