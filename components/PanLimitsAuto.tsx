'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Box3, Vector3, MathUtils, Object3D } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface PanLimitsAutoProps {
  buildingRef: React.RefObject<Object3D>
  controlsRef: React.RefObject<OrbitControlsImpl>
  paddingX?: number
  paddingZ?: number
  paddingY?: number
  minY?: number
}

export default function PanLimitsAuto({
  buildingRef,
  controlsRef,
  paddingX = 2,
  paddingZ = 2,
  paddingY = 1,
  minY = 0,
}: PanLimitsAutoProps) {
  const { controls } = useThree()

  // Reusable objects to avoid allocations
  const boxRef = useRef(new Box3())
  const centerRef = useRef(new Vector3())
  const sizeRef = useRef(new Vector3())
  const limitsRef = useRef<{
    minX: number
    maxX: number
    minY: number
    maxY: number
    minZ: number
    maxZ: number
  } | null>(null)

  // Compute limits once the building is available
  useEffect(() => {
    if (!buildingRef.current) return
    const box = boxRef.current
    const center = centerRef.current
    const size = sizeRef.current

    box.setFromObject(buildingRef.current)
    if (box.isEmpty()) return

    box.getCenter(center)
    box.getSize(size)

    limitsRef.current = {
      minX: box.min.x - paddingX,
      maxX: box.max.x + paddingX,
      minZ: box.min.z - paddingZ,
      maxZ: box.max.z + paddingZ,
      minY,
      maxY: center.y + size.y * 0.5 + paddingY,
    }
  }, [buildingRef, minY, paddingX, paddingZ, paddingY])

  useFrame(() => {
    const orbit = controlsRef.current ?? (controls as OrbitControlsImpl | null)
    const limits = limitsRef.current
    if (!orbit || !orbit.target || !limits) return

    const { target } = orbit

    const clampedX = MathUtils.clamp(target.x, limits.minX, limits.maxX)
    const clampedY = MathUtils.clamp(target.y, limits.minY, limits.maxY)
    const clampedZ = MathUtils.clamp(target.z, limits.minZ, limits.maxZ)

    if (clampedX !== target.x || clampedY !== target.y || clampedZ !== target.z) {
      target.set(clampedX, clampedY, clampedZ)
      orbit.update()
    }
  })

  return null
}


