import { useEffect, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// Perfil de frente: cuerpo conico mas ancho en la base, que se va cerrando hacia
// arriba hasta la punta donde va la anilla. Extremos cerrados (solida, no hueca).
function makeYerberaGeometry() {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.95, 0.15),
    new THREE.Vector2(0.98, 0.35),
    new THREE.Vector2(0.92, 0.7),
    new THREE.Vector2(0.78, 1.1),
    new THREE.Vector2(0.58, 1.55),
    new THREE.Vector2(0.36, 2.0),
    new THREE.Vector2(0.18, 2.4),
    new THREE.Vector2(0.05, 2.62),
    new THREE.Vector2(0.0, 2.7),
  ]
  return new THREE.LatheGeometry(pts, 48)
}

const YERBERA_GEOMETRY = makeYerberaGeometry()

// Anilla / mosqueton metalico en la punta superior.
function makeRingGeometry() {
  const t = new THREE.TorusGeometry(0.13, 0.035, 12, 24)
  t.rotateX(Math.PI / 2)
  return t
}
const RING_GEOMETRY = makeRingGeometry()

const RING_MAT = new THREE.MeshStandardMaterial({
  color: '#B8860B',
  roughness: 0.35,
  metalness: 0.85,
  envMapIntensity: 0.8,
})

function makeBlankWrap() {
  const W = 1200
  const H = 480
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  return { c, ctx, W, H }
}

function drawWrapPlain(blank) {
  const { ctx, W, H } = blank
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
}

// Zona de impresion sobre el cuerpo (parte abultada de la yerbera), sin llegar a
// la punta/era de la anilla ni al fondo. La imagen se ve completa y sin deformar
// (contain), envuelta 360 grados alrededor del cuerpo conico.
function drawWrapOnto(blank, imagen) {
  const { ctx, W, H } = blank
  const iw = imagen.naturalWidth || imagen.width
  const ih = imagen.naturalHeight || imagen.height
  if (!iw || !ih) return

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  const maxW = W * 0.9
  const maxTop = H * 0.18
  const maxBot = H * 0.82
  const maxAH = maxBot - maxTop

  const s = Math.min(maxW / iw, maxAH / ih)
  const w = iw * s
  const h = ih * s
  const dx = W / 2 - w / 2
  const dy = (maxTop + maxBot) / 2 - h / 2
  ctx.drawImage(imagen, dx, dy, w, h)
}

function Yerbera({ imagen }) {
  const wrap = useMemo(() => makeBlankWrap(), [])
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(wrap.c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [wrap])
  const [, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    let img = null
    if (imagen) {
      img = new Image()
      img.onload = () => {
        if (!alive) return
        drawWrapOnto(wrap, img)
        tex.needsUpdate = true
        tex.image = wrap.c
        setTick((t) => t + 1)
      }
      img.src = imagen
    } else {
      drawWrapPlain(wrap)
      tex.needsUpdate = true
      tex.image = wrap.c
      setTick((t) => t + 1)
    }
    return () => {
      alive = false
      if (img) img.src = ''
    }
  }, [imagen, wrap, tex])

  return (
    <group>
      <mesh geometry={YERBERA_GEOMETRY}>
        <meshStandardMaterial map={tex} color="#ffffff" roughness={0.16} metalness={0.0} envMapIntensity={0.5} />
      </mesh>
      <mesh geometry={RING_GEOMETRY} position={[0, 2.74, 0]} material={RING_MAT} />
    </group>
  )
}

export default function Yerbera3D({ imagen, onExportRef }) {
  return (
    <div className="taza3d">
      <Canvas
        camera={{ position: [4.6, 1.5, 4.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#e5e5e8']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 4]} intensity={1.3} />
        <directionalLight position={[-4, 2, -3]} intensity={0.5} />
        <Yerbera imagen={imagen} />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.1} minDistance={3.5} maxDistance={10} minPolarAngle={0.2} maxPolarAngle={Math.PI - 0.2} target={[0, 1.3, 0]} />
      </Canvas>
    </div>
  )
}
