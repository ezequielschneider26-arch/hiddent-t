/* Vista previa procedural de la mochila (placeholder).
   Se usa cuando no existe ./assets/mochila.glb.
   Misma geometría que la app: cuerpo arqueado, bolsillo frontal,
   cremallera, pespuntes y asa. Material negro mate con normal map de tela. */

import * as THREE from 'three';

/* ---------- Texturas procedurales ---------- */

function makeNormalTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const h = new Float32Array(size * size);
  const step = 9;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      if (x % step < 2 || y % step < 2) v += -6;
      v += Math.sin(x * 0.09) * 3 + Math.sin(y * 0.11) * 3;
      v += (Math.random() - 0.5) * 5;
      h[y * size + x] = v;
    }
  }
  const strength = 1.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = h[y * size + ((x + size - 1) % size)];
      const xr = h[y * size + ((x + 1) % size)];
      const yu = h[((y + size - 1) % size) * size + x];
      const yd = h[((y + 1) % size) * size + x];
      let nx = xl - xr;
      let ny = yu - yd;
      let nz = 2 * strength;
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;
      const i = (y * size + x) * 4;
      img.data[i] = Math.round((nx * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.4, 2.4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeStitchTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 16;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 64, 16);
  for (let i = 2; i < 64; i += 8) {
    x.fillStyle = 'rgba(30,32,36,0.6)';
    x.fillRect(i, 1, 5, 14);
    x.fillStyle = 'rgba(255,255,255,0.22)';
    x.fillRect(i + 1, 2, 2, 12);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Utilidades de malla ---------- */

function extruded(shape, depth, bevelT, bevelS) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevelT,
    bevelSize: bevelS,
    bevelSegments: 5,
    curveSegments: 28,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

function bodyShape() {
  const w = 2.6;
  const x0 = -w / 2;
  const x1 = w / 2;
  const rB = 0.4;
  const TOP_Y = 1.7;
  const BOTTOM_Y = -1.7;
  const shY = TOP_Y - 0.3;
  const arcH = 0.55;
  const s = new THREE.Shape();
  s.moveTo(x0, BOTTOM_Y + rB);
  s.lineTo(x0, shY);
  s.quadraticCurveTo(0, TOP_Y + arcH, x1, shY);
  s.lineTo(x1, BOTTOM_Y + rB);
  s.quadraticCurveTo(x1, BOTTOM_Y, x1 - rB, BOTTOM_Y);
  s.lineTo(x0 + rB, BOTTOM_Y);
  s.quadraticCurveTo(x0, BOTTOM_Y, x0, BOTTOM_Y + rB);
  s.closePath();
  return s;
}

function pocketShape() {
  const PW = 2.15;
  const PH = 1.45;
  const x0 = -PW / 2;
  const x1 = PW / 2;
  const y0 = -PH / 2;
  const y1 = PH / 2;
  const rT = 0.3;
  const rB = 0.14;
  const s = new THREE.Shape();
  s.moveTo(x0, y0 + rB);
  s.lineTo(x0, y1 - rT);
  s.quadraticCurveTo(x0, y1, x0 + rT, y1);
  s.lineTo(x1 - rT, y1);
  s.quadraticCurveTo(x1, y1, x1, y1 - rT);
  s.lineTo(x1, y0 + rB);
  s.quadraticCurveTo(x1, y0, x1 - rB, y0);
  s.lineTo(x0 + rB, y0);
  s.quadraticCurveTo(x0, y0, x0, y0 + rB);
  s.closePath();
  return s;
}

function stitchPlane(length, mat, pos) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.05), mat);
  m.position.set(...pos);
  return m;
}

/* ---------- Construcción del modelo ---------- */

export function buildFallbackBackpack() {
  const group = new THREE.Group();

  const normal = makeNormalTexture();
  const fabric = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.82,
    metalness: 0.02,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.9, 0.9),
  });

  const stitchTex = makeStitchTexture();
  const stitchMat = new THREE.MeshBasicMaterial({
    map: stitchTex,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const zipMat = new THREE.MeshStandardMaterial({
    color: 0x22262c,
    roughness: 0.22,
    metalness: 0.92,
  });

  /* Cuerpo */
  const body = new THREE.Mesh(extruded(bodyShape(), 1.0, 0.14, 0.12), fabric);
  body.castShadow = true;
  group.add(body);

  /* Bolsillo frontal */
  const pocket = new THREE.Mesh(extruded(pocketShape(), 0.1, 0.06, 0.05), fabric);
  pocket.position.set(0, -0.86, 0.68);
  pocket.castShadow = true;
  group.add(pocket);

  /* Asa superior (cinta plana) */
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.07), fabric);
  strap.position.set(0, 1.82, 0);
  strap.castShadow = true;
  group.add(strap);

  /* Cremallera oculta: línea de pespunte + tirador */
  const zipperLine = stitchPlane(1.95, stitchMat, [0, -0.235, 0.808]);
  group.add(zipperLine);

  const pull = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.03), zipMat);
  pull.position.set(0.72, -0.255, 0.845);
  pull.rotation.z = -0.3;
  pull.castShadow = true;
  group.add(pull);

  /* Pespuntes: contorno del bolsillo + laterales e inferior del cuerpo */
  group.add(stitchPlane(2.21, stitchMat, [0, -0.135 + 0.025, 0.812]));
  group.add(stitchPlane(2.21, stitchMat, [0, -1.585 - 0.025, 0.812]));
  group.add(stitchPlane(1.51, stitchMat, [-1.075 - 0.025, -0.86, 0.812]));
  group.add(stitchPlane(1.51, stitchMat, [1.075 + 0.025, -0.86, 0.812]));

  group.add(stitchPlane(2.45, stitchMat, [-1.2, 0, 0.63]));
  group.add(stitchPlane(2.45, stitchMat, [1.2, 0, 0.63]));
  group.add(stitchPlane(2.42, stitchMat, [0, -1.36, 0.63]));

  /* Envés inferior */
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.5), fabric);
  base.position.set(0, -1.65, 0.04);
  base.castShadow = true;
  group.add(base);

  return group;
}