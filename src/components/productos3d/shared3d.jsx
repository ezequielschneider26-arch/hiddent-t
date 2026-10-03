import { useMemo, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ---------- Micro-relieve de tela (bump compartido, barato) ----------
function makeFabricBump() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const x = c.getContext('2d')
  x.fillStyle = '#808080'
  x.fillRect(0, 0, 128, 128)
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
export function getFabricBump() {
  if (!FABRIC_BUMP) FABRIC_BUMP = makeFabricBump()
  return FABRIC_BUMP
}

// ---------- Telas: cómo se ve cada material en 3D ----------
export const TELA_PROPS = {
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
const DEFAULT_TELA = { roughness: 0.7, metalness: 0.02, bump: 0.02 }

export function luminance(hex) {
  const c = new THREE.Color(hex)
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
}

// ---------- Materiales según color de tela + tipo de tela ----------
// Devuelve { mats, thread }. Los materiales viejos se liberan solos.
export function useFabricMats(colorTela, telaId) {
  const mats = useMemo(() => {
    const color = colorTela || '#17171a'
    const tp = (telaId && TELA_PROPS[telaId]) || DEFAULT_TELA
    const bumpMap = getFabricBump()
    const body = new THREE.MeshStandardMaterial({
      color, roughness: tp.roughness, metalness: tp.metalness,
      bumpMap, bumpScale: tp.bump, envMapIntensity: 0.5,
    })
    const darker = new THREE.Color(color).multiplyScalar(0.88)
    const bodyDark = new THREE.MeshStandardMaterial({
      color: darker, roughness: Math.min(1, tp.roughness + 0.05), metalness: tp.metalness,
      bumpMap, bumpScale: tp.bump, envMapIntensity: 0.45,
    })
    const dark = new THREE.MeshStandardMaterial({ color: '#0c0c0e', roughness: 0.8, metalness: 0, envMapIntensity: 0.3 })
    const metal = new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.3, metalness: 0.6, envMapIntensity: 0.9 })
    return { body, bodyDark, dark, metal }
  }, [colorTela, telaId])
  const prev = useRef(null)
  useEffect(() => {
    const old = prev.current
    prev.current = mats
    return () => { if (old) Object.values(old).forEach((m) => { if (m && m.dispose) m.dispose() }) }
  }, [mats])
  useEffect(() => () => {
    const cur = prev.current
    if (cur) Object.values(cur).forEach((m) => { if (m && m.dispose) m.dispose() })
  }, [])
  const thread = useMemo(() => (luminance(colorTela || '#17171a') < 0.35 ? 'light' : 'dark'), [colorTela])
  return { mats, thread }
}

// ---------- Textura del diseño subido por el usuario ----------
export function useDesignTexture(imagen) {
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
  return imgInfo
}

// ---------- Escenario 3D compartido: luces, sombra, export PNG ----------
export function Stage({ onExportRef, groundY = -2.05, distance = 7.6, target = [0, 0, 0], children }) {
  return (
    <div className="mochila3d">
      <Canvas
        shadows
        camera={{ position: [0, 0.15, distance], fov: 36 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#14141c']} />
        <fog attach="fog" args={['#14141c', 10, 22]} />
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
        {children}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={3} maxDistance={13} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={target} />
      </Canvas>
    </div>
  )
}

// ---------- Zonas clicables de bordado ----------
// zones: [{ id, pos:[x,y,z], hit:[w,h], rot:[rx,ry,rz] }]
export function ZoneHits({ zones, imagen, zonaActiva, zonasyMarca, onZoneClick, applied }) {
  useEffect(() => () => { document.body.style.cursor = 'auto' }, [])
  if (!imagen || applied || !onZoneClick) return null
  return zones.map((z) => {
    const active = zonaActiva === z.id
    const marked = (zonasyMarca || []).indexOf(z.id) >= 0
    const col = active ? '#06B6D4' : marked ? '#10B981' : '#d7dbe2'
    const op = active ? 0.55 : marked ? 0.35 : 0.18
    return (
      <group key={z.id} position={z.pos} rotation={z.rot || [0, 0, 0]}>
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

// ---------- Plano con el diseño del usuario ----------
export function DesignPlane({ imgInfo, pos, rot, width, maxH, rotZ = 0, applied }) {
  if (!imgInfo) return null
  const aspect = imgInfo.w / imgInfo.h
  let w = width
  let h = w / aspect
  if (h > maxH) {
    const s = maxH / h
    w *= s
    h = maxH
  }
  return (
    <mesh position={pos} rotation={rot || [0, 0, (rotZ * Math.PI) / 180]} raycast={() => null}>
      <planeGeometry args={[w, h]} />
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

// ---------- Costura decorativa ----------
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
export function Stitch({ length, pos, tone, rot }) {
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
    <mesh position={pos} rotation={rot || [0, 0, 0]} raycast={() => null}>
      <planeGeometry args={[length, 0.045]} />
      <meshBasicMaterial map={tex} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
}
