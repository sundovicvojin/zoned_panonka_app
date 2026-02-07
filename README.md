# Building Viewer - 3D Interactive

A modern Next.js application for viewing and interacting with 3D building models using Three.js and React Three Fiber.

## Features

- Interactive 3D building visualization
- Clickable apartment zones with popup information
- Smooth camera controls (orbit, zoom, pan)
- Debug mode to visualize click zones
- Responsive design with modern UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Place your GLB model at:
```
public/models/building.glb
```

3. Update apartment data in:
```
data/apartments.json
```

4. Run the development server:
```bash
npm run dev
```

## Usage

- **Click apartments**: Click on any apartment zone (meshes named with `AC_` prefix) to view details
- **Rotate**: Left mouse drag
- **Zoom**: Mouse wheel
- **Pan**: Right mouse drag
- **Debug mode**: Press `D` key or add `?debug=true` to URL to show click zones

## File Structure

- `components/BuildingViewer.tsx` - Main UI component with state management
- `components/SceneCanvas.tsx` - Canvas wrapper with controls
- `components/models/BuildingModel.tsx` - GLB loading and click handling
- `data/apartments.json` - Apartment data (keys match apartment IDs)

## Model Requirements

Your GLB model should contain:
- Building meshes (visible)
- Click planes with names starting with `AC_` (e.g., `AC_APT_A01`, `AC_APT_A02`)
- Click planes will be automatically made transparent and clickable

## Customization

Simply replace:
- `public/models/building.glb` - Your 3D model
- `data/apartments.json` - Your apartment data

The apartment IDs in the JSON should match the click plane names without the `AC_` prefix.

