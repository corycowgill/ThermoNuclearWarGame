// ========== MISSILE & EXPLOSION SYSTEM ==========
// Handles ICBM arc trajectories and nuclear detonation visuals

import { CITIES } from './data.js';
import { latLngToVec3, getGlobeRadius, getGlobeGroup } from './globe.js';
import AudioEngine from './audio.js';
import { gameState } from './state.js';

const GLOBE_RADIUS = getGlobeRadius();

export function createMissileArc(from, to, color) {
  const group = getGlobeGroup();
  const start = latLngToVec3(from.lat, from.lng, GLOBE_RADIUS + 0.05);
  const end = latLngToVec3(to.lat, to.lng, GLOBE_RADIUS + 0.05);

  // Midpoint raised above globe surface for arc effect
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  mid.normalize().multiplyScalar(GLOBE_RADIUS + dist * 0.4);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const totalPoints = 100;

  const missile = {
    curve,
    progress: 0,
    totalPoints,
    color: color || 0x00ff41,
    from,
    to,
    line: null,
    head: null,
    done: false
  };

  // Trail line (updated each frame)
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(totalPoints * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({
    color: missile.color, transparent: true, opacity: 0.8
  });
  missile.line = new THREE.Line(geo, mat);
  group.add(missile.line);

  // Missile warhead dot
  const headGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  missile.head = new THREE.Mesh(headGeo, headMat);
  group.add(missile.head);

  return missile;
}

export function updateMissile(missile, delta) {
  if (missile.done) return;

  missile.progress += delta * 0.2;
  if (missile.progress >= 1) {
    missile.progress = 1;
    missile.done = true;
    getGlobeGroup().remove(missile.head);
    createExplosion(missile.to);
    AudioEngine.explosion();
    return;
  }

  // Draw trail up to current progress
  const drawCount = Math.floor(missile.progress * missile.totalPoints);
  const positions = missile.line.geometry.attributes.position.array;
  for (let i = 0; i <= drawCount && i < missile.totalPoints; i++) {
    const t = i / missile.totalPoints;
    const pt = missile.curve.getPoint(t);
    positions[i * 3] = pt.x;
    positions[i * 3 + 1] = pt.y;
    positions[i * 3 + 2] = pt.z;
  }
  missile.line.geometry.attributes.position.needsUpdate = true;
  missile.line.geometry.setDrawRange(0, drawCount);

  // Move warhead dot
  const headPos = missile.curve.getPoint(missile.progress);
  missile.head.position.copy(headPos);
}

function createExplosion(city) {
  const group = getGlobeGroup();
  const pos = latLngToVec3(city.lat, city.lng, GLOBE_RADIUS + 0.05);

  const explosion = {
    pos,
    radius: 0.01,
    maxRadius: 0.5,
    opacity: 1,
    mesh: null,
    ring: null,
    done: false,
    city
  };

  // Fireball sphere
  const geo = new THREE.SphereGeometry(1, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff4400, transparent: true, opacity: 1
  });
  explosion.mesh = new THREE.Mesh(geo, mat);
  explosion.mesh.position.copy(pos);
  explosion.mesh.scale.set(0.01, 0.01, 0.01);
  group.add(explosion.mesh);

  // Shockwave ring
  const ringGeo = new THREE.RingGeometry(0.8, 1, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff8800, transparent: true, opacity: 0.8, side: THREE.DoubleSide
  });
  explosion.ring = new THREE.Mesh(ringGeo, ringMat);
  explosion.ring.position.copy(pos);
  explosion.ring.lookAt(new THREE.Vector3(0, 0, 0));
  explosion.ring.scale.set(0.01, 0.01, 0.01);
  group.add(explosion.ring);

  gameState.explosions.push(explosion);

  // Track destruction
  gameState.destroyedCities.add(city.name);
  gameState.citiesDestroyed = gameState.destroyedCities.size;

  // Casualty calculation
  const casualties = Math.floor(city.pop * (0.4 + Math.random() * 0.4));
  if (CITIES.us.find(c => c.name === city.name)) {
    gameState.usCasualties += casualties;
  } else {
    gameState.ussrCasualties += casualties;
  }
}

export function updateExplosion(exp, delta) {
  if (exp.done) return;

  exp.radius += delta * 0.8;
  exp.opacity -= delta * 0.4;

  if (exp.opacity <= 0) {
    exp.done = true;
    const group = getGlobeGroup();

    // Leave a burn scar on the globe
    const scarGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const scarMat = new THREE.MeshBasicMaterial({
      color: 0x441100, transparent: true, opacity: 0.6
    });
    const scar = new THREE.Mesh(scarGeo, scarMat);
    scar.position.copy(exp.pos);
    group.add(scar);

    group.remove(exp.mesh);
    group.remove(exp.ring);
    return;
  }

  const s = exp.radius;
  exp.mesh.scale.set(s, s, s);
  exp.mesh.material.opacity = exp.opacity;
  exp.ring.scale.set(s * 1.5, s * 1.5, s * 1.5);
  exp.ring.material.opacity = exp.opacity * 0.6;

  // Color shifts from white-hot to orange to red
  const r = Math.floor(255 * exp.opacity);
  const g = Math.floor(100 * exp.opacity);
  exp.mesh.material.color.setRGB(r / 255, g / 255, 0);
}
