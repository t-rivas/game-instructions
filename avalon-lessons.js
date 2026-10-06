/* Pure teaching models: fictional seats only; no storage or live assignments. */
function avalonExampleRoster(data, options) {
  const setup = data.setups[options.players];
  const selected = options.avalonMode === 'basic' ? [] : options.optional;
  const roles = data.roles.filter(r => ['merlin','assassin'].includes(r.id) || selected.includes(r.id));
  for (const side of ['good','evil']) {
    const count = setup[side] - roles.filter(r => r.side === side).length;
    for (let n = 0; n < count; n++) roles.push(data.generic[side]);
  }
  return roles.map((role, index) => {
    const targets = roles.flatMap((other, i) => {
      if (i === index) return [];
      const seen = role.id === 'merlin' ? other.side === 'evil' && other.id !== 'mordred'
        : role.id === 'percival' ? ['merlin','morgana'].includes(other.id)
        : role.side === 'evil' && role.id !== 'oberon' ? other.side === 'evil' && other.id !== 'oberon' : false;
      return seen ? [i + 1] : [];
    });
    return {...role, seat:index + 1, targets};
  });
}
function avalonExampleQuest(data, players, quest, fails) {
  const size = data.setups[players].quests[quest - 1];
  const threshold = quest === 4 && players >= 7 ? 2 : 1;
  return {size, threshold, succeeds:fails < threshold, successes:size - fails, approvals:Math.floor(players / 2) + 1};
}
function avalonExampleTeam(roster, size) {
  return [...roster.filter(r => r.side === 'evil').slice(0,2), ...roster.filter(r => r.side === 'good').slice(0,size-2)].sort((a,b) => a.seat-b.seat);
}
function avalonExampleVote(players, mode = 'approve') {
  const approvals = Math.floor(players / 2) + (mode === 'approve' ? 1 : 0);
  return {approvals, rejects:players-approvals, approved:approvals > players/2, tied:approvals === players/2};
}
// END SHARED MODEL
const AVALON_TEACHING = {
  setups: AVALON_SETUPS,
  roles: AVALON_ROLES,
  generic: {
    good:{id:'servant',side:'good',name:L('Loyal Servant of Arthur','Leal a Arturo'),text:L('No opening information about other players.','No recibe información inicial sobre otras personas.')},
    evil:{id:'minion',side:'evil',name:L('Minion of Mordred','Esbirro de Mordred'),text:L('Recognizes other Evil players except Oberon.','Reconoce a los demás jugadores del Mal, excepto a Oberón.')}
  },
  unknown: {
    merlin:L('Does not learn exact Evil roles. If Mordred is included, an unseen player is not necessarily Good.','No conoce los personajes exactos del Mal. Si participa Mordred, alguien que no vio puede ser del Mal.'),
    percival:L('With Morgana, cannot tell which of the two is Merlin. Learns no other players’ loyalties.','Con Morgana, no distingue cuál de los dos es Merlín. No conoce los bandos de las demás personas.'),
    evil:L('Does not learn who Merlin or Percival is, or the exact roles of Evil allies. Oberon stays hidden from this group.','No sabe quién es Merlín ni Percival, ni los personajes exactos de sus aliados. Oberón queda oculto para este grupo.'),
    oberon:L('Does not know any allies. Other Evil players do not recognize Oberon; Merlin does.','No conoce a sus aliados. Los demás jugadores del Mal no reconocen a Oberón; Merlín sí.'),
    servant:L('Does not know Merlin, other Good players, or Evil players.','No conoce a Merlín, a las demás personas del Bien ni a las del Mal.')
  },
  copy: {
    title:L('Roles, secrets & a quest','Personajes, secretos y una misión'),
    fiction:L('Teaching example only. Numbered seats are fictional, not your table’s assignments. Never enter or reveal real secret roles here.','Solo es un ejemplo para aprender. Los lugares numerados son ficticios, no son los personajes de tu mesa. Nunca ingreses ni reveles personajes secretos reales aquí.'),
    balance:L('With 5 players and Percival, the rulebook recommends including Morgana or Mordred for balance. Optional roles still replace ordinary roles on the same side.','Con 5 jugadores y Percival, el reglamento recomienda incluir a Morgana o Mordred para equilibrar la partida. Los opcionales sustituyen personajes comunes de su mismo bando.'),
    roles:L('Your selected roles','Los personajes seleccionados'),
    roleIntro:L('A role card stays secret and gives you a side, an objective and sometimes private opening information. Repeated ordinary roles are shown once.','Tu personaje se mantiene en secreto: indica tu bando, tu objetivo y, a veces, información inicial privada. Los personajes comunes repetidos se muestran una sola vez.'),
    good:L('Good','Bien'),evil:L('Evil','Mal'),
    goal:L('Objective','Objetivo'),knows:L('Opening information','Información inicial'),unknown:L('Does not know','No sabe'),
    goodGoal:L('Complete 3 quests successfully and protect Merlin from the Assassin.','Lograr 3 misiones exitosas y proteger a Merlín del Asesino.'),
    evilGoal:L('Win through 3 failed quests, 5 rejected teams in a row, or identifying Merlin after 3 successes.','Ganar con 3 misiones fallidas, 5 equipos rechazados seguidos o identificando a Merlín tras 3 éxitos.'),
    portrait:L('Small published role portrait; read the explanation beside it.','Retrato publicado pequeño; lee la explicación que lo acompaña.'),
    tile:L('Labeled role tile; no official artwork available here.','Ficha con el nombre del personaje; aquí no hay ilustración oficial disponible.'),
    diagram:L('Who recognizes whom?','¿Quién reconoce a quién?'),
    diagramIntro:L('This is a teaching view of the entire fictional roster. Each arrow belongs only to the role on its left: the table does not share that knowledge. Seat numbers identify fictional people, not real players.','Esta vista muestra todos los personajes ficticios para aprender. Cada flecha pertenece solo al personaje de la izquierda: la mesa no comparte esa información. Los números identifican personas ficticias, no jugadores reales.'),
    seat:L('Seat','Lugar'),none:L('Nobody','Nadie'),sees:L('Privately recognizes','Reconoce en secreto'),
    seesEvil:L('as Evil, without exact role names','como integrantes del Mal, sin conocer sus personajes exactos'),
    seesPair:L('as Merlin / Morgana candidates; cannot tell which is which','como posibles Merlín / Morgana; no distingue cuál es cuál'),
    seesMerlin:L('as Merlin (Morgana is absent)','como Merlín (Morgana no participa)'),
    script:L('Read the selected opening script','Leer el guion de los personajes seleccionados'),
    sequence:L('Try a fictional quest','Prueba una misión ficticia'),
    stage0:L('Choose the team','Elegir el equipo'),stage1:L('Everyone votes','Todos votan'),stage2:L('The team submits quest cards','El equipo entrega cartas de misión'),stage3:L('Resolve the quest','Resolver la misión'),stage4:L('After 3 successes: assassination','Tras 3 éxitos: el asesinato'),
    quest:L('Example quest','Misión de ejemplo'),
    team:L('The leader proposes exactly this many people and may join the team. Everyone can discuss. Roles remain hidden.','El líder propone esta cantidad exacta de personas y puede integrar el equipo. Todos pueden debatir. Los personajes siguen ocultos.'),
    votes:L('Every player, including the leader and people outside the team, secretly chooses Approve or Reject. Reveal together: each person’s vote becomes public, not their role.','Todos, incluido el líder y quienes no integran el equipo, eligen Aprobar o Rechazar en secreto. Revelan juntos: el voto de cada persona se hace público, su personaje no.'),
    voteResult:L('In this example, the first seats Approve and the rest Reject. The team passes with a strict majority. A tie rejects. A rejection keeps the same quest and passes leadership clockwise; 5 rejections in a row give Evil the win.','En este ejemplo, los primeros lugares aprueban y los demás rechazan. El equipo se aprueba con mayoría absoluta. Un empate lo rechaza. Un rechazo conserva la misión y pasa el liderazgo en sentido horario; 5 rechazos seguidos dan la victoria al Mal.'),
    publicTable:L('Public team proposal · roles stay hidden','Propuesta pública de equipo · los personajes siguen ocultos'),
    leader:L('Leader','Líder'), onTeam:L('On the proposed team','Integra el equipo propuesto'), outsideTeam:L('Outside the team','Fuera del equipo'),
    everyoneVotes:L('All these seats vote, including people outside the team. A vote reveals a choice about the team, not a secret role.','Todos estos lugares votan, incluso quienes no integran el equipo. El voto revela una decisión sobre el equipo, no un personaje secreto.'),
    onlyTeam:L('Only these approved team members submit one hidden quest card each','Solo estos integrantes del equipo aprobado entregan una carta de misión oculta por persona'),
    voteExample:L('Example vote outcome','Resultado de votación del ejemplo'),
    majorityExample:L('Strict majority approves','La mayoría absoluta aprueba'),
    rejectionExample:L('No majority: team rejected','Sin mayoría: equipo rechazado'),
    approved:L('Team approved. More than half voted Approve. Only the selected team now submits quest cards.','Equipo aprobado. Más de la mitad votó Aprobar. Ahora solo el equipo elegido entrega cartas de misión.'),
    rejected:L('Team rejected. There is no majority for Approve, so nobody submits quest cards. Pass leadership clockwise and propose again on the same quest.','Equipo rechazado. No hay mayoría para Aprobar, así que nadie entrega cartas de misión. El liderazgo pasa en sentido horario y se propone otro equipo en la misma misión.'),
    tie:L('A tied vote rejects the team.','Un empate rechaza el equipo.'),
    fifthRejection:L('If this were the fifth rejection in a row, Evil would win immediately. This example starts with no earlier rejections.','Si fuera el quinto rechazo seguido, el Mal ganaría de inmediato. Este ejemplo comienza sin rechazos anteriores.'),
    proposeAgain:L('Next leader: propose again','Siguiente líder: proponer de nuevo'),
    hiddenCard:L('One face-down quest card · no identity shown','Una carta de misión boca abajo · sin mostrar identidad'),
    anonymousCards:L('Shuffled quest cards · no player labels','Cartas de misión mezcladas · sin nombres de jugadores'),
    sources:L('Source for this lesson','Fuente de esta lección'),
    sourceName:L('Classic Avalon rulebook · setup, votes, quests, game end and optional roles (pp. 2–7)','Reglamento de Avalon clásico · preparación, votos, misiones, final y personajes opcionales (págs. 2–7)'),
    approve:L('Approve','Aprobar'),reject:L('Reject','Rechazar'),
    revealVotes:L('Reveal example votes','Revelar votos del ejemplo'),continue:L('Continue','Continuar'),back:L('Back','Anterior'),replay:L('Replay','Repetir'),
    submit:L('Only the approved team gets Success and Fail cards and secretly submits one each. Good must choose Success. Evil may choose either. Shuffle the submitted cards before revealing; collect and shuffle unused cards separately.','Solo el equipo aprobado recibe cartas de Éxito y Fracaso y entrega una en secreto por persona. El Bien debe elegir Éxito. El Mal puede elegir cualquiera. Mezclen las cartas jugadas antes de revelarlas; recojan y mezclen las no usadas por separado.'),
    anonymous:L('These are anonymous totals from a fictional team that includes 2 Evil players. The cards are never linked to individual seats. Neither the submitted nor unused cards may identify who played what.','Son totales anónimos de un equipo ficticio con 2 integrantes del Mal. Las cartas nunca se vinculan a lugares individuales. Ni las cartas jugadas ni las descartadas deben identificar quién eligió cada una.'),
    fails:L('Fail cards in this example','Cartas de Fracaso en este ejemplo'),success:L('Success','Éxito'),fail:L('Fail','Fracaso'),
    revealQuest:L('Shuffle & reveal quest cards','Mezclar y revelar cartas de misión'),
    threshold:L('Fail cards needed to fail','Fracasos necesarios para fallar'),
    exception:L('Only quest 4 with 7–10 players needs 2 Fails. All other quests need 1, including quest 5.','Solo la misión 4 con 7–10 jugadores necesita 2 Fracasos. Las demás necesitan 1, incluida la misión 5.'),
    aftermath:L('Record the result, reset rejections and pass leadership clockwise. Advance to the next quest even after a failure, unless the game has ended. Three failures end the game for Evil. Success does not prove that everyone on the team is Good.','Anoten el resultado, reinicien los rechazos y pasen el liderazgo en sentido horario. Avancen a la próxima misión incluso tras un fracaso, salvo que termine la partida. Tres fracasos dan la victoria al Mal. Un éxito no demuestra que todo el equipo sea del Bien.'),
    endIntro:L('Separate endgame example: assume the third successful quest has just finished. Keep roles hidden while Evil discusses; the Assassin names one Good player as Merlin. Only one guess.','Ejemplo final independiente: supongamos que acaba de terminar la tercera misión exitosa. Mantengan los personajes ocultos mientras el Mal debate; el Asesino señala a una persona del Bien como Merlín. Hay un solo intento.'),
    hit:L('The Assassin names Merlin','El Asesino señala a Merlín'),miss:L('The Assassin names another Good player','El Asesino señala a otra persona del Bien'),
    evilWins:L('Evil wins: Merlin was identified, despite 3 successful quests.','Gana el Mal: identificaron a Merlín, a pesar de las 3 misiones exitosas.'),
    goodWins:L('Good wins: 3 quests succeeded and the only assassination guess missed Merlin.','Gana el Bien: hubo 3 éxitos y el único intento de asesinato no identificó a Merlín.'),
    votePhoto:L('Published photo: Approve on the left, Reject on the right. These are votes about the team, not quest outcomes.','Foto publicada: Aprobar a la izquierda, Rechazar a la derecha. Son votos sobre el equipo, no resultados de misión.'),
    questPhoto:L('Published photo: Success on the left, Fail on the right. These cards determine the quest outcome, not team approval.','Foto publicada: Éxito a la izquierda, Fracaso a la derecha. Estas cartas determinan el resultado de la misión, no la aprobación del equipo.'),
    rules:L('Full rules & exceptions','Reglas completas y excepciones')
  }
};

// Portable renderer. React owns the hosted UI; both use the models and copy above.
function avalonPracticeStart(key='',quest=4) {return {key,stage:0,quest,fails:1,votes:false,ending:'',voteMode:'approve',leader:1};}
let avalonLessonPractice = avalonPracticeStart();
function avalonLesson() {
  const d=AVALON_TEACHING,t=key=>e(d.copy[key]),roster=avalonExampleRoster(d,state);
  const key=JSON.stringify([state.players,state.avalonMode,state.optional]);
  if(avalonLessonPractice.key!==key)avalonLessonPractice=avalonPracticeStart(key);
  const p=avalonLessonPractice,q=avalonExampleQuest(d,state.players,p.quest,p.fails),vote=avalonExampleVote(state.players,p.voteMode);
  const art=id=>officialButton('avalon-'+id,'lesson-card-art');
  const roles=[...new Map(roster.map(r=>[r.id,r])).values()];
  const team=avalonExampleTeam(roster,q.size),seats=team.map(r=>`${t('seat')} ${r.seat}`).join(', ');
  const rejected=p.stage===1&&p.votes&&!vote.approved;
  const feedback=p.stage===1&&p.votes?`<p><strong>${vote.approvals} ${t('approve')} · ${vote.rejects} ${t('reject')}</strong></p><p>${t(vote.approved?'approved':'rejected')}</p>${vote.tied?`<p>${t('tie')}</p>`:''}${!vote.approved?`<p>${t('fifthRejection')}</p>`:''}`
    :p.stage===3?`<p>${q.successes} ${t('success')} + ${p.fails} ${t('fail')}</p><p><strong data-avalon-result="${q.succeeds?'success':'fail'}">${t(q.succeeds?'success':'fail')}</strong> · ${t('threshold')}: ${q.threshold}</p>`
    :p.stage===4&&p.ending?`<p>${t(p.ending==='hit'?'evilWins':'goodWins')}</p>`:'';
  return `<section id="avalon-lesson" class="block avalon-lesson" aria-labelledby="avalon-lesson-title">
    <h2 id="avalon-lesson-title">${t('title')}</h2><p class="callout">${t('fiction')}</p><h3>${t('roles')}</h3><p>${t('roleIntro')}</p>
    <div class="avalon-teaching-roles">${roles.map(r=>`<article data-avalon-role="${r.id}">${['servant','minion'].includes(r.id)?`<div class="avalon-role-tile">${e(r.name)}</div>`:art(r.id)}<div><h4>${e(r.name)} · ${t(r.side)}</h4><p><strong>${t('goal')}: </strong>${t(r.side+'Goal')}</p><p><strong>${t('knows')}: </strong>${e(r.text)}${r.side==='evil'&&!['oberon','minion'].includes(r.id)?' '+e(d.generic.evil.text):''}</p><p><strong>${t('unknown')}: </strong>${e(d.unknown[r.id]||d.unknown.evil)}</p><small>${t(['servant','minion'].includes(r.id)?'tile':'portrait')}</small></div></article>`).join('')}</div>
    ${state.players===5&&state.optional.includes('percival')?`<p class="callout">${t('balance')}</p>`:''}
    <h3>${t('diagram')}</h3><p>${t('diagramIntro')}</p><ol class="avalon-knowledge">${roster.map(r=>`<li data-avalon-seat="${r.seat}"><strong>${t('seat')} ${r.seat}: ${e(r.name)}</strong><span aria-hidden="true"> → </span><span>${t('sees')}: ${r.targets.length?r.targets.map(n=>t('seat')+' '+n).join(', '):t('none')}${r.targets.length?' — '+t(r.id==='percival'?(state.optional.includes('morgana')?'seesPair':'seesMerlin'):'seesEvil'):''}.</span></li>`).join('')}</ol>
    <details class="avalon-opening-script"><summary>${t('script')}</summary><ol>${openingScript().map(s=>`<li>${e(s)}</li>`).join('')}</ol></details>
    <h3>${t('sequence')}</h3><label for="avalon-example-quest">${t('quest')}</label><select id="avalon-example-quest">${[1,4,5].map(n=>`<option value="${n}" ${n===p.quest?'selected':''}>${n}</option>`).join('')}</select>
    <ol class="avalon-stages">${[0,1,2,3,4].map(n=>`<li ${p.stage===n?'aria-current="step"':''}>${t('stage'+n)}</li>`).join('')}</ol>
    <div class="avalon-scene" data-avalon-stage="${p.stage}"><h4 id="avalon-scene-title" tabindex="-1">${t('stage'+p.stage)}</h4>
      ${p.stage<=1?`<p>${t('team')}</p><p><strong>${t('leader')}: ${t('seat')} <span data-avalon-leader>${p.leader}</span> · ${q.size}: ${seats}</strong></p><ul class="avalon-public-team" aria-label="${t('publicTable')}">${roster.map(r=>`<li data-avalon-team-seat="${r.seat}" data-on-team="${team.some(m=>m.seat===r.seat)}"><strong>${t('seat')} ${r.seat}</strong><span>${t(team.some(m=>m.seat===r.seat)?'onTeam':'outsideTeam')}</span></li>`).join('')}</ul>`:''}
      ${p.stage===1?`${art('team')}<p class="image-note">${t('votePhoto')}</p><p>${t('votes')}</p><p>${t('everyoneVotes')}</p><label for="avalon-example-vote">${t('voteExample')}</label><select id="avalon-example-vote"><option value="approve" ${p.voteMode==='approve'?'selected':''}>${t('majorityExample')}</option><option value="reject" ${p.voteMode==='reject'?'selected':''}>${t('rejectionExample')}</option></select>${p.votes?`<ol class="avalon-public-votes">${roster.map(r=>`<li>${t('seat')} ${r.seat}: ${t(r.seat<=vote.approvals?'approve':'reject')}</li>`).join('')}</ol>`:`<button type="button" data-avalon-votes>${t('revealVotes')}</button>`}`:''}
      ${p.stage===2?`${art('mission')}<p class="image-note">${t('questPhoto')}</p><p>${t('submit')}</p><p><strong>${t('onlyTeam')}: ${seats}.</strong></p><ul class="avalon-hidden-quest" aria-label="${t('anonymousCards')}">${team.map(()=>`<li><span aria-hidden="true">?</span>${t('hiddenCard')}</li>`).join('')}</ul><p>${t('anonymous')}</p><label for="avalon-example-fails">${t('fails')}</label><select id="avalon-example-fails">${[0,1,2].map(n=>`<option ${n===p.fails?'selected':''}>${n}</option>`).join('')}</select>`:''}
      ${p.stage===3?`${art('mission')}<p class="image-note">${t('questPhoto')}</p><ul class="avalon-result-cards" aria-label="${t('anonymousCards')}">${Array.from({length:q.size},(_,i)=>`<li data-avalon-card="${i<p.fails?'fail':'success'}">${t(i<p.fails?'fail':'success')}</li>`).join('')}</ul><p>${t('exception')}</p><p>${t('aftermath')}</p>`:''}
      ${p.stage===4?`${art('assassin')}<p>${t('endIntro')}</p><div class="avalon-example-controls">${['hit','miss'].map(id=>`<button type="button" id="avalon-ending-${id}" data-avalon-ending="${id}" aria-pressed="${p.ending===id}">${t(id)}</button>`).join('')}</div>`:''}
      <div class="avalon-feedback" role="status" aria-atomic="true">${feedback}</div>
    </div>
    <nav class="avalon-example-controls" aria-label="${t('sequence')}"><button type="button" data-avalon-back ${p.stage===0?'disabled':''}>${t('back')}</button><button type="button" data-avalon-replay>${t('replay')}</button>${rejected?`<button type="button" data-avalon-propose>${t('proposeAgain')}</button>`:p.stage<4?`<button type="button" data-avalon-next ${p.stage===1&&!p.votes?'disabled':''}>${t(p.stage===2?'revealQuest':'continue')}</button>`:''}</nav>
    <a href="#avalon/full/${p.stage===4?'ending':p.stage<=1?'teams':'quests'}">${t('rules')} →</a>
    <details class="avalon-example-sources"><summary>${t('sources')}</summary><a href="https://avalon.fun/pdfs/rules.pdf">${t('sourceName')}</a></details>
  </section>`;
}
function bindAvalonLesson() {
  const root=document.getElementById('avalon-lesson');if(!root)return;
  const refresh=(focus='avalon-scene-title')=>{
    const open=[...root.querySelectorAll('details[open]')].map(d=>d.className);
    const live=root.querySelector('.avalon-feedback'),template=document.createElement('template');
    template.innerHTML=avalonLesson();
    const nextLive=template.content.querySelector('.avalon-feedback'),message=nextLive.innerHTML;
    nextLive.replaceWith(live);root.replaceWith(template.content);bindAvalonLesson();live.innerHTML=message;
    for(const cls of open)document.querySelector('#avalon-lesson .'+cls).open=true;
    document.getElementById(focus)?.focus();
  };
  const p=avalonLessonPractice;
  root.querySelector('[data-avalon-next]')?.addEventListener('click',()=>{p.stage++;refresh();});
  root.querySelector('[data-avalon-back]').onclick=()=>{p.stage--;refresh();};
  root.querySelector('[data-avalon-replay]').onclick=()=>{avalonLessonPractice=avalonPracticeStart(p.key,p.quest);refresh();};
  root.querySelector('[data-avalon-votes]')?.addEventListener('click',()=>{p.votes=true;refresh();});
  root.querySelector('[data-avalon-propose]')?.addEventListener('click',()=>{Object.assign(p,{leader:p.leader%state.players+1,stage:0,votes:false,voteMode:'approve'});refresh();});
  root.querySelector('#avalon-example-quest').onchange=ev=>{avalonLessonPractice=avalonPracticeStart(p.key,+ev.target.value);refresh('avalon-example-quest');};
  root.querySelector('#avalon-example-vote')?.addEventListener('change',ev=>{p.voteMode=ev.target.value;p.votes=false;refresh('avalon-example-vote');});
  root.querySelector('#avalon-example-fails')?.addEventListener('change',ev=>{p.fails=+ev.target.value;refresh('avalon-example-fails');});
  root.querySelectorAll('[data-avalon-ending]').forEach(b=>b.onclick=()=>{p.ending=b.dataset.avalonEnding;refresh('avalon-ending-'+p.ending);});
}
