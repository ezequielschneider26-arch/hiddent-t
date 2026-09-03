import { useEffect, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function makeMugGeometry() {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.92, 0.0),
    new THREE.Vector2(0.94, 0.05),
    new THREE.Vector2(0.90, 0.1),
    new THREE.Vector2(0.88, 0.15),
    new THREE.Vector2(0.86, 0.25),
    new THREE.Vector2(0.85, 0.5),
    new THREE.Vector2(0.85, 1.4),
    new THREE.Vector2(0.86, 1.6),
    new THREE.Vector2(0.90, 1.75),
    new THREE.Vector2(0.94, 1.8),
    new THREE.Vector2(0.96, 1.85),
    new THREE.Vector2(0.95, 1.9),
    new THREE.Vector2(0.90, 1.92),
    new THREE.Vector2(0.86, 1.9),
    new THREE.Vector2(0.80, 1.88),
  ]
  return new THREE.LatheGeometry(pts, 48)
}

const MUG_GEOMETRY = makeMugGeometry()

function makeHandleGeometry() {
  const pts = []
  const rBody = 0.9
  const rArc = 0.52
  const yMid = 1.05
  const steps = 32
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI
    const y = yMid - rArc * Math.cos(a)
    const z = rBody + rArc * Math.sin(a)
    pts.push(new THREE.Vector3(0, y, z))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.09, 16, false)
}
const HANDLE_GEOMETRY = makeHandleGeometry()

const WHITE = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.16, metalness: 0.0, envMapIntensity: 0.5 })
const INNER = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.12, metalness: 0.0, envMapIntensity: 0.5, side: THREE.DoubleSide })

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

// Zone de impresion realista: sin llegar al fondo de la taza ni al borde superior.
// La imagen se ve completa y sin deformar (contain), centrada dentro de esa zona.
// Area: 90% de la vuelta x zona vertical de 12% a 72% de la lamina (~3.75:1).
function drawWrapOnto(blank, imagen) {
  const { ctx, W, H } = blank
  const iw = imagen.naturalWidth || imagen.width
  const ih = imagen.naturalHeight || imagen.height
  if (!iw || !ih) return

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  const maxW = W * 0.9
  const maxTop = H * 0.12
  const maxBot = H * 0.72
  const maxAH = maxBot - maxTop

  const s = Math.min(maxW / iw, maxAH / ih)
  const w = iw * s
  const h = ih * s
  const dx = W / 2 - w / 2
  const dy = (maxTop + maxBot) / 2 - h / 2
  ctx.drawImage(imagen, dx, dy, w, h)
}

function Mug({ imagen }) {
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
      <mesh geometry={MUG_GEOMETRY}>
        <meshStandardMaterial map={tex} color="#ffffff" roughness={0.16} metalness={0.0} envMapIntensity={0.5} />
      </mesh>
      <mesh geometry={MUG_GEOMETRY} scale={[0.97, 1.0, 0.97]}>
        <primitive object={INNER} attach="material" />
      </mesh>
      <mesh geometry={HANDLE_GEOMETRY}>
        <primitive object={WHITE} attach="material" />
      </mesh>
    </group>
  )
}

export default function Taza3D({ imagen, onExportRef }) {
  return (
    <div className="taza3d">
      <Canvas
        camera={{ position: [4.2, 1.4, 4.2], fov: 42 }}
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
        <Mug imagen={imagen} />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.1} minDistance={3} maxDistance={9} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0.95, 0]} />
      </Canvas>
    </div>
  )
}