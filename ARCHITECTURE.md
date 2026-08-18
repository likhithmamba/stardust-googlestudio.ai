# Stardust System Architecture

This document provides a comprehensive overview of the Stardust codebase architecture, generated and validated using Graphify. It maps the foundational state management, rendering engines, physics simulations, and bridging components that constitute the application.

## 1. System Overview

Stardust is a highly interactive, physics-driven knowledge management system. At its core, it manages collections of `Notes` and renders them in various visual modes (Matrix, Orbital, Prism, Timeline, etc.). The system delegates heavy computational work to background workers, orchestrates physics in a simulated `World`, and drives a unified rendering `Engine`.

## 2. Core Architectural Components ("God Nodes")

The system is anchored by several highly connected, central abstractions:

### State Management
* **`useSettingsStore`**: The most connected module in the system (49 edges). It dictates UI settings, user preferences, and configuration across almost all components (from `AppShell` to individual `CanvasViewport` components).
* **`useStore`**: The primary application state (40 edges). Manages active data, node structures, and interactions.
  * *Optimizations:* Uses browser-native `structuredClone()` for transaction state snapshots (undo/redo history) with a 300ms debounce.
  * *Dispatches:* Zustand state updates are throttled to **10fps** during physics ticks to prevent React component rendering fatigue.

### Engine & Simulation
* **`Engine`** (11 edges) & **`World`** (12 edges): The core systems responsible for orchestrating the canvas, managing the physics simulation step-loop, and applying attraction/repulsion forces.
  * *Visual Registry:* Coordinates 60fps DOM element transformations directly, detaching hot positional ticks from React updates.
* **`WorkerBridge`** (22 edges): Crucial for performance. It acts as a bridge to Web Workers, offloading complex layout calculations (like Barnes-Hut calculations or force-directed graph resolution) off the main UI thread. Decoupled from position-only updates via structural identity hashes.

### Data & Presentation
* **`NoteType`** (15 edges): The central data structure representing a piece of knowledge in the Stardust universe.
* **`VisualRegistry`** (12 edges): A central registry that maps underlying data models (like `NoteType`) to their corresponding visual components on the canvas.
* **`SoundManager`** (11 edges): Centralized orchestrator for auditory feedback and ambient soundscapes.
* **`PDF Parser`**: Fully client-side parsing pipeline powered by `pdfjs-dist` to automatically generate radial note constellations based on startup roadmap details or document reference structures.

## 3. Structural Bridges & Data Flow

Several components serve as critical cross-community bridges, connecting distinct parts of the application:

* **`ViewMode`**: Acts as the central router between the UI overlay (`Community 18`) and the specific rendering implementations for various layouts (Matrix, Orbital, Prism, etc.).
* **`NoteType`**: Bridges the core physics/engine logic with the visual boundaries and slot logic.
* **`WorkerBridge`**: Ensures smooth communication between the data stores and the heavy computation modules, providing non-blocking updates to the canvas.

## 4. UI & Layout Communities

The architecture splits specific view modes into cohesive but loosely coupled communities:
* **Matrix Mode** (`MATRIX_CONFIG`, `MatrixChrome`)
* **Orbital Mode** (`ORBITAL_CONFIG`, `OrbitalChrome`, `BlackHole`)
* **Prism / Void / Timeline Modes** (`PRISM_CONFIG`, `TIMELINE_CONFIG`)

## 5. Resolved & Outstanding Technical Debt

Based on recent structural cleanup and analysis:

1. **Weak Cohesion in Data Import/Export**: The community handling `importData()`, `exportAllData()`, `bulkUpsertNotes()`, etc., remains localized but functional.
2. **Isolated Constants/Configuration**: Consolidating constants like `LOGICAL_SLOT_RADIUS` is ongoing.
3. **[RESOLVED] UI Sections Dead Code**: The loose, unused components originally located in `src/ui/landing/` (including `CognitiveVoid`, `EngineRoom`, `CompareSection`, etc.) have been completely pruned. Visual elements, comparison matrices, and subscription blocks are now built inline inside `LandingUltimate.tsx`, reducing initial chunk overhead and codebase clutter.

## 6. Build Optimization & Chunking Strategy

To enhance Core Web Vitals (specifically LCP and CLS), the building sequence in `vite.config.ts` utilizes a custom `manualChunks` partition:
- **`framework`**: React and ReactDOM core libraries.
- **`animation`**: Framer Motion assets.
- **`vendor`**: All remaining third-party utils.
This reduces the monolithic vendor size by 29% and enables independent browser caching.

---
*Generated via Graphify incremental analysis on 2026-06-09.*

