import { RoundedBox } from '@react-three/drei'
import { useFabricMats, useDesignTexture, Stage, ZoneHits, DesignPlane, Stitch } from './shared3d'

// Estuche: neceser compacto con cierre superior.
const W = 1.9
const H = 1.0
const D = 0.65
const FRONT_Z = D / 2

const ZONES = [
  { id: 'centro', pos: [0, 0.05, FRONT_Z + 0.02], hit: [1.2, 0.6], size: 0.75, maxH: 0.55 },
  { id: 'inferior', pos: [0, -0.3, FRONT_Z + 0.02], hit: [1.1, 0.35], size: 0.6, maxH: 0.3 },
]

export default function Estuche3D(props) {
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
          width={(tamano / 100) * 1.5}
          maxH={0.7}
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
    <Stage onExportRef={onExportRef} groundY={-0.8} distance={5.5}>
      {/* Cuerpo */}
      <RoundedBox args={[W, H, D]} radius={0.18} smoothness={5} material={mats.body} castShadow receiveShadow />
      {/* Cierre superior */}
      <mesh position={[0, H / 2 - 0.02, 0.22]} material={mats.metal}>
        <boxGeometry args={[W - 0.25, 0.055, 0.1]} />
      </mesh>
      <mesh position={[W / 2 - 0.35, H / 2 - 0.06, 0.24]} rotation={[0, 0, -0.2]} material={mats.dark}>
        <boxGeometry args={[0.12, 0.05, 0.03]} />
      </mesh>
      {/* Costura frontal */}
      <Stitch length={W - 0.3} pos={[0, -H / 2 + 0.14, FRONT_Z + 0.006]} tone={thread} />
      <ZoneHits zones={ZONES} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
      {design}
    </Stage>
  )
}
