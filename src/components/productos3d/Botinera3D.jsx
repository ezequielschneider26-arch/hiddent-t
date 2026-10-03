import { RoundedBox } from '@react-three/drei'
import { useFabricMats, useDesignTexture, Stage, ZoneHits, DesignPlane, Stitch } from './shared3d'

// Botinera: bolso rectangular con tapa, manijas y zonas laterales.
const W = 2.4
const H = 1.7
const D = 1.3
const FRONT_Z = D / 2
const SIDE_X = W / 2
const ZONES = [
  { id: 'izquierdo', pos: [-SIDE_X - 0.02, 0, 0], rot: [0, -Math.PI / 2, 0], hit: [0.9, 0.9], size: 0.7, maxH: 0.85 },
  { id: 'derecho', pos: [SIDE_X + 0.02, 0, 0], rot: [0, Math.PI / 2, 0], hit: [0.9, 0.9], size: 0.7, maxH: 0.85 },
  { id: 'centro', pos: [0, 0.35, FRONT_Z + 0.02], rot: [0, 0, 0], hit: [1.4, 0.5], size: 0.9, maxH: 0.45 },
]

export default function Botinera3D(props) {
  const { colorTela, telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
  const { mats, thread } = useFabricMats(colorTela, telaSeleccionada)
  const imgInfo = useDesignTexture(imagen)
  const rotRad = (rotacion * Math.PI) / 180

  let design = null
  if (imgInfo && imagen && (zonaActiva || modoLibre)) {
    if (modoLibre) {
      design = (
        <DesignPlane
          imgInfo={imgInfo}
          pos={[(posX / 100 - 0.5) * (W - 0.4), H / 2 - (posY / 100) * H, FRONT_Z + 0.02]}
          width={(tamano / 100) * 1.8}
          maxH={1.0}
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
            pos={[z.pos[0], z.pos[1], z.pos[2]]}
            rot={[z.rot[0], z.rot[1], rotRad]}
            width={z.size * (tamano / 40)}
            maxH={z.maxH}
            applied={applied}
          />
        )
      }
    }
  }

  return (
    <Stage onExportRef={onExportRef} groundY={-1.2} distance={7}>
      {/* Cuerpo */}
      <RoundedBox args={[W, H, D]} radius={0.15} smoothness={5} material={mats.body} castShadow receiveShadow />
      {/* Tapa superior */}
      <RoundedBox args={[W + 0.04, 0.3, D + 0.04]} radius={0.1} smoothness={4} material={mats.bodyDark} position={[0, H / 2, 0]} castShadow />
      {/* Línea de cierre bajo la tapa */}
      <mesh position={[0, H / 2 - 0.17, FRONT_Z + 0.005]} material={mats.dark}>
        <boxGeometry args={[W - 0.4, 0.05, 0.02]} />
      </mesh>
      {/* Manijas superiores */}
      {[-0.5, 0.5].map((hx) => (
        <mesh key={hx} position={[hx, H / 2 + 0.12, 0]} material={mats.dark} castShadow>
          <torusGeometry args={[0.28, 0.06, 12, 24, Math.PI]} />
        </mesh>
      ))}
      {/* Costuras laterales */}
      <Stitch length={H - 0.4} pos={[-W / 2 + 0.08, 0, FRONT_Z + 0.006]} tone={thread} />
      <Stitch length={H - 0.4} pos={[W / 2 - 0.08, 0, FRONT_Z + 0.006]} tone={thread} />
      <ZoneHits zones={ZONES} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
      {design}
    </Stage>
  )
}

