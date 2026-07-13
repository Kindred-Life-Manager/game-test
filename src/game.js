const upgrades = [
  { id: 'turbo', name: 'Oficina Turbo', cost: 45, appeal: 22, icon: '🔧', text: 'Carros tunados ganham velocidade e chamam atenção.' },
  { id: 'asphalt', name: 'Asfalto Premium', cost: 35, appeal: 16, icon: '🛣️', text: 'Menos buracos, mais confiança para escolher sua rota.' },
  { id: 'billboard', name: 'Outdoor Neon', cost: 30, appeal: 13, icon: '✨', text: 'Propaganda brilhante rouba carros indecisos do rival.' },
  { id: 'pitstop', name: 'Pit Stop Barato', cost: 55, appeal: 28, icon: '⛽', text: 'Combustível e lanche fazem a fila crescer rápido.' },
];

const objectives = [
  { id: 'appeal', label: 'Chegar a 90 de atratividade', done: player => player.appeal >= 90 },
  { id: 'traffic', label: 'Atrair 12 carros no total', done: player => player.traffic >= 12 },
  { id: 'lead', label: 'Vencer 2 simulações seguidas', done: player => player.streak >= 2 },
  { id: 'garage', label: 'Instalar 4 melhorias', done: player => player.upgrades.length >= 4 },
];

const defaultGhost = {
  name: 'Rival automático',
  appeal: 24,
  traffic: 0,
  streak: 0,
  upgrades: ['Pedágio VIP'],
  completed: [],
  round: 1,
};

const state = {
  round: 1,
  cash: 120,
  mode: 'solo',
  challengeStatus: '',
  player: { name: 'Você', appeal: 20, traffic: 0, streak: 0, upgrades: [], completed: new Set() },
  ghost: { ...defaultGhost },
  finished: false,
};

const els = {
  round: document.querySelector('#round'),
  cash: document.querySelector('#cash'),
  fans: document.querySelector('#fans'),
  playerPower: document.querySelector('#playerPower'),
  rivalTitle: document.querySelector('#rivalTitle'),
  rivalPower: document.querySelector('#rivalPower'),
  playerRoad: document.querySelector('#playerRoad'),
  rivalRoad: document.querySelector('#rivalRoad'),
  cards: document.querySelector('#upgradeCards'),
  objectives: document.querySelector('#objectivesList'),
  log: document.querySelector('#eventLog'),
  simulate: document.querySelector('#simulateBtn'),
  challengeBtn: document.querySelector('#challengeBtn'),
  resetBtn: document.querySelector('#resetBtn'),
  challengePanel: document.querySelector('#challengePanel'),
  challengeStatus: document.querySelector('#challengeStatus'),
  challengeLink: document.querySelector('#challengeLink'),
  copyChallenge: document.querySelector('#copyChallenge'),
};

function render() {
  els.round.textContent = `Rodada ${state.round}`;
  els.cash.textContent = `$${state.cash}`;
  els.fans.textContent = `${state.player.completed.size}/3`;
  els.playerPower.textContent = `Atratividade ${state.player.appeal}`;
  els.rivalTitle.textContent = state.mode === 'challenge' ? 'Fantasma do amigo' : 'Pista rival';
  els.rivalPower.textContent = `Atratividade ${state.ghost.appeal}`;
  renderRoad(els.playerRoad, state.player, '🚗');
  renderRoad(els.rivalRoad, state.ghost, state.mode === 'challenge' ? '👻' : '🏎️');
  renderCards();
  renderObjectives();
  renderChallengePanel();
  els.simulate.disabled = state.finished;
  els.challengeBtn.disabled = state.finished || state.mode === 'challenge';
}

function renderRoad(element, driver, carIcon) {
  element.innerHTML = '';
  const lane = document.createElement('div');
  lane.className = 'lane';
  const cars = Math.max(2, Math.min(9, Math.ceil(driver.appeal / 18)));
  for (let index = 0; index < cars; index += 1) {
    const car = document.createElement('span');
    car.textContent = carIcon;
    car.style.animationDelay = `${index * -0.8}s`;
    lane.appendChild(car);
  }
  element.appendChild(lane);

  const upgradesLine = document.createElement('p');
  upgradesLine.className = 'upgrades-line';
  upgradesLine.textContent = driver.upgrades.length ? driver.upgrades.join(' • ') : 'Pista básica';
  element.appendChild(upgradesLine);
}

function renderCards() {
  els.cards.innerHTML = '';
  upgrades.forEach(upgrade => {
    const boughtCount = state.player.upgrades.filter(item => item === upgrade.name).length;
    const price = upgrade.cost + boughtCount * 15;
    const card = document.createElement('button');
    card.className = 'upgrade-card';
    card.disabled = state.cash < price || state.finished;
    card.innerHTML = `<span>${upgrade.icon}</span><strong>${upgrade.name}</strong><p>${upgrade.text}</p><small>$${price} · +${upgrade.appeal} atratividade</small>`;
    card.addEventListener('click', () => buyUpgrade(upgrade, price));
    els.cards.appendChild(card);
  });
}

function renderObjectives() {
  els.objectives.innerHTML = '';
  objectives.forEach(objective => {
    const item = document.createElement('li');
    const isDone = state.player.completed.has(objective.id);
    item.className = isDone ? 'done' : '';
    item.textContent = `${isDone ? '✅' : '⬜'} ${objective.label}`;
    els.objectives.appendChild(item);
  });
}

function renderChallengePanel() {
  els.challengePanel.hidden = !state.challengeStatus && !els.challengeLink.value;
  els.challengeStatus.textContent = state.challengeStatus;
}

function buyUpgrade(upgrade, price) {
  if (state.cash < price || state.finished) return;
  state.cash -= price;
  state.player.appeal += upgrade.appeal;
  state.player.upgrades.push(upgrade.name);
  addLog(`Você instalou ${upgrade.name} e aumentou sua atratividade em ${upgrade.appeal}.`);
  checkObjectives(state.player);
  render();
}

function simulateTraffic() {
  if (state.finished) return;
  const playerRoll = state.player.appeal + randomBetween(1, 30);
  const ghostRoll = state.ghost.appeal + randomBetween(1, 30);
  const playerCars = Math.max(1, Math.round(playerRoll / 18));
  const ghostCars = Math.max(1, Math.round(ghostRoll / 18));

  state.player.traffic += playerCars;
  state.ghost.traffic += ghostCars;
  state.cash += 35 + playerCars * 8;

  if (playerRoll >= ghostRoll) {
    state.player.streak += 1;
    state.ghost.streak = 0;
    addLog(`Sua rodovia venceu a disputa: ${playerCars} carros escolheram você contra ${ghostCars} do rival.`);
  } else {
    state.player.streak = 0;
    state.ghost.streak += 1;
    addLog(`O rival levou a melhor nesta rodada: ${ghostCars} carros contra ${playerCars}.`);
  }

  if (state.mode === 'solo') {
    state.ghost.appeal += 10 + state.round * 2;
  }

  state.round += 1;
  checkObjectives(state.player);
  render();
}

function checkObjectives(player) {
  objectives.forEach(objective => {
    if (!player.completed.has(objective.id) && objective.done(player)) {
      player.completed.add(objective.id);
      addLog(`Objetivo concluído: ${objective.label}.`);
    }
  });

  if (player.completed.size >= 3 && !state.finished) {
    state.finished = true;
    const message = state.mode === 'challenge'
      ? getChallengeResultMessage()
      : '🏁 Vitória! Você concluiu 3 objetivos antes do rival dominar a cidade.';
    addLog(message);
  }
}

function getChallengeResultMessage() {
  const ghostScore = state.ghost.completed?.length ?? 0;
  if (state.player.completed.size > ghostScore) {
    return `🏁 Você bateu o desafio! Fez ${state.player.completed.size} objetivos contra ${ghostScore} do fantasma.`;
  }
  return `🏁 Você concluiu 3 objetivos. Compare a rodada ${state.round} com o print/link do seu amigo para desempatar.`;
}

function createChallengeLink() {
  const payload = {
    v: 1,
    name: 'Amigo',
    appeal: state.player.appeal,
    traffic: state.player.traffic,
    streak: state.player.streak,
    upgrades: state.player.upgrades,
    completed: [...state.player.completed],
    round: state.round,
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const url = `${location.origin}${location.pathname}#challenge=${encoded}`;
  els.challengeLink.value = url;
  state.challengeStatus = 'Link de desafio gerado! Manda para seu amigo abrir no navegador e tentar bater sua pista.';
  addLog('Você gerou um desafio assíncrono com a configuração atual da sua pista.');
  render();
}

async function copyChallengeLink() {
  if (!els.challengeLink.value) return;
  try {
    await navigator.clipboard.writeText(els.challengeLink.value);
    state.challengeStatus = 'Link copiado para a área de transferência.';
  } catch {
    els.challengeLink.select();
    state.challengeStatus = 'Não consegui copiar automaticamente. Selecione o campo e copie manualmente.';
  }
  render();
}

function loadChallengeFromUrl() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const encoded = hash.get('challenge');
  if (!encoded) return;

  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    state.mode = 'challenge';
    state.ghost = {
      name: payload.name || 'Amigo',
      appeal: Number(payload.appeal) || defaultGhost.appeal,
      traffic: Number(payload.traffic) || 0,
      streak: Number(payload.streak) || 0,
      upgrades: Array.isArray(payload.upgrades) ? payload.upgrades : [],
      completed: Array.isArray(payload.completed) ? payload.completed : [],
      round: Number(payload.round) || 1,
    };
    state.challengeStatus = 'Desafio recebido! Monte sua pista e tente superar o fantasma do seu amigo.';
    addLog(`Desafio carregado: fantasma com ${state.ghost.appeal} de atratividade e ${state.ghost.upgrades.length} melhorias.`);
  } catch {
    state.challengeStatus = 'Link de desafio inválido. Começando uma partida normal.';
  }
}

function resetGame() {
  location.href = location.pathname;
}

function addLog(message) {
  const item = document.createElement('li');
  item.textContent = message;
  els.log.prepend(item);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

els.simulate.addEventListener('click', simulateTraffic);
els.challengeBtn.addEventListener('click', createChallengeLink);
els.copyChallenge.addEventListener('click', copyChallengeLink);
els.resetBtn.addEventListener('click', resetGame);
loadChallengeFromUrl();
addLog('Escolha melhorias para transformar sua pista na rodovia mais desejada.');
render();
