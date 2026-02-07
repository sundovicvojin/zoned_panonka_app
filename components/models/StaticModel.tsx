'use client'

import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

type Props = {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}

export default function StaticModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: Props) {
  const gltf = useGLTF(url)

  // malo optimizacije (ne menja izgled)
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true)
    s.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.frustumCulled = true
        mesh.castShadow = false
        mesh.receiveShadow = false
      }
    })
    return s
  }, [gltf.scene])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
