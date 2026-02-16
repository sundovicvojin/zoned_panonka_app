'use client'

import { useGLTF } from '@react-three/drei'
import { useMemo, useRef, useEffect, forwardRef } from 'react'
import { Mesh, Material, DoubleSide, MeshStandardMaterial, Color } from 'three'
import type { Group, Object3D } from 'three'
import apartmentsData from '@/data/apartments.json'

interface BuildingModelProps {
  onApartmentClick: (apartmentId: string) => void
  debugMode: boolean
}

// Color mapping based on status
const STATUS_COLORS: Record<string, string> = {
  sold: '#ec4747', // orange
  available: '#61ff61', // light green
}

// Get color for apartment status
function getStatusColor(status: string | undefined): string {
  if (!status) return '#cccccc' // default gray
  const normalizedStatus = status.toLowerCase()
  return STATUS_COLORS[normalizedStatus] || '#cccccc'
}

function toMaterialList(material: Mesh['material']): Material[] {
  if (Array.isArray(material)) {
    const result: Material[] = []
    material.forEach((mat) => {
      if (Array.isArray(mat)) {
        mat.forEach((inner) => result.push(inner))
      } else {
        result.push(mat)
      }
    })
    return result
  }
  return [material]
}

const BuildingModel = forwardRef<Group, BuildingModelProps>(
  ({ onApartmentClick, debugMode }, ref) => {
    const { scene } = useGLTF('/models/building.glb')
    const internalRef = useRef<Group>(null)
    const hoveredMeshRef = useRef<Mesh | null>(null)

    // Use forwarded ref or internal ref
    const actualRef = (ref as React.RefObject<Group>) || internalRef

    // Memoize the processed scene - traverse only once on load
    // This sets up click plane materials and metadata
    const processedScene = useMemo(() => {
      const clonedScene = scene.clone()
      let clickPlanesFound = 0

      clonedScene.traverse((object: Object3D) => {
        if (object instanceof Mesh && object.name.startsWith('AC_')) {
          clickPlanesFound++
          const mesh = object as Mesh

          // Extract apartment ID
          const apartmentId = object.name.replace(/^AC_/, '')
          const apartmentData = (apartmentsData as Record<string, any>)[apartmentId]
          const status = apartmentData?.status
          const statusColor = getStatusColor(status)

          // Ensure material exists
          if (!mesh.material) {
            return
          }

          // Handle both single material and material array
          const isArray = Array.isArray(mesh.material)
          const originalMaterials = toMaterialList(mesh.material)
          const newMaterials: Material[] = []

          originalMaterials.forEach((mat) => {
            if (mat instanceof Material) {
              // Create new MeshStandardMaterial with status color
              const material = new MeshStandardMaterial()
              if (mat instanceof MeshStandardMaterial) {
                material.copy(mat)
              } else {
                // Copy basic properties from any material type
                material.copy(mat as any)
              }
              material.userData.isClickPlane = true
              material.userData.apartmentId = apartmentId

              // Set color based on status (always set, even when invisible)
              material.color = new Color(statusColor)

              // Set click plane properties
              material.transparent = true
              material.opacity = 0.0 // Start invisible, will be updated by useEffect
              material.depthWrite = false
              material.side = DoubleSide
              material.needsUpdate = true

              newMaterials.push(material)
            }
          })

          // Assign the new materials
          mesh.material = isArray ? newMaterials : newMaterials[0]
        }
      })

      console.log(`BuildingModel: Found ${clickPlanesFound} click planes`)
      return clonedScene
    }, [scene])

    // Update materials when debug mode changes (only opacity, no traversal of entire scene)
    useEffect(() => {
      if (!actualRef.current) return

      // Only traverse AC_ meshes to update opacity
      actualRef.current.traverse((object: Object3D) => {
        if (object instanceof Mesh && object.name.startsWith('AC_')) {
          const mesh = object as Mesh
          if (!mesh.material) return

          const materials = toMaterialList(mesh.material)
          materials.forEach((mat) => {
            if (mat instanceof Material) {
              // Update opacity only (color is already set from initial processing)
              mat.opacity = debugMode ? 0.3 : 0.0
              mat.needsUpdate = true
            }
          })
        }
      })
    }, [debugMode])

    // Click handler - hard-locked to only AC_ prefixed meshes
    const handleClick = (event: any) => {
      event.stopPropagation()

      const object = event.object as Object3D
      if (!object || !object.name || typeof object.name !== 'string') {
        return
      }

      // Hard-lock: Only process clicks on AC_ prefixed meshes
      if (!object.name.startsWith('AC_')) {
        return
      }

      // Extract apartment ID by removing AC_ prefix
      const apartmentId = object.name.replace(/^AC_/, '')
      if (apartmentId && apartmentId.length > 0) {
        console.log(`Clicked apartment: ${apartmentId}`)
        onApartmentClick(apartmentId)
      }
    }

    const animateMeshOpacity = (mesh: Mesh, targetOpacity: number, durationMs = 150) => {
      if (!mesh.material) return

      const materials = toMaterialList(mesh.material)
      const animatableMaterials = materials.filter((mat): mat is Material => mat instanceof Material)
      if (animatableMaterials.length === 0) return

      const startOpacities = animatableMaterials.map((mat) => mat.opacity)
      const startTime = performance.now()
      const existingAnimationId = mesh.userData.opacityAnimationId as number | undefined
      if (existingAnimationId) {
        cancelAnimationFrame(existingAnimationId)
      }

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs)
        const eased = 1 - Math.pow(1 - progress, 3)

        animatableMaterials.forEach((mat, index) => {
          mat.opacity = startOpacities[index] + (targetOpacity - startOpacities[index]) * eased
          mat.needsUpdate = true
        })

        if (progress < 1) {
          mesh.userData.opacityAnimationId = requestAnimationFrame(tick)
        } else {
          mesh.userData.opacityAnimationId = undefined
        }
      }

      mesh.userData.opacityAnimationId = requestAnimationFrame(tick)
    }

    const getBaseOpacity = () => (debugMode ? 0.3 : 0.0)

    // Pointer events for cursor feedback
    const handlePointerOver = (event: any) => {
      event.stopPropagation()
      const object = event.object as Object3D
      if (!(object instanceof Mesh)) return

      if (object?.name && typeof object.name === 'string' && object.name.startsWith('AC_APT_')) {
        if (hoveredMeshRef.current && hoveredMeshRef.current !== object) {
          animateMeshOpacity(hoveredMeshRef.current, getBaseOpacity(), 150)
        }
        hoveredMeshRef.current = object
        animateMeshOpacity(object, 0.7, 200)
        document.body.style.cursor = 'pointer'
      }
    }

    const handlePointerOut = (event: any) => {
      event.stopPropagation()
      const object = event.object as Object3D
      if (!(object instanceof Mesh)) return
      if (!object.name.startsWith('AC_APT_')) return

      animateMeshOpacity(object, getBaseOpacity(), 150)
      if (hoveredMeshRef.current === object) {
        hoveredMeshRef.current = null
      }
      document.body.style.cursor = 'default'
    }

    return (
      <primitive
        ref={actualRef}
        object={processedScene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    )
  }
)

BuildingModel.displayName = 'BuildingModel'

// Preload the model for better performance
useGLTF.preload('/models/building.glb')

export default BuildingModel

