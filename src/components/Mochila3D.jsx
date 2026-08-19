import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const BODY_W = 3.0
const BODY_H = 3.35
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2

function roundedRectShape(w, h, r) {
  const x0 = -w / 2
  const x1 = w / 2
  const y0 = -h / 2
  const y1 = h / 2
  const s = new THREE.Shape()
  s.moveTo(x0, y0 + r)
  s.lineTo(x0, y1 - r)
  s.quadraticCurveTo(x0, y1, x0 + r, y1)
  s.lineTo(x1 - r, y1)
  s.quadraticCurveTo(x1, y1, x1, y1 - r)
  s.lineTo(x1, y0 + r)
  s.quadraticCurveTo(x1, y0, x1 - r, y0)
  s.lineTo(x0 + r, y0)
  s.quadraticCurveTo(x0, y0, x0, y0 + r)
  s.closePath()
  return s
}

function bodyShape() {
  const wT = BODY_W
  const wB = 2.6
  const xT0 = -wT / 2
  const xT1 = wT / 2
  const xB0 = -wB / 2
  const xB1 = wB / 2
  const rT = 0.55
  const rB = 0.3
  const s = new THREE.Shape()
  s.moveTo(xB0, BOTTOM_Y + rB)
  s.lineTo(xT0, TOP_Y - rT)
  s.quadraticCurveTo(xT0, TOP_Y, xT0 + rT, TOP_Y)
  s.lineTo(xT1 - rT, TOP_Y)
  s.quadraticCurveTo(xT1, TOP_Y, xT1, TOP_Y - rT)
  s.lineTo(xB1, BOTTOM_Y + rB)
  s.quadraticCurveTo(xB1, BOTTOM_Y, xB1 - rB, BOTTOM_Y)
  s.lineTo(xB0 + rB, BOTTOM_Y)
  s.quadraticCurveTo(xB0, BOTTOM_Y, xB0, BOTTOM_Y + rB)
  s.closePath()
  return s
}

function extruded(shape, depth, opts) {
  const o = opts || {}
  const bevelT = o.bevelT || 0.12
  const bevelS = o.bevelS || 0.08
  const bevelSeg = o.bevelSeg || 4
  const curveSeg = o.curveSeg || 24
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevelT,
    bevelSize: bevelS,
    bevelSegments: bevelSeg,
    curveSegments: curveSeg,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

const BODY_GEOM = extruded(bodyShape(), 1.0, { bevelT: 0.14, bevelS: 0.11, bevelSeg: 6, curveSeg: 32 })
const POCKET_GEOM = extruded(roundedRectShape(1.9, 1.1, 0.2), 0.12, { bevelT: 0.08, bevelS: 0.07, bevelSeg: 4 })
const FLAP_GEOM = extruded(roundedRectShape(2.6, 0.95, 0.26), 0.5, { bevelT: 0.09, bevelS: 0.09, bevelSeg: 5 })

const BODY_FRONT_Z = 1.0 / 2 + 0.14
const POCKET_FRONT_Z = 0.92
const FLAP_FRONT_Z = 1.14
const POCKET_Z = POCKET_FRONT_Z - (0.12 / 2 + 0.08)
const FLAP_Z = FLAP_FRONT_Z - (0.5 / 2 + 0.09)

const ZONE_DEF = {
  centro: { pos: [0, 0.35, BODY_FRONT_Z + 0.03], hit: [2.0, 1.2], pct: 35 },
  bolsillo: { pos: [0, -0.4, POCKET_FRONT_Z + 0.03], hit: [1.9, 1.1], pct: 22 },
  tapa: { pos: [0, 1.35, FLAP_FRONT_Z + 0.03], hit: [2.5, 0.9], pct: 20 },
}

const ZONES = [
  { id: 'centro', ...ZONE_DEF.centro },
  { id: 'bolsillo', ...ZONE_DEF.bolsillo },
  { id: 'tapa', ...ZONE_DEF.tapa },
]

function makeBumpTexture(textureId) {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const x = c.getContext('2d')
  x.fillStyle = '#7f7f7f'
  x.fillRect(0, 0, 128, 128)
  if (textureId !== 'ft-glossy') {
    x.strokeStyle = 'rgba(255,255,255,0.12)'
    for (let y = 0; y <= 128; y += 4) { x.beginPath(); x.moveTo(0, y); x.lineTo(128, y); x.stroke() }
    x.strokeStyle = 'rgba(0,0,0,0.15)'
    for (let y = 2; y <= 128; y += 4) { x.beginPath(); x.moveTo(0, y); x.lineTo(128, y); x.stroke() }
    x.strokeStyle = 'rgba(255,255,255,0.09)'
    for (let i = 0; i <= 128; i += 5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke() }
    x.strokeStyle = 'rgba(0,0,0,0.10)'
    for (let i = 3; i <= 128; i += 5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke() }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  return t
}

function makeMats(hex, textureId) {
  const smoothish = textureId === 'ft-leather' || textureId === 'ft-glossy'
  const gloss = textureId === 'ft-glossy'
  const base = new THREE.Color(hex)
  const opt = { roughness: smoothish ? 0.32 : 0.62, metalness: gloss ? 0.12 : 0.02 }
  const body = new THREE.MeshStandardMaterial({ color: base, ...opt })
  const pocket = new THREE.MeshStandardMaterial({ color: base.clone().multiplyScalar(1.08), ...opt })
  const flap = new THREE.MeshStandardMaterial({ color: base.clone().multiplyScalar(0.94), ...opt })
  const trim = new THREE.MeshStandardMaterial({ color: base.clone().multiplyScalar(0.78), roughness: 0.68 })
  const zipper = new THREE.MeshStandardMaterial({ color: '#5b6472', roughness: 0.4, metalness: 0.7 })
  if (!gloss) {
    const bump = makeBumpTexture(textureId)
    body.bumpMap = bump
    body.bumpScale = 0.018
    pocket.bumpMap = bump
    pocket.bumpScale = 0.018
    flap.bumpMap = bump
    flap.bumpScale = 0.018
    trim.bumpMap = bump
    trim.bumpScale = 0.01
  }
  return { body, pocket, flap, trim, zipper }
}

function Backpack({ mats }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh geometry={BODY_GEOM} material={mats.body} />

      <mesh geometry={FLAP_GEOM} material={mats.flap} position={[0, 1.35, FLAP_Z]} />
      <mesh geometry={POCKET_GEOM} material={mats.pocket} position={[0, -0.4, POCKET_Z]} />

      <mesh material={mats.trim} position={[-1.05, 0, -0.74]}>
        <capsuleGeometry args={[0.1, 2.2, 6, 14]} />
      </mesh>
      <mesh material={mats.trim} position={[1.05, 0, -0.74]}>
        <capsuleGeometry args={[0.1, 2.2, 6, 14]} />
      </mesh>

      <mesh material={mats.trim} position={[0, TOP_Y + 0.14, 0]}>
        <torusGeometry args={[0.28, 0.05, 10, 28, Math.PI]} />
      </mesh>

      <RoundedBox args={[2.5, 0.045, 0.035]} radius={0.015} smoothness={4} material={mats.zipper} position={[0, 0.78, BODY_FRONT_Z + 0.02]} />
      <RoundedBox args={[0.09, 0.07, 0.05]} radius={0.02} smoothness={4} material={mats.zipper} position={[1.18, 0.74, BODY_FRONT_Z + 0.09]} />
      <RoundedBox args={[1.55, 0.04, 0.03]} radius={0.015} smoothness={4} material={mats.zipper} position={[0, 0.26, POCKET_FRONT_Z + 0.02]} />

      <RoundedBox args={[2.8, 0.09, 0.85]} radius={0.04} smoothness={4} material={mats.trim} position={[0, BOTTOM_Y - 0.02, 0.04]} />
    </group>
  )
}

function setCursor(cur) {
  document.body.style.cursor = cur
}

function ZoneHits({ imagen, zonaActiva, zonasyMarca, onZoneClick, applied }) {
  if (!imagen || applied || !onZoneClick) return null
  return ZONES.map((z) => {
    const active = zonaActiva === z.id
    const marked = zonasyMarca.indexOf(z.id) >= 0
    const col = active ? '#8B5CF6' : marked ? '#10B981' : '#d7dbe2'
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
    x = (posX / 100 - 0.5) * BODY_W * 0.9
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

  const mats = useMemo(() => makeMats(colorTela, telaSeleccionada), [colorTela, telaSeleccionada])

  return (
    <div className="mochila3d">
      <Canvas
        camera={{ position: [4.6, 1.1, 5.4], fov: 38 }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#e9e9ec']} />
        <ambientLight intensity={0.6} />
        <hemisphereLight args={['#ffffff', '#3a3a3a', 0.5]} />
        <directionalLight position={[5, 6, 5]} intensity={1.2} />
        <directionalLight position={[-5, 3, -4]} intensity={0.6} />
        <Backpack mats={mats} />
        <ZoneHits imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
        <Design imagen={imagen} imgInfo={imgInfo} zonaActiva={zonaActiva} modoLibre={modoLibre} tamano={tamano} rotacion={rotacion} posX={posX} posY={posY} applied={applied} />
        <ContactShadows position={[0, BOTTOM_Y - 0.12, 0]} opacity={0.45} scale={9} blur={2.6} far={4} color="#000000" />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={3.4} maxDistance={9.5} minPolarAngle={0.15} maxPolarAngle={Math.PI - 0.15} target={[0, 0.1, 0]} />
      </Canvas>
    </div>
  )
}