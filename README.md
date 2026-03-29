# PatternForge

**Design. Simulate. Stitch.**

A modern, open-source pattern design platform for fiber arts. Built as a fast, client-side-first web app with PWA support and zero cost deployment.

[![Build and Deploy](https://github.com/aliasfoxkde/PatternForge/actions/workflows/deploy.yml/badge.svg)](https://github.com/aliasfoxkde/PatternForge/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Pattern Editor** — Grid-based design with zoom, pan, and virtual rendering for large patterns (up to 2000x2000)
- **Drawing Tools** — Pencil, brush, eraser, fill, line, rectangle, ellipse, selection, mirror draw
- **Multi-Craft Support** — Knitting (flat/round), crochet (standard/C2C), cross stitch, diamond painting, fuse beads, pixel art
- **Image to Pattern** — Upload images and convert with color quantization, dithering, and confetti reduction
- **Written Instructions** — Auto-generate row-by-row instructions for knitting and crochet
- **Progress Tracking** — Row counter, stitch highlighting, completion statistics
- **Calculators** — Fabric, thread/yarn, and time estimation tools
- **Export** — PNG, SVG, PDF, JSON, CSV
- **Dark/Light Theme** — System-aware with manual toggle
- **PWA** — Install as a desktop/mobile app, works offline
- **Open Source** — MIT license, no account required, all features free

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite + React 19 + TypeScript |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| Grid Engine | HTML5 Canvas |
| Storage | IndexedDB (local-first) |
| Deploy | Cloudflare Pages |
| Testing | Vitest + Testing Library |

## Project Structure

```
src/
├── app/           # App shell, routing, layout
├── engine/        # Core engine (framework-agnostic)
│   ├── grid/      # Sparse grid data structure
│   ├── renderer/  # Canvas rendering engine
│   ├── tools/     # Drawing tools
│   ├── history/   # Undo/redo
│   ├── color/     # Color science (OKLCH, CIEDE2000)
│   ├── pattern/   # Pattern model & serialization
│   └── image/     # Image processing
├── features/      # Feature modules
├── shared/        # UI components, hooks, stores, utils
└── workers/       # Web Workers
```

## Roadmap

See [docs/PLAN.md](docs/PLAN.md) for the full implementation plan.

- **Phase 1** — Foundation (scaffolding, routing, design system, PWA) ✅
- **Phase 2** — Grid Engine (canvas renderer, drawing tools, interaction) 🔄
- **Phase 3** — Pattern Model (craft types, colors, symbols, serialization) 🔄
- **Phase 4** — Editor UI (tool palette, color panel, command palette)
- **Phase 5** — Image to Pattern (quantization, dithering, confetti reduction)
- **Phase 6** — Import/Export (PNG, SVG, PDF, JSON)
- **Phase 7** — Written Instructions (knitting, crochet, cross stitch)
- **Phase 8** — Progress Tracking
- **Phase 9** — Calculators (fabric, thread, time)
- **Phase 10** — Landing Page & Gallery
- **Phase 11** — Cloud Backend (Cloudflare Workers, D1, R2)
- **Phase 12** — Polish (mobile, accessibility, performance)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — free for personal and commercial use.
