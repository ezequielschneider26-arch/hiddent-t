import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useFabricMats, useDesignTexture, Stage, ZoneHits, DesignPlane, Stitch } from './shared3d'

// Yerbera mate: cuerpo cónico, tapa y correa al hombro.
const BODY_H = 2.4
const R_TOP = 0.72
const R_BOT = 0.58
const FRONT_Z = 0.68

const ZONES = [
  { id: 'centro', pos: [0, 0.05, FRONT_Z + 0.02], hit: [1.1, 0.85], size: 0.7, maxH: 0.8 },
  { id: 'tapa', pos: [0, 0.82, 0.72], hit: [1.0, 0.38], size: 0.55, maxH: 0.34 },
]

function radiusAt(y) {
  return R_BOT + ((y + BODY_H / 2) / BODY_H) * (R_TOP - R_BOT)
}

export default function Yerbera3D(props) {
  const { colorTela, telaSeleccionada, imagen, zonaActiva, modoLibre, tamano, rotacion, posX, posY, onZoneClick, zonasyMarca, applied, onExportRef } = props
  const { mats, thread } = useFabricMats(colorTela, telaSeleccionada)
  const imgInfo = useDesignTexture(imagen)

  let design = null
  if (imgInfo && imagen && (zonaActiva || modoLibre)) {
    if (modoLibre) {
      const w = (tamano / 100) * 1.6
      design = (
        <DesignPlane
          imgInfo={imgInfo}
          pos={[(posX / 100 - 0.5) * 1.2, BODY_H / 2 - (posY / 100) * BODY_H, FRONT_Z + 0.02]}
          width={w}
          maxH={1.4}
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
    <Stage onExportRef={onExportRef} groundY={-1.55} distance={6.5}>
      {/* Cuerpo cónico */}
      <mesh material={mats.body} castShadow receiveShadow>
        <cylinderGeometry args={[R_TOP, R_BOT, BODY_H, 40]} />
      </mesh>
      {/* Base reforzada */}
      <mesh material={mats.bodyDark} position={[0, -BODY_H / 2 + 0.09, 0]}>
        <cylinderGeometry args={[R_BOT + 0.02, R_BOT - 0.02, 0.18, 40]} />
      </mesh>
      {/* Tapa */}
      <mesh material={mats.bodyDark} position={[0, BODY_H / 2 + 0.09, 0]} castShadow>
        <cylinderGeometry args={[R_TOP + 0.03, R_TOP + 0.03, 0.18, 40]} />
      </mesh>
      {/* Correa al hombro (arco por detrás) */}
      <mesh material={mats.dark} castShadow>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.62, 0.9, -0.25),
          new THREE.Vector3(-0.5, 2.2, -0.55),
          new THREE.Vector3(0, 2.6, -0.65),
          new THREE.Vector3(0.5, 2.2, -0.55),
          new THREE.Vector3(0.62, 0.9, -0.25),
        ]), 40, 0.055, 10, false]} />
      </mesh>
      {/* Costuras verticales */}
      <Stitch length={1.9} pos={[-0.45, 0, radiusAt(0) - 0.12]} tone={thread} rot={[0, -0.35, 0]} />
      <Stitch length={1.9} pos={[0.45, 0, radiusAt(0) - 0.12]} tone={thread} rot={[0, 0.35, 0]} />
      <ZoneHits zones={ZONES} imagen={imagen} zonaActiva={zonaActiva} zonasyMarca={zonasyMarca} onZoneClick={onZoneClick} applied={applied} />
      {design}
      {/* Boca inferior redondeada */}
      <RoundedBox args={[0.7, 0.3, 0.5]} radius={0.1} smoothness={4} material={mats.dark} position={[0, -BODY_H / 2 - 0.05, 0]} />
    </Stage>
  )
}
