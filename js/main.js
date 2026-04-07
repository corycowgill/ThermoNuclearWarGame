// ========== MAIN ENTRY POINT ==========
// Initializes the game and runs the animation loop

import { gameState } from './state.js';
import { initThree, renderFrame, getCityMeshes } from './globe.js';
import { updateMissile, updateExplosion } from './missiles.js';
import { setupChoiceHandlers, titlePhase, updateScoreDisplay } from './game.js';

let lastTime = 0;

function animate(time) {
  requestAnimationFrame(animate);
  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  // Update missiles in flight
  gameState.missiles.forEach(m => updateMissile(m, delta));

  // Update explosion animations
  gameState.explosions.forEach(e => updateExplosion(e, delta));

  // Update score display during active phases
  if (gameState.phase === 'war' || gameState.phase === 'aftermath') {
    updateScoreDisplay();
  }

  // Flicker city dots; destroyed cities turn dark red
  const cityMeshes = getCityMeshes();
  cityMeshes.forEach(mesh => {
    const city = mesh.userData.city;
    if (gameState.destroyedCities.has(city.name)) {
      mesh.material.color.setHex(0x441100);
    } else {
      const flicker = 0.8 + Math.sin(time * 0.005 + mesh.position.x * 10) * 0.2;
      mesh.material.opacity = flicker;
    }
  });

  // Render the globe scene
  renderFrame(time);
}

function init() {
  initThree();
  setupChoiceHandlers();
  requestAnimationFrame(animate);
  titlePhase();
}

init();
