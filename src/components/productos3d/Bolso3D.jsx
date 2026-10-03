import { RoundedBox } from '@react-three/drei'
import { useFabricMats, useDesignTexture, Stage, ZoneHits, DesignPlane, Stitch } from './shared3d'

// Bolso tote: cuerpo plano, manijas y bolsillo frontal.
const W = 2.6
const H = 2.0
const D = 0.8
const FRONT_Z = D / 2
const POCKET_W = 1.5
const POCKET_H = 0.7
const POCKET_Y = -0.45
const POCKET_TOP_Z = FRONT_Z + 0.12

const ZONES = [
  { id: 'centro', pos: [0, 0.35, FRONT_Z + 0.02], hit: [1.6, 0.8], size: 1.0, maxH: 0.75 },
  { id: 'bolsillo', pos: [0, POCKET_Y, POCKET_TOP_Z + 0.02], hit: [1.4, 0.6], size: 0.9, maxH: 0.55 },
]

export default function Bolso3D(props) {
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
          width={(tamano / 100) * 2.0}
          maxH={1.2}
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
    <Stage onExportRef={onExportRef} groundY={-1.35} distance={7}>
      {/* Cuerpo */}
      <RoundedBox args={[W, H, D]} radius={0.12} smoothness={5} material={mats.body} castShadow receiveShadow />
      {/* Refuerzo inferior */}
      <RoundedBox args={[W - 0.06, 0.16, D - 0.04]} radius={0.05} smoothness={4} material={mats.bodyDark} position={[0, -H / 2 + 0.02, 0]} />
      {/* Bolsillo frontal */}
      <RoundedBox args={[POCKET_W, POCKET_H, 0.12]} radius={0.06} smoothness={4} material={mats.bodyDark} position={[0, POCKET_Y, FRONT_Z]} castShadow receiveShadow />
      {/* Manijas (adelante y atrás) */}
      {[-0.25, 0.25].map((hz) => (
        <group key={hz}>
          {[-0.6, 0.6].map((hx) => (
            <mesh key={hx} position={[hx, H / 2 - 0.05, hz]} material={mats.dark} castShadow>
              <torusGeometry args={[0.42, 0.07, 12, 24, Math.PI]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Costura superior */}
      <Stitch length={W - 0.3} pos={[0, H / 2 - 0.12, FRONT_Z + 0.006]} tone={thread} />
      {/* Costura del bolsillo */}
      <Stitch length={POCKET_W - 0.12} pos={[0, POCKET_Y + POCKET_H / 2 - 0.03, POCKET_TOP_Z + 0.006]} tone={thread} />
      <ZoneHits zones={ZONES} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
      {design}
    </Stage>
  )
}
