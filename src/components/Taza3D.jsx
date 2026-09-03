import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

// Perfil de la taza (mitad externa, desde el fondo hasta el borde)
// coordenadas: [x (radio desde el eje), y (altura desde la base)]
function mugProfile() {
  return [
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
}

const MUG_GEOMETRY = new THREE.LatheGeometry(mugProfile(), 64)

// asa: arco vertical en el plano YZ que sobresale en +Z y toca el cuerpo en sus extremos
// (en el JSX se rota 90deg para que sobresalga en +X, alineado con la costura del wrap)
function makeHandleGeometry() {
  const pts = []
  const rBody = 0.9
  const rArc = 0.52
  const yMid = 1.05
  const steps = 32
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI
    // extremos tocan el cuerpo (z = rBody) en y baja/alta, el medio sobresale en +Z
    const y = yMid - rArc * Math.cos(a)
    const z = rBody + rArc * Math.sin(a)
    pts.push(new THREE.Vector3(0, y, z))
  }
  const path = new THREE.CatmullRomCurve3(pts)
  return new THREE.TubeGeometry(path, 48, 0.09, 16, false)
}
const HANDLE_GEOMETRY = makeHandleGeometry()

function makeMugMaterials() {
  const white = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.16,
    metalness: 0.0,
    envMapIntensity: 0.6,
  })
  const inner = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.12,
    metalness: 0.0,
    envMapIntensity: 0.6,
    side: THREE.DoubleSide,
  })
  const handleMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.16,
    metalness: 0.0,
    envMapIntensity: 0.6,
  })
  return { mug: white, inner, handle: handleMat }
}

// textura de sublimacion full-wrap: la imagen envuelve toda la vuelta exterior
// y deja un hueco blanco (gap) en la zona donde va la manija (la costura +X).
// El canvas representa la "lamina envolvente": al aplicarse como textura del
// Lathe de 360deg, el borde izquierdo y derecho del canvas se encuentran en +X,
// que es justamente donde esta la manija. Por eso el gap queda blanco.
function makePrintedMaterial(imagen, onReady) {
  const W = 1200
  const H = 480
  const gapFrac = 0.09
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  const finish = () => {
    if (onReady) onReady()
  }

  if (imagen) {
    const img = new Image()
    img.onload = () => {
      const iw = img.naturalWidth || img.width
      const ih = img.naturalHeight || img.height
      const x0 = (gapFrac / 2) * W
      const x1 = W - (gapFrac / 2) * W
      const bw = x1 - x0
      // "cover": la imagen llena la banda imprimible sin deformar (recorta)
      const scale = Math.max(bw / iw, H / ih)
      const w = iw * scale
      const h = ih * scale
      const dx = x0 + (bw - w) / 2
      const dy = (H - h) / 2
      ctx.drawImage(img, dx, dy, w, h)
      finish()
    }
    img.onerror = finish
    img.src = imagen
  } else {
    finish()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.16,
    metalness: 0.0,
    envMapIntensity: 0.6,
  })
}

function Mug({ printed }) {
  const mats = useMemo(() => makeMugMaterials(), [])
  return (
    <group>
      {/* cuerpo exterior */}
      <mesh geometry={MUG_GEOMETRY} material={printed || mats.mug} />
      {/* interior con el liquido/espacio oscuro */}
      <mesh geometry={MUG_GEOMETRY} material={mats.inner} scale={[0.97, 1.0, 0.97]} />
      {/* asa */}
      <mesh
        geometry={HANDLE_GEOMETRY}
        material={mats.handle}
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  )
}

export default function Taza3D({ imagen, onExportRef }) {
  const [printed, setPrinted] = useState(() => makePrintedMaterial(imagen))
  const [, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    const mat = makePrintedMaterial(imagen, () => {
      if (alive) {
        mat.map.needsUpdate = true
        setPrinted(mat)
        setTick((t) => t + 1)
      }
    })
    setPrinted(mat)
    return () => {
      alive = false
      if (mat.map) mat.map.dispose()
    }
  }, [imagen])

  return (
    <div className="taza3d">
      <Canvas
        camera={{ position: [4.2, 1.4, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        onCreated={({ gl }) => {
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#e5e5e8']} />
        <ambientLight intensity={0.4} />
        <hemisphereLight args={['#ffffff', '#3a3a3a', 0.3]} />
        <directionalLight position={[5, 6, 4]} intensity={1.1} />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3.2} position={[0, 3, 5]} scale={[4, 2.4]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.8} position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[3, 2]} color="#cdd2da" />
          <Lightformer form="rect" intensity={1.8} position={[4, 1, 2]} rotation-y={-Math.PI / 2} scale={[3, 2]} color="#cdd2da" />
        </Environment>
        <Mug printed={printed} />
        <ContactShadows position={[0, -0.02, 0]} opacity={0.4} scale={6} blur={2.4} far={3.5} color="#000000" />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={3} maxDistance={9} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0.95, 0]} />
      </Canvas>
    </div>
  )
}
