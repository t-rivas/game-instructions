/* Finite comparisons derived from verified teaching data, never live game state.
 * Independent expectations and rulebook sections: docs/lesson-comparison-sources.md. */
const LESSON_COMPARISONS = (() => {
  const T = (en, es) => ({en, es});
  const skullBase = SKULL_TRICKS.scenarios.find(s => s.id === 'pirate-mermaid');
  // The only new trick fixture: replace Bruno's numbered card, keep order/cards.
  const skullKing = {plays:['mermaid','king','pirate'], winner:0, next:0};
  const skullSituation = (snapshot, label, fact, explanation) => ({
    label, fact, result:String(snapshot.winner), snapshot,
    groups:[{label:T('Clockwise · Ana → Bruno → Cami','Orden horario · Ana → Bruno → Cami'), items:snapshot.plays.map((id,i) => {
      const card = SKULL_TRICKS.cards[id];
      return {label:T(`${i+1} · ${['Ana','Bruno','Cami'][i]}`,`${i+1} · ${['Ana','Bruno','Cami'][i]}`), name:id==='black-14'?T('Black 14 · trump','Negro 14 · triunfo'):card.name, ...(card.art?{art:card.art}:{}), ...(card.rank?{rank:card.rank,suit:T('Black · trump','Negro · triunfo')}:{}), changed:i===1};
    })}],
    outcome:T(`${['Ana','Bruno','Cami'][snapshot.winner]} wins · leads next`,`${['Ana','Bruno','Cami'][snapshot.winner]} gana · sale después`), explanation,
  });
  const coupSituation = (id, label, fact, explanation) => {
    const snapshot = COUP_LESSON.nodes[id];
    const proved = id === 'tax-true';
    const cardName = id => LESSON_CARD_FACTS[id].name || OFFICIAL[id].title;
    return {label,fact,result:proved?'tax':'cancelled',snapshot,
      groups:[{label:T('During the challenge','Durante el desafío'),items:[proved
        ? {name:cardName('coup-duke'),art:'coup-duke',symbol:'✓',changed:true,note:T('Proof → shuffled back into deck','Prueba → se mezcla en el mazo')}
        : {name:T('No Duke proved','No demuestra Duque'),symbol:'×',changed:true,note:T('Ana cannot prove the claim.','Ana no puede demostrar la declaración.')} ]},
        ...snapshot.players.slice(0,2).map(p => ({label:T(`${p.name} · after resolution`,`${p.name} · tras resolver`),after:true,
          quantity:T(`${p.coins} coins · ${p.hidden} influence`,`${p.coins} monedas · ${p.hidden} influencias`),
          items:[...Array.from({length:p.hidden},(_,i)=>({name:T('Face down','Boca abajo'),symbol:'✦',...(proved&&p.name==='Ana'&&i===1?{note:T('Replacement · unknown','Reemplazo · desconocido')}:{})})),
            ...p.lost.map(card=>({name:cardName(card),art:card,symbol:'×',note:T('Face up · lost','Boca arriba · perdida')}))]
        }))],
      outcome:proved?T('Tax resolves · Ana takes 3 coins','Impuestos se resuelve · Ana toma 3 monedas'):T('Tax cancelled · Ana takes 0 coins','Impuestos se cancela · Ana toma 0 monedas'),explanation,
    };
  };
  const avalonSituation = players => {
    const roster = avalonExampleRoster(AVALON_TEACHING,{players,avalonMode:'basic',optional:[]});
    const quest = avalonExampleQuest(AVALON_TEACHING,players,4,1);
    const team = avalonExampleTeam(roster,quest.size);
    return {label:T(`${players} players`,`${players} jugadores`),
      fact:T(`Quest 4 · ${players} players → ${quest.threshold} Fail${quest.threshold===1?'':'s'} needed`, `Misión 4 · ${players} jugadores → ${quest.threshold} Fracaso${quest.threshold===1?'':'s'} necesario${quest.threshold===1?'':'s'}`),
      result:quest.succeeds?'success':'fail',snapshot:{players,roster,team,quest:4,fails:1,...quest},
      groups:[{label:T('Fictional roster · ✓ on team / ○ off team','Mesa ficticia · ✓ en equipo / ○ fuera'),
        quantity:T(`${AVALON_TEACHING.setups[players].good} Good / ${AVALON_TEACHING.setups[players].evil} Evil · required team: ${quest.size}`,`${AVALON_TEACHING.setups[players].good} del Bien / ${AVALON_TEACHING.setups[players].evil} del Mal · equipo requerido: ${quest.size}`),
        items:roster.map(r=>({name:T(`Seat ${r.seat}`,`Lugar ${r.seat}`),symbol:team.some(t=>t.seat===r.seat)?'✓':'○',symbolLabel:team.some(t=>t.seat===r.seat)?T('On team','En el equipo'):T('Off team','Fuera del equipo'),compact:true,changed:r.seat===7}))},
        {label:T('Shuffled submissions · anonymous','Cartas mezcladas · anónimas'),
          quantity:T(`${quest.size} cards · 1 Fail in both situations`,`${quest.size} cartas · 1 Fracaso en ambos casos`),
          items:Array.from({length:quest.size},(_,i)=>({name:AVALON_TEACHING.copy[i===0?'fail':'success'],symbol:i===0?'×':'✓',compact:true}))}],
      outcome:AVALON_TEACHING.copy[quest.succeeds?'success':'fail'],
      explanation:quest.succeeds
        ? T('At 7 players, quest 4 needs 2 Fails. One Fail is below that threshold, so the quest succeeds.','Con 7 jugadores, la misión 4 necesita 2 Fracasos. Un Fracaso no alcanza ese mínimo, así que la misión tiene éxito.')
        : T('At 6 players, quest 4 needs only 1 Fail. That single Fail makes the quest fail.','Con 6 jugadores, la misión 4 necesita solo 1 Fracaso. Esa única carta hace fallar la misión.'),
    };
  };
  return {
    skull_king:[{id:'mermaid-king',lessons:['basic-trick'],basic:2,rule:'hierarchy',
      question:T('Does adding Skull King change who wins?','¿Agregar Skull King cambia quién gana?'),
      context:T('Three players, one card each. Ana and Cami keep the same cards; only Bruno’s card changes. A character lead leaves no suit to follow. Base rules, without pirate powers.','Tres jugadores, una carta cada uno. Ana y Cami conservan sus cartas; solo cambia la de Bruno. La salida de personaje deja la baza sin palo a seguir. Reglas base, sin poderes de pirata.'),
      difference:T('Bruno: black 14 → Skull King','Bruno: negro 14 → Skull King'),
      situations:[
        skullSituation(skullBase,T('Mermaid versus Pirate','Sirena contra Pirata'),T('Skull King absent','Sin Skull King'),T('Without Skull King, Pirate beats Mermaid and all numbered cards. Cami’s Pirate wins.','Sin Skull King, Pirata supera a Sirena y a todas las numeradas. Gana el Pirata de Cami.')),
        skullSituation(skullKing,T('Skull King joins the trick','Skull King entra en la baza'),T('Skull King present','Con Skull King'),T('Mermaid + Pirate + Skull King triggers the exception: Mermaid wins, regardless of play order. Ana wins.','Sirena + Pirata + Skull King activa la excepción: gana Sirena, sin importar el orden de juego. Gana Ana.')),
      ],
      exception:T('This is a three-character exception. Skull King beats Pirates when no Mermaid is present. Expansion cards and optional pirate powers have their own exceptions.','Esta es una excepción de tres personajes. Skull King supera a Pirata si no hay Sirena. Las cartas de expansión y los poderes opcionales tienen sus propias excepciones.'),
      source:{url:skullBase.sourceUrl,section:T('Skull King · Special Cards & Leading with Special Cards, pp. 10–12','Skull King · cartas especiales y salida con especiales, págs. 10–12')},
    }],
    coup:[{id:'challenged-tax',lessons:['basic-challenge'],basic:2,rule:'challenges',
      question:T('Who loses influence when Tax is challenged?','¿Quién pierde influencia al desafiar Impuestos?'),
      context:T('Same claim: Ana announces Duke / Tax; Bruno challenges. All three start with 2 coins and 2 influence. Cami keeps those totals in both situations. Two fictional hands, base Coup rules.','Misma declaración: Ana anuncia Duque / Impuestos; Bruno desafía. Los tres comienzan con 2 monedas y 2 influencias. Cami conserva esos totales en ambos casos. Dos manos ficticias, reglas de Coup base.'),
      difference:T('Ana proves Duke → Ana cannot prove Duke','Ana demuestra Duque → Ana no demuestra Duque'),
      situations:[
        coupSituation('tax-true',T('Duke proved','Duque demostrado'),T('Ana shows Duke','Ana muestra Duque'),T('Proof makes Bruno lose the challenge and 1 influence: Captain stays face up. Ana shuffles Duke into the deck, draws a hidden replacement, then takes 3 coins. Proof costs her no influence.','La prueba hace perder a Bruno el desafío y 1 influencia: Capitán queda boca arriba. Ana mezcla Duque en el mazo, toma un reemplazo oculto y después cobra 3 monedas. La prueba no le cuesta influencia.')),
        coupSituation('tax-caught',T('Bluff exposed','Mentira descubierta'),T('Ana cannot show Duke','Ana no puede mostrar Duque'),T('Without proof, Ana loses the challenge and 1 influence: Captain stays face up. Tax fails, so she receives no coins. A lost card is never replaced; her other card stays hidden. Bruno loses nothing.','Sin prueba, Ana pierde el desafío y 1 influencia: Capitán queda boca arriba. Impuestos falla, así que no recibe monedas. Una carta perdida no se reemplaza; la otra queda oculta. Bruno no pierde nada.')),
      ],
      exception:T('Tax cannot be blocked. An unchallenged Tax claim succeeds even if it is a bluff. If a player loses their last influence, they leave immediately. Reformation restrictions remain in the full rules.','Impuestos no se puede bloquear. Si nadie lo desafía, tiene éxito aunque sea mentira. Al perder la última influencia, se abandona la partida de inmediato. Las restricciones de Reformation están en las reglas completas.'),
      source:{url:'https://officialgamerules.org/wp-content/uploads/2025/02/Coup-Rulebook.pdf',section:T('Coup · Influence (p. 2), Duke / Tax (p. 3), Challenges (p. 5)','Coup · influencia (pág. 2), Duque / Impuestos (pág. 3), desafíos (pág. 5)')},
    }],
    avalon:[{id:'fourth-quest',lessons:['basic-quest'],basic:3,rule:'quests',
      question:T('Can one Fail still mean a successful quest?','¿Un Fracaso puede dejar una misión exitosa?'),
      context:T('Quest 4, an approved team and exactly 1 anonymous Fail in both situations. Player count also changes the roster and required team size. These fictional tables do not change your setup.','Misión 4, un equipo aprobado y exactamente 1 Fracaso anónimo en ambos casos. La cantidad de jugadores también cambia la mesa y el tamaño requerido del equipo. Estas mesas ficticias no cambian tu preparación.'),
      difference:T('6 → 7 players · Fail threshold: 1 → 2','6 → 7 jugadores · mínimo de Fracasos: 1 → 2'),
      situations:[avalonSituation(6),avalonSituation(7)],
      exception:T('The 2-Fail exception applies only to quest 4 at 7–10 players. All other quests, including quest 5, need just 1 Fail. Good must submit Success; Evil may submit either. Success does not prove everyone is Good.','La excepción de 2 Fracasos vale solo para la misión 4 con 7–10 jugadores. Las demás, incluida la misión 5, necesitan solo 1 Fracaso. El Bien debe jugar Éxito; el Mal puede elegir cualquiera. Un éxito no demuestra que todos sean del Bien.'),
      source:{url:'https://avalon.fun/pdfs/rules.pdf',section:T('Avalon · Setup (p. 2), Team Building (p. 3), Quest Phase notes (p. 5)','Avalon · preparación (pág. 2), formación de equipo (pág. 3), notas de misión (pág. 5)')},
    }],
  };
})();

// Portable guide uses the same snapshots and presentation structure, memory only.
const comparisonReveals = {};
function lessonComparisons(n) {
  return (LESSON_COMPARISONS[state.game]||[]).filter(c=>c.basic===n).map(c=>{
    const shown=!!comparisonReveals[c.id];
    return `<details class="lesson-comparison" data-comparison="${c.id}"><summary>${tr('What changes the result?','¿Qué cambia el resultado?')}</summary><div class="comparison-body"><h4>${e(c.question)}</h4><p>${e(c.context)}</p><p class="comparison-difference"><b>↔ ${tr('Changed fact','Dato que cambia')}: ${e(c.difference)}</b></p><div class="comparison-pair">${c.situations.map((s,i)=>`<article class="comparison-situation" data-situation="${i}"><h5>${i===0?'A':'B'} · ${e(s.label)}</h5><p class="comparison-fact">◆ ${e(s.fact)}</p>${s.groups.map(g=>`<div class="comparison-group" ${g.after&&!shown?'hidden':''} data-after="${!!g.after}"><strong>${e(g.label)}</strong>${g.quantity?`<p class="comparison-quantity">${e(g.quantity)}</p>`:''}<ul class="comparison-items">${g.items.map(item=>`<li class="comparison-item" data-changed="${!!item.changed}" data-compact="${!!item.compact}">${item.label?`<small>${e(item.label)}</small>`:''}${item.changed?`<span class="comparison-marker">◆ ${tr('Changed','Cambia')}</span>`:''}${item.art?officialButton(item.art,'lesson-card-art'):item.rank?`<div class="comparison-schematic"><b>${item.rank}</b><span>${e(item.suit)}</span></div>`:item.symbol?`<span class="comparison-symbol" ${item.symbolLabel?`role="img" aria-label="${e(item.symbolLabel)}"`:'aria-hidden="true"'}>${item.symbol}</span>`:''}<b>${e(item.name)}</b>${item.note?`<small>${e(item.note)}</small>`:''}</li>`).join('')}</ul></div>`).join('')}<div class="comparison-outcome" data-comparison-result="${s.result}" ${shown?'':'hidden'}><strong>${tr('Outcome','Resultado')}: ${e(s.outcome)}</strong><p>${e(s.explanation)}</p></div></article>`).join('')}</div><div class="comparison-controls"><button type="button" data-comparison-reveal ${shown?'disabled':''}>${tr('Reveal both outcomes','Revelar ambos resultados')}</button><button type="button" data-comparison-replay>${tr('Replay','Repetir')}</button><span role="status" aria-atomic="true">${shown?tr('Both outcomes revealed','Ambos resultados revelados'):''}</span></div><p class="comparison-exception">${e(c.exception)}</p><div class="comparison-links"><a href="#${state.game}/full/${c.rule}">${tr('Full rules & exceptions','Reglas completas y excepciones')} →</a><a href="${c.source.url}">${e(c.source.section)}</a></div></div></details>`;
  }).join('');
}
function bindLessonComparisons() {
  document.querySelectorAll('[data-comparison]').forEach(root=>{
    const set=shown=>{
      comparisonReveals[root.dataset.comparison]=shown;
      root.querySelectorAll('.comparison-outcome,[data-after=true]').forEach(el=>el.hidden=!shown);
      root.querySelector('[data-comparison-reveal]').disabled=shown;
      root.querySelector('[role=status]').textContent=shown?tr('Both outcomes revealed','Ambos resultados revelados'):'';
      if(!shown)root.querySelector('[data-comparison-reveal]').focus();
    };
    root.querySelector('[data-comparison-reveal]').onclick=()=>set(true);
    root.querySelector('[data-comparison-replay]').onclick=()=>set(false);
    root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.hidden=true));
  });
}
