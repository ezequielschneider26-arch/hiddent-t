import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const BODY_W = 2.6
const BODY_H = 3.4
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2

function pocketShape() {
  const x0 = -POCKET_W / 2
  const x1 = POCKET_W / 2
  const y0 = -POCKET_H / 2
  const y1 = POCKET_H / 2
  const rT = 0.3
  const rB = 0.14
  const s = new THREE.Shape()
  s.moveTo(x0, y0 + rB)
  s.lineTo(x0, y1 - rT)
  s.quadraticCurveTo(x0, y1, x0 + rT, y1)
  s.lineTo(x1 - rT, y1)
  s.quadraticCurveTo(x1, y1, x1, y1 - rT)
  s.lineTo(x1, y0 + rB)
  s.quadraticCurveTo(x1, y0, x1 - rB, y0)
  s.lineTo(x0 + rB, y0)
  s.quadraticCurveTo(x0, y0, x0, y0 + rB)
  s.closePath()
  return s
}

function bodyShape() {
  const w = 2.6
  const x0 = -w / 2
  const x1 = w / 2
  const rB = 0.4
  const shY = TOP_Y - 0.3
  const arcH = 0.55
  const s = new THREE.Shape()
  s.moveTo(x0, BOTTOM_Y + rB)
  s.lineTo(x0, shY)
  s.quadraticCurveTo(0, TOP_Y + arcH, x1, shY)
  s.lineTo(x1, BOTTOM_Y + rB)
  s.quadraticCurveTo(x1, BOTTOM_Y, x1 - rB, BOTTOM_Y)
  s.lineTo(x0 + rB, BOTTOM_Y)
  s.quadraticCurveTo(x0, BOTTOM_Y, x0, BOTTOM_Y + rB)
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

const BODY_GEOM = extruded(bodyShape(), 1.0, { bevelT: 0.14, bevelS: 0.12, bevelSeg: 5, curveSeg: 32 })

const POCKET_W = 2.15
const POCKET_H = 1.45
const POCKET_Y = -0.86
const POCKET_TOP_Y = POCKET_Y + POCKET_H / 2
const POCKET_GEOM = extruded(pocketShape(), 0.1, { bevelT: 0.06, bevelS: 0.05, bevelSeg: 4 })

const BODY_FRONT_Z = 1.0 / 2 + 0.12
const POCKET_FRONT_Z = 0.8
const POCKET_Z = POCKET_FRONT_Z - (0.1 / 2 + 0.07)

const ZIPPER_Y = POCKET_TOP_Y - 0.1

const ZONE_DEF = {
  centro: { pos: [0, 0.15, BODY_FRONT_Z + 0.03], hit: [1.9, 1.05], pct: 32 },
  bolsillo: { pos: [0, POCKET_Y, POCKET_FRONT_Z + 0.03], hit: [1.85, 1.3], pct: 38 },
  tapa: { pos: [0, 1.3, BODY_FRONT_Z + 0.03], hit: [1.9, 0.6], pct: 22 },
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

function makeFabricTexture(hex, textureId) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const x = c.getContext('2d')
  const base = new THREE.Color(hex)
  x.fillStyle = '#' + base.getHexString()
  x.fillRect(0, 0, 256, 256)
  const weave = (step, lw, la, da) => {
    x.strokeStyle = 'rgba(255,255,255,' + la + ')'
    x.lineWidth = lw
    for (let y = step / 2; y < 256; y += step) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke() }
    x.strokeStyle = 'rgba(0,0,0,' + da + ')'
    for (let y = step / 2; y < 256; y += step) { x.beginPath(); x.moveTo(0, y + lw * 2); x.lineTo(256, y + lw * 2); x.stroke() }
    x.strokeStyle = 'rgba(255,255,255,' + la * 0.7 + ')'
    for (let X = step / 2; X < 256; X += step) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, 256); x.stroke() }
    x.strokeStyle = 'rgba(0,0,0,' + da * 0.8 + ')'
    for (let X = step / 2; X < 256; X += step) { x.beginPath(); x.moveTo(X + lw * 2, 0); x.lineTo(X + lw * 2, 256); x.stroke() }
    x.lineWidth = 1
  }
  const diagonal = (step, off, da) => {
    x.strokeStyle = 'rgba(0,0,0,' + da + ')'
    for (let y = -256; y < 512; y += step) { x.beginPath(); x.moveTo(0, y + off); x.lineTo(256, y + off + step); x.stroke() }
  }
  const speckle = (n, a, max) => {
    for (let i = 0; i < n; i++) {
      x.fillStyle = 'rgba(' + (i % 2 === 0 ? '0,0,0' : '255,255,255') + ',' + a + ')'
      const r = 0.6 + Math.random() * max
      x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2); x.fill()
    }
  }
  switch (textureId) {
    case 'ft-nylon':
      weave(8, 0.9, 0.16, 0.22)
      break
    case 'ft-poliester':
      weave(10, 1.1, 0.2, 0.18)
      break
    case 'ft-canvas':
      weave(15, 1.4, 0.24, 0.26)
      break
    case 'ft-canvas-heavy':
      weave(10, 1.6, 0.3, 0.34)
      break
    case 'ft-leather':
      speckle(420, 0.5, 3.4)
      diagonal(64, 0, 0.06)
      break
    case 'ft-mesh':
      for (let y = 8; y <= 256; y += 26) {
        for (let X = 8; X <= 256; X += 26) {
          x.fillStyle = 'rgba(0,0,0,0.55)'
          x.beginPath(); x.arc(X, y, 4.4, 0, Math.PI * 2); x.fill()
          x.fillStyle = 'rgba(255,255,255,0.22)'
          x.beginPath(); x.arc(X + 13, y + 13, 2.8, 0, Math.PI * 2); x.fill()
        }
      }
      break
    case 'ft-cotton':
      weave(7, 0.8, 0.14, 0.16)
      break
    case 'ft-denim':
      diagonal(8, 0, 0.3)
      diagonal(8, 4, 0.18)
      break
    case 'ft-ripstop':
      weave(18, 1.2, 0.16, 0.2)
      diagonal(48, 0, 0.1)
      break
    case 'ft-polar':
      speckle(800, 0.45, 4.6)
      break
    case 'ft-neoprene':
      speckle(900, 0.3, 2.2)
      break
    case 'ft-glossy':
      x.fillStyle = 'rgba(255,255,255,0.3)'
      x.beginPath(); x.moveTo(0, 0); x.lineTo(256, 0); x.lineTo(0, 256); x.closePath(); x.fill()
      x.fillStyle = 'rgba(0,0,0,0.12)'
      x.beginPath(); x.moveTo(256, 0); x.lineTo(256, 256); x.lineTo(0, 256); x.closePath(); x.fill()
      break
    default:
      weave(22, 1, 0.1, 0.12)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2.4, 2.4)
  t.anisotropy = 8
  return t
}

function makeMats(hex, textureId) {
  const smoothish = textureId === 'ft-leather' || textureId === 'ft-glossy'
  const gloss = textureId === 'ft-glossy'
  const base = new THREE.Color(hex)
  const fabric = makeFabricTexture(hex, textureId)
  const opt = { roughness: smoothish ? 0.32 : 0.62, metalness: gloss ? 0.12 : 0.02, color: '#ffffff', map: fabric }
  const body = new THREE.MeshStandardMaterial({ ...opt })
  const pocket = new THREE.MeshStandardMaterial({ ...opt })
  const trim = new THREE.MeshStandardMaterial({ color: '#9a9a9a', map: fabric, roughness: 0.68 })
  const seam = new THREE.MeshStandardMaterial({ color: '#6a6a6a', map: fabric, roughness: 0.55 })
  const net = new THREE.MeshBasicMaterial({ color: base.clone().multiplyScalar(0.55), wireframe: true, transparent: true, opacity: 0.85 })
  const zip = new THREE.MeshStandardMaterial({ color: '#0c0c0c', roughness: 0.3, metalness: 0.35 })
  const zipper = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.35, metalness: 0.4 })
  if (!gloss) {
    const bump = makeBumpTexture(textureId)
    body.bumpMap = bump
    body.bumpScale = 0.02
    pocket.bumpMap = bump
    pocket.bumpScale = 0.02
    trim.bumpMap = bump
    trim.bumpScale = 0.012
    seam.bumpMap = bump
    seam.bumpScale = 0.02
  }
  return { body, pocket, trim, seam, net, zip, zipper }
}

function Backpack({ mats }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh geometry={BODY_GEOM} material={mats.body} />

      <mesh geometry={POCKET_GEOM} material={mats.pocket} position={[0, POCKET_Y, POCKET_Z]} />

      <mesh material={mats.seam} position={[0, TOP_Y + 0.18, 0]}>
        <torusGeometry args={[0.13, 0.028, 8, 22, Math.PI]} />
      </mesh>

      <RoundedBox args={[1.95, 0.04, 0.03]} radius={0.015} smoothness={4} material={mats.zipper} position={[0, ZIPPER_Y, POCKET_FRONT_Z + 0.015]} />
      <RoundedBox args={[0.14, 0.13, 0.03]} radius={0.02} smoothness={4} material={mats.zipper} position={[0.68, ZIPPER_Y, POCKET_FRONT_Z + 0.05]} />

      <RoundedBox args={[POCKET_W, 0.022, 0.02]} radius={0.01} smoothness={4} material={mats.seam} position={[0, POCKET_TOP_Y - 0.01, POCKET_FRONT_Z + 0.006]} />
      <RoundedBox args={[POCKET_W, 0.022, 0.02]} radius={0.01} smoothness={4} material={mats.seam} position={[0, POCKET_Y - POCKET_H / 2, POCKET_FRONT_Z + 0.006]} />
      <RoundedBox args={[0.022, POCKET_H, 0.02]} radius={0.01} smoothness={4} material={mats.seam} position={[-POCKET_W / 2, POCKET_Y, POCKET_FRONT_Z + 0.006]} />
      <RoundedBox args={[0.022, POCKET_H, 0.02]} radius={0.01} smoothness={4} material={mats.seam} position={[POCKET_W / 2, POCKET_Y, POCKET_FRONT_Z + 0.006]} />

      <RoundedBox args={[0.035, 2.45, 0.03]} radius={0.012} smoothness={4} material={mats.seam} position={[-1.18, 0, BODY_FRONT_Z + 0.004]} />
      <RoundedBox args={[0.035, 2.45, 0.03]} radius={0.012} smoothness={4} material={mats.seam} position={[1.18, 0, BODY_FRONT_Z + 0.004]} />
      <RoundedBox args={[2.4, 0.035, 0.03]} radius={0.012} smoothness={4} material={mats.seam} position={[0, -1.35, BODY_FRONT_Z + 0.004]} />

      <RoundedBox args={[2.4, 0.14, 0.05]} radius={0.03} smoothness={4} material={mats.trim} position={[0, BOTTOM_Y + 0.05, 0.04]} />
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
        camera={{ position: [0, 0.15, 7.4], fov: 38 }}
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
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.5} maxDistance={11} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}