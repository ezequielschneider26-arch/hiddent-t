import { RoundedBox } from '@react-three/drei'
import { useFabricMats, useDesignTexture, Stage, ZoneHits, DesignPlane, Stitch } from './shared3d'

// Cartera: sobre rígido con solapa y broche.
const W = 2.2
const H = 1.3
const D = 0.4
const FRONT_Z = D / 2
const FLAP_H = 0.55
const FLAP_Y = 0.35
const FLAP_TOP_Z = FRONT_Z + 0.08

const ZONES = [
  { id: 'centro', pos: [0, -0.32, FRONT_Z + 0.02], hit: [1.3, 0.5], size: 0.8, maxH: 0.45 },
  { id: 'bolsillo', pos: [0, FLAP_Y, FLAP_TOP_Z + 0.02], hit: [1.3, 0.45], size: 0.8, maxH: 0.4 },
]

export default function Cartera3D(props) {
  const { colorTela, telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
  const { mats, thread } = useFabricMats(colorTela, telaSeleccionada)
  const imgInfo = useDesignTexture(imagen)

  let design = null
  if (imgInfo && imagen && (zonaActiva || modoLibre)) {
    if (modoLibre) {
      design = (
        <DesignPlane
          imgInfo={imgInfo}
          pos={[(posX / 100 - 0.5) * (W - 0.4), H / 2 - (posY / 100) * H, FRONT_Z + 0.02]}
          width={(tamano / 100) * 1.8}
          maxH={0.9}
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
    <Stage onExportRef={onExportRef} groundY={-0.95} distance={6}>
      {/* Cuerpo */}
      <RoundedBox args={[W, H, D]} radius={0.1} smoothness={5} material={mats.body} castShadow receiveShadow />
      {/* Solapa */}
      <RoundedBox args={[W, FLAP_H, 0.08]} radius={0.04} smoothness={4} material={mats.bodyDark} position={[0, FLAP_Y, FRONT_Z]} castShadow />
      {/* Broche metálico */}
      <mesh position={[0, FLAP_Y - FLAP_H / 2 + 0.03, FLAP_TOP_Z + 0.01]} material={mats.metal}>
        <boxGeometry args={[0.18, 0.1, 0.05]} />
      </mesh>
      {/* Costura inferior */}
      <Stitch length={W - 0.3} pos={[0, -H / 2 + 0.12, FRONT_Z + 0.006]} tone={thread} />
      <ZoneHits zones={ZONES} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
      {design}
    </Stage>
  )
}
