# PatternForge - Master Implementation Plan

**Category:** Project Plan
**Last Updated:** 2026-03-29
**Status:** Active
**Maintainer:** PatternForge Team

---

## Quick Summary

PatternForge is an open-source, modern re-imagining of Stitch Fiddle — a browser-based pattern design tool for fiber arts (knitting, crochet, cross-stitch, and more). Built as a CSR-first SPA with Vite + React + TypeScript, deployed to Cloudflare Pages with PWA support. 100% free, open source (MIT), $0 operating cost.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Vite + React 19 + TypeScript | CSR-first, fast HMR, optimal for CF Pages |
| **State** | Zustand | Lightweight, no boilerplate |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Utility-first, accessible, modern |
| **Grid Engine** | HTML5 Canvas (custom) | GPU-accelerated, performant for large grids |
| **Icons** | Lucide React | Consistent, tree-shakeable |
| **Routing** | React Router v7 | SPA routing, code splitting |
| **Storage** | IndexedDB (via idb) | Local-first, offline capable |
| **PWA** | vite-plugin-pwa | Service worker, manifest, installable |
| **Testing** | Vitest + Testing Library + Playwright | Unit + integration + E2E |
| **Linting** | Biome (ESLint+Prettier replacement) | Fast, unified tooling |
| **Deploy** | Cloudflare Pages via Wrangler | Free tier, global CDN, $0 cost |
| **Backend** | Cloudflare Pages Functions | Image processing, sharing URLs |
| **Database** | Cloudflare D1 (SQLite) | Pattern sharing, user prefs |
| **Storage** | Cloudflare R2 | User-uploaded images |
| **Color Science** | culori | CIEDE2000, OKLCH color spaces |
| **PDF Export** | jsPDF | Client-side PDF generation |
| **Image Processing** | Web Workers + Canvas API | Off main thread |

## Architecture

```
PatternForge/
├── public/                  # Static assets, PWA icons
├── src/
│   ├── app/                 # App shell, routing, layout
│   │   ├── routes/          # Page components
│   │   └── layout/          # App shell, navbar, sidebar
│   ├── features/            # Feature modules (domain-driven)
│   │   ├── editor/          # Pattern editor (core feature)
│   │   ├── landing/         # Landing page
│   │   ├── gallery/         # Pattern gallery/dashboard
│   │   ├── image-converter/ # Image-to-pattern
│   │   ├── instructions/    # Written instructions
│   │   ├── export/          # Import/export system
│   │   ├── sharing/         # Share/embed patterns
│   │   ├── progress/        # Progress tracking
│   │   ├── calculators/     # Fabric/time/thread calculators
│   │   └── settings/        # User settings
│   ├── engine/              # Core rendering & logic (framework-agnostic)
│   │   ├── grid/            # Grid data structures, virtualization
│   │   ├── renderer/        # Canvas rendering engine
│   │   ├── tools/           # Drawing tools (pencil, fill, line, etc.)
│   │   ├── history/         # Undo/redo (command pattern)
│   │   ├── color/           # Color science, quantization
│   │   ├── pattern/         # Pattern model, serialization
│   │   └── image/           # Image processing, dithering
│   ├── shared/              # Shared utilities
│   │   ├── ui/              # shadcn/ui components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # Zustand stores
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   └── workers/             # Web Workers (heavy processing)
│       ├── image-worker.ts  # Image processing off main thread
│       └── export-worker.ts # Export processing off main thread
├── functions/               # Cloudflare Pages Functions (API)
│   ├── share.ts             # Share URL handlers
│   ├── image.ts             # Image processing API
│   └── patterns.ts          # Pattern CRUD API
├── tests/                   # All tests
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # Playwright E2E tests
├── docs/                    # Documentation
└── scripts/                 # Build/utility scripts
```

---

## Phase 1: Foundation & Scaffolding

### 1.1 Project Scaffolding
- Vite + React 19 + TypeScript project setup
- Tailwind CSS 4 with custom craft-inspired theme
- shadcn/ui component library setup
- Biome for linting + formatting
- Vitest + Testing Library configuration
- .gitignore (node_modules, dist, .claude, CLAUDE.md, .env, etc.)
- GitHub repo structure (README, LICENSE, CONTRIBUTING)

### 1.2 App Shell & Routing
- React Router v7 with code splitting
- App layout: responsive navbar, sidebar (collapsible)
- Routes: `/`, `/editor`, `/editor/:id`, `/gallery`, `/image-converter`, `/calculators`, `/settings`, `/shared/:id`

### 1.3 Design System
- Tailwind custom theme with CSS variables (dark/light)
- Craft-inspired color palette (warm, natural tones)
- Typography: Inter (UI) + JetBrains Mono (grid coordinates)
- shadcn/ui components setup

### 1.4 PWA Setup
- vite-plugin-pwa configuration
- Web app manifest, service worker
- Offline fallback, install prompt

### 1.5 Storage Layer
- IndexedDB via `idb` library
- Stores: patterns, settings, history, thumbnails
- Auto-save with debounce
- Pattern versioning

---

## Phase 2: Grid Engine (Core)

### 2.1 Grid Data Structure
- Sparse grid (Map-based, memory efficient)
- Cell model: color, symbol, stitchType, metadata
- Grid up to 2000x2000

### 2.2 Canvas Renderer
- HTML5 Canvas rendering with virtual viewport
- Zoom (0.1x-10x), pan, HiDPI support
- Grid lines, coordinate labels, selection highlight

### 2.3 Interaction System
- Mouse + touch + keyboard input
- Pinch-zoom, gesture pan
- Minimap for large grids

### 2.4 Drawing Tools
- Pencil, Brush (1-20 cells), Eraser, Fill, Line, Rectangle, Ellipse
- Color Picker, Text, Selection (move/copy/delete)
- Mirror Draw, Repeat/Tiling

### 2.5 Undo/Redo
- Command pattern, infinite undo (100 actions)
- Survives page reload, keyboard shortcuts

---

## Phase 3: Pattern Model & Craft System

### 3.1 Pattern Schema
- Pattern, Cell, Palette, Color, Symbol types
- Serialization to/from JSON

### 3.2 Craft Types
- Knitting (flat, in-the-round), Crochet (standard, c2c), Cross Stitch, Diamond Painting, Fuse Beads, Pixel Art

### 3.3 Color & Palette System
- OKLCH color model, CIEDE2000 delta
- Thread brand databases (DMC 489, Anchor 446)
- Color search, palette generation

### 3.4 Symbol System
- Unicode symbols (200+), custom symbols
- Symbol-to-color mapping, legend generation

---

## Phase 4: Editor UI

### 4.1 Editor Layout
- Top bar, left panel (tools/colors), center (canvas), right panel (info/minimap), bottom status bar

### 4.2 Tool Palette
- Visual tool buttons, active indicator, context-sensitive options

### 4.3 Color Palette Panel
- Color grid, search/filter, thread brands, color picker

### 4.4 Command Palette
- Ctrl+K, search actions, quick actions

---

## Phase 5: Image-to-Pattern Engine

### 5.1 Image Upload
- Drag & drop, file picker, clipboard paste, URL import

### 5.2 Color Quantization
- K-means, median cut, octree algorithms
- Perceptual matching, thread brand snapping

### 5.3 Dithering
- None, Floyd-Steinberg, Ordered, Atkinson

### 5.4 Confetti Reduction
- Post-processing cleanup, isolated stitch detection
- Before/after comparison

### 5.5 Quality Score
- Fragmentation, color complexity, workability

---

## Phase 6: Import/Export

### 6.1 Export: PNG, SVG, PDF (jsPDF), JSON, CSV
### 6.2 Import: PatternForge JSON, images, CSV
### 6.3 Print support with @media print

---

## Phase 7: Written Instructions

### 7.1 Knitting/Crochet row-by-row instructions
### 7.2 Cross stitch color-by-color stitch list
### 7.3 Output: plain text, markdown, clipboard

---

## Phase 8: Progress Tracking

### 8.1 Row counter, stitch highlighting
### 8.2 Completion statistics, time tracking

---

## Phase 9: Calculators

### 9.1 Fabric, thread/yarn, time calculators

---

## Phase 10: Landing Page & Gallery

### 10.1 Hero, features, demo, comparison, open source
### 10.2 Gallery: grid/list, thumbnails, search, sort
### 10.3 Shared pattern viewer (public, read-only)

---

## Phase 11: Cloud Backend

### 11.1 Cloudflare Pages Functions (serverless API)
### 11.2 D1 for shared patterns + user prefs
### 11.3 R2 for uploaded images
### 11.4 $0 cost (free tier only, no Durable Objects)

---

## Phase 12: Polish

### 12.1 Dark/light theme, mobile experience
### 12.2 Accessibility (ARIA, keyboard nav, screen reader)
### 12.3 Performance (virtual rendering, web workers, lazy loading)

---

## Deployment

```bash
npm run build        # Output to dist/
npx wrangler pages deploy dist/ --project-name=patternforge
```

CI/CD: GitHub Actions → Cloudflare Pages on push to main.

---

## Execution Priority

1. Phase 1 → 2 → 3 → 4 (critical path: working editor)
2. Phase 5 + 6 + 7 (parallel, enhance editor)
3. Phase 8 + 9 (independent features)
4. Phase 10 (landing page, can start early)
5. Phase 11 (backend, can parallel with features)
6. Phase 12 (ongoing polish)
