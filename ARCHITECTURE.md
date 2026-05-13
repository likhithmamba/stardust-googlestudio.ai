# Stardust System Architecture

This document provides a comprehensive overview of the Stardust codebase architecture, generated and validated using Graphify. It maps the foundational state management, rendering engines, physics simulations, and bridging components that constitute the application.

## 1. System Overview

Stardust is a highly interactive, physics-driven knowledge management system. At its core, it manages collections of `Notes` and renders them in various visual modes (Matrix, Orbital, Prism, Timeline, etc.). The system delegates heavy computational work to background workers, orchestrates physics in a simulated `World`, and drives a unified rendering `Engine`.

## 2. Core Architectural Components ("God Nodes")

The system is anchored by several highly connected, central abstractions:

### State Management
* **`useSettingsStore`**: The most connected module in the system (49 edges). It dictates UI settings, user preferences, and configuration across almost all components (from `AppShell` to individual `CanvasViewport` components).
* **`useStore`**: The primary application state (40 edges). Manages active data, node structures, and interactions.

### Engine & Simulation
* **`Engine`** (11 edges) & **`World`** (12 edges): The core systems responsible for orchestrating the canvas, managing the physics simulation step-loop, and applying attraction/repulsion forces.
* **`WorkerBridge`** (22 edges): Crucial for performance. It acts as a bridge to Web Workers, offloading complex layout calculations (like Barnes-Hut calculations or force-directed graph resolution) off the main UI thread.

### Data & Presentation
* **`NoteType`** (15 edges): The central data structure representing a piece of knowledge in the Stardust universe.
* **`VisualRegistry`** (12 edges): A central registry that maps underlying data models (like `NoteType`) to their corresponding visual components on the canvas.
* **`SoundManager`** (11 edges): Centralized orchestrator for auditory feedback and ambient soundscapes.

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

## 5. Known Blind Spots & Technical Debt

Based on structural analysis, the following areas represent potential technical debt or require deeper architectural alignment:

1. **Weak Cohesion in Data Import/Export**: The community handling `importData()`, `exportAllData()`, `bulkUpsertNotes()`, etc., has weak internal cohesion. This suggests the data boundary is fragmented and might benefit from a unified `DataManager` or `SyncService` abstraction.
2. **Isolated Constants/Configuration**: There are over 130 loosely connected nodes, particularly configuration constants like `LOGICAL_SLOT_RADIUS`, `MODE_DOCK_COLORS`, and `PALETTE`. Consolidating these into a stricter theme or config registry could improve maintainability.
3. **UI Sections**: Components like `AISection`, `CompareSection`, and `PricingSection` are loosely integrated with the core app, acting more like distinct landing-page components rather than integrated application features.

---
*Generated via Graphify incremental analysis on 2026-05-14.*
