'use client'

import { useFrame } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Raycaster, Vector3, Object3D, Mesh } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CameraCollisionProps {
  buildingRef: React.RefObject<Object3D>
}

const COLLISION_MARGIN = 0.3 // Safety margin in world units

export default function CameraCollision({ buildingRef }: CameraCollisionProps) {
  const { camera, controls } = useThree()
  const raycasterRef = useRef<Raycaster>(new Raycaster())
  
  // Reusable vectors (no per-frame allocations)
  const cameraPosRef = useRef<Vector3>(new Vector3())
  const targetPosRef = useRef<Vector3>(new Vector3())
  const directionRef = useRef<Vector3>(new Vector3())
  const newCameraPosRef = useRef<Vector3>(new Vector3())

  // Track collider meshes (calculated once when building loads)
  const colliderMeshesRef = useRef<Mesh[]>([])
  const hasCalculatedColliders = useRef(false)

  useFrame(() => {
    // Calculate collider meshes once when building becomes available
    if (buildingRef.current && !hasCalculatedColliders.current) {
      const meshes: Mesh[] = []
      buildingRef.current.traverse((object: Object3D) => {
        if (object instanceof Mesh) {
          // Exclude click planes (AC_ prefixed) - these are invisible and should not block camera
          if (!object.name.startsWith('AC_')) {
            meshes.push(object)
          }
        }
      })
      colliderMeshesRef.current = meshes
      hasCalculatedColliders.current = true
    }

    // Skip collision check if building not loaded or no controls or no colliders
    if (!buildingRef.current || !controls || colliderMeshesRef.current.length === 0) {
      return
    }

    const orbitControls = controls as unknown as OrbitControlsImpl
    if (!orbitControls.target) {
      return
    }

    const raycaster = raycasterRef.current
    
    // Reuse vectors (no allocations)
    const cameraPos = cameraPosRef.current.copy(camera.position)
    const targetPos = targetPosRef.current.copy(orbitControls.target)
    const direction = directionRef.current

    // Direction from target to camera
    direction.subVectors(cameraPos, targetPos)
    const distance = direction.length()

    if (distance < 0.01) {
      return // Too close, skip check
    }

    direction.normalize()

    // Raycast from target toward camera
    raycaster.set(targetPos, direction)
    raycaster.far = distance + COLLISION_MARGIN

    const intersects = raycaster.intersectObjects(colliderMeshesRef.current, false)

    if (intersects.length > 0) {
      const firstHit = intersects[0]
      const hitDistance = firstHit.distance

      // If hit is closer than camera position, push camera back
      if (hitDistance < distance) {
        // Calculate safe position: hit point - margin in direction away from hit
        const safeDistance = Math.max(hitDistance - COLLISION_MARGIN, COLLISION_MARGIN)
        
        // Calculate new camera position along the ray (reuse vector)
        const newCameraPos = newCameraPosRef.current
        newCameraPos.copy(targetPos).addScaledVector(direction, safeDistance)

        // Update camera position
        camera.position.copy(newCameraPos)

        // Update OrbitControls to reflect the change (maintains smooth damping)
        orbitControls.update()
      }
    }
  })

  return null
}

