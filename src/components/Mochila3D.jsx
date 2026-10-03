import { useMemo, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// ---------- Medidas (referencia: mochila urbana minimalista) ----------
const BODY_W = 2.4            // ancho ~70% del alto
const BODY_H = 3.4            // alto
const BODY_D = 0.95           // profundidad ~28% del alto
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2
// OJO: el frente real sale del bounding box (el bevel suma 0.16 en Z).

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
BODY_GEOM.computeBoundingBox()
const FRONT_Z = BODY_GEOM.boundingBox.max.z
const BACK_Z = BODY_GEOM.boundingBox.min.z

// ---------- Bolsillo frontal (inferior/media, centrado, leve relieve) ----------
const POCKET_W = BODY_W * 0.63
const POCKET_H = BODY_H * 0.26
const POCKET_Y = -0.72
const POCKET_D = 0.14
const POCKET_FRONT_Z = FRONT_Z + 0.03
const POCKET_TOP_Z = POCKET_FRONT_Z + POCKET_D / 2

// ---------- Cremallera en U invertida (frente, sigue el contorno superior) ----------
const ZIP_D = 0.16
function zipperPoints() {
  const z = FRONT_Z + 0.018
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
  const baseY = TOP_Y - 0.02
  const archH = 0.38
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (i / steps) * Math.PI
    pts.push(new THREE.Vector3(Math.cos(a) * r, baseY + (-Math.sin(a)) * archH, 0))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.06, 12, false)
}
const HANDLE_GEOM = buildHandleGeometry()

// ---------- Correas traseras acolchadas ----------
const STRAP_W = 0.34
const STRAP_H = 3.2

// ---------- Micro-relieve de tela (bump compartido, barato) ----------
function makeFabricBump() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const x = c.getContext('2d')
  x.fillStyle = '#808080'
  x.fillRect(0, 0, 128, 128)
  // trama tejida
  for (let j = 0; j < 128; j += 2) {
    for (let i = 0; i < 128; i += 2) {
      const v = 118 + Math.round(Math.random() * 20) + ((i + j) % 4 === 0 ? 8 : 0)
      x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'
      x.fillRect(i, j, 2, 2)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  return t
}
let FABRIC_BUMP = null
function getFabricBump() {
  if (!FABRIC_BUMP) FABRIC_BUMP = makeFabricBump()
  return FABRIC_BUMP
}

// ---------- Telas: cómo se ve cada material en 3D ----------
const TELA_PROPS = {
  nylon600: { roughness: 0.38, metalness: 0.02, bump: 0.015 },
  poliester: { roughness: 0.5, metalness: 0.02, bump: 0.012 },
  cuero_sint: { roughness: 0.42, metalness: 0.06, bump: 0.008 },
  lona: { roughness: 0.85, metalness: 0.0, bump: 0.03 },
  lona12: { roughness: 0.85, metalness: 0.0, bump: 0.03 },
  lona16: { roughness: 0.9, metalness: 0.0, bump: 0.035 },
  malla: { roughness: 0.92, metalness: 0.0, bump: 0.045 },
  algodon: { roughness: 0.88, metalness: 0.0, bump: 0.028 },
  nylon: { roughness: 0.4, metalness: 0.02, bump: 0.016 },
  polar: { roughness: 0.95, metalness: 0.0, bump: 0.04 },
  neoprene: { roughness: 0.6, metalness: 0.0, bump: 0.01 },
  pvc: { roughness: 0.25, metalness: 0.05, bump: 0.006 },
  mezclilla: { roughness: 0.8, metalness: 0.0, bump: 0.028 },
  tela_imp: { roughness: 0.3, metalness: 0.04, bump: 0.01 },
}
const DEFAULT_TELA = { roughness: 0.72, metalness: 0.03, bump: 0.02 }

function luminance(hex) {
  const c = new THREE.Color(hex)
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
}

function Backpack({ mats, thread }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Cuerpo */}
      <mesh geometry={BODY_GEOM} material={mats.body} castShadow receiveShadow />

      {/* Bolsillo frontal */}
      <RoundedBox args={[POCKET_W, POCKET_H, POCKET_D]} radius={0.14} smoothness={5} material={mats.pocket} position={[0, POCKET_Y, POCKET_FRONT_Z]} castShadow receiveShadow />

      {/* Cierre horizontal del bolsillo (en su parte superior, tirador a la izquierda) */}
      <mesh position={[0, POCKET_Y + POCKET_H / 2 - 0.02, POCKET_TOP_Z + 0.01]}>
        <boxGeometry args={[POCKET_W - 0.16, 0.045, 0.012]} />
        <primitive object={mats.zipper} attach="material" />
      </mesh>
      <mesh position={[-POCKET_W / 2 + 0.28, POCKET_Y + POCKET_H / 2 - 0.045, POCKET_TOP_Z + 0.012]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.12, 0.045, 0.014]} />
        <primitive object={mats.zip} attach="material" />
      </mesh>

      {/* Cremallera principal en U invertida (sube por el lateral izq, curvea arriba, baja por el der) */}
      <mesh geometry={ZIPPER_GEOM} material={mats.zipper} />

      {/* Tiradores de la cremallera principal (izq y der) */}
      <mesh position={[-BODY_W / 2 + ZIP_D, -0.3, FRONT_Z + 0.018]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.11, 0.05, 0.016]} />
        <primitive object={mats.zip} attach="material" />
      </mesh>
      <mesh position={[BODY_W / 2 - ZIP_D, 1.0, FRONT_Z + 0.018]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.11, 0.05, 0.016]} />
        <primitive object={mats.zip} attach="material" />
      </mesh>

      {/* Asa superior central */}
      <mesh geometry={HANDLE_GEOM} material={mats.strap} castShadow />

      {/* Bolsillo lateral derecho (botella), vertical abierto */}
      <mesh position={[BODY_W / 2, -0.8, 0]}>
        <cylinderGeometry args={[0.24, 0.2, 1.7, 24, 1, true]} />
        <primitive object={mats.pocketSide} attach="material" />
      </mesh>

      {/* Correas traseras acolchadas (ocultas parcialmente desde el frente) */}
      <RoundedBox args={[STRAP_W, STRAP_H, 0.14]} radius={0.07} smoothness={4} material={mats.strap} position={[-0.55, 0, BACK_Z - 0.09]} castShadow />
      <RoundedBox args={[STRAP_W, STRAP_H, 0.14]} radius={0.07} smoothness={4} material={mats.strap} position={[0.55, 0, BACK_Z - 0.09]} castShadow />

      {/* Contorno de costura del panel frontal */}
      <Stitch length={BODY_H - 0.2} pos={[-BODY_W / 2 + 0.08, 0, FRONT_Z + 0.006]} tone={thread} />
      <Stitch length={BODY_H - 0.2} pos={[BODY_W / 2 - 0.08, 0, FRONT_Z + 0.006]} tone={thread} />
      {/* Costura borde del bolsillo */}
      <Stitch length={POCKET_W - 0.12} pos={[0, POCKET_Y + POCKET_H / 2 - 0.04, POCKET_TOP_Z + 0.006]} tone={thread} />
      <Stitch length={POCKET_W - 0.12} pos={[0, POCKET_Y - POCKET_H / 2 + 0.04, POCKET_TOP_Z + 0.006]} tone={thread} />
    </group>
  )
}

// ---------- Materiales según color de tela + tipo de tela elegidos ----------
function makeMats(colorTela, telaId) {
  const color = colorTela || '#17171a'
  const tp = (telaId && TELA_PROPS[telaId]) || DEFAULT_TELA
  const bumpMap = getFabricBump()
  const body = new THREE.MeshStandardMaterial({
    color,
    roughness: tp.roughness,
    metalness: tp.metalness,
    bumpMap,
    bumpScale: tp.bump,
    envMapIntensity: 0.5,
  })
  // Bolsillo apenas más oscuro para dar volumen
  const pocketColor = new THREE.Color(color).multiplyScalar(0.9)
  const pocket = new THREE.MeshStandardMaterial({
    color: pocketColor,
    roughness: Math.min(1, tp.roughness + 0.05),
    metalness: tp.metalness,
    bumpMap,
    bumpScale: tp.bump,
    envMapIntensity: 0.45,
  })
  const pocketSide = new THREE.MeshStandardMaterial({
    color: pocketColor,
    roughness: Math.min(1, tp.roughness + 0.05),
    metalness: tp.metalness,
    side: THREE.DoubleSide,
    envMapIntensity: 0.4,
  })
  const strap = new THREE.MeshStandardMaterial({ color: '#0c0c0e', roughness: 0.8, metalness: 0, envMapIntensity: 0.3 })
  const zipper = new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.3, metalness: 0.6, envMapIntensity: 0.9 })
  const zip = new THREE.MeshStandardMaterial({ color: '#101012', roughness: 0.5, metalness: 0.25, envMapIntensity: 0.4 })
  return { body, pocket, pocketSide, trim: strap, seam: body, net: strap, zip, zipper, strap }
}

// ---------- Costuras con hilo contrastante (una textura por tono, compartida) ----------
const stitchCache = {}
function makeStitchCanvas(thread) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 16
  const x = c.getContext('2d')
  x.clearRect(0, 0, 64, 16)
  for (let i = 2; i < 64; i += 8) {
    x.fillStyle = thread
    x.fillRect(i, 3, 5, 10)
    x.fillStyle = 'rgba(255,255,255,0.18)'
    x.fillRect(i + 1, 4, 1.5, 8)
  }
  return c
}

function Stitch({ length, pos, tone }) {
  const tex = useMemo(() => {
    const key = tone || 'dark'
    if (!stitchCache[key]) {
      stitchCache[key] = makeStitchCanvas(key === 'light' ? '#e9e9ec' : '#232326')
    }
    const t = new THREE.CanvasTexture(stitchCache[key])
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(Math.max(1, Math.round(length / 0.28)), 1)
    return t
  }, [length, tone])
  useEffect(() => () => { tex.dispose() }, [tex])
  return (
    <mesh position={pos} raycast={() => null}>
      <planeGeometry args={[length, 0.045]} />
      <meshBasicMaterial map={tex} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
}

// ---------- Zonas de bordado ----------
const ZONE_DEF = {
  centro: { pos: [0, 0.35, FRONT_Z + 0.02], hit: [1.55, 0.8], pct: 30 },
  bolsillo: { pos: [0, POCKET_Y, POCKET_TOP_Z + 0.02], hit: [1.5, POCKET_H], pct: 42 },
  tapa: { pos: [0, 1.45, FRONT_Z + 0.02], hit: [1.55, 0.4], pct: 16 },
}
const ZONES = [
  { id: 'centro', ...ZONE_DEF.centro },
  { id: 'bolsillo', ...ZONE_DEF.bolsillo },
  { id: 'tapa', ...ZONE_DEF.tapa },
]

function ZoneHits({ imagen, zonaActiva, zonasyMarca, onZoneClick, applied }) {
  useEffect(() => () => { document.body.style.cursor = 'auto' }, [])
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
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'auto' }}
        >
          <planeGeometry args={z.hit} />
          <meshBasicMaterial color="#ffffff" transparent opacity={active ? 0.14 : marked ? 0.1 : 0.02} depthWrite={false} />
        </mesh>
        <mesh raycast={() => null}>
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
  let maxH = BODY_H * 0.5
  if (modoLibre) {
    width = (tamano / 100) * 2.3
    x = (posX / 100 - 0.5) * BODY_W * 0.85
    y = TOP_Y - (posY / 100) * BODY_H
    z = FRONT_Z + 0.02
  } else {
    const zone = ZONE_DEF[zonaActiva]
    if (!zone) return null
    width = (zone.pct / 100) * BODY_W * 1.1 * (tamano / 40)
    x = zone.pos[0]
    y = zone.pos[1]
    z = zone.pos[2] + 0.012
    maxH = zone.hit[1] * 0.92
  }
  let height = width / aspect
  // Si la imagen es vertical, achicar para que no desborde la zona
  if (height > maxH) {
    const s = maxH / height
    width *= s
    height = maxH
  }
  return (
    <mesh position={[x, y, z]} rotation={[0, 0, (rotacion * Math.PI) / 180]} raycast={() => null}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={imgInfo.tex}
        transparent
        depthWrite={false}
        opacity={applied ? 0.94 : 1}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}

export default function Mochila3D(props) {
  const { colorTela, telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
  const [imgInfo, setImgInfo] = useState(null)

  useEffect(() => {
    if (!imagen) { setImgInfo(null); return }
    let alive = true
    let tex = null
    setImgInfo((prev) => {
      if (prev && prev.tex) prev.tex.dispose()
      return null
    })
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
      tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      if (alive) setImgInfo({ tex, w: c.width, h: c.height })
      else tex.dispose()
    }
    img.onerror = () => { if (alive) setImgInfo(null) }
    img.src = imagen
    return () => { alive = false; img.src = ''; if (tex) tex.dispose() }
  }, [imagen])

  const mats = useMemo(() => makeMats(colorTela, telaSeleccionada), [colorTela, telaSeleccionada])
  const prevMats = useRef(null)
  useEffect(() => {
    const old = prevMats.current
    prevMats.current = mats
    return () => {
      if (old) Object.values(old).forEach((m) => { if (m && m.dispose && m !== old.body) m.dispose(); })
      if (old && old.body) old.body.dispose()
    }
  }, [mats])
  useEffect(() => () => {
    const cur = prevMats.current
    if (cur) Object.values(cur).forEach((m) => { if (m && m.dispose) m.dispose() })
  }, [])

  const thread = useMemo(() => (luminance(colorTela || '#17171a') < 0.35 ? 'light' : 'dark'), [colorTela])

  return (
    <div className="mochila3d">
      <Canvas
        shadows
        camera={{ position: [0, 0.15, 7.6], fov: 36 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#14141c']} />
        <fog attach="fog" args={['#14141c', 10, 18]} />
        <hemisphereLight args={['#ffffff', '#23232b', 0.5]} />
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[4, 6, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={5}
          shadow-camera-bottom={-4}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.9} color="#a78bfa" />
        <directionalLight position={[0, 1, 6]} intensity={0.35} />
        <Backpack mats={mats} thread={thread} />
        <ZoneHits imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
        <Design imagen={imagen} imgInfo={imgInfo} zonaActiva={zonaActiva} modoLibre={modoLibre} tamano={tamano} rotacion={rotacion} posX={posX} posY={posY} applied={applied} />
        {/* Piso receptor de sombra */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.5} maxDistance={11} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}
