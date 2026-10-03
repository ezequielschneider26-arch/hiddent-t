import { useMemo, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// =====================================================================
// Botinera 36 x 19 x 13 cm => 1u = 0.1 escena.
//   alto 3.6 | ancho 1.9 | profundidad 1.3
// Cierre perimetral naranja en U, bolsillo frontal, banda inferior,
// asa superior grande, EVERLAST frontal.
// =====================================================================
const BODY_W = 1.9
const BODY_H = 3.6
const BODY_D = 1.3
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2
const ORANGE = '#E8721C'
const ORANGE_DARK = '#B34A12'

function bodyShape() {
  const hw = BODY_W / 2
  const rBot = 0.30
  const yArch = TOP_Y - 0.55
  const s = new THREE.Shape()
  s.moveTo(-hw + rBot, BOTTOM_Y)
  s.lineTo(hw - rBot, BOTTOM_Y)
  s.quadraticCurveTo(hw, BOTTOM_Y, hw, BOTTOM_Y + rBot)
  s.lineTo(hw, yArch)
  s.quadraticCurveTo(hw, TOP_Y, 0, TOP_Y)
  s.quadraticCurveTo(-hw, TOP_Y, -hw, yArch)
  s.lineTo(-hw, BOTTOM_Y + rBot)
  s.quadraticCurveTo(-hw, BOTTOM_Y, -hw + rBot, BOTTOM_Y)
  s.closePath()
  return s
}

function buildBodyGeometry() {
  const g = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: BODY_D,
    bevelEnabled: true,
    bevelThickness: 0.10,
    bevelSize: 0.08,
    bevelSegments: 5,
    curveSegments: 36,
  })
  g.translate(0, 0, -BODY_D / 2)
  // Tela confeccionada: frente convexo, espalda hacia adentro.
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = THREE.MathUtils.clamp((v.y - BOTTOM_Y) / BODY_H, 0, 1)
    const xn = THREE.MathUtils.clamp(v.x / (BODY_W / 2), -1, 1)
    if (v.z > 0) {
      v.z += 0.03 * (1 - xn * xn) * Math.sin(Math.PI * t)
    } else {
      v.z += 0.05 * (1 - xn * xn)
    }
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  g.computeBoundingBox()
  return g
}
const BODY_GEOM = buildBodyGeometry()
const FRONT_Z = BODY_GEOM.boundingBox.max.z
const BACK_Z = BODY_GEOM.boundingBox.min.z

// ---------- Cierre principal perimetral: U invertida, 0.22 del borde ----------
function mainZipperPoints() {
  const z = FRONT_Z + 0.01
  return [
    new THREE.Vector3(-0.73, -1.30, z - 0.10),
    new THREE.Vector3(-0.73, -0.90, z),
    new THREE.Vector3(-0.73, -0.20, z + 0.01),
    new THREE.Vector3(-0.72, 0.50, z + 0.01),
    new THREE.Vector3(-0.68, 1.00, z + 0.01),
    new THREE.Vector3(-0.50, 1.36, z),
    new THREE.Vector3(-0.10, 1.54, z - 0.01),
    new THREE.Vector3(0.30, 1.55, z - 0.01),
    new THREE.Vector3(0.60, 1.40, z),
    new THREE.Vector3(0.71, 1.02, z + 0.01),
    new THREE.Vector3(0.73, 0.40, z + 0.01),
    new THREE.Vector3(0.73, -0.40, z + 0.01),
    new THREE.Vector3(0.73, -1.10, z),
    new THREE.Vector3(0.73, -1.28, z - 0.08),
  ]
}
const MAIN_ZIP_PTS = mainZipperPoints()
const MAIN_ZIP_CURVE = new THREE.CatmullRomCurve3(MAIN_ZIP_PTS)
const MAIN_TAPE_GEOM = new THREE.TubeGeometry(MAIN_ZIP_CURVE, 96, 0.045, 10, false)
const MAIN_TEETH_GEOM = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(MAIN_ZIP_PTS.map((p) => new THREE.Vector3(p.x, p.y, p.z + 0.042))),
  96, 0.02, 8, false
)
const MAIN_ZIP_START = MAIN_ZIP_PTS[0]

// ---------- Bolsillo frontal: 1.75 x 1.10, borde sup. en y=0.23 ----------
const POCKET_W = 1.75
const POCKET_H = 1.10
const POCKET_Y = -0.32
const POCKET_D = 0.16
const POCKET_CZ = FRONT_Z + 0.02
const POCKET_TOP_Z = POCKET_CZ + POCKET_D / 2
const POCKET_ZIP_Y = 0.19
const POCKET_ZIP_X0 = -0.78
const POCKET_ZIP_X1 = 0.78

function pocketZipPoints() {
  const pts = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    pts.push(new THREE.Vector3(POCKET_ZIP_X0 + (POCKET_ZIP_X1 - POCKET_ZIP_X0) * t, POCKET_ZIP_Y, POCKET_TOP_Z + 0.005))
  }
  return pts
}
const POCKET_ZIP_CURVE = new THREE.CatmullRomCurve3(pocketZipPoints())
const POCKET_TAPE_GEOM = new THREE.TubeGeometry(POCKET_ZIP_CURVE, 24, 0.04, 10, false)
const POCKET_TEETH_GEOM = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(pocketZipPoints().map((p) => new THREE.Vector3(p.x, p.y, p.z + 0.04))),
  24, 0.018, 8, false
)
const POCKET_SLIDER_X = POCKET_ZIP_X0 + 0.10

// ---------- Banda inferior: 0.45 de alto en todo el ancho ----------
const BAND_H = 0.45
const BAND_Y = BOTTOM_Y + BAND_H / 2 + 0.02

// ---------- Asa superior: arco de cinta, +0.6 sobre el cuerpo ----------
const HANDLE_R = 0.60
const HANDLE_Y = TOP_Y - 0.08
const HANDLE_GEOM = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(
    Array.from({ length: 25 }, (_, i) => {
      const a = (i / 24) * Math.PI
      return new THREE.Vector3(Math.cos(a) * HANDLE_R, HANDLE_Y + Math.sin(a) * HANDLE_R, 0)
    })
  ),
  32, 0.11, 12, false
)

// ---------- EVERLAST frontal: ubicación y tamaño de referencia ----------
function brandTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const x = c.getContext('2d')
  x.clearRect(0, 0, 512, 128)
  x.fillStyle = '#F2F3F5'
  x.font = '900 76px Arial, sans-serif'
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.fillText('EVERLAST', 256, 68)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
let BRAND_TEX = null

function Backpack({ mats }) {
  const brandTex = useMemo(() => {
    if (!BRAND_TEX) BRAND_TEX = brandTexture()
    return BRAND_TEX
  }, [])
  return (
    <group position={[0, 0, 0]}>
      {/* Cuerpo principal */}
      <mesh name="cuerpo-principal" geometry={BODY_GEOM} material={mats.body} castShadow receiveShadow />

      {/* Panel trasero */}
      <RoundedBox name="panel-trasero" args={[1.70, 3.20, 0.10]} radius={0.05} smoothness={4} material={mats.bodyDark} position={[0, 0, BACK_Z]} receiveShadow />

      {/* Banda inferior */}
      <RoundedBox name="panel-inferior" args={[1.80, BAND_H, BODY_D + 0.24]} radius={0.10} smoothness={5} material={mats.bodyDark} position={[0, BAND_Y, 0]} castShadow receiveShadow />

      {/* Cierre principal: cinta + dientes naranja */}
      <mesh name="cierre-principal-cinta" geometry={MAIN_TAPE_GEOM} material={mats.orange} />
      <mesh name="cierre-principal-dientes" geometry={MAIN_TEETH_GEOM} material={mats.orangeDark} />
      {/* Costuras que flanquean el cierre */}
      <SeamTube curve={SEAM_L_CURVE} />
      <SeamTube curve={SEAM_R_CURVE} />
      {/* Cursor + tirador negro abajo-izquierda */}
      <mesh name="cursor-principal" position={[MAIN_ZIP_START.x, MAIN_ZIP_START.y + 0.04, MAIN_ZIP_START.z + 0.10]} rotation={[0, 0, 0.3]} material={mats.zip}>
        <boxGeometry args={[0.12, 0.09, 0.07]} />
      </mesh>
      <group name="tirador-principal" position={[MAIN_ZIP_START.x, MAIN_ZIP_START.y - 0.04, MAIN_ZIP_START.z + 0.10]} rotation={[0.15, 0, 0.15]}>
        <mesh position={[0, -0.02, 0]} material={mats.zip}>
          <boxGeometry args={[0.035, 0.06, 0.025]} />
        </mesh>
        <mesh position={[0, -0.11, 0.005]} material={mats.zip}>
          <torusGeometry args={[0.05, 0.017, 8, 20]} />
        </mesh>
      </group>

      {/* Bolsillo frontal */}
      <RoundedBox name="bolsillo-frontal" args={[POCKET_W, POCKET_H, POCKET_D]} radius={0.08} smoothness={5} material={mats.pocket} position={[0, POCKET_Y, POCKET_CZ]} castShadow receiveShadow />
      {/* Cierre del bolsillo naranja */}
      <mesh name="cierre-bolsillo-cinta" geometry={POCKET_TAPE_GEOM} material={mats.orange} />
      <mesh name="cierre-bolsillo-dientes" geometry={POCKET_TEETH_GEOM} material={mats.orangeDark} />
      {/* Cursor + tirador negro a la izquierda */}
      <mesh name="cursor-bolsillo" position={[POCKET_SLIDER_X, POCKET_ZIP_Y + 0.01, POCKET_TOP_Z + 0.05]} material={mats.zip}>
        <boxGeometry args={[0.11, 0.07, 0.06]} />
      </mesh>
      <group name="tirador-bolsillo" position={[POCKET_SLIDER_X, POCKET_ZIP_Y - 0.03, POCKET_TOP_Z + 0.05]} rotation={[0.15, 0, -0.1]}>
        <mesh position={[0, -0.02, 0]} material={mats.zip}>
          <boxGeometry args={[0.03, 0.05, 0.02]} />
        </mesh>
        <mesh position={[0, -0.09, 0.005]} material={mats.zip}>
          <torusGeometry args={[0.045, 0.015, 8, 20]} />
        </mesh>
      </group>

      {/* EVERLAST: ubicación y tamaño de referencia */}
      <mesh name="logo-frontal" position={[0, 0.81, FRONT_Z + 0.012]} raycast={() => null}>
        <planeGeometry args={[1.05, 0.26]} />
        <meshBasicMaterial map={brandTex} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>

      {/* Asa superior de cinta */}
      <mesh name="asa-superior" geometry={HANDLE_GEOM} material={mats.body} scale={[1, 1, 0.45]} castShadow />
      {/* Refuerzos del asa */}
      {[-0.60, 0.60].map((hx) => (
        <mesh key={hx} name={'refuerzo-asa-' + (hx < 0 ? 'izq' : 'der')} position={[hx, TOP_Y - 0.06, 0.30]} rotation={[-0.25, 0, 0]} material={mats.bodyDark}>
          <boxGeometry args={[0.26, 0.22, 0.10]} />
        </mesh>
      ))}

      {/* Costuras: laterales */}
      <Stitch length={2.2} pos={[-0.962, 0, 0]} rot={[0, -Math.PI / 2, Math.PI / 2]} />
      <Stitch length={2.2} pos={[0.962, 0, 0]} rot={[0, Math.PI / 2, Math.PI / 2]} />
      {/* Costura horizontal de la banda inferior */}
      <Stitch length={1.7} pos={[0, BAND_Y + BAND_H / 2 + 0.005, FRONT_Z + 0.006]} />
      {/* Costuras del bolsillo: laterales + inferior + sobre el cierre */}
      <Stitch length={POCKET_H - 0.1} pos={[-POCKET_W / 2 + 0.06, POCKET_Y, POCKET_TOP_Z + 0.006]} />
      <Stitch length={POCKET_H - 0.1} pos={[POCKET_W / 2 - 0.06, POCKET_Y, POCKET_TOP_Z + 0.006]} />
      <Stitch length={POCKET_W - 0.16} pos={[0, POCKET_Y - POCKET_H / 2 + 0.04, POCKET_TOP_Z + 0.006]} />
      <Stitch length={POCKET_W - 0.2} pos={[0, POCKET_ZIP_Y + 0.09, POCKET_TOP_Z + 0.006]} />
      {/* Costuras de los refuerzos del asa */}
      <Stitch length={0.2} pos={[-0.60, TOP_Y - 0.06, 0.36]} />
      <Stitch length={0.2} pos={[0.60, TOP_Y - 0.06, 0.36]} />
    </group>
  )
}

// ---------- Materiales: marino + naranja + negros ----------
function makeMats(colorTela) {
  const color = colorTela || '#22345C'
  const body = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.02, envMapIntensity: 0.45 })
  const pocket = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.92), roughness: 0.75, metalness: 0.02, envMapIntensity: 0.4 })
  const bodyDark = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.70), roughness: 0.78, metalness: 0.02, envMapIntensity: 0.35 })
  const orange = new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.5 })
  const orangeDark = new THREE.MeshStandardMaterial({ color: ORANGE_DARK, roughness: 0.45, metalness: 0.3, envMapIntensity: 0.6 })
  const zip = new THREE.MeshStandardMaterial({ color: '#0B0B0D', roughness: 0.5, metalness: 0.25, envMapIntensity: 0.4 })
  return { body, pocket, bodyDark, orange, orangeDark, zip }
}

// ---------- Costuras hilo claro ----------
const stitchCache = {}
function navyStitchCanvas() {
  if (!stitchCache.navy) {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 16
    const x = c.getContext('2d')
    x.clearRect(0, 0, 64, 16)
    for (let i = 2; i < 64; i += 8) {
      x.fillStyle = '#c9cdd6'
      x.fillRect(i, 3, 5, 10)
      x.fillStyle = 'rgba(255,255,255,0.18)'
      x.fillRect(i + 1, 4, 1.5, 8)
    }
    stitchCache.navy = c
  }
  return stitchCache.navy
}

function Stitch({ length, pos, rot }) {
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(navyStitchCanvas())
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(Math.max(1, Math.round(length / 0.28)), 1)
    return t
  }, [length])
  useEffect(() => () => { tex.dispose() }, [tex])
  return (
    <mesh position={pos} rotation={rot || [0, 0, 0]} raycast={() => null}>
      <planeGeometry args={[length, 0.045]} />
      <meshBasicMaterial map={tex} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
}

// ---------- Costura punteada que flanquea el cierre principal ----------
function seamCurve(offset) {
  const pts = []
  const Z = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= 56; i++) {
    const t = i / 56
    const p = MAIN_ZIP_CURVE.getPointAt(t)
    const tan = MAIN_ZIP_CURVE.getTangentAt(t)
    const perp = new THREE.Vector3().crossVectors(tan, Z).normalize()
    pts.push(new THREE.Vector3(p.x + perp.x * offset, p.y + perp.y * offset, p.z + 0.008))
  }
  return new THREE.CatmullRomCurve3(pts)
}
const SEAM_L_CURVE = seamCurve(0.085)
const SEAM_R_CURVE = seamCurve(-0.085)

function SeamTube({ curve }) {
  const { tex, geom } = useMemo(() => {
    const g = new THREE.TubeGeometry(curve, 72, 0.016, 6, false)
    const t = new THREE.CanvasTexture(navyStitchCanvas())
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    t.repeat.set(Math.max(4, Math.round(curve.getLength() / 0.22)), 1)
    return { tex: t, geom: g }
  }, [curve])
  useEffect(() => () => { tex.dispose(); geom.dispose() }, [tex, geom])
  return (
    <mesh geometry={geom} raycast={() => null}>
      <meshBasicMaterial map={tex} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  )
}

// ---------- Zonas de bordado ----------
const ZONE_DEF = {
  izquierdo: { pos: [-0.99, 0, 0], rot: [0, -Math.PI / 2, 0], hit: [1.0, 1.4], size: 0.8, maxH: 1.3 },
  derecho: { pos: [0.99, 0, 0], rot: [0, Math.PI / 2, 0], hit: [1.0, 1.4], size: 0.8, maxH: 1.3 },
  centro: { pos: [0, 1.12, FRONT_Z + 0.02], rot: [0, 0, 0], hit: [1.1, 0.45], size: 0.75, maxH: 0.42 },
}
const ZONES = [
  { id: 'izquierdo', ...ZONE_DEF.izquierdo },
  { id: 'derecho', ...ZONE_DEF.derecho },
  { id: 'centro', ...ZONE_DEF.centro },
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
      <group key={z.id} position={z.pos} rotation={z.rot}>
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
  const rotRad = (rotacion * Math.PI) / 180
  let width = 0
  let pos = [0, 0, 0]
  let rot = [0, 0, rotRad]
  let maxH = BODY_H * 0.5
  if (modoLibre) {
    width = (tamano / 100) * 1.6
    pos = [(posX / 100 - 0.5) * (BODY_W - 0.4), TOP_Y - (posY / 100) * BODY_H, FRONT_Z + 0.02]
    maxH = 2.0
  } else {
    const zone = ZONE_DEF[zonaActiva]
    if (!zone) return null
    width = zone.size * (tamano / 40)
    pos = [zone.pos[0], zone.pos[1], zone.pos[2] + 0.012]
    rot = [zone.rot[0], zone.rot[1], rotRad]
    maxH = zone.maxH
  }
  let height = width / aspect
  if (height > maxH) {
    const s = maxH / height
    width *= s
    height = maxH
  }
  return (
    <mesh position={pos} rotation={rot} raycast={() => null}>
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

export default function Botinera3D(props) {
  const { colorTela, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
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

  const mats = useMemo(() => makeMats(colorTela), [colorTela])
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

  return (
    <div className="mochila3d">
      <Canvas
        shadows
        camera={{ position: [0, 0.1, 7.5], fov: 36 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#14141c']} />
        <fog attach="fog" args={['#14141c', 11, 20]} />
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
        <Backpack mats={mats} />
        <ZoneHits imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
        <Design imagen={imagen} imgInfo={imgInfo} zonaActiva={zonaActiva} modoLibre={modoLibre} tamano={tamano} rotacion={rotacion} posX={posX} posY={posY} applied={applied} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4} maxDistance={13} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0.1, 0]} />
      </Canvas>
    </div>
  )
}
