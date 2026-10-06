/* Small teaching scenarios, not a referee for an ongoing game. */
const PRACTICE = {
  skull_king: [
    {id:'zero-bid', question:L('You were dealt 5 cards, bid zero and take one trick. What is your classic bid score?','Te repartieron 5 cartas, apostaste cero y ganaste una baza. ¿Cuánto puntúas por la apuesta clásica?'),choices:[L('−50 points','−50 puntos'),L('−10 points','−10 puntos'),L('+20 points','+20 puntos')],answer:0,explanation:L('A failed zero bid loses 10 points for each card dealt, regardless of how many tricks you actually won. Five cards were dealt, so the score is −50.','Fallar una apuesta de cero resta 10 por cada carta repartida, sin importar cuántas bazas ganaste. Se repartieron cinco cartas: −50.'),section:'scoring'},
    {id:'three-characters', question:L('A Pirate, the Skull King and a Mermaid are all in one trick. Who wins?','En una misma baza hay un Pirata, Skull King y una Sirena. ¿Quién gana?'),choices:[L('The Skull King','Skull King'),L('The Mermaid','La Sirena'),L('The Pirate','El Pirata')],answer:1,explanation:L('This three-way exception is always won by the Mermaid, no matter when the cards were played.','Esta excepción de tres personajes siempre la gana la Sirena, sin importar cuándo se jugaron.'),section:'hierarchy'}
  ],
  sushi_go: [
    {id:'wasabi', question:L('You have one wasabi and play a squid nigiri. How many points is that nigiri worth?','Tienes un wasabi y juegas un nigiri de calamar. ¿Cuántos puntos vale ese nigiri?'),choices:[L('3 points','3 puntos'),L('6 points','6 puntos'),L('9 points','9 puntos')],answer:2,explanation:L('The next nigiri must go on an empty wasabi. Squid is worth 3, tripled to 9.','El siguiente nigiri debe ir sobre un wasabi libre. El calamar vale 3, triplicado a 9.'),section:'draft'},
    {id:'maki-tie', question:L('Two players tie for most maki icons in original Sushi Go!. What happens to the 6 points?','Dos personas empatan con más iconos maki en Sushi Go! original. ¿Qué ocurre con los 6 puntos?'),choices:[L('Each gets 6','Cada una recibe 6'),L('Each gets 3; no second place','Cada una recibe 3; no hay segundo puesto')],answer:1,explanation:L('Original Sushi Go! splits first-place maki points among tied players and awards no second-place points.','Sushi Go! original divide los puntos del primer puesto entre quienes empatan y no concede puntos por el segundo.'),section:'round-scoring'}
  ],
  sushi_go_party: [
    {id:'special-order', question:L('Seven people are building a Party menu. Can they include Special Order?','Siete personas arman un menú Party. ¿Pueden incluir Pedido especial?'),choices:[L('Yes, any special works','Sí, sirve cualquier especial'),L('No, Special Order is for 2–6 players','No, Pedido especial es para 2–6 personas')],answer:1,explanation:L('The published custom-menu rules exclude Menu and Special Order at seven or eight players.','Las reglas publicadas para crear menús excluyen Menú y Pedido especial con siete u ocho personas.'),section:'menu'},
    {id:'pudding-tie', question:L('In Party, two players tie for the most pudding cards. How many points does each get?','En Party, dos personas empatan con más budines. ¿Cuántos puntos recibe cada una?'),choices:[L('3 points','3 puntos'),L('6 points','6 puntos')],answer:1,explanation:L('Party awards the full +6 to every player tied for most pudding; this differs from original Sushi Go!.','Party concede los +6 completos a cada persona empatada con más budines; es diferente de Sushi Go! original.'),section:'dessert'}
  ],
  catan: [
    {
      id:'robber-discard', question:L('A 7 is rolled. You hold 9 resource cards. How many must you discard?','Sale un 7 y tienes 9 cartas de recurso. ¿Cuántas descartas?'),
      choices:[L('4 cards','4 cartas'),L('5 cards','5 cartas'),L('None: it is not my turn','Ninguna: no es mi turno')], answer:0,
      explanation:L('More than 7 means discarding half, rounded down: 9 ÷ 2 → 4. This applies to everyone, including the active player. Development cards do not count.','Con más de 7 se descarta la mitad redondeada hacia abajo: 9 ÷ 2 → 4. Se aplica a todos, incluso a quien tiene el turno. Las cartas de desarrollo no cuentan.'), section:'robber'
    },
    {
      id:'city-cost', question:L('You have 2 ore and 2 grain. Can you upgrade a settlement to a city?','Tienes 2 minerales y 2 cereales. ¿Puedes mejorar un poblado a ciudad?'),
      choices:[L('Yes, four resources are enough','Sí, cuatro recursos alcanzan'),L('No, one ore is missing','No, falta un mineral')], answer:1,
      explanation:L('A city costs 3 ore and 2 grain and replaces one of your settlements. Resource types matter, not just the number of cards.','Una ciudad cuesta 3 minerales y 2 cereales y reemplaza uno de tus poblados. Importa el tipo de recurso, no solo la cantidad de cartas.'), section:'building'
    }
  ],
  secret_hitler: [
    {
      id:'hitler-election', question:L('There are 3 Fascist policies. Hitler is elected Chancellor. What happens next?','Hay 3 políticas fascistas. Hitler es elegido canciller. ¿Qué ocurre?'),
      choices:[L('Draw three policies','Robar tres políticas'),L('Fascists win immediately','Los fascistas ganan de inmediato')], answer:1,
      explanation:L('Check the Chancellor before drawing. At 3 or more Fascist policies, electing Hitler ends the game immediately.','Comprueba quién es el canciller antes de robar. Con 3 o más políticas fascistas, elegir a Hitler termina la partida de inmediato.'), section:'victory'
    },
    {
      id:'veto-chaos', question:L('The election tracker is at 2. An elected government agrees to veto. What happens?','El marcador electoral está en 2. Un gobierno elegido acuerda un veto. ¿Qué ocurre?'),
      choices:[L('The election reset the tracker to 0','La elección reinició el marcador a 0'),L('Chaos: enact the top policy without its power','Caos: aprobar la primera política sin su poder')], answer:1,
      explanation:L('A veto advances the tracker. Election alone does not reset it; enacting a policy does. The third advance triggers chaos and clears term limits. Veto is available after 5 Fascist policies.','Un veto avanza el marcador. Elegir gobierno no lo reinicia; aprobar una política sí. El tercer avance provoca caos y elimina restricciones de cargos. El veto está disponible tras 5 políticas fascistas.'), section:'legislation'
    }
  ],
  el_camarero: [
    {
      id:'returns', question:L('There are 6 players. You choose to return unwanted dishes. How many must you attempt?','Son 6 jugadores. Eliges devolver platos que nadie pidió. ¿Cuántos debes intentar devolver?'),
      choices:[L('1 dish','1 plato'),L('2 dishes','2 platos'),L('As many as I want','Los que quiera')], answer:1,
      explanation:L('With 5–7 players, attempt 2 returns, one at a time. An error stops the turn; earlier correct returns stay yours.','Con 5–7 jugadores debes intentar 2 devoluciones, de a una. Un error termina el turno; conservas las devoluciones correctas anteriores.'), section:'service'
    },
    {
      id:'empty-deck', question:L('The draw pile is empty, but dishes remain in the kitchen and orders are unserved. Is the game over?','El mazo está vacío, pero quedan platos en la cocina y pedidos sin servir. ¿Terminó la partida?'),
      choices:[L('Yes, score now','Sí, contar puntos'),L('No, continue serving or returning dishes','No, seguir sirviendo o devolviendo')], answer:1,
      explanation:L('An empty draw pile is not enough. Continue until all orders are served or the kitchen has no cards left.','Agotar el mazo no basta. Sigan hasta servir todos los pedidos o dejar la cocina sin cartas.'), section:'scoring'
    }
  ],
  monopoly: [
    {
      id:'auction', question:L('You decline an unowned property. What must the Banker do?','Rechazas una propiedad libre. ¿Qué debe hacer el banco?'),
      choices:[L('Leave it for the next visitor','Dejarla para quien caiga después'),L('Auction it to everyone, including you','Subastarla entre todos, incluso tú')], answer:1,
      explanation:L('Declining the printed price starts an auction immediately. You may still bid. This keeps properties entering play.','Rechazar el precio impreso inicia una subasta de inmediato. También puedes pujar. Así las propiedades entran en juego.'), section:'movement'
    },
    {
      id:'mortgage-rent', question:L('You own a complete color group. One street is mortgaged. What rent applies to another, unimproved and unmortgaged street?','Tienes un color completo y una calle hipotecada. ¿Cuánto cobra otra calle del grupo, sin construir y sin hipoteca?'),
      choices:[L('Double its base rent','El doble del alquiler base'),L('No rent anywhere in the group','Ningún alquiler en todo el grupo')], answer:0,
      explanation:L('The mortgage blocks rent only on that property. The other unimproved streets still earn double rent for the complete color group. Building must wait until all mortgages in the group are lifted.','La hipoteca impide cobrar solo en esa propiedad. Las otras calles sin construir mantienen el alquiler doble por color completo. Para construir debes cancelar todas las hipotecas del grupo.'), section:'property'
    }
  ],
  chess: [
    {
      id:'stalemate', question:L('Your king is not in check, but you have no legal move with any piece. What is the result?','Tu rey no está en jaque, pero no tienes ninguna jugada legal con ninguna pieza. ¿Cuál es el resultado?'),
      choices:[L('Checkmate: you lose','Jaque mate: pierdes'),L('Stalemate: a draw','Ahogado: tablas'),L('Skip your turn','Pasar el turno')], answer:1,
      explanation:L('No legal moves plus no check is stalemate. Checkmate requires the king to be in check. You cannot pass a turn.','Sin jugadas legales y sin jaque hay ahogado. El mate exige que el rey esté en jaque. No se puede pasar el turno.'), section:'check'
    },
    {
      id:'castling', question:L('The king and rook have never moved and the path is empty, but the king would cross an attacked square. May you castle?','Rey y torre nunca se movieron y el camino está vacío, pero el rey cruzaría una casilla atacada. ¿Puedes enrocar?'),
      choices:[L('Yes, if the destination is safe','Sí, si el destino es seguro'),L('No, the crossing square must also be safe','No, la casilla de paso también debe ser segura')], answer:1,
      explanation:L('The king cannot start in check, cross an attacked square or finish on one. Empty squares alone do not make castling legal.','El rey no puede empezar en jaque, cruzar una casilla atacada ni terminar en una. No basta con que el camino esté vacío.'), section:'special'
    }
  ],
  burako: [
    {
      id:'group-colors', question:L('Can a same-number group contain two red 8s and one blue 8 in this variant?','¿Una pierna puede tener dos 8 rojos y un 8 azul en esta variante?'),
      choices:[L('Yes, repeated colors are allowed','Sí, se permiten colores repetidos'),L('No, all colors must differ','No, todos deben ser distintos')], answer:0,
      explanation:L('This guide uses the Argentine coastal variant: groups match numbers, regardless of color. Runs instead need consecutive numbers of one color.','Esta guía usa la variante argentino-costera: las piernas reúnen el mismo número sin importar el color. Las escaleras sí necesitan números consecutivos de un color.'), section:'turn'
    },
    {
      id:'discard-pile', question:L('You have 2 tiles on your rack and the discard pile has 2. May you take the discard pile?','Tienes 2 fichas en el atril y hay 2 en el pozo. ¿Puedes levantar el pozo?'),
      choices:[L('Yes, take both','Sí, tomar las dos'),L('No, draw from the stock','No, robar de la pila')], answer:1,
      explanation:L('In this variant, rack plus discard pile must total at least 5. Here 2 + 2 = 4, so you must draw from the stock.','En esta variante, atril y pozo deben sumar al menos 5. Aquí 2 + 2 = 4, así que debes robar de la pila.'), section:'turn'
    }
  ],
  truco: [
    {
      id:'muestra-piece', question:L('The muestra is the 4 of coins. Which card becomes that missing piece?','La muestra es el 4 de oros. ¿Qué carta ocupa el lugar de esa pieza?'),
      choices:[L('The 12 of coins','El 12 de oros'),L('Every 4','Todos los 4'),L('The ace of coins','El as de oros')], answer:0,
      explanation:L('When a piece itself is the muestra, the 12 of that suit takes its rank and value. Here it replaces the 4, below the 2 and above the 5 of coins.','Si la muestra es una pieza, el 12 de su palo adopta su jerarquía y valor. Aquí reemplaza al 4: debajo del 2 y encima del 5 de oros.'), section:'ranking'
    },
    {
      id:'piece-envido', question:L('The muestra is cups. You hold the 4 of cups, 3 of swords and 6 of coins. What is your envido?','La muestra es de copas. Tienes 4 de copas, 3 de espadas y 6 de oros. ¿Cuánto tienes de envido?'),
      choices:[L('29','29'),L('35','35'),L('38','38')], answer:1,
      explanation:L('The piece joins the 6: 20 + 9 + 6 = 35. The 3 does not add to this two-card count. These two ordinary cards have different suits, so the hand has no flor.','La pieza se une al 6: 20 + 9 + 6 = 35. El 3 no se suma a este tanto de dos cartas. Las dos cartas comunes son de palos distintos, así que no hay flor.'), section:'flor-envido'
    }
  ]
};

// Stable concepts/options: persistence never depends on a lesson's display order.
const PRACTICE_CONCEPTS = {
 skull_king: [
  ['zero-bid', ['basic-score'], ['minus-fifty','minus-ten','plus-twenty'], [L('Five cards were dealt, so the failed zero bid costs 50.','Se repartieron cinco cartas, así que fallar el cero cuesta 50.'), L('The penalty uses cards dealt, not the one trick taken.','La penalización usa las cartas repartidas, no la única baza ganada.'), L('A failed zero bid is a penalty, not a reward for taking a trick.','Fallar una apuesta de cero resta puntos; ganar una baza no da un premio.')], 'basic-score', 'zero-bid'],
  ['three-characters', ['basic-trick'], ['king','mermaid','pirate'], [L('The Skull King beats Pirates, but the Mermaid captures him in this combination.','Skull King vence a los Piratas, pero la Sirena lo captura en esta combinación.'), L('The Mermaid wins this specific three-card exception.','La Sirena gana esta excepción de tres cartas.'), L('The Pirate cannot beat the Skull King; the Mermaid wins the exception.','El Pirata no vence a Skull King; la Sirena gana la excepción.')], 'example', 'three-characters', ['sk-pirate','sk-king','sk-mermaid']]
 ],
 sushi_go: [
  ['wasabi', ['basic-combinations'], ['three','six','nine'], [L('Three is the squid nigiri’s value before wasabi.','Tres es el valor del nigiri de calamar antes del wasabi.'),L('Wasabi triples the nigiri; it does not double it.','El wasabi triplica el nigiri; no lo duplica.'),L('Three times three gives nine.','Tres por tres da nueve.')], 'basic-combinations'],
  ['maki-tie', ['basic-score'], ['six-each','three-each'], [L('Original Sushi Go! splits the six points; it does not give six to each tied player.','Sushi Go! original divide los seis puntos; no da seis a cada persona empatada.'),L('Six divided between two players gives three each.','Seis divididos entre dos personas da tres para cada una.')], 'basic-score', 'maki-tie']
 ],
 sushi_go_party: [
  ['special-order', ['basic-menu'], ['allowed','two-to-six'], [L('Special Order has a player-count limit even though it is a special card.','Pedido especial tiene un límite de jugadores aunque sea una carta especial.'),L('Seven exceeds Special Order’s six-player limit.','Siete supera el límite de seis de Pedido especial.')], 'basic-menu'],
  ['pudding-tie', ['basic-score'], ['three','six'], [L('Splitting pudding points is the original game’s rule, not Party’s.','Dividir los puntos del pudín es la regla original, no la de Party.'),L('Party gives each tied leader the full six points.','Party da los seis puntos completos a cada persona empatada en el primer lugar.')], 'basic-score', 'pudding-tie']
 ],
 catan: [
  ['robber-discard', ['basic-produce'], ['four','five','none'], [L('Round half of nine down to four.','Redondea la mitad de nueve hacia abajo: cuatro.'),L('Five rounds up; the discard rule rounds down.','Cinco redondea hacia arriba; al descartar se redondea hacia abajo.'),L('The seven affects everyone with more than seven resource cards.','El siete afecta a todos los que tienen más de siete cartas de recurso.')], 'basic-produce'],
  ['city-cost', ['basic-build'], ['enough','missing-ore'], [L('You cannot substitute a different resource for the missing ore.','No puedes sustituir el mineral que falta por otro recurso.'),L('Three ore are needed, and you have only two.','Necesitas tres minerales y solo tienes dos.')], 'basic-build']
 ],
 secret_hitler: [
  ['hitler-election', ['basic-elect'], ['draw','fascists-win'], [L('Check this victory condition before starting the legislative session.','Comprueba esta condición de victoria antes de empezar la sesión legislativa.'),L('Electing Hitler with three Fascist policies ends the game.','Elegir a Hitler con tres políticas fascistas termina la partida.')], 'basic-elect'],
  ['veto-chaos', ['basic-legislate'], ['reset','chaos'], [L('Election alone does not reset the tracker.','La elección por sí sola no reinicia el marcador.'),L('The veto makes the third advance and triggers chaos.','El veto hace avanzar el marcador por tercera vez y provoca caos.')], 'basic-legislate']
 ],
 el_camarero: [
  ['returns', ['basic-serve'], ['one','two','any'], [L('One return is for a smaller table; six players attempt two.','Una devolución corresponde a una mesa más chica; con seis jugadores se intentan dos.'),L('Six players use the two-return requirement.','Con seis jugadores se aplica el requisito de dos devoluciones.'),L('The player count sets the number of attempts.','La cantidad de jugadores determina cuántos intentos corresponden.')], 'basic-serve'],
  ['empty-deck', ['basic-score'], ['finish','continue'], [L('An empty draw pile alone does not end service.','Que se agote el mazo no termina el servicio por sí solo.'),L('Orders and dishes still need resolving.','Todavía hay pedidos y platos por resolver.')], 'basic-score']
 ],
 monopoly: [
  ['auction', ['basic-roll'], ['leave','auction'], [L('Declining does not leave the property waiting for another visitor.','Rechazarla no deja la propiedad esperando a otro visitante.'),L('The Banker auctions it immediately, and you may bid.','El banco la subasta de inmediato y también puedes pujar.')], 'basic-roll'],
  ['mortgage-rent', ['basic-build'], ['double','none'], [L('Only the mortgaged street cannot collect rent.','Solo la calle hipotecada no puede cobrar alquiler.'),L('A mortgage does not cancel rent on the other streets.','Una hipoteca no cancela el alquiler de las otras calles.')], 'basic-build']
 ],
 chess: [
  ['stalemate', ['basic-check'], ['mate','draw','pass'], [L('Checkmate requires check; this king is not in check.','El mate exige jaque; este rey no está en jaque.'),L('No legal moves without check means a draw by stalemate.','Sin jugadas legales y sin jaque hay tablas por ahogado.'),L('Chess does not allow passing a turn.','En ajedrez no se puede pasar el turno.')], 'basic-check'],
  ['castling', ['basic-special'], ['destination','crossing'], [L('A safe destination is insufficient if the king crosses an attacked square.','Un destino seguro no basta si el rey cruza una casilla atacada.'),L('The crossing square must be safe too.','La casilla de paso también debe ser segura.')], 'basic-special']
 ],
 burako: [
  ['group-colors', ['basic-draw-meld-discard'], ['repeats','different'], [L('This guide’s coastal variant allows repeated colors in groups.','La variante costera de esta guía permite colores repetidos en las piernas.'),L('Same-color sequences are runs; groups match numbers instead.','Las secuencias de un color son escaleras; las piernas reúnen números iguales.')], 'basic-draw-meld-discard'],
  ['discard-pile', ['basic-draw-meld-discard'], ['take','stock'], [L('Two plus two is only four, below the five-tile minimum.','Dos más dos da solo cuatro, menos del mínimo de cinco fichas.'),L('This rack and pile do not reach five; draw from the stock.','El atril y el pozo no llegan a cinco; roba de la pila.')], 'basic-draw-meld-discard']
 ],
 truco: [
  ['muestra-piece', ['basic-trick'], ['twelve','all-fours','ace'], [L('The twelve of the muestra’s suit takes the missing piece’s place.','El doce del palo de la muestra ocupa el lugar de la pieza faltante.'),L('Only the twelve of the muestra’s suit replaces that piece.','Solo el doce del palo de la muestra reemplaza esa pieza.'),L('The ace does not replace a piece shown as the muestra.','El as no reemplaza una pieza que aparece como muestra.')], 'basic-trick'],
  ['piece-envido', ['basic-flor-envido'], ['twenty-nine','thirty-five','thirty-eight'], [L('The piece can combine with the six in this hand.','La pieza puede combinarse con el seis en esta mano.'),L('Twenty plus nine plus six gives thirty-five.','Veinte más nueve más seis da treinta y cinco.'),L('Envido uses two cards here; do not add the three as well.','Aquí el envido usa dos cartas; no sumes también el tres.')], 'basic-flor-envido']
 ]
};
const BASE_LESSON_PRACTICE = Object.fromEntries(Object.entries(PRACTICE).map(([game, scenarios]) => [game, scenarios.map(scenario => {
 const [id,lessons,optionIds,feedback,revisit,example,cards] = PRACTICE_CONCEPTS[game].find(entry => entry[0] === scenario.id);
 return {...scenario,id,lessons,optionIds,feedback,revisit,example,cards,...(id==='zero-bid'?{exampleFact:1}:['maki-tie','pudding-tie'].includes(id)?{exampleFact:0}:{})};
})]));
// These checks use the fictional situations already taught by items 03, 04 and 09.
const EXTRA_LESSON_PRACTICE = {coup: [{id:'duke-proof',lessons:['basic-challenge'],optionIds:['ana-loses','bruno-loses','keep-duke'],cards:['coup-duke'],section:'challenges',revisit:'example',example:'tax',answer:1,
 question:L('Ana and Bruno each start with 2 coins and 2 influence. Bruno challenges Ana’s Tax. Ana proves Duke. What happens?','Ana y Bruno empiezan con 2 monedas y 2 influencias cada uno. Bruno desafía los Impuestos de Ana. Ana demuestra Duque. ¿Qué pasa?'),
 choices:[L('Ana loses that Duke as influence','Ana pierde ese Duque como influencia'),L('Bruno loses influence; Ana replaces Duke and collects Tax','Bruno pierde influencia; Ana reemplaza Duque y cobra Impuestos'),L('Bruno loses influence; Ana keeps the shown Duke','Bruno pierde influencia; Ana conserva el Duque mostrado')],
 feedback:[L('Showing proof is not losing influence. Ana won the challenge.','Mostrar una prueba no es perder influencia. Ana ganó el desafío.'),L('Bruno loses the challenge. Ana keeps two hidden influence after replacing Duke.','Bruno pierde el desafío. Ana conserva dos influencias ocultas tras reemplazar Duque.'),L('The proven Duke must be shuffled into the deck and replaced, not kept.','El Duque demostrado debe mezclarse en el mazo y reemplazarse, no conservarse.')],
 explanation:L('Ana ends with 5 coins and 2 influence; Bruno has 2 coins and 1 influence. Bruno acts next. Revisit the Tax example to see the reveal and replacement.','Ana termina con 5 monedas y 2 influencias; Bruno tiene 2 monedas y 1 influencia. Sigue Bruno. Vuelve al ejemplo de Impuestos para ver la prueba y el reemplazo.')},
 {id:'contessa-block',lessons:['basic-action'],optionIds:['refund','spent'],cards:['coup-assassin','coup-contessa'],section:'actions',revisit:'example',example:'assassination',answer:1,
 question:L('Ana starts with 5 coins, pays 3 to assassinate, and Bruno’s Contessa block is unchallenged. How many coins does Ana keep?','Ana empieza con 5 monedas, paga 3 para asesinar y nadie desafía el bloqueo de Condesa de Bruno. ¿Cuántas monedas conserva Ana?'),
 choices:[L('5: the cost is refunded','5: se devuelve el costo'),L('2: the cost stays spent','2: el costo queda pagado')],
 feedback:[L('A successful block is different from a successful challenge to Assassin. A block does not refund the cost.','Un bloqueo exitoso es distinto de un desafío exitoso al Asesino. El bloqueo no devuelve el costo.'),L('Five minus three leaves two, even though the assassination was blocked.','Cinco menos tres deja dos, aunque el asesinato fue bloqueado.')],
 explanation:L('Ana has 2 coins and 2 influence; Bruno keeps 2 coins and 2 influence and acts next. No hidden card is proved by an unchallenged block.','Ana tiene 2 monedas y 2 influencias; Bruno conserva 2 monedas y 2 influencias y juega después. Un bloqueo sin desafío no demuestra ninguna carta oculta.')}],
avalon: [{id:'quest-voters',lessons:['basic-vote'],optionIds:['team-only','everyone'],cards:['avalon-team'],section:'teams',revisit:'example',example:'vote',answer:1,
 question:L('A team has been proposed. Who votes Approve or Reject?','Se propuso un equipo. ¿Quién vota Aprobar o Rechazar?'),
 choices:[L('Only the proposed team','Solo el equipo propuesto'),L('Everyone, including players outside the team','Todos, incluso quienes están fuera del equipo')],
 feedback:[L('Team membership limits quest-card submission, not the team vote.','Pertenecer al equipo limita quién entrega cartas de misión, no quién vota el equipo.'),L('Every player has a public vote on the proposed team.','Cada persona vota públicamente sobre el equipo propuesto.')],
 explanation:L('Everyone votes simultaneously. A strict majority approves the team; a tie rejects it. Only an approved team proceeds to quest cards.','Todos votan a la vez. Una mayoría estricta aprueba el equipo; un empate lo rechaza. Solo un equipo aprobado pasa a las cartas de misión.')},
 {id:'quest-submitters',lessons:['basic-quest'],optionIds:['everyone','approved-team'],cards:['avalon-mission'],section:'quests',revisit:'example',example:'quest',answer:1,
 question:L('The team is approved. Who secretly submits Success or Fail?','El equipo fue aprobado. ¿Quién entrega Éxito o Fracaso en secreto?'),
 choices:[L('Every player who voted Approve','Cada persona que votó Aprobar'),L('Only members of the approved team','Solo integrantes del equipo aprobado')],
 feedback:[L('An approval vote does not put someone on the quest team.','Votar Aprobar no hace que alguien integre el equipo de misión.'),L('The approved team submits cards; outside players submit none.','El equipo aprobado entrega cartas; quienes están fuera no entregan ninguna.')],
 explanation:L('Good team members must submit Success. Evil may submit Success or Fail. Shuffle before revealing, so quest cards are anonymous.','Integrantes del Bien deben entregar Éxito. El Mal puede entregar Éxito o Fracaso. Mezclen antes de revelar para que las cartas de misión sean anónimas.')}],
dixit: [{id:'all-found',lessons:['basic-score'],optionIds:['three','zero'],section:'scoring',revisit:'basic-score',example:'some-to-all',exampleFact:1,answer:1,
 question:L('Everyone finds the storyteller’s card. How many points does the storyteller earn?','Todos encuentran la carta del narrador. ¿Cuántos puntos gana el narrador?'),
 choices:[L('3 points','3 puntos'),L('0 points','0 puntos')],
 feedback:[L('The storyteller earns three only when some, but not all, find the card.','El narrador gana tres solo si algunos, pero no todos, encuentran la carta.'),L('An all-correct vote gives the storyteller zero.','Si todos aciertan, el narrador recibe cero.')],
 explanation:L('Everyone else earns 2 points. Votes for other players’ cards earn those players 1 each, up to 3 bonus points in this edition. Use the scoring example above to compare some versus all.','Los demás ganan 2 puntos. Los votos por cartas de otros jugadores les dan 1 punto por voto, hasta 3 puntos extra en esta edición. Usa el ejemplo de puntuación de arriba para comparar algunos aciertos con todos.') }]};
const LESSON_PRACTICE = {...BASE_LESSON_PRACTICE, ...EXTRA_LESSON_PRACTICE};

const practiceState = {};
function scenarioPractice() {
  const scenarios = PRACTICE[state.game];
  if (!scenarios) return '';
  const progress = practiceState[state.game] ||= {index:0, answers:[]};
  const scenario = scenarios[progress.index];
  const entry=LESSON_PRACTICE[state.game][progress.index];
  const saved=entry.optionIds.indexOf(learningAnswers(state.game)[entry.id]);
  const answer=saved<0?undefined:saved;
  return `<section class="playground scenario-practice" id="scenario-practice" aria-labelledby="scenario-heading">
    <div class="playground-heading"><span class="eyebrow">${tr('TRY A TABLE DECISION','PRUEBA UNA DECISIÓN DE JUEGO')} · ${progress.index+1} / ${scenarios.length}</span>
    <h2 id="scenario-heading" tabindex="-1">${e(scenario.question)}</h2></div>
    <div class="scenario-choices" role="group" aria-labelledby="scenario-heading">${scenario.choices.map((choice,i)=>`<button type="button" id="scenario-choice-${i}" data-scenario-choice="${i}" aria-pressed="${answer===i}" aria-describedby="scenario-feedback">${e(choice)}</button>`).join('')}</div>
    <div class="practice-feedback" id="scenario-feedback" role="status" aria-live="polite" aria-atomic="true">${scenarioFeedback(scenario,answer)}</div>
    <a class="inline-link" href="#${state.game}/full/${scenario.section}">${tr('Read the rule behind this example','Lee la regla de este ejemplo')}</a>
    <div class="demo-actions"><button type="button" id="scenario-reset">${tr('Try again','Intentar de nuevo')}</button><button type="button" id="scenario-next">${tr('Next example','Siguiente ejemplo')}${icon('arrow')}</button></div>
  </section>`;
}
function scenarioFeedback(scenario, answer) {
  return answer===undefined ? tr('Choose an answer to see the explanation.','Elige una respuesta para ver la explicación.') : `<strong>${answer===scenario.answer?tr('Correct.','Correcto.'):tr('Not quite.','Todavía no.')}</strong> ${e(LESSON_PRACTICE[state.game]?.find(item=>item.id===scenario.id)?.feedback[answer]||scenario.explanation)} ${e(scenario.explanation)}`;
}
function bindScenarioPractice() {
  const scenarios = PRACTICE[state.game];
  if (!scenarios || !$('#scenario-practice')) return;
  const progress = practiceState[state.game];
  $$('[data-scenario-choice]').forEach(button => button.onclick = () => {
    progress.answers[progress.index] = +button.dataset.scenarioChoice;
    const entry=LESSON_PRACTICE[state.game][progress.index];
    saveLearningAnswer(state.game,entry.id,entry.optionIds[+button.dataset.scenarioChoice]);
    $$('[data-scenario-choice]').forEach(choice => choice.setAttribute('aria-pressed',choice===button));
    // Keep the live region and focused button in place for assistive technology.
    $('#scenario-feedback').innerHTML = scenarioFeedback(scenarios[progress.index],progress.answers[progress.index]);
  });
  $('#scenario-next').onclick = () => {
    progress.index = (progress.index+1)%scenarios.length;
    patchTool('scenario-practice',scenarioPractice(),'scenario-heading');
  };
  $('#scenario-reset').onclick = () => {
    delete progress.answers[progress.index];
    saveLearningAnswer(state.game,LESSON_PRACTICE[state.game][progress.index].id,undefined);
    patchTool('scenario-practice',scenarioPractice(),'scenario-choice-0');
  };
}

const PRACTICE_LESSONS = {
 coup:['deal','action','challenge','influence','reformation'],avalon:['roles','team','vote','quest','assassination'],poker:['deal','bet','streets','showdown'],moth:['guard','discard','cheat','accusation'],dixit:['deal','clue','vote','score','next-round'],catan:['settle','produce','build','victory'],secret_hitler:['roles','elect','legislate','powers'],el_camarero:['orders','serve','correct','score'],monopoly:['bank','roll','build','bankruptcy'],chess:['board','move','check','special'],burako:['deal','draw-meld-discard','canasta','close'],truco:['deal','flor-envido','trick','raise'],skull_king:['deal','bid','trick','score','expansion'],sushi_go:['deal','draft','combinations','score'],sushi_go_party:['menu','deal','draft','score']
};
function learningAnswers(game) {
 const key=`tablefolk-${typeof sharedRoute!=='undefined'&&sharedRoute?'shared-':''}practice-${game}-decisions-v1`;
 try {const saved=JSON.parse(sessionStorage.getItem(key)||'{}');return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};}catch{return {};}
}
function saveLearningAnswer(game, id, answer) {
 const answers=learningAnswers(game);
 if(answer===undefined)delete answers[id];else answers[id]=answer;
 try{sessionStorage.setItem(`tablefolk-${typeof sharedRoute!=='undefined'&&sharedRoute?'shared-':''}practice-${game}-decisions-v1`,JSON.stringify(answers));}catch{}
}
function inlineLessonPractice(n) {
 const lesson=`basic-${PRACTICE_LESSONS[state.game]?.[n]}`;
 const decisions=(LESSON_PRACTICE[state.game]||[]).filter(s=>s.lessons.includes(lesson));
 const decision=decisions.find(s=>s.id===learningAnswers(state.game)['selection:'+lesson])||decisions[0];
 const helper=(state.game==='poker'&&['basic-streets','basic-showdown'].includes(lesson))||(state.game==='moth'&&lesson==='basic-discard')?lessonPracticeHelper():'';
 if(!decision&&!helper)return '';
 const selected=decision?decision.optionIds.indexOf(learningAnswers(state.game)[decision.id]):-1;
 return `<section class="lesson-practice" id="inline-lesson-practice" ${decision?`data-lesson-practice="${decision.id}"`:''}><p class="eyebrow">${tr('Optional · try this decision','Opcional · prueba esta decisión')}</p>${helper}${decisions.length>1?`<label class="practice-picker">${tr('Choose a decision','Elige una decisión')}<select id="inline-practice-picker">${decisions.map(item=>`<option value="${item.id}" ${item.id===decision.id?'selected':''}>${e(item.question)}</option>`).join('')}</select></label>`:''}${decision?`<h4 id="inline-practice-heading">${e(decision.question)}</h4>${(decision.cards||[]).filter(id=>OFFICIAL[id]).map(id=>officialButton(id)).join('')}<div class="scenario-choices" role="group" aria-labelledby="inline-practice-heading">${decision.choices.map((choice,i)=>`<button type="button" data-inline-answer="${i}" id="inline-answer-${i}" aria-pressed="${selected===i}" aria-describedby="inline-practice-feedback">${e(choice)}</button>`).join('')}</div><div id="inline-practice-feedback" class="practice-feedback" role="status" aria-atomic="true">${inlinePracticeFeedback(decision,selected)}</div>`:''}<div class="practice-actions">${decision?`<button type="button" id="inline-practice-retry">${tr('Try again','Intentar de nuevo')}</button>`:''}<button type="button" id="inline-practice-revisit">${tr('Revisit example','Volver al ejemplo')}</button><button type="button" id="inline-practice-continue">${tr('Skip / Continue','Saltar / Seguir')} →</button></div></section>`;
}
function inlinePracticeFeedback(decision, selected) {
 return selected<0?tr('Choose an answer to see why. You can also skip and continue.','Elige una respuesta para ver por qué. También puedes saltar la práctica y seguir.'):`<p><strong>${selected===decision.answer?tr('Correct.','Correcto.'):tr('Not quite.','Todavía no.')}</strong> ${e(decision.feedback[selected])}</p><p>${e(decision.explanation)}</p>`;
}
function bindInlineLessonPractice() {
 if(!$('#inline-lesson-practice'))return;
 const lesson=`basic-${PRACTICE_LESSONS[state.game]?.[visualState.steps[state.game]||0]}`;
 const decisions=(LESSON_PRACTICE[state.game]||[]).filter(s=>s.lessons.includes(lesson));
 const decision=decisions.find(s=>s.id===learningAnswers(state.game)['selection:'+lesson])||decisions[0];
 if($('#inline-practice-picker'))$('#inline-practice-picker').onchange=event=>{saveLearningAnswer(state.game,'selection:'+lesson,event.target.value);render(true);$('#inline-practice-picker')?.focus();};
 $$('[data-inline-answer]').forEach(button=>button.onclick=()=>{
  const answer=+button.dataset.inlineAnswer;saveLearningAnswer(state.game,decision.id,decision.optionIds[answer]);
  $$('[data-inline-answer]').forEach(option=>option.setAttribute('aria-pressed',option===button));
  $('#inline-practice-feedback').innerHTML=inlinePracticeFeedback(decision,answer);
 });
 if($('#inline-practice-retry'))$('#inline-practice-retry').onclick=()=>{saveLearningAnswer(state.game,decision.id,undefined);$$('[data-inline-answer]').forEach(b=>b.setAttribute('aria-pressed','false'));$('#inline-practice-feedback').innerHTML=inlinePracticeFeedback(decision,-1);$('#inline-answer-0')?.focus();};
 $('#inline-practice-continue').onclick=()=>{visualState.steps[state.game]=Math.min(lessonSteps().length-1,(visualState.steps[state.game]||0)+1);render(true);$('#basics h3')?.setAttribute('tabindex','-1');$('#basics h3')?.focus();};
 $('#inline-practice-revisit').onclick=()=>{
  const target=decision?.revisit==='basic-score'&&SCORING_EXAMPLES[state.game]?'scoring-example':({coup:'coup-lesson',avalon:'avalon-lesson',skull_king:'skull-trick-lesson',dixit:'scoring-example',poker:'poker-demo',moth:'moth-practice'})[state.game];
  if(target&&document.getElementById(target)){
   if(state.game==='coup'&&decision?.example){const picker=document.querySelector(`[data-coup-example="${decision.example}"]`);picker?.click();}
   if(target==='skull-trick-lesson'&&decision?.example){const picker=$('#trick-example');if(picker){picker.value=decision.example;picker.dispatchEvent(new Event('change'));}}
   if(target==='scoring-example'&&decision?.example){const picker=$('#scoring-scenario'),i=SCORING_EXAMPLES[state.game].scenarios.findIndex(s=>s.id===decision.example);if(picker&&i>=0){picker.value=String(i);picker.dispatchEvent(new Event('change'));const fact=$('#scoring-fact');if(fact&&decision.exampleFact!==undefined){fact.value=String(decision.exampleFact);fact.dispatchEvent(new Event('change'));}}}
   const example=document.getElementById(target),heading=example.querySelector('h2,h3');heading?.setAttribute('tabindex','-1');heading?.focus();example.scrollIntoView({block:'start'});
  }else{$('#basics h3')?.setAttribute('tabindex','-1');$('#basics h3')?.focus();}
 };
}
