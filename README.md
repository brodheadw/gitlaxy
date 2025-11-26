# Gitlaxy

A 3D interactive visualization of Git repositories as a galaxy. Explore your codebase as a cosmic journey through solar systems and planets.

![Gitlaxy](https://img.shields.io/badge/React-19-blue) ![Three.js](https://img.shields.io/badge/Three.js-0.175-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## Overview

Gitlaxy transforms your repository structure into a traversable 3D galaxy:

- **Folders** become **solar systems** with glowing stars at their centers
- **Files** become **planets** orbiting their parent folder's star
- **Nested folders** form a connected network of solar systems
- **File types** determine planet appearance and color

Inspired by [Gitlantis](https://github.com/gitlantis), but reimagined as a space exploration experience with No Man's Sky-style flight controls.

## Features

### Galaxy View
- Procedurally generated solar systems based on your repository structure
- Color-coded stars by folder depth (blue supergiants for top-level, red dwarfs for deep nesting)
- Volumetric nebulae scattered throughout the space
- Starfield background with 15,000+ stars

### Flight Mode
Full spaceship controls inspired by No Man's Sky:

| Control | Action |
|---------|--------|
| `Mouse` | Pitch & Yaw |
| `W` | Thrust forward |
| `S` | Brake / Reverse |
| `A` / `D` | Barrel roll |
| `Shift` | Boost (faster acceleration) |
| `ESC` | Exit fly mode |

**Speed characteristics:**
- Max speed: 3000 u/s
- Reverse speed: -300 u/s
- Maintains speed when no keys pressed (coasts)
- Auto-snaps to 0 when near stopped

### Ship Selection
Choose from 4 procedurally-rendered ships:
- **Falcon** - Balanced fighter
- **Viper** - Sleek interceptor
- **Hauler** - Heavy freighter
- **Explorer** - Long-range vessel

### Visual Effects
- Bloom and chromatic aberration post-processing
- Animated engine exhausts
- Auto-banking on turns
- Procedural planet textures based on file type

## Tech Stack

- **React 19** - UI framework
- **Three.js** - 3D rendering via `@react-three/fiber`
- **@react-three/drei** - Three.js helpers (OrbitControls, Stars, Html)
- **@react-three/postprocessing** - Visual effects
- **Zustand** - State management
- **Vite** - Build tool
- **TypeScript** - Type safety

## Project Structure

```
src/
├── components/
│   ├── Galaxy.tsx          # Main galaxy layout and solar system positioning
│   ├── SolarSystem.tsx     # Individual solar systems (star + orbiting planets)
│   ├── ProceduralPlanet.tsx # Procedural planet generation
│   ├── SpaceBackground.tsx # Volumetric nebulae
│   ├── Spaceship.tsx       # 4 ship models with exhaust effects
│   ├── ShipControls.tsx    # NMS-style flight physics
│   ├── Scene.tsx           # Three.js scene setup + post-processing
│   └── HUD.tsx             # UI overlay (controls, speed, ship selector)
├── store/
│   └── index.ts            # Zustand store (flight state, selections, etc.)
├── hooks/
│   └── useKeyboardControls.ts
├── types/
│   └── index.ts            # TypeScript types (FileNode, FolderNode, etc.)
├── utils/
│   ├── gitParser.ts        # Demo repo data generation
│   └── layout.ts           # Layout utilities
├── App.tsx
└── main.tsx
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Controls Reference

### Orbit Mode (default)
- **Left-click + drag** - Rotate camera
- **Right-click + drag** - Pan
- **Scroll** - Zoom
- **Click node** - Select file/folder

### Fly Mode
- **Click screen** - Capture mouse (pointer lock)
- **Mouse movement** - Steer ship
- **WASD** - Thrust/brake/roll
- **Shift** - Boost acceleration
- **ESC** - Exit to orbit mode

## Configuration

Flight physics can be tuned in `src/components/ShipControls.tsx`:

```typescript
const FLIGHT_CONFIG = {
  minSpeed: -300,         // Reverse limit
  maxSpeed: 3000,         // Forward limit
  acceleration: 150,      // Speed gain per second
  brakeForce: 300,        // Deceleration rate
  basePitchRate: 1.5,     // Mouse pitch sensitivity
  baseYawRate: 1.2,       // Mouse yaw sensitivity
  rollRate: 2.5,          // A/D roll speed
  mouseSensitivity: 0.004,
  // ... more options
}
```

## Future Plans

- [ ] Real git repository parsing (currently uses demo data)
- [ ] File content preview on selection
- [ ] Commit history visualization (time travel through repo history)
- [ ] Multiplayer exploration
- [ ] VR support

## License

MIT

## Acknowledgments

- Inspired by [Gitlantis](https://github.com/gitlantis)
- Flight controls inspired by No Man's Sky
- Built with the amazing React Three Fiber ecosystem
