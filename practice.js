/* Small teaching scenarios, not a referee for an ongoing game. */
const PRACTICE = {
  skull_king: [
    {question:L('Round 6: you bid zero and take one trick. What is your classic bid score?','Ronda 6: apostaste cero y ganaste una baza. ¿Cuánto puntúas por la apuesta clásica?'),choices:[L('−60 points','−60 puntos'),L('−10 points','−10 puntos'),L('+20 points','+20 puntos')],answer:0,explanation:L('A failed zero bid loses 10 points for each card dealt, regardless of how many tricks you actually won. Six cards were dealt, so the score is −60.','Fallar una apuesta de cero resta 10 por cada carta repartida, sin importar cuántas bazas ganaste. Se repartieron seis cartas: −60.'),section:'scoring'},
    {question:L('A Pirate, the Skull King and a Mermaid are all in one trick. Who wins?','En una misma baza hay un Pirata, Skull King y una Sirena. ¿Quién gana?'),choices:[L('The Skull King','Skull King'),L('The Mermaid','La Sirena'),L('The Pirate','El Pirata')],answer:1,explanation:L('This three-way exception is always won by the Mermaid, no matter when the cards were played.','Esta excepción de tres personajes siempre la gana la Sirena, sin importar cuándo se jugaron.'),section:'hierarchy'}
  ],
  sushi_go: [
    {question:L('You have one wasabi and play a squid nigiri. How many points is that nigiri worth?','Tienes un wasabi y juegas un nigiri de calamar. ¿Cuántos puntos vale ese nigiri?'),choices:[L('3 points','3 puntos'),L('6 points','6 puntos'),L('9 points','9 puntos')],answer:2,explanation:L('The next nigiri must go on an empty wasabi. Squid is worth 3, tripled to 9.','El siguiente nigiri debe ir sobre un wasabi libre. El calamar vale 3, triplicado a 9.'),section:'draft'},
    {question:L('Two players tie for most maki icons in original Sushi Go!. What happens to the 6 points?','Dos personas empatan con más iconos maki en Sushi Go! original. ¿Qué ocurre con los 6 puntos?'),choices:[L('Each gets 6','Cada una recibe 6'),L('Each gets 3; no second place','Cada una recibe 3; no hay segundo puesto')],answer:1,explanation:L('Original Sushi Go! splits first-place maki points among tied players and awards no second-place points.','Sushi Go! original divide los puntos del primer puesto entre quienes empatan y no concede puntos por el segundo.'),section:'round-scoring'}
  ],
  sushi_go_party: [
    {question:L('Seven people are building a Party menu. Can they include Special Order?','Siete personas arman un menú Party. ¿Pueden incluir Pedido especial?'),choices:[L('Yes, any special works','Sí, sirve cualquier especial'),L('No, Special Order is for 2–6 players','No, Pedido especial es para 2–6 personas')],answer:1,explanation:L('The published custom-menu rules exclude Menu and Special Order at seven or eight players.','Las reglas publicadas para crear menús excluyen Menú y Pedido especial con siete u ocho personas.'),section:'menu'},
    {question:L('In Party, two players tie for the most pudding cards. How many points does each get?','En Party, dos personas empatan con más budines. ¿Cuántos puntos recibe cada una?'),choices:[L('3 points','3 puntos'),L('6 points','6 puntos')],answer:1,explanation:L('Party awards the full +6 to every player tied for most pudding; this differs from original Sushi Go!.','Party concede los +6 completos a cada persona empatada con más budines; es diferente de Sushi Go! original.'),section:'dessert'}
  ],
  catan: [
    {
      question:L('A 7 is rolled. You hold 9 resource cards. How many must you discard?','Sale un 7 y tienes 9 cartas de recurso. ¿Cuántas descartas?'),
      choices:[L('4 cards','4 cartas'),L('5 cards','5 cartas'),L('None: it is not my turn','Ninguna: no es mi turno')], answer:0,
      explanation:L('More than 7 means discarding half, rounded down: 9 ÷ 2 → 4. This applies to everyone, including the active player. Development cards do not count.','Con más de 7 se descarta la mitad redondeada hacia abajo: 9 ÷ 2 → 4. Se aplica a todos, incluso a quien tiene el turno. Las cartas de desarrollo no cuentan.'), section:'robber'
    },
    {
      question:L('You have 2 ore and 2 grain. Can you upgrade a settlement to a city?','Tienes 2 minerales y 2 cereales. ¿Puedes mejorar un poblado a ciudad?'),
      choices:[L('Yes, four resources are enough','Sí, cuatro recursos alcanzan'),L('No, one ore is missing','No, falta un mineral')], answer:1,
      explanation:L('A city costs 3 ore and 2 grain and replaces one of your settlements. Resource types matter, not just the number of cards.','Una ciudad cuesta 3 minerales y 2 cereales y reemplaza uno de tus poblados. Importa el tipo de recurso, no solo la cantidad de cartas.'), section:'building'
    }
  ],
  secret_hitler: [
    {
      question:L('There are 3 Fascist policies. Hitler is elected Chancellor. What happens next?','Hay 3 políticas fascistas. Hitler es elegido canciller. ¿Qué ocurre?'),
      choices:[L('Draw three policies','Robar tres políticas'),L('Fascists win immediately','Los fascistas ganan de inmediato')], answer:1,
      explanation:L('Check the Chancellor before drawing. At 3 or more Fascist policies, electing Hitler ends the game immediately.','Comprueba quién es el canciller antes de robar. Con 3 o más políticas fascistas, elegir a Hitler termina la partida de inmediato.'), section:'victory'
    },
    {
      question:L('The election tracker is at 2. An elected government agrees to veto. What happens?','El marcador electoral está en 2. Un gobierno elegido acuerda un veto. ¿Qué ocurre?'),
      choices:[L('The election reset the tracker to 0','La elección reinició el marcador a 0'),L('Chaos: enact the top policy without its power','Caos: aprobar la primera política sin su poder')], answer:1,
      explanation:L('A veto advances the tracker. Election alone does not reset it; enacting a policy does. The third advance triggers chaos and clears term limits. Veto is available after 5 Fascist policies.','Un veto avanza el marcador. Elegir gobierno no lo reinicia; aprobar una política sí. El tercer avance provoca caos y elimina restricciones de cargos. El veto está disponible tras 5 políticas fascistas.'), section:'legislation'
    }
  ],
  el_camarero: [
    {
      question:L('There are 6 players. You choose to return unwanted dishes. How many must you attempt?','Son 6 jugadores. Eliges devolver platos que nadie pidió. ¿Cuántos debes intentar devolver?'),
      choices:[L('1 dish','1 plato'),L('2 dishes','2 platos'),L('As many as I want','Los que quiera')], answer:1,
      explanation:L('With 5–7 players, attempt 2 returns, one at a time. An error stops the turn; earlier correct returns stay yours.','Con 5–7 jugadores debes intentar 2 devoluciones, de a una. Un error termina el turno; conservas las devoluciones correctas anteriores.'), section:'service'
    },
    {
      question:L('The draw pile is empty, but dishes remain in the kitchen and orders are unserved. Is the game over?','El mazo está vacío, pero quedan platos en la cocina y pedidos sin servir. ¿Terminó la partida?'),
      choices:[L('Yes, score now','Sí, contar puntos'),L('No, continue serving or returning dishes','No, seguir sirviendo o devolviendo')], answer:1,
      explanation:L('An empty draw pile is not enough. Continue until all orders are served or the kitchen has no cards left.','Agotar el mazo no basta. Sigan hasta servir todos los pedidos o dejar la cocina sin cartas.'), section:'scoring'
    }
  ],
  monopoly: [
    {
      question:L('You decline an unowned property. What must the Banker do?','Rechazas una propiedad libre. ¿Qué debe hacer el banco?'),
      choices:[L('Leave it for the next visitor','Dejarla para quien caiga después'),L('Auction it to everyone, including you','Subastarla entre todos, incluso tú')], answer:1,
      explanation:L('Declining the printed price starts an auction immediately. You may still bid. This keeps properties entering play.','Rechazar el precio impreso inicia una subasta de inmediato. También puedes pujar. Así las propiedades entran en juego.'), section:'movement'
    },
    {
      question:L('You own a complete color group. One street is mortgaged. What rent applies to another, unimproved and unmortgaged street?','Tienes un color completo y una calle hipotecada. ¿Cuánto cobra otra calle del grupo, sin construir y sin hipoteca?'),
      choices:[L('Double its base rent','El doble del alquiler base'),L('No rent anywhere in the group','Ningún alquiler en todo el grupo')], answer:0,
      explanation:L('The mortgage blocks rent only on that property. The other unimproved streets still earn double rent for the complete color group. Building must wait until all mortgages in the group are lifted.','La hipoteca impide cobrar solo en esa propiedad. Las otras calles sin construir mantienen el alquiler doble por color completo. Para construir debes cancelar todas las hipotecas del grupo.'), section:'property'
    }
  ],
  chess: [
    {
      question:L('Your king is not in check, but you have no legal move with any piece. What is the result?','Tu rey no está en jaque, pero no tienes ninguna jugada legal con ninguna pieza. ¿Cuál es el resultado?'),
      choices:[L('Checkmate: you lose','Jaque mate: pierdes'),L('Stalemate: a draw','Ahogado: tablas'),L('Skip your turn','Pasar el turno')], answer:1,
      explanation:L('No legal moves plus no check is stalemate. Checkmate requires the king to be in check. You cannot pass a turn.','Sin jugadas legales y sin jaque hay ahogado. El mate exige que el rey esté en jaque. No se puede pasar el turno.'), section:'check'
    },
    {
      question:L('The king and rook have never moved and the path is empty, but the king would cross an attacked square. May you castle?','Rey y torre nunca se movieron y el camino está vacío, pero el rey cruzaría una casilla atacada. ¿Puedes enrocar?'),
      choices:[L('Yes, if the destination is safe','Sí, si el destino es seguro'),L('No, the crossing square must also be safe','No, la casilla de paso también debe ser segura')], answer:1,
      explanation:L('The king cannot start in check, cross an attacked square or finish on one. Empty squares alone do not make castling legal.','El rey no puede empezar en jaque, cruzar una casilla atacada ni terminar en una. No basta con que el camino esté vacío.'), section:'special'
    }
  ],
  burako: [
    {
      question:L('Can a same-number group contain two red 8s and one blue 8 in this variant?','¿Una pierna puede tener dos 8 rojos y un 8 azul en esta variante?'),
      choices:[L('Yes, repeated colors are allowed','Sí, se permiten colores repetidos'),L('No, all colors must differ','No, todos deben ser distintos')], answer:0,
      explanation:L('This guide uses the Argentine coastal variant: groups match numbers, regardless of color. Runs instead need consecutive numbers of one color.','Esta guía usa la variante argentino-costera: las piernas reúnen el mismo número sin importar el color. Las escaleras sí necesitan números consecutivos de un color.'), section:'turn'
    },
    {
      question:L('You have 2 tiles on your rack and the discard pile has 2. May you take the discard pile?','Tienes 2 fichas en el atril y hay 2 en el pozo. ¿Puedes levantar el pozo?'),
      choices:[L('Yes, take both','Sí, tomar las dos'),L('No, draw from the stock','No, robar de la pila')], answer:1,
      explanation:L('In this variant, rack plus discard pile must total at least 5. Here 2 + 2 = 4, so you must draw from the stock.','En esta variante, atril y pozo deben sumar al menos 5. Aquí 2 + 2 = 4, así que debes robar de la pila.'), section:'turn'
    }
  ],
  truco: [
    {
      question:L('The muestra is the 4 of coins. Which card becomes that missing piece?','La muestra es el 4 de oros. ¿Qué carta ocupa el lugar de esa pieza?'),
      choices:[L('The 12 of coins','El 12 de oros'),L('Every 4','Todos los 4'),L('The ace of coins','El as de oros')], answer:0,
      explanation:L('When a piece itself is the muestra, the 12 of that suit takes its rank and value. Here it replaces the 4, below the 2 and above the 5 of coins.','Si la muestra es una pieza, el 12 de su palo adopta su jerarquía y valor. Aquí reemplaza al 4: debajo del 2 y encima del 5 de oros.'), section:'ranking'
    },
    {
      question:L('The muestra is cups. You hold the 4 of cups, 3 of swords and 6 of coins. What is your envido?','La muestra es de copas. Tienes 4 de copas, 3 de espadas y 6 de oros. ¿Cuánto tienes de envido?'),
      choices:[L('29','29'),L('35','35'),L('38','38')], answer:1,
      explanation:L('The piece joins the 6: 20 + 9 + 6 = 35. The 3 does not add to this two-card count. These two ordinary cards have different suits, so the hand has no flor.','La pieza se une al 6: 20 + 9 + 6 = 35. El 3 no se suma a este tanto de dos cartas. Las dos cartas comunes son de palos distintos, así que no hay flor.'), section:'flor-envido'
    }
  ]
};

const practiceState = {};
function scenarioPractice() {
  const scenarios = PRACTICE[state.game];
  if (!scenarios) return '';
  const progress = practiceState[state.game] ||= {index:0, answers:[]};
  const scenario = scenarios[progress.index];
  const answer = progress.answers[progress.index];
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
  return answer===undefined ? tr('Choose an answer to see the explanation.','Elige una respuesta para ver la explicación.') : `<strong>${answer===scenario.answer?tr('Correct.','Correcto.'):tr('Not quite.','Todavía no.')}</strong> ${e(scenario.explanation)}`;
}
function bindScenarioPractice() {
  const scenarios = PRACTICE[state.game];
  if (!scenarios || !$('#scenario-practice')) return;
  const progress = practiceState[state.game];
  $$('[data-scenario-choice]').forEach(button => button.onclick = () => {
    progress.answers[progress.index] = +button.dataset.scenarioChoice;
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
    patchTool('scenario-practice',scenarioPractice(),'scenario-choice-0');
  };
}
