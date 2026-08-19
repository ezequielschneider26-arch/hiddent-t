import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const BODY_W = 3.0
const BODY_H = 3.6
const BODY_D = 1.3
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2

const ZONE_DEF = {
  centro: { pos: [0, 0.35, 0.68], hit: [2.0, 1.2], pct: 35 },
  bolsillo: { pos: [0, -0.4, 0.95], hit: [1.9, 1.1], pct: 22 },
  tapa: { pos: [0, 1.35, 1.22], hit: [2.5, 0.9], pct: 20 },
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
  const trim = new THREE.MeshStandardMaterial({ color: base.clone().multiplyScalar(0.78), roughness: 0.72 })
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
    <group position={[0, 0.0, 0]}>
      <RoundedBox args={[BODY_W, BODY_H, BODY_D]} radius={0.16} smoothness={8} material={mats.body} position={[0, 0, 0]} />
      <RoundedBox args={[0.24, BODY_H * 0.7, 0.1]} radius={0.05} smoothness={4} material={mats.trim} position={[-1.02, 0.0, -0.72]} />
      <RoundedBox args={[0.24, BODY_H * 0.7, 0.1]} radius={0.05} smoothness={4} material={mats.trim} position={[1.02, 0.0, -0.72]} />
      <RoundedBox args={[0.62, 0.07, 0.07]} radius={0.03} smoothness={4} material={mats.trim} position={[0, TOP_Y + 0.24, 0]} />
      <RoundedBox args={[0.06, 0.22, 0.06]} radius={0.02} smoothness={4} material={mats.trim} position={[-0.27, TOP_Y + 0.03, 0]} />
      <RoundedBox args={[0.06, 0.22, 0.06]} radius={0.02} smoothness={4} material={mats.trim} position={[0.27, TOP_Y + 0.03, 0]} />
      <RoundedBox args={[2.6, 1.0, 0.5]} radius={0.12} smoothness={6} material={mats.flap} position={[0, 1.35, BODY_D / 2 + 0.25]} />
      <RoundedBox args={[1.95, 1.12, 0.24]} radius={0.1} smoothness={6} material={mats.pocket} position={[0, -0.4, BODY_D / 2 + 0.12]} />
      <RoundedBox args={[2.5, 0.045, 0.035]} radius={0.015} smoothness={4} material={mats.zipper} position={[0, 0.82, BODY_D / 2 + 0.01]} />
      <RoundedBox args={[0.09, 0.07, 0.05]} radius={0.02} smoothness={4} material={mats.zipper} position={[1.18, 0.78, BODY_D / 2 + 0.06]} />
      <RoundedBox args={[1.6, 0.04, 0.03]} radius={0.015} smoothness={4} material={mats.zipper} position={[0, 0.26, BODY_D / 2 + 0.27]} />
      <RoundedBox args={[BODY_W + 0.08, 0.07, BODY_D - 0.1]} radius={0.03} smoothness={4} material={mats.trim} position={[0, BOTTOM_Y - 0.02, 0.05]} />
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
    z = 0.7
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
        <ContactShadows position={[0, BOTTOM_Y - 0.13, 0]} opacity={0.45} scale={9} blur={2.6} far={4} color="#000000" />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={3.4} maxDistance={9.5} minPolarAngle={0.15} maxPolarAngle={Math.PI - 0.15} target={[0, 0.1, 0]} />
      </Canvas>
    </div>
  )
}