// Item 10: guide-only context. Never reads or writes a game session.
function setupCopy(en, es) { return {en, es}; }
function guidePlayerCount(id, value) {
  const max = id === 'coup' ? 10 : id === 'sushi_go_party' ? 8 : 0;
  return Number.isInteger(value) && value >= 2 && value <= max ? value : null;
}
function selectedSetup(id, options) {
  const n = guidePlayerCount(id, options.guidePlayers);
  if (id === 'coup') {
    const copies = n ? (n <= 6 ? 3 : n <= 8 ? 4 : 5) : null;
    return [copies ? setupCopy(
      `For ${n} players, use ${copies} copies of each of five characters: ${copies * 5} cards total. Set extra copies aside.${n > 6 ? ' Extra character copies from Reformation are needed; allegiance rules remain optional.' : ''}`,
      `Para ${n} jugadores, usa ${copies} copias de cada uno de cinco personajes: ${copies * 5} cartas en total. Aparta las copias extra.${n > 6 ? ' Necesitas las copias extra de Reformation; las reglas de bandos siguen siendo opcionales.' : ''}`
    ) : setupCopy('Choose a player count to see the applicable deck size. Use five character types; extra copies are needed above six players.', 'Elige la cantidad de jugadores para ver el tamaño de mazo correspondiente. Usa cinco tipos de personaje; con más de seis necesitas copias extra.'),
    setupCopy(
      `Use Duke, Assassin, Captain, Contessa and ${options.exchange === 'inquisitor' ? 'Inquisitor instead of Ambassador (optional variant)' : 'Ambassador (base game)'}. Deal two secret cards and two coins each.${n === 2 ? ' The starting player receives only one coin.' : n === null ? ' With two players, the starting player receives only one coin.' : ''}`,
      `Usa Duque, Asesino, Capitán, Condesa y ${options.exchange === 'inquisitor' ? 'Inquisidor en lugar de Embajador (variante opcional)' : 'Embajador (juego base)'}. Reparte dos cartas secretas y dos monedas por persona.${n === 2 ? ' Quien empieza recibe solo una moneda.' : n === null ? ' Con dos jugadores, quien empieza recibe solo una moneda.' : ''}`
    )];
  }
  if (id === 'sushi_go_party') {
    const deal = n ? (n <= 3 ? 10 : n <= 5 ? 9 : n <= 7 ? 8 : 7) : null;
    const desserts = n && n >= 6 ? [7,5,3] : [5,3,2];
    const menu = setupCopy('Use Nigiri, one roll type, three different appetizers, two different specials and one dessert. Use only these sets and put their matching tiles on the board.', 'Usa nigiri, un tipo de rollo, tres aperitivos distintos, dos especiales distintos y un postre. Usa solo esos conjuntos y coloca sus fichas en el tablero.');
    const restrictions = n === null ? setupCopy('Choose a player count to see menu restrictions. Menu and Special Order are for 2–6; Spoon and Edamame are for 3–8.', 'Elige la cantidad de jugadores para ver las restricciones del menú. Menú y Pedido especial son para 2–6; Cuchara y Edamame son para 3–8.')
      : n === 2 ? setupCopy('Do not use Spoon or Edamame. Use the 2–5-player side of the Maki tile. Pudding and Temaki have no negative score at two players.', 'No uses Cuchara ni Edamame. Usa el lado de 2–5 jugadores de la ficha de Maki. Budín y Temaki no dan puntos negativos con dos jugadores.')
      : n >= 7 ? setupCopy('Do not use Menu or Special Order. Use the 6–8-player side of the Maki tile.', 'No uses Menú ni Pedido especial. Usa el lado de 6–8 jugadores de la ficha de Maki.')
      : setupCopy(`All base menu types are available. Use the ${n === 6 ? '6–8' : '2–5'}-player side of the Maki tile.`, `Todos los tipos del menú base están disponibles. Usa el lado de ${n === 6 ? '6–8' : '2–5'} jugadores de la ficha de Maki.`);
    return [menu, deal ? setupCopy(
      `For ${n} players, deal ${deal} cards each in every round. Before rounds 1, 2 and 3, shuffle ${desserts[0]}, ${desserts[1]} and ${desserts[2]} dessert cards into the main deck, respectively.${n <= 5 ? ' Leave the other five dessert cards out.' : ''} Keep played desserts between rounds; score them after round 3.`,
      `Para ${n} jugadores, reparte ${deal} cartas por persona en cada ronda. Antes de las rondas 1, 2 y 3, mezcla ${desserts[0]}, ${desserts[1]} y ${desserts[2]} cartas de postre en el mazo principal, respectivamente.${n <= 5 ? ' Deja fuera las otras cinco cartas de postre.' : ''} Conserva los postres jugados entre rondas; puntúalos después de la ronda 3.`
    ) : setupCopy('Choose a player count to see the deal and dessert schedule. Shuffle the chosen desserts separately, then add a batch before each round. Keep played desserts until scoring after round 3.', 'Elige la cantidad de jugadores para ver el reparto y el calendario de postres. Mezcla los postres elegidos aparte y agrega un grupo antes de cada ronda. Conserva los postres jugados hasta puntuarlos después de la ronda 3.'), restrictions];
  }
  if (id === 'skull_king') return [setupCopy(
    options.skullExpansion ? 'Base box + Expansion Pack selected. Agree which new cards and powers to include before preparing the deck; base teaching examples stay labeled separately.' : 'Base box selected. For a first game, set aside the four blank cards, two Loot cards, Kraken and White Whale. Named-pirate powers are optional.',
    options.skullExpansion ? 'Caja base + paquete de expansión seleccionados. Acuerden qué cartas y poderes nuevos incluir antes de preparar el mazo; los ejemplos base conservan su etiqueta.' : 'Caja base seleccionada. Para la primera partida, aparta las cuatro cartas en blanco, las dos de Botín, Kraken y Ballena Blanca. Los poderes de piratas con nombre son opcionales.'),
    setupCopy('Optional base-box cards and pirate powers have separately labeled examples. Open their options in the trick lesson to try them; they do not change the base examples.', 'Las cartas opcionales de la caja base y los poderes de piratas tienen ejemplos con etiquetas propias. Abre sus opciones en la lección de bazas para probarlos; no cambian los ejemplos base.')];
  return [];
}
function setupSummary(id, options) {
  const n = guidePlayerCount(id, options.guidePlayers);
  if (id === 'coup') {
    const role = options.exchange === 'inquisitor' ? setupCopy('Inquisitor variant','Variante Inquisidor') : setupCopy('Ambassador · base game','Embajador · juego base');
    const copies = n <= 6 ? 3 : n <= 8 ? 4 : 5;
    return setupCopy(n ? `${n} players · ${role.en}. ${copies} copies × 5 characters = ${copies*5} cards.` : `${role.en}. Choose a count for the deck size.`, n ? `${n} jugadores · ${role.es}. ${copies} copias × 5 personajes = ${copies*5} cartas.` : `${role.es}. Elige la cantidad de jugadores para ver el tamaño del mazo.`);
  }
  if (id === 'sushi_go_party') {
    if (!n) return setupCopy('Choose a count for the deal, dessert schedule and menu limits.','Elige la cantidad de jugadores para ver el reparto, los postres y los límites del menú.');
    const deal = n <= 3 ? 10 : n <= 5 ? 9 : n <= 7 ? 8 : 7;
    const desserts = n <= 5 ? [5,3,2] : [7,5,3];
    return setupCopy(`${n} players: ${deal} cards each. Desserts to add: round 1 = ${desserts[0]}; round 2 = ${desserts[1]}; round 3 = ${desserts[2]}.${n===2?' No Spoon or Edamame.':n>=7?' No Menu or Special Order.':''}`, `${n} jugadores: ${deal} cartas por persona. Postres para agregar: ronda 1 = ${desserts[0]}; ronda 2 = ${desserts[1]}; ronda 3 = ${desserts[2]}.${n===2?' Sin Cuchara ni Edamame.':n>=7?' Sin Menú ni Pedido especial.':''}`);
  }
  return setupCopy(options.skullExpansion ? 'Base box + Expansion Pack. Expansion examples are labeled separately.' : 'Base box. Core examples exclude optional cards and pirate powers.', options.skullExpansion ? 'Caja base + paquete de expansión. Los ejemplos de expansión tienen etiquetas propias.' : 'Caja base. Los ejemplos básicos excluyen cartas opcionales y poderes de piratas.');
}
function contextualBasics(id, basics, options) {
  const selected = selectedSetup(id, options);
  return basics.map((text, i) => id === 'coup' && i === 0 ? setupCopy(selected[0].en + ' ' + selected[1].en, selected[0].es + ' ' + selected[1].es)
    : id === 'sushi_go_party' && i === 0 ? setupCopy(selected[0].en + ' ' + selected[2].en, selected[0].es + ' ' + selected[2].es)
    : id === 'sushi_go_party' && i === 1 ? selected[1] : text);
}
// END SHARED MODEL
function guideSetupContext() {
  const copy = selectedSetup(state.game, state);
  if (!copy.length) return '';
  const max = state.game === 'coup' ? 10 : state.game === 'sushi_go_party' ? 8 : 0;
  const n = guidePlayerCount(state.game, state.guidePlayers);
  const sections = [...GAMES[state.game].sections, ...(GAMES[state.game].expansionSections || [])].filter((section,index,list)=>list.findIndex(other=>other.id===section.id)===index).filter(s => ['setup','menu','deal','base-options','pirate-powers','expansion-setup'].includes(s.id));
  return `<section class="block guide-setup-context"><h2>${tr('Rules for your setup','Reglas para tu preparación')}</h2>${max ? `<label for="guide-player-count">${tr('Guide player count (optional)','Jugadores en la guía (opcional)')}</label><select id="guide-player-count"><option value="">${tr('Not chosen · general guidance','Sin elegir · orientación general')}</option>${Array.from({length:max-1},(_,i)=>i+2).map(count=>`<option value="${count}" ${n===count?'selected':''}>${count}</option>`).join('')}</select>` : ''}<p role="status">${e(setupSummary(state.game,state))}</p>${fold('selected-setup-details',L('Setup details for this choice','Detalles de esta preparación'),copy.map(p=>`<p>${e(p)}</p>`).join(''))}${fold('other-setups',L('Other player counts / variants','Otras cantidades de jugadores / variantes'),sections.map(s=>`<h3>${e(s.title)}</h3>${s.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}`).join(''))}</section>`;
}
