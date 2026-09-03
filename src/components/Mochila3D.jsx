import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const BODY_W = 2.6
const BODY_H = 3.4
const BODY_D = 1.0
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2
const BODY_FRONT_Z = BODY_D / 2

const POCKET_W = 2.15
const POCKET_H = 1.35
const POCKET_Y = -0.7
const POCKET_D = 0.16
const POCKET_FRONT_Z = BODY_FRONT_Z + 0.05

const ZIPPER_Y = 0.6
const ZIPPER_W = 2.1
const ZIPPER_Z = BODY_FRONT_Z + 0.01

const ZONE_DEF = {
  centro: { pos: [0, 0.55, BODY_FRONT_Z + 0.02], hit: [1.7, 0.7], pct: 30 },
  bolsillo: { pos: [0, POCKET_Y, POCKET_FRONT_Z + 0.02], hit: [1.9, 1.25], pct: 40 },
  tapa: { pos: [0, 1.35, BODY_FRONT_Z + 0.02], hit: [1.7, 0.45], pct: 18 },
}

const ZONES = [
  { id: 'centro', ...ZONE_DEF.centro },
  { id: 'bolsillo', ...ZONE_DEF.bolsillo },
  { id: 'tapa', ...ZONE_DEF.tapa },
]

function makeNormalTexture(textureId) {
  const size = 256
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, size)
  const h = new Float32Array(size * size)
  const step = textureId === 'ft-canvas' || textureId === 'ft-canvas-heavy' ? 13 : 8
  const groove = textureId === 'ft-leather' ? 3 : 7
  const denim = textureId === 'ft-denim'
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0
      if (textureId === 'ft-glossy') {
        v = 0
      } else if (textureId === 'ft-leather') {
        v += (Math.random() - 0.5) * 46
      } else if (textureId === 'ft-polar' || textureId === 'ft-neoprene') {
        v += (Math.random() - 0.5) * 30
      } else {
        if (denim && ((x % step < 2) || (y % step < 2))) v += -8
        if ((x % step < 2) || (y % step < 2)) v += -groove
        v += Math.sin(x * 0.09) * 3.1 + Math.sin(y * 0.11) * 3.1
        v += (Math.random() - 0.5) * 5
      }
      h[y * size + x] = v
    }
  }
  const strength = 1.2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = h[y * size + ((x + size - 1) % size)]
      const xr = h[y * size + ((x + 1) % size)]
      const yu = h[((y + size - 1) % size) * size + x]
      const yd = h[((y + 1) % size) * size + x]
      let nx = xl - xr
      let ny = yu - yd
      let nz = 2 * strength
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz)
      nx *= inv
      ny *= inv
      nz *= inv
      const i = (y * size + x) * 4
      img.data[i] = Math.round((nx * 0.5 + 0.5) * 255)
      img.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      img.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2.4, 2.4)
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
  const opt = { roughness: smoothish ? 0.32 : 0.55, metalness: gloss ? 0.12 : 0.02, color: '#ffffff', map: fabric, envMapIntensity: 0.4 }
  const body = new THREE.MeshStandardMaterial({ ...opt })
  const pocket = new THREE.MeshStandardMaterial({ ...opt })
  const trim = new THREE.MeshStandardMaterial({ color: '#6c6c6c', map: fabric, roughness: 0.55, envMapIntensity: 0.4 })
  const seam = new THREE.MeshStandardMaterial({ color: '#4a4a4a', map: fabric, roughness: 0.5, envMapIntensity: 0.4 })
  const zip = new THREE.MeshStandardMaterial({ color: '#0c0c0c', roughness: 0.3, metalness: 0.4 })
  const zipper = new THREE.MeshStandardMaterial({ color: '#c9cdd4', roughness: 0.2, metalness: 0.95, envMapIntensity: 1.2 })
  const strap = new THREE.MeshStandardMaterial({ color: '#101114', map: fabric, roughness: 0.55, envMapIntensity: 0.35 })
  if (!gloss) {
    const normal = makeNormalTexture(textureId)
    body.normalMap = normal
    body.normalScale = new THREE.Vector2(0.9, 0.9)
    pocket.normalMap = normal
    pocket.normalScale = new THREE.Vector2(0.9, 0.9)
    trim.normalMap = normal
    trim.normalScale = new THREE.Vector2(0.5, 0.5)
    seam.normalMap = normal
    seam.normalScale = new THREE.Vector2(0.5, 0.5)
  }
  return { body, pocket, trim, seam, zip, zipper, strap }
}

function makeHandleGeometry() {
  const pts = []
  const r = 0.34
  const y = TOP_Y + 0.18
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (i / steps) * Math.PI
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, 0))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.06, 12, false)
}
const HANDLE_GEOM = makeHandleGeometry()

function Backpack({ mats }) {
  return (
    <group position={[0, 0, 0]}>
      <RoundedBox args={[BODY_W, BODY_H, BODY_D]} radius={0.45} smoothness={6} material={mats.body} />

      <RoundedBox args={[POCKET_W, POCKET_H, POCKET_D]} radius={0.24} smoothness={5} material={mats.pocket} position={[0, POCKET_Y, POCKET_FRONT_Z]} />

      {/* Cierre horizontal superior */}
      <Stitch length={ZIPPER_W} pos={[0, ZIPPER_Y, ZIPPER_Z]} />
      <mesh position={[0, ZIPPER_Y, POCKET_FRONT_Z + 0.02]}>
        <boxGeometry args={[ZIPPER_W, 0.05, 0.012]} />
        <primitive object={mats.zipper} attach="material" />
      </mesh>
      <mesh position={[0.98, ZIPPER_Y, POCKET_FRONT_Z + 0.018]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.16, 0.05, 0.02]} />
        <primitive object={mats.zip} attach="material" />
      </mesh>

      {/* Asa superior */}
      <mesh geometry={HANDLE_GEOM} material={mats.strap} />

      {/* Costuras - borde del cuerpo */}
      <Stitch length={BODY_H - 0.3} pos={[-BODY_W / 2 + 0.06, 0.1, BODY_FRONT_Z + 0.005]} />
      <Stitch length={BODY_H - 0.3} pos={[BODY_W / 2 - 0.06, 0.1, BODY_FRONT_Z + 0.005]} />
      {/* Costuras - borde del bolsillo */}
      <Stitch length={POCKET_W - 0.2} pos={[0, POCKET_Y + POCKET_H / 2 - 0.03, POCKET_FRONT_Z + 0.01]} />
      <Stitch length={POCKET_W - 0.2} pos={[0, POCKET_Y - POCKET_H / 2 + 0.03, POCKET_FRONT_Z + 0.01]} />
      <Stitch length={POCKET_H - 0.2} pos={[-POCKET_W / 2 + 0.03, POCKET_Y, POCKET_FRONT_Z + 0.01]} />
      <Stitch length={POCKET_H - 0.2} pos={[POCKET_W / 2 - 0.03, POCKET_Y, POCKET_FRONT_Z + 0.01]} />

      {/* Base (refuerzo inferior) */}
      <RoundedBox args={[BODY_W - 0.1, 0.16, BODY_D - 0.1]} radius={0.05} smoothness={4} material={mats.trim} position={[0, BOTTOM_Y + 0.08, 0]} />
    </group>
  )
}

function makeStitchTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 16
  const x = c.getContext('2d')
  x.clearRect(0, 0, 64, 16)
  for (let i = 2; i < 64; i += 8) {
    x.fillStyle = 'rgba(30,32,36,0.6)'
    x.fillRect(i, 1, 5, 14)
    x.fillStyle = 'rgba(255,255,255,0.22)'
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
    t.repeat.set(Math.max(1, Math.round(length / 0.3)), 1)
    return t
  }, [length])
  return (
    <mesh position={pos} raycast={() => null}>
      <planeGeometry args={[length, 0.05]} />
      <meshBasicMaterial map={tex} transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
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
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#e5e5e8']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 4]} intensity={1.3} />
        <directionalLight position={[-4, 2, -3]} intensity={0.5} />
        <Backpack mats={mats} />
        <ZoneHits imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
        <Design imagen={imagen} imgInfo={imgInfo} zonaActiva={zonaActiva} modoLibre={modoLibre} tamano={tamano} rotacion={rotacion} posX={posX} posY={posY} applied={applied} />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.5} maxDistance={11} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}
