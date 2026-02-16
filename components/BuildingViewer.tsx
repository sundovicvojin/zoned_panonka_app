'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useProgress } from '@react-three/drei'
import apartmentsData from '@/data/apartments.json'

// Dynamic import with SSR disabled
const SceneCanvas = dynamic(() => import('@/components/SceneCanvas'), {
  ssr: false,
  loading: () => null,
})

interface ApartmentData {
  id: string
  name?: string
  floor?: number
  area?: string
  bedrooms?: string
  bathrooms?: string
  price?: string
  status?: string
  planImage?: string
  link?: string
  [key: string]: any
}

const DISPLAY_FIELDS = ['floor', 'area_m2', 'rooms', 'price_eur', 'status', 'note']

// === SRPSKI NAZIVI POLJA ZA POPUP ===
const FIELD_LABELS_SR: Record<string, string> = {
  floor: 'Sprat',
  area_m2: 'Površina (m²)',
  rooms: 'Broj soba',
  price_eur: 'Cena (€)',
  status: 'Status',
  note: 'Napomena',
}


interface BuildingViewerProps { }

export default function BuildingViewer({ }: BuildingViewerProps) {
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Load debug mode from URL query or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlDebug = params.get('debug') === 'true'
    const storedDebug = localStorage.getItem('debugMode') === 'true'
    setDebugMode(urlDebug || storedDebug)
  }, [])

  // Single source of truth for toggling debug mode
  const toggleDebugMode = useCallback(() => {
    setDebugMode((prev) => {
      const newValue = !prev
      localStorage.setItem('debugMode', String(newValue))
      return newValue
    })
  }, [])

  // Keyboard shortcut for debug mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return
        }
        toggleDebugMode()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [toggleDebugMode])

  // Memoize to prevent SceneCanvas rerenders
  const handleApartmentClick = useCallback((apartmentId: string) => {
    setSelectedApartmentId(apartmentId)
    setIsPanelOpen(true)
  }, [])

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedApartmentId(null)
  }

  const apartmentData: ApartmentData | null = selectedApartmentId
    ? (apartmentsData as Record<string, ApartmentData>)[selectedApartmentId] || null
    : null

  const getFloorplanImageSrc = (apartmentClass: string) => {
    const normalizedClass = apartmentClass.trim()
    // The CSS class is used as a floor plan image reference.
    // Place your floor plan images in /public/floorplans and name them after the CSS class.
    // Example: APT_A01 -> /floorplans/APT_A01.png
    return `/floorplans/${normalizedClass}.png`
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <a href="https://zonedpanonka.rs" className="back-arrow" aria-label="Go back">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <h1 className="navbar-title">Zoned Panonka</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-nav-desktop">
          <a href="/" className="nav-link" onClick={handleMobileMenuClose}>
            Homepage
          </a>
          <a href="#" className="nav-link" onClick={handleMobileMenuClose}>
            Link 1
          </a>
          <a href="#" className="nav-link" onClick={handleMobileMenuClose}>
            Link 2
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-button"
          onClick={handleMobileMenuToggle}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <a href="/" className="mobile-menu-link" onClick={handleMobileMenuClose}>
          Homepage
        </a>
        <a href="#" className="mobile-menu-link" onClick={handleMobileMenuClose}>
          Link 1
        </a>
        <a href="#" className="mobile-menu-link" onClick={handleMobileMenuClose}>
          Link 2
        </a>
      </div>

      {/* Debug Toggle Slider */}
      <div className="debug-toggle-container">
        <label className="debug-toggle-label">Pogledaj površinu</label>
        <button
          className={`debug-toggle-slider ${debugMode ? 'on' : 'off'}`}
          onClick={toggleDebugMode}
          aria-label={`Pogledaj površinu: ${debugMode ? 'ON' : 'OFF'}`}
          role="switch"
          aria-checked={debugMode}
        >
          <span className="slider-thumb"></span>
        </button>
      </div>

      {/* 3D Scene */}
      <Suspense fallback={null}>
        <SceneCanvas
          onApartmentClick={handleApartmentClick}
          debugMode={debugMode}
        />
      </Suspense>
      <LoaderOverlay />

      {/* Apartment Floor Plan Popup */}
      {isPanelOpen && selectedApartmentId && apartmentData && (
        <>
          <div
            className="apartment-popup-backdrop"
            onClick={handleClosePanel}
            aria-hidden="true"
          />
          <div className="apartment-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="apartment-popup-close"
              onClick={handleClosePanel}
              aria-label="Close popup"
            >
              ×
            </button>

            <img
              src={apartmentData.planImage != "" ? apartmentData.planImage : "/plans/placeholder.png"}
              alt="Apartman_slika"
              className={`apartment-popup-image ${selectedApartmentId}`}
            />
            <div className="apartment-popup-details">
              {DISPLAY_FIELDS.map((field) => (
                apartmentData[field] ? (
                  <div key={field} className="apartment-popup-row">
                    <span className="apartment-popup-label">
                      {FIELD_LABELS_SR[field] ?? field.replace(/_/g, ' ')}
                    </span>
                    <span className="apartment-popup-value">
                      {String(apartmentData[field])}
                    </span>
                  </div>
                ) : null
              ))}
            </div>
            <a className="apartment-popup-button" href={apartmentData.link} target='blank'>Pogledaj detalje</a>
          </div>
        </>
      )}
    </div>
  )
}

function LoaderOverlay() {
  const { active, progress } = useProgress()
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)))

  if (!active && roundedProgress >= 100) {
    return null
  }

  return (
    <div className="loader-overlay">
      <div className="loader-panel">
        <div className="loader-spinner" />
        <div className="loader-text">Ucitavanje objekta...</div>
        <div className="loader-progress-row">
          <div className="loader-progress-track">
            <div className="loader-progress-fill" style={{ width: `${roundedProgress}%` }} />
          </div>
          <span className="loader-percentage">{roundedProgress}%</span>
        </div>
      </div>
    </div>
  )
}

