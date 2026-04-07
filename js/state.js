// ========== GAME STATE ==========
// Centralized mutable state for the game session

export const gameState = {
  phase: 'title',        // title | choose | strategy | war | aftermath | end
  playerSide: null,      // 'us' | 'ussr'
  enemySide: null,       // 'us' | 'ussr'
  selectedTargets: [],   // cities the player has chosen to strike
  defcon: 5,             // 5 (peace) down to 1 (nuclear war)
  missiles: [],          // active missile arc objects
  explosions: [],        // active explosion animations
  usCasualties: 0,
  ussrCasualties: 0,
  citiesDestroyed: 0,
  playerMissileCount: 6,
  enemyMissileCount: 6,
  destroyedCities: new Set()
};
