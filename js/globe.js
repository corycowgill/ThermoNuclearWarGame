// ========== THREE.JS GLOBE ==========
// 3D wireframe globe with continent outlines and city markers

import { CITIES, CONTINENTS } from './data.js';

const GLOBE_RADIUS = 5;

let scene, camera, renderer, globe, globeGroup;
let cityMeshes = [];
let mouseDown = false, mouseX = 0, mouseY = 0;
let rotY = 0, rotX = 0.3, targetRotY = 0, targetRotX = 0.3;

export function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function getGlobeRadius() {
  return GLOBE_RADIUS;
}

export function getScene() {
  return scene;
}

export function getGlobeGroup() {
  return globeGroup;
}

export function getCityMeshes() {
  return cityMeshes;
}

export function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 16;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000);
  document.getElementById('game-container').insertBefore(
    renderer.domElement,
    document.getElementById('ui-overlay')
  );

  // Globe wireframe sphere
  const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 36, 18);
  const globeMat = new THREE.MeshBasicMaterial({
    color: 0x003300, wireframe: true, transparent: true, opacity: 0.15
  });
  globe = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globe);

  // Globe group holds everything that rotates with the globe
  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Grid lines
  const gridMat = new THREE.LineBasicMaterial({ color: 0x002200, transparent: true, opacity: 0.3 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lng = 0; lng <= 360; lng += 5) {
      pts.push(latLngToVec3(lat, lng, GLOBE_RADIUS + 0.01));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    globeGroup.add(new THREE.Line(geo, gridMat));
  }
  for (let lng = 0; lng < 360; lng += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 5) {
      pts.push(latLngToVec3(lat, lng, GLOBE_RADIUS + 0.01));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    globeGroup.add(new THREE.Line(geo, gridMat));
  }

  // Continent outlines
  const contMat = new THREE.LineBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.7 });
  Object.values(CONTINENTS).forEach(coords => {
    const pts = coords.map(([lat, lng]) => latLngToVec3(lat, lng, GLOBE_RADIUS + 0.02));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    globeGroup.add(new THREE.Line(geo, contMat));
  });

  // City dots
  Object.entries(CITIES).forEach(([side, cities]) => {
    cities.forEach(city => {
      const pos = latLngToVec3(city.lat, city.lng, GLOBE_RADIUS + 0.05);

      const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({
        color: side === 'us' ? 0x00aaff : 0xff4444
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = { city, side };
      globeGroup.add(dot);
      cityMeshes.push(dot);

      // Glow ring around city
      const ringGeo = new THREE.RingGeometry(0.08, 0.12, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: side === 'us' ? 0x00aaff : 0xff4444,
        transparent: true, opacity: 0.4, side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(ring);
    });
  });

  // Ambient light
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Mouse controls
  setupControls(renderer.domElement);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function setupControls(canvas) {
  canvas.addEventListener('mousedown', e => {
    mouseDown = true; mouseX = e.clientX; mouseY = e.clientY;
  });
  canvas.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    targetRotY += (e.clientX - mouseX) * 0.005;
    targetRotX += (e.clientY - mouseY) * 0.005;
    targetRotX = Math.max(-1.5, Math.min(1.5, targetRotX));
    mouseX = e.clientX; mouseY = e.clientY;
  });
  canvas.addEventListener('mouseup', () => mouseDown = false);
  canvas.addEventListener('mouseleave', () => mouseDown = false);

  // Touch
  canvas.addEventListener('touchstart', e => {
    mouseDown = true;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (!mouseDown) return;
    targetRotY += (e.touches[0].clientX - mouseX) * 0.005;
    targetRotX += (e.touches[0].clientY - mouseY) * 0.005;
    targetRotX = Math.max(-1.5, Math.min(1.5, targetRotX));
    mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', () => mouseDown = false);
}

export function renderFrame(time) {
  // Auto-rotate when not dragging
  if (!mouseDown) {
    targetRotY += 0.001;
  }
  rotY += (targetRotY - rotY) * 0.05;
  rotX += (targetRotX - rotX) * 0.05;

  globe.rotation.y = rotY;
  globe.rotation.x = rotX;
  globeGroup.rotation.y = rotY;
  globeGroup.rotation.x = rotX;

  renderer.render(scene, camera);
}
