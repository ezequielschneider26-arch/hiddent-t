import { Suspense, useCallback, useMemo, useState, useEffect, Component } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Html } from '@react-three/drei'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import * as THREE from 'three'

// ---------- Modelo 3D real (GLB exportado de Blender) ----------
const GLB_URL = '/modelos/mochila.glb'

// Alto deseado de la mochila en unidades de escena
const MODEL_TARGET_H = 3.4

const _center = new THREE.Vector3()
const _box = new THREE.Box3()

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

  model.updateMatrixWorld(true)
  const size = _box.setFromObject(model).getSize(new THREE.Vector3())
  model.scale.setScalar(MODEL_TARGET_H / size.y)
  model.position.set(0, 0, 0)
  model.updateMatrixWorld(true)
  const box = _box.setFromObject(model)
  box.getCenter(_center)
  model.position.sub(_center)
  model.updateMatrixWorld(true)
  return model
}

function medidaModelo(model) {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  return { w: size.x, h: size.y, d: size.z, frontZ: box.max.z }
}

useGLTF.preload(GLB_URL)

function Mochila({ colorTela, onMeta }) {
  const { scene } = useGLTF(GLB_URL)
  const model = useMemo(() => buildModel(scene, colorTela), [scene, colorTela])
  const meta = useMemo(() => medidaModelo(model), [model])
  useEffect(() => { if (onMeta) onMeta(meta) }, [meta, onMeta])
  return <primitive object={model} />
}

class ModelBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  render() {
    if (this.state.err) {
      const msg = String((this.state.err && this.state.err.message) || this.state.err || '')
      console.error('[Mochila3D] error cargando modelo:', this.state.err)
      return (
        <Html center>
          <div style={{ background: '#fff', color: '#c00', padding: '10px 14px', borderRadius: 8, border: '1px solid #c00', fontSize: 13, maxWidth: 300, textAlign: 'center' }}>
            Error cargando modelo: {msg}
          </div>
        </Html>
      )
    }
    return this.props.children
  }
}

const META_DEFAULT = { w: 2.8, h: 3.4, d: 1, frontZ: -1.5 }

function zonasFor(meta) {
  const z = meta.frontZ + 0.02
  return [
    { id: 'centro', pos: [0, 0.35, z], hit: [1.35, 0.85] },
    { id: 'bolsillo', pos: [0, -1.0, z], hit: [1.25, 0.85] },
    { id: 'tapa', pos: [0, 1.42, z], hit: [1.35, 0.5] },
  ]
}

function setCursor(cur) {
  document.body.style.cursor = cur
}

function ZoneHits({ meta, imagen, zonaActiva, zonasyMarca, onZoneClick, applied }) {
  if (!imagen || applied || !onZoneClick) return null
  return zonasFor(meta).map((z) => {
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

function Design({ meta, imagen, imgInfo, zonaActiva, modoLibre, tamano, rotacion, posX, posY, applied }) {
  if (!imgInfo || !imagen || !(zonaActiva || modoLibre)) return null
  const aspect = imgInfo.w / imgInfo.h
  let width = 0
  let x = 0
  let y = 0
  let z = 0
  if (modoLibre) {
    width = (tamano / 100) * 2.6
    x = (posX / 100 - 0.5) * meta.w * 0.85
    y = meta.h / 2 - (posY / 100) * meta.h
    z = meta.frontZ + 0.02
  } else {
    const zona = zonasFor(meta).find((q) => q.id === zonaActiva)
    const pct = zonaActiva === 'centro' ? 26 : zonaActiva === 'bolsillo' ? 24 : 22
    width = (pct / 100) * meta.w * 0.5 * (tamano / 40)
    x = zona.pos[0]
    y = zona.pos[1]
    z = zona.pos[2] + 0.012
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
  const [meta, setMeta] = useState(META_DEFAULT)
  const handleMeta = useCallback((m) => setMeta(m), [])

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
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 6, 4]} intensity={1.8} />
        <directionalLight position={[-4, 2, -3]} intensity={0.8} />
        <Suspense fallback={null}>
          <ModelBoundary>
            <Mochila colorTela={colorTela} onMeta={handleMeta} />
          </ModelBoundary>
          <ZoneHits meta={meta} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
          <Design meta={meta} imagen={imagen} imgInfo={imgInfo} zonaActiva={zonaActiva} modoLibre={modoLibre} tamano={tamano} rotacion={rotacion} posX={posX} posY={posY} applied={applied} />
        </Suspense>
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.5} maxDistance={11} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} target={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}