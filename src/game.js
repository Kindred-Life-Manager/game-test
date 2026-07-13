const upgrades = [
  { id: 'turbo', name: 'Oficina Turbo', cost: 45, appeal: 22, icon: '🔧', text: 'Carros tunados ganham velocidade e chamam atenção.' },
  { id: 'asphalt', name: 'Asfalto Premium', cost: 35, appeal: 16, icon: '🛣️', text: 'Menos buracos, mais confiança para escolher sua rota.' },
  { id: 'billboard', name: 'Outdoor Neon', cost: 30, appeal: 13, icon: '✨', text: 'Propaganda brilhante rouba carros indecisos do rival.' },
  { id: 'pitstop', name: 'Pit Stop Barato', cost: 55, appeal: 28, icon: '⛽', text: 'Combustível e lanche fazem a fila crescer rápido.' },
];

const objectives = [
  { id: 'appeal', label: 'Chegar a 90 de atratividade', done: state => state.player.appeal >= 90 },
  { id: 'traffic', label: 'Atrair 12 carros no total', done: state => state.player.traffic >= 12 },
  { id: 'lead', label: 'Vencer 2 simulações seguidas', done: state => state.player.streak >= 2 },
  { id: 'garage', label: 'Instalar 4 melhorias', done: state => state.player.upgrades.length >= 4 },
];

const state = {
  round: 1,
  cash: 120,
  completed: new Set(),
  player: { appeal: 20, traffic: 0, streak: 0, upgrades: [] },
  rival: { appeal: 24, traffic: 0, streak: 0, upgrades: ['Pedágio VIP'] },
  finished: false,
};

const els = {
  round: document.querySelector('#round'),
  cash: document.querySelector('#cash'),
  fans: document.querySelector('#fans'),
  playerPower: document.querySelector('#playerPower'),
  rivalPower: document.querySelector('#rivalPower'),
  playerRoad: document.querySelector('#playerRoad'),
  rivalRoad: document.querySelector('#rivalRoad'),
  cards: document.querySelector('#upgradeCards'),
  objectives: document.querySelector('#objectivesList'),
  log: document.querySelector('#eventLog'),
  simulate: document.querySelector('#simulateBtn'),
};

function render() {
  els.round.textContent = `Rodada ${state.round}`;
  els.cash.textContent = `$${state.cash}`;
  els.fans.textContent = `${state.completed.size}/3`;
  els.playerPower.textContent = `Atratividade ${state.player.appeal}`;
  els.rivalPower.textContent = `Atratividade ${state.rival.appeal}`;
  renderRoad(els.playerRoad, state.player, '🚗');
  renderRoad(els.rivalRoad, state.rival, '🏎️');
  renderCards();
  renderObjectives();
  els.simulate.disabled = state.finished;
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
    const isDone = state.completed.has(objective.id);
    item.className = isDone ? 'done' : '';
    item.textContent = `${isDone ? '✅' : '⬜'} ${objective.label}`;
    els.objectives.appendChild(item);
  });
}

function buyUpgrade(upgrade, price) {
  if (state.cash < price || state.finished) return;
  state.cash -= price;
  state.player.appeal += upgrade.appeal;
  state.player.upgrades.push(upgrade.name);
  addLog(`Você instalou ${upgrade.name} e aumentou sua atratividade em ${upgrade.appeal}.`);
  checkObjectives();
  render();
}

function simulateTraffic() {
  if (state.finished) return;
  const playerRoll = state.player.appeal + randomBetween(1, 30);
  const rivalRoll = state.rival.appeal + randomBetween(1, 30);
  const playerCars = Math.max(1, Math.round(playerRoll / 18));
  const rivalCars = Math.max(1, Math.round(rivalRoll / 18));

  state.player.traffic += playerCars;
  state.rival.traffic += rivalCars;
  state.cash += 35 + playerCars * 8;

  if (playerRoll >= rivalRoll) {
    state.player.streak += 1;
    state.rival.streak = 0;
    addLog(`Sua rodovia venceu a disputa: ${playerCars} carros escolheram você contra ${rivalCars} do rival.`);
  } else {
    state.player.streak = 0;
    state.rival.streak += 1;
    addLog(`O rival levou a melhor nesta rodada: ${rivalCars} carros contra ${playerCars}.`);
  }

  state.rival.appeal += 10 + state.round * 2;
  state.round += 1;
  checkObjectives();
  render();
}

function checkObjectives() {
  objectives.forEach(objective => {
    if (!state.completed.has(objective.id) && objective.done(state)) {
      state.completed.add(objective.id);
      addLog(`Objetivo concluído: ${objective.label}.`);
    }
  });

  if (state.completed.size >= 3 && !state.finished) {
    state.finished = true;
    addLog('🏁 Vitória! Você concluiu 3 objetivos antes do rival dominar a cidade.');
  }
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
addLog('Escolha melhorias para transformar sua pista na rodovia mais desejada.');
render();
