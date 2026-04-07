// ========== GAME PHASES ==========
// Orchestrates the flow: title -> choose side -> strategy -> war -> aftermath -> end

import { CITIES } from './data.js';
import { gameState } from './state.js';
import AudioEngine from './audio.js';
import { typeText, termType, sleep } from './terminal.js';
import { createMissileArc } from './missiles.js';

// ---- UI Helpers ----

function updateDefcon(level) {
  gameState.defcon = level;
  const el = document.getElementById('defcon');
  el.textContent = 'DEFCON ' + level;
  el.className = 'defcon' + level;
}

export function updateScoreDisplay() {
  document.getElementById('us-casualties').textContent =
    'US CASUALTIES: ' + gameState.usCasualties.toLocaleString();
  document.getElementById('ussr-casualties').textContent =
    'USSR CASUALTIES: ' + gameState.ussrCasualties.toLocaleString();
  document.getElementById('cities-destroyed').textContent =
    'CITIES DESTROYED: ' + gameState.citiesDestroyed;
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toISOString().substr(11, 8) + ' ZULU';
}

// ---- Title Phase ----

export async function titlePhase() {
  setInterval(updateClock, 1000);
  updateClock();

  const titleEl = document.getElementById('title-text');
  const subEl = document.getElementById('subtitle-text');

  await sleep(1000);
  await typeText(titleEl, 'GLOBAL THERMONUCLEAR WAR', 80);
  await sleep(800);
  await typeText(subEl, 'GREETINGS, PROFESSOR FALKEN.', 60);
  await sleep(1500);

  document.getElementById('choice-panel').style.display = 'block';
  AudioEngine.beep(600, 0.15, 0.2);
}

// ---- Choice Handlers ----

export function setupChoiceHandlers() {
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      AudioEngine.beep(1000, 0.1);
      gameState.playerSide = btn.dataset.side;
      gameState.enemySide = btn.dataset.side === 'us' ? 'ussr' : 'us';
      document.getElementById('title-screen').style.display = 'none';
      await strategyPhase();
    });
  });
}

// ---- Strategy Phase ----

async function strategyPhase() {
  gameState.phase = 'strategy';
  const sideName = gameState.playerSide === 'us' ? 'UNITED STATES' : 'SOVIET UNION';

  await termType('LOGON: ' + sideName + ' STRATEGIC COMMAND', 25, true);
  await sleep(400);
  await termType('ACCESSING WOPR TARGETING SYSTEM...', 25);
  await sleep(600);
  await termType('SATELLITE UPLINK ESTABLISHED', 25);
  await sleep(400);

  updateDefcon(4);
  AudioEngine.beep(400, 0.2, 0.15);
  await termType('DEFCON 4 - INCREASED READINESS', 25, true);
  await sleep(500);
  await termType('', 25);
  await termType('SELECT TARGET CITIES FOR NUCLEAR STRIKE (3-6 TARGETS)', 25, true);
  await termType('WARNING: ENEMY RETALIATION IS ASSURED', 25);

  // Show target selection panel
  const panel = document.getElementById('side-panel');
  panel.style.display = 'block';
  const targetList = document.getElementById('target-list');
  targetList.innerHTML = '';

  const enemyCities = CITIES[gameState.enemySide];
  enemyCities.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'target-btn';
    btn.textContent = `${city.name} (POP: ${(city.pop / 1000000).toFixed(1)}M)`;
    btn.addEventListener('click', () => {
      AudioEngine.beep(800, 0.05);
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        gameState.selectedTargets = gameState.selectedTargets.filter(
          t => t.name !== city.name
        );
      } else if (gameState.selectedTargets.length < 6) {
        btn.classList.add('selected');
        gameState.selectedTargets.push(city);
      }
      document.getElementById('launch-btn').style.display =
        gameState.selectedTargets.length >= 3 ? 'block' : 'none';
    });
    targetList.appendChild(btn);
  });

  document.getElementById('launch-btn').addEventListener('click', async () => {
    if (gameState.selectedTargets.length >= 3) {
      document.getElementById('side-panel').style.display = 'none';
      document.getElementById('score-display').style.display = 'block';
      await warPhase();
    }
  });

  document.getElementById('missile-count').textContent =
    'MISSILES: ' + gameState.playerMissileCount;
}

// ---- War Phase ----

async function warPhase() {
  gameState.phase = 'war';

  updateDefcon(3);
  AudioEngine.beep(500, 0.2, 0.2);
  await termType('', 20);
  await termType('DEFCON 3 - ROUND HOUSE', 20, true);
  await sleep(500);

  updateDefcon(2);
  AudioEngine.beep(600, 0.2, 0.2);
  await termType('DEFCON 2 - FAST PACE', 20, true);
  await sleep(500);

  updateDefcon(1);
  AudioEngine.alarm();
  await termType('*** DEFCON 1 - COCKED PISTOL ***', 20, true);
  await termType('*** NUCLEAR LAUNCH DETECTED ***', 20, true);
  await sleep(500);

  const playerTag = gameState.playerSide === 'us' ? 'US' : 'USSR';
  const enemyTag = gameState.enemySide === 'us' ? 'US' : 'USSR';
  const playerCities = CITIES[gameState.playerSide];
  const enemyCities = CITIES[gameState.enemySide];

  // Launch player missiles
  await termType(
    `${playerTag} LAUNCHING ${gameState.selectedTargets.length} ICBM(S)...`, 20, true
  );

  for (let i = 0; i < gameState.selectedTargets.length; i++) {
    const origin = playerCities[i % playerCities.length];
    const target = gameState.selectedTargets[i];
    const color = gameState.playerSide === 'us' ? 0x00aaff : 0xff4444;
    const missile = createMissileArc(origin, target, color);
    gameState.missiles.push(missile);
    gameState.playerMissileCount--;
    document.getElementById('missile-count').textContent =
      'MISSILES: ' + gameState.playerMissileCount;
    await termType(`  ICBM ${i + 1} -> ${target.name}`, 15);
    AudioEngine.beep(1200, 0.05, 0.15);
    await sleep(300);
  }

  // Enemy retaliation
  await sleep(2000);
  await termType('', 20);
  await termType(`*** WARNING: ${enemyTag} RETALIATORY LAUNCH DETECTED ***`, 20, true);
  AudioEngine.alarm();

  const enemyTargets = [...playerCities]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(playerCities.length, gameState.selectedTargets.length + 1));

  for (let i = 0; i < enemyTargets.length; i++) {
    const origin = enemyCities[i % enemyCities.length];
    const target = enemyTargets[i];
    const color = gameState.enemySide === 'us' ? 0x00aaff : 0xff4444;
    const missile = createMissileArc(origin, target, color);
    gameState.missiles.push(missile);
    gameState.enemyMissileCount--;
    await termType(`  ${enemyTag} ICBM ${i + 1} -> ${target.name}`, 15);
    AudioEngine.beep(1200, 0.05, 0.15);
    await sleep(300);
  }

  // Wait for all missiles to impact
  await termType('', 20);
  await termType('TRACKING INCOMING AND OUTGOING WARHEADS...', 20);

  await new Promise(resolve => {
    const check = setInterval(() => {
      if (gameState.missiles.every(m => m.done)) {
        clearInterval(check);
        resolve();
      }
    }, 200);
  });

  await sleep(1500);
  await aftermathPhase();
}

// ---- Aftermath Phase ----

async function aftermathPhase() {
  gameState.phase = 'aftermath';

  await termType('', 20);
  await termType('========================================', 10, true);
  await termType('        DAMAGE ASSESSMENT REPORT', 20, true);
  await termType('========================================', 10, true);
  await sleep(500);

  updateScoreDisplay();

  await termType(
    `US CASUALTIES: ${gameState.usCasualties.toLocaleString()}`, 20
  );
  await termType(
    `USSR CASUALTIES: ${gameState.ussrCasualties.toLocaleString()}`, 20
  );
  await termType(`CITIES DESTROYED: ${gameState.citiesDestroyed}`, 20);
  await sleep(500);

  const destroyedList = [...gameState.destroyedCities].join(', ');
  await termType(`DESTROYED: ${destroyedList}`, 15);
  await sleep(1000);

  const totalDead = gameState.usCasualties + gameState.ussrCasualties;
  await termType('', 20);
  await termType('ESTIMATED TOTAL DEAD: ' + totalDead.toLocaleString(), 20, true);
  await termType('ESTIMATED NUCLEAR WINTER DURATION: 8-12 YEARS', 20);
  await termType('GLOBAL CROP FAILURE PROBABILITY: 94%', 20);
  await termType('ADDITIONAL PROJECTED DEATHS: 2,400,000,000', 20);

  await sleep(2000);
  await endPhase();
}

// ---- End Phase ----

async function endPhase() {
  gameState.phase = 'end';

  await termType('', 20);
  await termType('========================================', 10, true);
  await sleep(500);
  await termType('WINNER: NONE', 40, true);
  await sleep(2000);
  await termType('', 20);
  await termType('A STRANGE GAME.', 60, true);
  await sleep(1000);
  await termType('THE ONLY WINNING MOVE IS NOT TO PLAY.', 60, true);
  await sleep(1500);
  await termType('', 20);
  await termType('HOW ABOUT A NICE GAME OF CHESS?', 50, true);

  AudioEngine.beep(440, 0.5, 0.1);
  await sleep(500);
  AudioEngine.beep(550, 0.5, 0.1);
  await sleep(500);
  AudioEngine.beep(660, 0.8, 0.1);
}
