import { useMemo, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// =====================================================================
// Mochila urbana reconstruida como blueprint: cada pieza visible es un
// elemento geométrico diferenciado. Proporciones en unidades de escena
// (altura total 3.4 = 100u  =>  1u = 0.034):
//   ancho 2.45 (72u) | profundidad 0.82 (24u) | bolsillo 2.10 x 0.92
// =====================================================================
const BODY_W = 2.45
const BODY_H = 3.4
const BODY_D = 0.82
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2

// ---------- Silueta frontal: base más ancha, esquinas inf. redondeadas,
// ---------- laterales que se curvan en el último ~22% superior ----------
function bodyShape() {
  const hw = BODY_W / 2
  const rBot = 0.4
  const yArch = TOP_Y - 0.75
  const s = new THREE.Shape()
  s.moveTo(-hw + rBot, BOTTOM_Y)
  s.lineTo(-hw, yArch)
  s.quadraticCurveTo(-hw, TOP_Y, 0, TOP_Y)
  s.quadraticCurveTo(hw, TOP_Y, hw, yArch)
  s.lineTo(hw, BOTTOM_Y + rBot)
  s.quadraticCurveTo(hw, BOTTOM_Y, hw - rBot, BOTTOM_Y)
  s.lineTo(-hw + rBot, BOTTOM_Y)
  s.quadraticCurveTo(-hw, BOTTOM_Y, -hw, BOTTOM_Y + rBot)
  s.closePath()
  return s
}

function buildBodyGeometry() {
  const g = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: BODY_D,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.10,
    bevelSegments: 5,
    curveSegments: 36,
  })
  g.translate(0, 0, -BODY_D / 2)
  // Post-proceso de confección: taper superior, frente convexo, espalda curva.
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = THREE.MathUtils.clamp((v.y - BOTTOM_Y) / BODY_H, 0, 1)
    const xn = THREE.MathUtils.clamp(v.x / (BODY_W / 2), -1, 1)
    v.x *= 1 - 0.10 * THREE.MathUtils.smoothstep(t, 0.35, 1.0)
    if (v.z > 0) {
      v.z += 0.05 * (1 - xn * xn) * Math.sin(Math.PI * t)
    } else {
      v.z += 0.06 * (1 - xn * xn)
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

// ---------- Bolsillo frontal: 86% del ancho, integrado con volumen ----------
const POCKET_W = 2.10
const POCKET_H = 0.97
const POCKET_Y = -0.75
const POCKET_D = 0.22
const POCKET_CZ = FRONT_Z - 0.01
const POCKET_TOP_Z = POCKET_CZ + POCKET_D / 2
const POCKET_ZIP_Y = POCKET_Y + POCKET_H / 2 - 0.04

// ---------- Cierre principal: nace abajo-izquierda, sube por el borde,
// ---------- corona la curva superior y termina arriba centro-derecha ----------
function mainZipperPoints() {
  return [
    new THREE.Vector3(-1.18, -1.30, 0.34),
    new THREE.Vector3(-1.08, -1.05, 0.52),
    new THREE.Vector3(-1.02, -0.50, 0.55),
    new THREE.Vector3(-1.00, 0.20, 0.57),
    new THREE.Vector3(-0.92, 0.90, 0.58),
    new THREE.Vector3(-0.62, 1.35, 0.58),
    new THREE.Vector3(-0.15, 1.58, 0.56),
    new THREE.Vector3(0.30, 1.58, 0.52),
  ]
}
const MAIN_ZIP_PTS = mainZipperPoints()
const MAIN_ZIP_CURVE = new THREE.CatmullRomCurve3(MAIN_ZIP_PTS)
const MAIN_TAPE_GEOM = new THREE.TubeGeometry(MAIN_ZIP_CURVE, 64, 0.042, 10, false)
const MAIN_TEETH_GEOM = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(MAIN_ZIP_PTS.map((p) => new THREE.Vector3(p.x - 0.012, p.y, p.z + 0.045))),
  64, 0.02, 8, false
)
const MAIN_ZIP_END = MAIN_ZIP_PTS[MAIN_ZIP_PTS.length - 1]

// ---------- Cierre horizontal del bolsillo (recto, con tirador de cordón) ----------
const POCKET_ZIP_X0 = -0.92
const POCKET_ZIP_X1 = 0.92
function pocketZipPoints() {
  const pts = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    pts.push(new THREE.Vector3(
      POCKET_ZIP_X0 + (POCKET_ZIP_X1 - POCKET_ZIP_X0) * t,
      POCKET_ZIP_Y,
      POCKET_TOP_Z + 0.005
    ))
  }
  return pts
}
const POCKET_ZIP_CURVE = new THREE.CatmullRomCurve3(pocketZipPoints())
const POCKET_TAPE_GEOM = new THREE.TubeGeometry(POCKET_ZIP_CURVE, 24, 0.04, 10, false)
const POCKET_TEETH_GEOM = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(pocketZipPoints().map((p) => new THREE.Vector3(p.x, p.y, p.z + 0.042))),
  24, 0.018, 8, false
)
// Tirador a ~52% del ancho, colgando hacia abajo
const POCKET_SLIDER_X = POCKET_ZIP_X0 + (POCKET_ZIP_X1 - POCKET_ZIP_X0) * 0.52

// ---------- Bolsillo lateral izquierdo: funda vertical abierta, elástica ----------
const SIDE_X = -1.18
const SIDE_Y = -0.95
const SIDE_R_TOP = 0.30
const SIDE_R_BOT = 0.26
const SIDE_H = 0.75

// ---------- Tirantes: curvas acolchadas independientes ----------
function strapCurve(sx) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(sx * 0.55, TOP_Y - 0.15, BACK_Z + 0.05),
    new THREE.Vector3(sx * 0.66, 0.80, BACK_Z - 0.18),
    new THREE.Vector3(sx * 0.64, -0.20, BACK_Z - 0.26),
    new THREE.Vector3(sx * 0.58, -1.20, BACK_Z - 0.12),
    new THREE.Vector3(sx * 0.55, -1.45, BACK_Z + 0.0),
  ])
}
const STRAP_GEOMS = [strapCurve(1), strapCurve(-1)].map(
  (c) => new THREE.TubeGeometry(c, 40, 0.12, 12, false)
)

// ---------- Asa superior: arco de tira doblada ----------
const HANDLE_GEOM = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(
    Array.from({ length: 17 }, (_, i) => {
      const a = Math.PI + (i / 16) * Math.PI
      return new THREE.Vector3(Math.cos(a) * 0.22, TOP_Y + 0.0 + (-Math.sin(a)) * 0.22, 0)
    })
  ),
  24, 0.05, 10, false
)

function Backpack({ mats }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Cuerpo principal */}
      <mesh name="cuerpo-principal" geometry={BODY_GEOM} material={mats.body} castShadow receiveShadow />

      {/* Panel trasero independiente */}
      <RoundedBox name="panel-trasero" args={[2.10, 2.90, 0.12]} radius={0.06} smoothness={4} material={mats.bodyDark} position={[0, 0, BACK_Z]} receiveShadow />

      {/* Bolsillo frontal integrado */}
      <RoundedBox name="bolsillo-frontal" args={[POCKET_W, POCKET_H, POCKET_D]} radius={0.10} smoothness={5} material={mats.pocket} position={[0, POCKET_Y, POCKET_CZ]} castShadow receiveShadow />
      {/* Cierre del bolsillo: cinta + dientes */}
      <mesh name="cierre-frontal-cinta" geometry={POCKET_TAPE_GEOM} material={mats.tape} />
      <mesh name="cierre-frontal-dientes" geometry={POCKET_TEETH_GEOM} material={mats.zipper} />
      {/* Cursor + tirador de cordón del bolsillo */}
      <mesh name="tirador-bolsillo-cursor" position={[POCKET_SLIDER_X, POCKET_ZIP_Y + 0.01, POCKET_TOP_Z + 0.05]} material={mats.zip}>
        <boxGeometry args={[0.11, 0.07, 0.06]} />
      </mesh>
      <group name="tirador-bolsillo-lazo" position={[POCKET_SLIDER_X, POCKET_ZIP_Y - 0.03, POCKET_TOP_Z + 0.05]} rotation={[0.15, 0, 0.1]}>
        <mesh position={[0, -0.02, 0]} material={mats.zip}>
          <boxGeometry args={[0.03, 0.05, 0.02]} />
        </mesh>
        <mesh position={[0, -0.10, 0.005]} material={mats.zip}>
          <torusGeometry args={[0.05, 0.016, 8, 20]} />
        </mesh>
      </group>

      {/* Cierre principal: cinta + dientes con volumen */}
      <mesh name="cierre-principal-cinta" geometry={MAIN_TAPE_GEOM} material={mats.tape} />
      <mesh name="cierre-principal-dientes" geometry={MAIN_TEETH_GEOM} material={mats.zipper} />
      {/* Costuras que flanquean el cierre principal */}
      <SeamTube curve={SEAM_L_CURVE} />
      <SeamTube curve={SEAM_R_CURVE} />
      {/* Cursor + tirador al final del recorrido */}
      <mesh name="tirador-principal-cursor" position={[MAIN_ZIP_END.x, MAIN_ZIP_END.y + 0.02, MAIN_ZIP_END.z + 0.05]} rotation={[0, 0, -0.5]} material={mats.zip}>
        <boxGeometry args={[0.13, 0.08, 0.07]} />
      </mesh>
      <group name="tirador-principal-lazo" position={[MAIN_ZIP_END.x + 0.03, MAIN_ZIP_END.y - 0.06, MAIN_ZIP_END.z + 0.05]} rotation={[0.2, 0, -0.15]}>
        <mesh position={[0, -0.02, 0]} material={mats.zip}>
          <boxGeometry args={[0.03, 0.05, 0.02]} />
        </mesh>
        <mesh position={[0, -0.10, 0.005]} material={mats.zip}>
          <torusGeometry args={[0.05, 0.016, 8, 20]} />
        </mesh>
      </group>

      {/* Bolsillo lateral izquierdo (funda abierta) */}
      <mesh name="bolsillo-lateral" position={[SIDE_X, SIDE_Y, 0.05]} material={mats.pocketSide} castShadow>
        <cylinderGeometry args={[SIDE_R_TOP, SIDE_R_BOT, SIDE_H, 24, 1, true, Math.PI, Math.PI]} />
      </mesh>
      {/* Aro elástico fruncido superior */}
      <mesh name="bolsillo-lateral-elastico" position={[SIDE_X, SIDE_Y + SIDE_H / 2, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={mats.dark}>
        <torusGeometry args={[SIDE_R_TOP, 0.055, 10, 28]} />
      </mesh>

      {/* Tirantes acolchados */}
      {STRAP_GEOMS.map((g, i) => (
        <mesh key={i} name={i === 0 ? 'correa-derecha' : 'correa-izquierda'} geometry={g} material={mats.strap} scale={[1, 1, 0.62]} castShadow />
      ))}
      {/* Parches de unión de tirantes */}
      {[1, -1].map((sx) => (
        <group key={sx} name={sx === 1 ? 'union-correa-derecha' : 'union-correa-izquierda'}>
          <mesh position={[sx * 0.55, TOP_Y - 0.18, BACK_Z + 0.02]} material={mats.bodyDark}>
            <boxGeometry args={[0.30, 0.24, 0.07]} />
          </mesh>
          <mesh position={[sx * 0.55, -1.42, BACK_Z + 0.02]} material={mats.bodyDark}>
            <boxGeometry args={[0.30, 0.22, 0.07]} />
          </mesh>
        </group>
      ))}

      {/* Asa superior */}
      <mesh name="asa-superior" geometry={HANDLE_GEOM} material={mats.strap} scale={[1, 1, 0.7]} castShadow />

      {/* Costuras de construcción: unión frente/lateral */}
      <Stitch length={BODY_H - 0.7} pos={[-1.02, 0, FRONT_Z + 0.006]} />
      <Stitch length={BODY_H - 0.7} pos={[1.02, 0, FRONT_Z + 0.006]} />
      {/* Costuras del bolsillo: laterales + inferior + sobre el cierre */}
      <Stitch length={POCKET_H - 0.12} pos={[-POCKET_W / 2 + 0.07, POCKET_Y, POCKET_TOP_Z + 0.006]} />
      <Stitch length={POCKET_H - 0.12} pos={[POCKET_W / 2 - 0.07, POCKET_Y, POCKET_TOP_Z + 0.006]} />
      <Stitch length={POCKET_W - 0.2} pos={[0, POCKET_Y - POCKET_H / 2 + 0.05, POCKET_TOP_Z + 0.006]} />
      <Stitch length={POCKET_W - 0.3} pos={[0, POCKET_ZIP_Y + 0.10, POCKET_TOP_Z + 0.006]} />
      {/* Costuras de la base del asa */}
      <Stitch length={0.18} pos={[-0.22, TOP_Y + 0.015, 0.12]} rot={[-Math.PI / 2, 0, 0]} />
      <Stitch length={0.18} pos={[0.22, TOP_Y + 0.015, 0.12]} rot={[-Math.PI / 2, 0, 0]} />
    </group>
  )
}

// ---------- Materiales: cuerpo en tela elegida, negros siempre en detalles ----------
function makeMats(colorTela) {
  const color = colorTela || '#22345C'
  const body = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.02,
    envMapIntensity: 0.4,
  })
  const pocket = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.92),
    roughness: 0.8,
    metalness: 0.02,
    envMapIntensity: 0.4,
  })
  const bodyDark = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.72), roughness: 0.82, metalness: 0.02, envMapIntensity: 0.35 })
  const pocketSide = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.85),
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.35,
  })
  const tape = new THREE.MeshStandardMaterial({ color: '#1A2340', roughness: 0.8, metalness: 0.0, envMapIntensity: 0.3 })
  const strap = new THREE.MeshStandardMaterial({ color: '#0B0B0D', roughness: 0.8, metalness: 0, envMapIntensity: 0.3 })
  const zipper = new THREE.MeshStandardMaterial({ color: '#0A0A0C', roughness: 0.35, metalness: 0.6, envMapIntensity: 0.8 })
  const zip = new THREE.MeshStandardMaterial({ color: '#0B0B0D', roughness: 0.5, metalness: 0.25, envMapIntensity: 0.4 })
  const dark = strap
  return { body, pocket, bodyDark, pocketSide, tape, strap, dark, zip, zipper }
}

// ---------- Costuras (hilo claro sobre marino, canvas compartido) ----------
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
// Sigue la curva del cierre a ±offset, en el plano de la superficie.
function seamCurve(offset) {
  const pts = []
  const Z = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= 48; i++) {
    const t = i / 48
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
    const g = new THREE.TubeGeometry(curve, 64, 0.016, 6, false)
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
  centro: { pos: [0, 0.45, FRONT_Z + 0.02], hit: [1.5, 0.85], pct: 30 },
  bolsillo: { pos: [0, POCKET_Y, POCKET_TOP_Z + 0.02], hit: [1.9, 0.8], pct: 42 },
  tapa: { pos: [0, 1.25, FRONT_Z + 0.02], hit: [1.3, 0.45], pct: 16 },
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
        <Backpack mats={mats} />
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
