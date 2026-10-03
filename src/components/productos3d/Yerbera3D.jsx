import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useFabricMats, useDesignTexture, Stage, ZoneHits, DesignPlane, Stitch } from './shared3d'

// =====================================================================
// Yerbera vertical blanda, trapezoidal: arriba más ancha, base curva.
// Unidades: altura 3.0 = 100u (1u = 0.03).
//   ancho superior 2.04 (68u) | ancho inferior 1.56 (52u) | prof. 0.50
// =====================================================================
const BODY_H = 3.0
const TOP_Y = BODY_H / 2
const BOTTOM_Y = -BODY_H / 2
const TOP_HW = 1.02
const BOT_HW = 0.78
const BOT_R = 0.35
const BODY_D = 0.50

function bodyShape() {
  const s = new THREE.Shape()
  s.moveTo(-0.43, BOTTOM_Y)
  s.lineTo(0.43, BOTTOM_Y)
  s.quadraticCurveTo(BOT_HW, BOTTOM_Y, BOT_HW, BOTTOM_Y + BOT_R)
  // lateral derecho con ligera curvatura hacia afuera
  s.quadraticCurveTo(0.94, 0.17, TOP_HW, TOP_Y)
  s.lineTo(-TOP_HW, TOP_Y)
  // lateral izquierdo espejado
  s.quadraticCurveTo(-0.94, 0.17, -BOT_HW, BOTTOM_Y + BOT_R)
  s.quadraticCurveTo(-BOT_HW, BOTTOM_Y, -0.43, BOTTOM_Y)
  s.closePath()
  return s
}

function buildBodyGeometry() {
  const g = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: BODY_D,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 32,
  })
  g.translate(0, 0, -BODY_D / 2)
  // Confección blanda: frente convexo, base acolchada, espalda hacia adentro.
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = THREE.MathUtils.clamp((v.y - BOTTOM_Y) / BODY_H, 0, 1)
    const xn = THREE.MathUtils.clamp(v.x / TOP_HW, -1, 1)
    if (v.z > 0) {
      v.z += 0.045 * (1 - xn * xn) * Math.sin(Math.PI * t)
      if (t < 0.22) v.z += 0.02 * (1 - t / 0.22)
    } else {
      v.z += 0.05 * (1 - xn * xn)
      if (t < 0.22) v.z -= 0.02 * (1 - t / 0.22)
    }
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  g.computeBoundingBox()
  return g
}
const BODY_GEOM = buildBodyGeometry()
const FRONT_Z = BODY_GEOM.boundingBox.max.z
const BACK_Z = BODY_GEOM.boundingBox.min.z

// ---------- Cinta/borde superior textil (2-4% de la altura) ----------
const BIND_H = 0.10
const BIND_Y = TOP_Y + 0.02
// ---------- Cierre: recorre casi todo el ancho superior ----------
const ZIP_LEN = TOP_HW * 2 - 0.10
const ZIP_Y = TOP_Y + 0.075
// ---------- Cursor a ~7% del extremo izquierdo ----------
const SLIDER_X = -TOP_HW + 0.05 + ZIP_LEN * 0.07

const ZONES = [
  { id: 'centro', pos: [0, -0.1, FRONT_Z + 0.02], hit: [1.3, 1.0], size: 0.95, maxH: 0.95 },
  { id: 'tapa', pos: [0, 1.05, FRONT_Z + 0.02], hit: [1.2, 0.4], size: 0.7, maxH: 0.36 },
]

// Vivos laterales: siguen la silueta de arriba a abajo, a media profundidad.
function sideWeltPoints(sx) {
  return [
    new THREE.Vector3(sx * 1.07, TOP_Y - 0.03, 0),
    new THREE.Vector3(sx * 0.97, 0.5, 0),
    new THREE.Vector3(sx * 0.89, -0.5, 0),
    new THREE.Vector3(sx * 0.81, BOTTOM_Y + 0.4, 0),
  ]
}
const WELT_GEOMS = [sideWeltPoints(1), sideWeltPoints(-1)].map(
  (pts) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.03, 8, false)
)

export default function Yerbera3D(props) {
  const { colorTela, telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
  const { mats } = useFabricMats(colorTela, telaSeleccionada)
  const imgInfo = useDesignTexture(imagen)

  let design = null
  if (imgInfo && imagen && (zonaActiva || modoLibre)) {
    if (modoLibre) {
      design = (
        <DesignPlane
          imgInfo={imgInfo}
          pos={[(posX / 100 - 0.5) * 1.6, TOP_Y - (posY / 100) * BODY_H, FRONT_Z + 0.02]}
          width={(tamano / 100) * 1.5}
          maxH={1.6}
          rotZ={rotacion}
          applied={applied}
        />
      )
    } else {
      const z = ZONES.find((q) => q.id === zonaActiva)
      if (z) {
        design = (
          <DesignPlane
            imgInfo={imgInfo}
            pos={[z.pos[0], z.pos[1], z.pos[2] + 0.012]}
            width={z.size * (tamano / 40)}
            maxH={z.maxH}
            rotZ={rotacion}
            applied={applied}
          />
        )
      }
    }
  }

  return (
    <Stage onExportRef={onExportRef} groundY={-1.85} distance={6}>
      {/* Cuerpo: panel frontal + laterales en una pieza blanda */}
      <mesh name="cuerpo-paneles" geometry={BODY_GEOM} material={mats.body} castShadow receiveShadow />

      {/* Panel trasero independiente */}
      <RoundedBox name="panel-trasero" args={[1.70, 2.60, 0.10]} radius={0.05} smoothness={4} material={mats.bodyDark} position={[0, 0, BACK_Z]} receiveShadow />

      {/* Panel inferior (base redondeada) */}
      <RoundedBox name="panel-inferior" args={[1.30, 0.26, 0.60]} radius={0.11} smoothness={5} material={mats.bodyDark} position={[0, BOTTOM_Y + 0.10, 0]} castShadow />

      {/* Vivos de los paneles laterales */}
      <mesh name="panel-lateral-derecho" geometry={WELT_GEOMS[0]} material={mats.bodyDark} />
      <mesh name="panel-lateral-izquierdo" geometry={WELT_GEOMS[1]} material={mats.bodyDark} />

      {/* Cinta/borde superior */}
      <RoundedBox name="borde-superior" args={[TOP_HW * 2 + 0.04, BIND_H, BODY_D + 0.20]} radius={0.04} smoothness={4} material={mats.bodyDark} position={[0, BIND_Y, 0]} castShadow />

      {/* Cierre superior: cinta + dientes */}
      <mesh name="cierre-cinta" position={[0, ZIP_Y, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.dark}>
        <cylinderGeometry args={[0.035, 0.035, ZIP_LEN, 12]} />
      </mesh>
      <mesh name="cierre-dientes" position={[0, ZIP_Y, 0.032]} rotation={[0, 0, Math.PI / 2]} material={mats.metal}>
        <cylinderGeometry args={[0.02, 0.02, ZIP_LEN - 0.04, 10]} />
      </mesh>

      {/* Cursor metálico + tirador alargado plateado */}
      <mesh name="cierre-cursor" position={[SLIDER_X, ZIP_Y + 0.005, 0.02]} material={mats.silver}>
        <boxGeometry args={[0.12, 0.08, 0.10]} />
      </mesh>
      <group name="tirador-metalico" position={[SLIDER_X + 0.03, ZIP_Y + 0.03, 0.05]} rotation={[0.2, 0, -0.25]}>
        <mesh position={[0, 0.02, 0]} material={mats.silver}>
          <torusGeometry args={[0.035, 0.012, 8, 18]} />
        </mesh>
        <mesh position={[0.02, 0.14, 0.01]} material={mats.silver}>
          <boxGeometry args={[0.045, 0.17, 0.025]} />
        </mesh>
      </group>

      {/* Costuras laterales siguiendo el taper */}
      <Stitch length={2.4} pos={[-0.86, 0.15, FRONT_Z + 0.006]} rot={[0, 0, 0.091]} />
      <Stitch length={2.4} pos={[0.86, 0.15, FRONT_Z + 0.006]} rot={[0, 0, -0.091]} />
      <ZoneHits zones={ZONES} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
      {design}
    </Stage>
  )
}
