'use client'

import { useFrame } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface PanLimitsProps {
  minTargetX?: number
  maxTargetX?: number
  minTargetY?: number
  maxTargetY?: number
  minTargetZ?: number
  maxTargetZ?: number
}

export default function PanLimits({
  minTargetX = -10,
  maxTargetX = 10,
  minTargetY = 0,
  maxTargetY = 8,
  minTargetZ = -10,
  maxTargetZ = 10,
}: PanLimitsProps) {
  const { controls } = useThree()

  useFrame(() => {
    if (!controls) return

    const orbitControls = controls as unknown as OrbitControlsImpl
    if (!orbitControls.target) return

    const target = orbitControls.target

    // Clamp target position within bounds (no allocations)
    const clampedX = Math.max(minTargetX, Math.min(maxTargetX, target.x))
    const clampedY = Math.max(minTargetY, Math.min(maxTargetY, target.y))
    const clampedZ = Math.max(minTargetZ, Math.min(maxTargetZ, target.z))

    // Only update if changed to avoid unnecessary updates
    if (
      target.x !== clampedX ||
      target.y !== clampedY ||
      target.z !== clampedZ
    ) {
      target.set(clampedX, clampedY, clampedZ)
      
      // Update controls to reflect the change smoothly (works with damping)
      orbitControls.update()
    }
  })

  return null
}

