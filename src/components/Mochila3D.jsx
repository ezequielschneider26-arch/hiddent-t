import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// ---------- Medidas (referencia: mochila urbana minimalista negra) ----------
const BODY_W = 2.4            // ancho ~70% del alto
const BODY_H = 3.4            // alto
const BODY_D = 0.95           // profundidad ~28% del alto
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2
const BODY_FRONT_Z = BODY_D / 2
const BODY_BACK_Z = -BODY_D / 2

// ---------- Forma del cuerpo: caja rectangular vertical ----------
// Esquinas superiores MUY redondeadas, inferiores moderadas.
function bodyShape() {
  const w = BODY_W
  const x0 = -w / 2
  const x1 = w / 2
  const rTop = 0.78
  const rBot = 0.42
  const s = new THREE.Shape()
  s.moveTo(x0, BOTTOM_Y + rBot)
  s.lineTo(x0, TOP_Y - rTop)
  s.quadraticCurveTo(x0, TOP_Y, x0 + rTop, TOP_Y)
  s.lineTo(x1 - rTop, TOP_Y)
  s.quadraticCurveTo(x1, TOP_Y, x1, TOP_Y - rTop)
  s.lineTo(x1, BOTTOM_Y + rBot)
  s.quadraticCurveTo(x1, BOTTOM_Y, x1 - rBot, BOTTOM_Y)
  s.lineTo(x0 + rBot, BOTTOM_Y)
  s.quadraticCurveTo(x0, BOTTOM_Y, x0, BOTTOM_Y + rBot)
  s.closePath()
  return s
}

function buildBodyGeometry() {
  const g = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: BODY_D,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.12,
    bevelSegments: 6,
    curveSegments: 40,
  })
  g.translate(0, 0, -BODY_D / 2)
  g.computeVertexNormals()
  return g
}
const BODY_GEOM = buildBodyGeometry()

// ---------- Bolsillo frontal (inferior/media, centrado, leve relieve) ----------
const POCKET_W = BODY_W * 0.63
const POCKET_H = BODY_H * 0.26
const POCKET_Y = -0.72
const POCKET_D = 0.14
const POCKET_FRONT_Z = BODY_FRONT_Z + 0.03

// ---------- Cremallera en U invertida (frente, sigue el contorno superior) ----------
const ZIP_D = 0.16
function zipperPoints() {
  const z = BODY_FRONT_Z + 0.018
  const xL = -BODY_W / 2 + ZIP_D
  const xR = BODY_W / 2 - ZIP_D
  const pts = []
  for (let i = 0; i <= 6; i++) {
    pts.push(new THREE.Vector3(xL, -0.55 + i * (2.3 / 6), z))
  }
  const t0 = xL
  const t1 = xR
  for (let i = 0; i <= 14; i++) {
    const t = i / 14
    const xx = t0 + (t1 - t0) * t
    const cy = TOP_Y - 0.72 + 0.34 * Math.sin(Math.PI * t)
    pts.push(new THREE.Vector3(xx, cy, z))
  }
  for (let i = 0; i <= 6; i++) {
    pts.push(new THREE.Vector3(xR, 1.75 - i * (2.3 / 6), z))
  }
  return pts
}
const ZIPPER_GEOM = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zipperPoints()), 80, 0.02, 8, false)

// ---------- Asa superior central (arco de tela) ----------
function buildHandleGeometry() {
  const pts = []
  const r = 0.3
  const y = TOP_Y + 0.16
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (i / steps) * Math.PI
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, 0))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.06, 12, false)
}
const HANDLE_GEOM = buildHandleGeometry()

// ---------- Correas traseras acolchadas ----------
const STRAP_W = 0.34
const STRAP_H = 3.2
function Backpack({ mats }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Cuerpo */}
      <mesh geometry={BODY_GEOM} material={mats.body} />

      {/* Bolsillo frontal */}
      <RoundedBox args={[POCKET_W, POCKET_H, POCKET_D]} radius={0.14} smoothness={5} material={mats.pocket} position={[0, POCKET_Y, POCKET_FRONT_Z]} />

      {/* Cierre horizontal del bolsillo (en su parte superior, tirador a la izquierda) */}
      <mesh position={[0, POCKET_Y + POCKET_H / 2 - 0.02, POCKET_FRONT_Z + 0.02]}>
        <boxGeometry args={[POCKET_W - 0.16, 0.045, 0.012]} />
        <primitive object={mats.zipper} attach="material" />
      </mesh>
      <mesh position={[-POCKET_W / 2 + 0.28, POCKET_Y + POCKET_H / 2 - 0.045, POCKET_FRONT_Z + 0.02]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.12, 0.045, 0.014]} />
        <primitive object={mats.zip} attach="material" />
      </mesh>

      {/* Cremallera principal en U invertida (sube por el lateral izq, curvea arriba, baja por el der) */}
      <mesh geometry={ZIPPER_GEOM} material={mats.zipper} />

      {/* Tiradores de la cremallera principal (izq y der) */}
      <mesh position={[-BODY_W / 2 + ZIP_D, -0.3, BODY_FRONT_Z + 0.018]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.11, 0.05, 0.016]} />
        <primitive object={mats.zip} attach="material" />
      </mesh>
      <mesh position={[BODY_W / 2 - ZIP_D, 1.0, BODY_FRONT_Z + 0.018]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.11, 0.05, 0.016]} />
        <primitive object={mats.zip} attach="material" />
      </mesh>

      {/* Asa superior central */}
      <mesh geometry={HANDLE_GEOM} material={mats.strap} />

      {/* Bolsillo lateral derecho (botella), vertical abierto */}
      <mesh position={[BODY_W / 2, -0.8, 0]} material={mats.pocket}>
        <cylinderGeometry args={[0.24, 0.2, 1.7, 24, 1, true]} />
      </mesh>

      {/* Correas traseras acolchadas (ocultas parcialmente desde el frente) */}
      <RoundedBox args={[STRAP_W, STRAP_H, 0.14]} radius={0.07} smoothness={4} material={mats.strap} position={[-0.55, 0, BODY_BACK_Z - 0.09]} />
      <RoundedBox args={[STRAP_W, STRAP_H, 0.14]} radius={0.07} smoothness={4} material={mats.strap} position={[0.55, 0, BODY_BACK_Z - 0.09]} />

      {/* Contorno de costura del panel frontal */}
      <Stitch length={BODY_H - 0.2} pos={[-BODY_W / 2 + 0.08, 0, BODY_FRONT_Z + 0.006]} />
      <Stitch length={BODY_H - 0.2} pos={[BODY_W / 2 - 0.08, 0, BODY_FRONT_Z + 0.006]} />
      {/* Costura borde del bolsillo */}
      <Stitch length={POCKET_W - 0.12} pos={[0, POCKET_Y + POCKET_H / 2 - 0.04, POCKET_FRONT_Z + 0.012]} />
      <Stitch length={POCKET_W - 0.12} pos={[0, POCKET_Y - POCKET_H / 2 + 0.04, POCKET_FRONT_Z + 0.012]} />
    </group>
  )
}

// ---------- Materiales: negro mate liso ----------
function makeMats(colorTela, textureId) {
  const color = colorTela && colorTela !== '#F5F5F5' ? colorTela : '#0d0d0f'
  const body = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.03,
    envMapIntensity: 0.4,
  })
  const pocket = body.clone()
  const strap = new THREE.MeshStandardMaterial({ color: '#0a0a0c', roughness: 0.8, metalness: 0, envMapIntensity: 0.3 })
  const zipper = new THREE.MeshStandardMaterial({ color: '#1a1a1c', roughness: 0.28, metalness: 0.55, envMapIntensity: 0.8 })
  const zip = new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.55, metalness: 0.15, envMapIntensity: 0.3 })
  return { body, pocket, trim: strap, seam: body, net: strap, zip, zipper, strap }
}

// ---------- Costuras ----------
function makeStitchTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 16
  const x = c.getContext('2d')
  x.clearRect(0, 0, 64, 16)
  for (let i = 2; i < 64; i += 8) {
    x.fillStyle = 'rgba(0,0,0,0.7)'
    x.fillRect(i, 1, 5, 14)
    x.fillStyle = 'rgba(255,255,255,0.12)'
    x.fillRect(i + 1, 2, 2, 12)
  }
  return c
}
const STITCH_CANVAS = makeStitchTexture()

function Stitch({ length, pos }) {
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(STITCH_CANVAS)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(Math.max(1, Math.round(length / 0.28)), 1)
    return t
  }, [length])
  return (
    <mesh position={pos} raycast={() => null}>
      <planeGeometry args={[length, 0.045]} />
      <meshBasicMaterial map={tex} transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ---------- Zonas de bordado ----------
const ZONE_DEF = {
  centro: { pos: [0, 0.35, BODY_FRONT_Z + 0.02], hit: [1.55, 0.8], pct: 30 },
  bolsillo: { pos: [0, POCKET_Y, POCKET_FRONT_Z + 0.02], hit: [1.5, POCKET_H], pct: 42 },
  tapa: { pos: [0, 1.45, BODY_FRONT_Z + 0.02], hit: [1.55, 0.4], pct: 16 },
}
const ZONES = [
  { id: 'centro', ...ZONE_DEF.centro },
  { id: 'bolsillo', ...ZONE_DEF.bolsillo },
  { id: 'tapa', ...ZONE_DEF.tapa },
]

function setCursor(cur) {
  document.body.style.cursor = cur
}

function ZoneHits({ imagen, zonaActiva, zonasyMarca, onZoneClick, applied }) {
  if (!imagen || applied || !onZoneClick) return null
  return ZONES.map((z) => {
    const active = zonaActiva === z.id
    const marked = zonasyMarca.indexOf(z.id) >= 0
    const col = active ? '#06B6D4' : marked ? '#10B981' : '#d7dbe2'
    const op = active ? 0.55 : marked ? 0.35 : 0.18
    return (
      <group key={z.id} position={z.pos}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onZoneClick(z.id) }}
          onPointerOver={() => setCursor('pointer')}
          onPointerOut={() => setCursor('auto')}
        >
          <planeGeometry args={z.hit} />
          <meshBasicMaterial color="#ffffff" transparent opacity={active ? 0.14 : marked ? 0.1 : 0.02} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[z.hit[0], z.hit[1], 0.012]} />
          <meshBasicMaterial wireframe color={col} transparent opacity={op} depthWrite={false} />
        </mesh>
      </group>
    )
  })
}

function Design({ imagen, imgInfo, zonaActiva, modoLibre, tamano, rotacion, posX, posY, applied }) {
  if (!imgInfo || !imagen || !(zonaActiva || modoLibre)) return null
  const aspect = imgInfo.w / imgInfo.h
  let width = 0
  let x = 0
  let y = 0
  let z = 0
  if (modoLibre) {
    width = (tamano / 100) * 2.3
    x = (posX / 100 - 0.5) * BODY_W * 0.85
    y = TOP_Y - (posY / 100) * BODY_H
    z = BODY_FRONT_Z + 0.02
  } else {
    const zone = ZONE_DEF[zonaActiva]
    width = (zone.pct / 100) * BODY_W * 0.55 * (tamano / 40)
    x = zone.pos[0]
    y = zone.pos[1]
    z = zone.pos[2] + 0.012
  }
  const height = width / aspect
  return (
    <mesh position={[x, y, z]} rotation={[0, 0, (rotacion * Math.PI) / 180]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={imgInfo.tex} transparent depthWrite={false} opacity={applied ? 0.94 : 1} />
    </mesh>
  )
}

export default function Mochila3D(props) {
  const { colorTela, telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
  const [imgInfo, setImgInfo] = useState(null)

  useEffect(() => {
    if (!imagen) { setImgInfo(null); return }
    let alive = true
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      if (!w || !h) { if (alive) setImgInfo(null); return }
      const maxSize = 1024
      const scale = Math.min(1, maxSize / Math.max(w, h))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(w * scale))
      c.height = Math.max(1, Math.round(h * scale))
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      if (alive) setImgInfo({ tex, w: c.width, h: c.height })
    }
    img.onerror = () => { if (alive) setImgInfo(null) }
    img.src = imagen
    return () => { alive = false; img.src = '' }
  }, [imagen])

  const mats = useMemo(() => makeMats(colorTela, telaSeleccionada), [colorTela])

  return (
    <div className="mochila3d">
      <Canvas
        camera={{ position: [0, 0.15, 7.6], fov: 36 }}
        dpr={[1, 2]}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#e5e5e8']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 6, 4]} intensity={1.35} />
        <directionalLight position={[-4, 2, -3]} intensity={0.55} />
        <Backpack mats={mats} />
        <ZoneHits imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
        <Design imagen={imagen} imgInfo={imgInfo} zonaActiva={zonaActiva} modoLibre={modoLibre} tamano={tamano} rotacion={rotacion} posX={posX} posY={posY} applied={applied} />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.5} maxDistance={11} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}
