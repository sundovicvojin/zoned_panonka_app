'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useRef, useMemo, useCallback, memo } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import BuildingModel from './models/BuildingModel'
import CameraCollision from './CameraCollision'
import PanLimitsAuto from './PanLimitsAuto'
import StaticModel from './models/StaticModel'

interface SceneCanvasProps {
  onApartmentClick: (apartmentId: string) => void
  debugMode: boolean
}

// Optimized DPR: lower on mobile for better performance
const getOptimalDPR = (): [number, number] => {
  if (typeof window === 'undefined') return [1, 2]
  const isMobile = window.innerWidth < 768
  return isMobile ? [1, 1.5] : [1, 2]
}



// Memoize SceneContent to prevent unnecessary rerenders
const SceneContent = memo(function SceneContent({
  onApartmentClick,
  debugMode,
}: SceneCanvasProps) {
  const buildingRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  // Memoize click handler to prevent rerenders
  const handleApartmentClick = useCallback(
    (apartmentId: string) => {
      onApartmentClick(apartmentId)
    },
    [onApartmentClick]
  )

  return (
    <>
      {/* Lighting - shadows disabled for performance */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow={false} />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} castShadow={false} />

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />

      {/* Controls - tight zoom limits */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={30}
        maxDistance={150}
        dampingFactor={0.05}
        enableDamping={true}
      />

      {/* Building Model */}
      <BuildingModel
        ref={buildingRef}
        onApartmentClick={handleApartmentClick}
        debugMode={debugMode}
      />

      {/* Camera Collision Protection */}
      <CameraCollision buildingRef={buildingRef} />

      {/* Ground / Yard (static, no interaction) */}
      <StaticModel
        url="/models/ground.glb"
      />


      {/* Pan Limits - auto from bounding box */}
      <PanLimitsAuto
        buildingRef={buildingRef}
        controlsRef={controlsRef}
        paddingX={2}
        paddingZ={2}
        paddingY={1}
        minY={0}
      />
    </>
  )
})

export default function SceneCanvas({ onApartmentClick, debugMode }: SceneCanvasProps) {
  // Memoize DPR calculation
  const dpr = useMemo(() => getOptimalDPR(), [])

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      style={{ width: '100%', height: '100%' }}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <SceneContent onApartmentClick={onApartmentClick} debugMode={debugMode} />
      </Suspense>
    </Canvas>
  )
}

