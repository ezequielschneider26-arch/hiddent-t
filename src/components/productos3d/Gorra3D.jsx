import { RoundedBox } from '@react-three/drei'
import { useFabricMats, useDesignTexture, Stage, ZoneHits, DesignPlane } from './shared3d'

// Gorra: copa semiesférica, visera, botón y zonas frente/costado.
const CROWN_R = 0.95
const CROWN_Y = 0.3

const ZONES = [
  { id: 'frente', pos: [0, 0.3, 0.97], rot: [-0.15, 0, 0], hit: [0.9, 0.5], size: 0.55, maxH: 0.45 },
  { id: 'costado', pos: [0.98, 0.3, 0.15], rot: [0, Math.PI / 2, 0], hit: [0.6, 0.45], size: 0.45, maxH: 0.4 },
]

export default function Gorra3D(props) {
  const { colorTela, telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
  const { mats } = useFabricMats(colorTela, telaSeleccionada)
  const imgInfo = useDesignTexture(imagen)
  const rotRad = (rotacion * Math.PI) / 180

  let design = null
  if (imgInfo && imagen && (zonaActiva || modoLibre)) {
    if (modoLibre) {
      design = (
        <DesignPlane
          imgInfo={imgInfo}
          pos={[(posX / 100 - 0.5) * 1.2, (posY / 100) * 0.75, 0.97]}
          width={(tamano / 100) * 1.1}
          maxH={0.6}
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
    <Stage onExportRef={onExportRef} groundY={-0.7} distance={5.5} target={[0, 0.25, 0]}>
      {/* Copa */}
      <mesh material={mats.body} position={[0, CROWN_Y, 0]} scale={[1, 0.85, 1]} castShadow receiveShadow>
        <sphereGeometry args={[CROWN_R, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      </mesh>
      {/* Base interior oscura (se ve el borde) */}
      <mesh material={mats.dark} position={[0, CROWN_Y - 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CROWN_R * 0.985, 40]} />
      </mesh>
      {/* Visera */}
      <RoundedBox args={[1.5, 0.08, 0.95]} radius={0.04} smoothness={4} material={mats.bodyDark} position={[0, 0.12, 1.05]} rotation={[0.06, 0, 0]} castShadow receiveShadow />
      {/* Botón superior */}
      <mesh material={mats.dark} position={[0, CROWN_Y + CROWN_R * 0.85, 0]}>
        <sphereGeometry args={[0.09, 16, 12]} />
      </mesh>
      <ZoneHits zones={ZONES} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
      {design}
    </Stage>
  )
}
