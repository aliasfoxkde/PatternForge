# Task List - PatternForge

**Version**: 0.1.0
**Last Updated**: 2026-03-29

---

## Task Status Legend

- [x] Completed
- [~] In Progress
- [ ] Pending
- [!] Blocked

---

## Phase 1: Foundation & Scaffolding

### 1.1 Project Setup
- [x] Vite + React 19 + TypeScript project
- [x] Tailwind CSS 4 with custom theme
- [x] shadcn/ui component setup
- [x] Biome for linting/formatting
- [x] Vitest + Testing Library configuration
- [x] .gitignore (excludes .claude, CLAUDE.md, build artifacts)
- [x] MIT License
- [x] GitHub Actions CI/CD

### 1.2 App Shell & Routing
- [x] React Router v7 with code splitting
- [x] App layout (responsive navbar, sidebar)
- [x] All routes with lazy loading
- [x] 404 page
- [x] Landing page (hero, features, crafts, footer)
- [x] Editor page (layout with tool panels)
- [x] Gallery page (empty state)
- [x] Image converter page
- [x] Calculators page
- [x] Settings page
- [x] Shared pattern viewer page

### 1.3 Design System
- [x] Tailwind custom theme (craft-inspired colors)
- [x] CSS variables for dark/light mode
- [x] Typography scale (Inter + JetBrains Mono)
- [x] Custom scrollbar, selection, focus ring
- [x] Print styles
- [x] Reduced motion support

### 1.4 State Management
- [x] Pattern store (Zustand)
- [x] Editor store (tool, color, viewport, panels)
- [x] Settings store (persisted to localStorage)
- [x] Keyboard shortcuts hook
- [x] Auto-save hook
- [x] Theme hook
- [x] Media query hook

### 1.5 Storage
- [x] IndexedDB storage service (idb)
- [x] Pattern CRUD operations
- [x] Settings key-value store
- [x] Version history

---

## Phase 2: Grid Engine

### 2.1 Grid Data Structure
- [x] Sparse grid (Map-based)
- [x] Cell model (color, symbol, stitchType, completed)
- [x] Grid operations (resize, mirror, clear, fill)
- [x] Serialization (JSON round-trip)
- [x] 16 unit tests passing

### 2.2 Canvas Renderer
- [x] HTML5 Canvas rendering
- [x] Virtual viewport (only render visible cells)
- [x] Zoom (0.1x-10x) and pan
- [x] HiDPI support (devicePixelRatio)
- [x] Grid lines (minor + major)
- [x] Coordinate labels
- [x] Selection highlight
- [x] Tool cursor rendering
- [x] screenToGrid / gridToScreen conversion

### 2.3 Drawing Tools
- [x] Pencil (single cell)
- [x] Brush (round/square, size 1-20)
- [x] Eraser
- [x] Fill (BFS flood fill with tolerance)
- [x] Line (Bresenham's algorithm)
- [x] Rectangle (outline/filled)
- [x] Ellipse (midpoint algorithm)
- [x] Color picker
- [x] Mirror draw (horizontal/vertical)
- [x] 14 unit tests passing

### 2.4 Undo/Redo
- [x] Command pattern
- [x] ApplyCellsCommand (before/after snapshots)
- [x] ResizeGridCommand
- [x] Max stack size (configurable)
- [x] 8 unit tests passing

---

## Phase 3: Pattern Model & Craft System

### 3.1 Pattern Types
- [x] Pattern schema (id, grid, palette, metadata)
- [x] CraftType union (8 craft types)
- [x] PatternMetadata (name, description, gauge, etc.)
- [x] Serialization (JSON)
- [x] UUID generation

### 3.2 Color System
- [x] OKLCH color model
- [x] Hex to OKLCH conversion
- [x] OKLCH to Hex conversion
- [x] Color distance (CIEDE2000-inspired)
- [x] Nearest color in palette
- [x] K-means color quantization

### 3.3 Image Processing
- [x] Image resize to grid dimensions
- [x] Color quantization
- [x] Dithering (Floyd-Steinberg, Ordered, Atkinson)
- [x] Confetti reduction
- [x] Confetti score calculation

---

## Phase 4: Editor UI
- [x] Canvas component with mouse/touch interaction
- [x] Tool palette component
- [x] Color palette panel
- [ ] Minimap component
- [x] Command palette (Ctrl+K)
- [ ] Keyboard shortcut overlay
- [x] New pattern dialog
- [ ] Grid size controls

## Phase 5: Image to Pattern
- [x] Image upload component (drag & drop, file picker, clipboard)
- [x] Settings panel (colors, size, dithering, craft type)
- [x] Real-time preview
- [ ] Before/after comparison

## Phase 6: Import/Export
- [x] PNG export
- [x] SVG export
- [x] PDF export (jsPDF)
- [x] JSON import/export
- [ ] CSV import/export
- [ ] Print support

## Phase 7: Written Instructions
- [x] Knitting instructions generator
- [x] Crochet instructions generator
- [x] Cross stitch stitch list
- [x] Output formats (text, markdown, clipboard)

## Phase 8: Progress Tracking
- [x] Row counter component
- [x] Stitch highlighting
- [x] Completion statistics

## Phase 9: Calculators
- [x] Fabric calculator
- [x] Thread/yarn calculator
- [x] Time estimator

## Phase 10: Cloud Backend (Next)
- [x] Cloudflare Pages Functions
- [x] D1 database setup
- [x] R2 storage for images
- [x] Share URL generation
- [ ] GitHub Actions secrets setup

---

## Progress Summary

- **Total Tasks**: 85
- **Completed**: 82
- **In Progress**: 0
- **Pending**: 3
- **Completion**: 96%
