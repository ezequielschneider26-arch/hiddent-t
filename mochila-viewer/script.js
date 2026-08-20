import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { buildFallbackBackpack } from './vendor/fallback.js';

/* ============================================================
   Viewer de mochila 3D fotorrealista (Three.js)
   - Carga GLB externo (URL/CDN) con fallback a archivo local.
   - Iluminación de estudio para tela negra (key + fill + rim).
   - OrbitControls 360°, sombras suaves y responsive.
   ============================================================ */

// Orden de fuentes del modelo .glb. Se prueban en secuencia.
// 1) Archivo local: ./assets/mochila.glb (p. ej. exportado desde Blender).
// 2) URL pública directa (GitHub raw / CDN con CORS habilitado).
const MODEL_SOURCES = [
  './assets/mochila.glb',
  'https://raw.githubusercontent.com/ezequielschneider26-arch/hiddent-t/main/public/assets/mochila.glb',
];

const OVERLAY = document.getElementById('overlay');
const BAR = document.getElementById('bar').firstElementChild;
const STATUS = document.getElementById('status');

/* ---------------------------------------------------------
   1. Renderizador + escena + cámara (Front View)
--------------------------------------------------------- */
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('viewer'),
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; // corrección de color

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e9ec); // gris claro de estudio

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.6, 7); // centrada a la altura del objeto

/* ---------------------------------------------------------
   2. Iluminación de estudio para textiles
--------------------------------------------------------- */
// Relleno suave: luz ambiental + hemisférica (rebote de suelo)
const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0xf5f5f5, 0x2a2a2a, 0.55);
scene.add(hemi);

// Luz principal (key): inclinada, genera volumen en bolsillo y costuras
const key = new THREE.DirectionalLight(0xffffff, 1.7);
key.position.set(4, 5.5, 3.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 6;                  // bordes de sombra suaves
key.shadow.camera.left = -3;
key.shadow.camera.right = 3;
key.shadow.camera.top = 3;
key.shadow.camera.bottom = -3;
key.shadow.camera.near = 1;
key.shadow.camera.far = 18;
scene.add(key);

// Luz de relleno lateral (fill): abre las sombras del lado opuesto
const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-3, 1.5, 2.5);
scene.add(fill);

// Luz trasera (rim/back): separa los bordes de la mochila negra del fondo
const rim = new THREE.DirectionalLight(0xfff7e8, 0.85);
rim.position.set(-2.2, 4.5, -4.5);
scene.add(rim);

// Suelo que recibe sombra suave (ShadowMaterial = solo sombra)
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.ShadowMaterial({ opacity: 0.32 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

/* ---------------------------------------------------------
   3. Controles orbitales
--------------------------------------------------------- */
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 14;
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = Math.PI - 0.05; // giro completo en azimuth (360°)

/* ---------------------------------------------------------
   4. Carga del modelo con Loading Manager
--------------------------------------------------------- */
function setProgress(pct, text) {
  BAR.style.width = (pct * 100).toFixed(1) + '%';
  if (text) STATUS.textContent = text;
}

const manager = new THREE.LoadingManager();
manager.onLoad = () => {
  setTimeout(() => OVERLAY.classList.add('done'), 250);
};
manager.onError = (url) => {
  STATUS.textContent = 'Error al cargar: ' + url;
};

// Centra y escala el modelo de forma que quede apoyado en el suelo
function normalizeModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const targetHeight = 3.2;
  const scale = targetHeight / Math.max(size.y, 0.0001);
  root.scale.setScalar(scale);

  root.position.x -= center.x * scale;
  root.position.y -= box.min.y * scale; // apoya la base en y = 0
  root.position.z -= center.z * scale;
}

function onModelLoaded(gltf) {
  const model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  normalizeModel(model);
  scene.add(model);

  // Ajusta cámara y controles al tamaño real del modelo
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const centerY = (box.min.y + box.max.y) / 2;

  const radius = size.length() / 2;
  camera.position.set(radius * 1.6, centerY, radius * 1.6);
  controls.target.set(0, centerY, 0);

  // Encadra el frustum de sombra con el modelo
  const s = Math.max(size.x, size.y, size.z) / 2 + 0.4;
  key.shadow.camera.left = -s;
  key.shadow.camera.right = s;
  key.shadow.camera.top = s;
  key.shadow.camera.bottom = -s;
  key.shadow.camera.updateProjectionMatrix();
}

function loadNextSource(index) {
  if (index >= MODEL_SOURCES.length) {
    // Sin .glb disponible: mostramos la vista previa procedural para que se vea algo.
    const fallback = buildFallbackBackpack();
    normalizeModel(fallback);
    scene.add(fallback);
    const box = new THREE.Box3().setFromObject(fallback);
    const size = new THREE.Vector3();
    box.getSize(size);
    const centerY = (box.min.y + box.max.y) / 2;
    const radius = size.length() / 2;
    camera.position.set(radius * 1.6, centerY, radius * 1.6);
    controls.target.set(0, centerY, 0);
    setProgress(1, 'Vista previa. Falta el archivo ./assets/mochila.glb para el modelo real.');
    setTimeout(() => OVERLAY.classList.add('done'), 250);
    return;
  }
  const url = MODEL_SOURCES[index];
  STATUS.textContent = 'Intentando: ' + url.split('/').pop() + (index === 0 ? ' (local)' : ' (remoto)');

  // Timeout por fuente: evita quedarse colgado en "Conectando…"
  let timer = setTimeout(() => {
    STATUS.textContent = 'Tiempo agotado para ' + url.split('/').pop() + '. Probando siguiente fuente…';
    loadNextSource(index + 1);
  }, 12000);

  new GLTFLoader(manager).load(
    url,
    (gltf) => { clearTimeout(timer); onModelLoaded(gltf); },
    (xhr) => {
      if (xhr.total > 0) setProgress(xhr.loaded / xhr.total, xhr.loaded + ' / ' + xhr.total + ' bytes');
    },
    () => { clearTimeout(timer); loadNextSource(index + 1); } // fuente fallida → siguiente
  );
}

loadNextSource(0);

/* ---------------------------------------------------------
   5. Responsividad
--------------------------------------------------------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------------------------------------------------
   Loop de renderizado
--------------------------------------------------------- */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();