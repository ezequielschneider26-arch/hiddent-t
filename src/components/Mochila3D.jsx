import { Suspense, useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import * as THREE from 'three'

// ---------- Modelo 3D real (GLB exportado de Blender) ----------
const GLB_URL = '/modelos/mochila.glb'

// Escala del GLB para que la mochila ocupe ~3.4 de alto en la escena
const GLB_SCALE = 0.0341

// Medidas resultantes tras centrar y escalar (unidades de escena)
const MODEL_W = 3.17
const MODEL_H = 3.4
const MODEL_FRONT_Z = -1.9

const _center = new THREE.Vector3()
const _size = new THREE.Vector3()

// Tinte simple: los colores elegidos multiplican la textura baked.
// Para negro/blanco mostramos la textura original (ya es el color real del producto).
function tintColor(colorTela) {
  if (!colorTela || colorTela === '#1A1A1A' || colorTela === '#F5F5F5') return '#ffffff'
  return colorTela
}

function buildModel(scene, colorTela) {
  const model = scene.clone(true)
  const tint = tintColor(colorTela)
  model.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material.map((m) => m.clone()) : [obj.material.clone()]
    obj.material = mats
    mats.forEach((m) => { m.color.set(tint) })
  })
  model.scale.setScalar(GLB_SCALE)
  model.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(model)
  box.getCenter(_center)
  model.position.sub(_center)
  model.updateMatrixWorld(true)
  return model
}

useGLTF.preload(GLB_URL)

function Mochila({ colorTela }) {
  const { scene } = useGLTF(GLB_URL)
  const model = useMemo(() => buildModel(scene, colorTela), [scene, colorTela])
  return <primitive object={model} />
}

// ---------- Zonas de bordado (frente del modelo) ----------
const ZONE_DEF = {
  centro: { pos: [0, 0.35, MODEL_FRONT_Z + 0.02], hit: [1.35, 0.85], pct: 26 },
  bolsillo: { pos: [0, -1.0, MODEL_FRONT_Z + 0.02], hit: [1.25, 0.85], pct: 24 },
  tapa: { pos: [0, 1.42, MODEL_FRONT_Z + 0.02], hit: [1.35, 0.5], pct: 22 },
}
const ZONES = [
  { id: 'centro', ...ZONE_DEF.centro },
  { id: 'bolsillo', ...ZONE_DEF.bolsillo },
  { id: 'tapa', ...ZONE_DEF.tapa },
]

function setCursor(cur) {
  document.body.style.cursor = cur
}

function ZoneHits({ imagen, zonaActiva, zonasyMarca, onZoneClick, applied }) {
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
    width = (tamano / 100) * 2.6
    x = (posX / 100 - 0.5) * MODEL_W * 0.9
    y = MODEL_H / 2 - (posY / 100) * MODEL_H
    z = MODEL_FRONT_Z + 0.02
  } else {
    const zone = ZONE_DEF[zonaActiva]
    width = (zone.pct / 100) * MODEL_W * 0.5 * (tamano / 40)
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
  const { colorTela, telaSeleccionada: _telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
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

  return (
    <div className="mochila3d">
      <Canvas
        camera={{ position: [0, 0.15, 7.6], fov: 36 }}
        dpr={[1, 2]}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        onCreated={({ gl, scene }) => {
          const pmrem = new THREE.PMREMGenerator(gl)
          const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
          scene.environment = env
          pmrem.dispose()
          if (onExportRef) onExportRef.current = () => gl.domElement.toDataURL('image/png')
        }}
      >
        <color attach="background" args={['#e5e5e8']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 6, 4]} intensity={1.35} />
        <directionalLight position={[-4, 2, -3]} intensity={0.55} />
        <Suspense fallback={null}>
          <Mochila colorTela={colorTela} />
          <ZoneHits imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
          <Design imagen={imagen} imgInfo={imgInfo} zonaActiva={zonaActiva} modoLibre={modoLibre} tamano={tamano} rotacion={rotacion} posX={posX} posY={posY} applied={applied} />
        </Suspense>
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.5} maxDistance={11} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}