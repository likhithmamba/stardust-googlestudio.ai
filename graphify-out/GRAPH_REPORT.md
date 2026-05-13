# Graph Report - stardust files  (2026-05-14)

## Corpus Check
- 142 files · ~420,583 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 703 nodes · 1170 edges · 80 communities (57 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `784910f1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]

## God Nodes (most connected - your core abstractions)
1. `useSettingsStore` - 49 edges
2. `useStore` - 40 edges
3. `WorkerBridge` - 22 edges
4. `NoteType` - 15 edges
5. `World` - 12 edges
6. `VisualRegistry` - 12 edges
7. `Engine` - 11 edges
8. `SoundManager` - 11 edges
9. `NOTE_STYLES` - 10 edges
10. `evaluateNote()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `SphericalChooser()` --calls--> `useSettingsStore`  [EXTRACTED]
  src/ui/spherical-chooser/SphericalChooser.tsx → src/ui/settings/settingsStore.ts
- `AppShell()` --calls--> `useSettingsStore`  [EXTRACTED]
  src/components/AppShell.tsx → src/ui/settings/settingsStore.ts
- `AppShell()` --calls--> `useStore`  [EXTRACTED]
  src/components/AppShell.tsx → src/store/useStore.ts
- `CanvasViewport()` --calls--> `useSettingsStore`  [EXTRACTED]
  src/components/CanvasViewport.tsx → src/ui/settings/settingsStore.ts
- `DashboardOverlay()` --calls--> `useSettingsStore`  [EXTRACTED]
  src/components/DashboardOverlay.tsx → src/ui/settings/settingsStore.ts

## Communities (80 total, 23 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (78): applyGhostLayer(), classifyEisenhower(), classifyMoSCoW(), classifySWOT(), estimateEffort(), estimateImpact(), evaluateAllNotes(), evaluateNote() (+70 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (11): bulkUpsertLinks(), bulkUpsertNotes(), db, exportAllData(), getAllLinks(), getAllNotes(), getAllSettings(), importData() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (17): AISection(), CompareSection(), CTASection(), FooterSection(), PricingSection(), WorkflowSection(), DualModeSection(), FloatingDebris() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (19): MatrixChrome(), OrbitalChrome(), PrismChrome(), TIMELINE_LANES, TimelineChrome(), VoidChrome(), DashboardBackground(), AMBIENT_TEXT (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (11): CreationMenuProps, SearchTeleport(), HierarchyOverlayProps, LinksOverlayProps, PLANET_TYPES, SphericalChooser(), SphericalChooserProps, LOGICAL_SLOT_RADIUS (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (27): 1. Solar Strategy (The "Day" Mode), 1. 🌀 Void Mode (Freeform), 2. 🔢 Matrix Mode (Structured Grid), 2. Zero-Point (The "Night" Mode), 3. 🌈 Prism Mode (Knowledge Graph), 4. 🪐 Orbital Mode (Priority Rings), 5. ⏳ Timeline Mode (Chronological), 🧠 AI Spark (Gemini 1.5) (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (15): ConnectionLayerProps, REAL_SIZES, initDB(), Connection, deletedConnectionIds, deletedNoteIds, DEMO_NOTES_FALLBACK, dirtyConnectionIds (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (14): BlackHole(), BlackHoleProps, MODE_ACCENTS, NotesChoiceRing(), NotesChoiceRingProps, ORBITS, TIER_SIZE, SemanticZoomController() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (15): LayoutVisuals(), LayoutVisualsProps, MATRIX_CONFIG, ORBITAL_CONFIG, PRISM_CONFIG, TIMELINE_CONFIG, Vector2, calculateTargets() (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (9): extractPlainText(), PlanetNote, PlanetNoteComponent(), PlanetNoteProps, getZoomLOD(), useZoomLOD(), ZoomLOD, REAL_SIZES (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (12): AI_MODELS, AIGenerateOptions, AIMessage, AIModelId, autoSummarize(), constellationMapper(), generateChat(), generateContent() (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.44
Nodes (8): MATRIX_CONFIG, ORBITAL_CONFIG, PRISM_CONFIG, TIMELINE_CONFIG, Vector2, LayoutStrategy, EngineNote, WorldConfig

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (11): CanvasInputHandler(), CanvasViewport(), ConnectionLayer(), MiniMap(), StarfieldLayer(), Toolbar(), HierarchyOverlay(), useEngine() (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (6): targets, FLAGS, SingularitySystem, EngineConnection, LayoutMode, Vector2

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (3): SmartLink, SmartLinkProps, VisualRegistry

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (3): World, PHYSICS_CONFIG, PhysicsSystem

### Community 17 - "Community 17"
Cohesion: 0.23
Nodes (10): applyAttractionForces(), applyBarnesHutForces(), applyCenterGravity(), config, links, node, nodes, PhysicsNode (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.2
Nodes (6): AppShell(), MODE_DOCK_COLORS, MODES, PALETTE, SettingsPanel(), ViewMode

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (10): Architecture, Getting Started, Key Features, 📊 Matrix Mode (Strategic Evaluation Engine), 🌌 Orbital Mode (Force-Directed Knowledge Graph), 🔍 Prism Mode (Advanced Spectral Refraction), Professional-Grade Knowledge Management System, Stardust Ultra (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (6): EditorOverlay(), relativeTime(), exampleTheme, editorConfig, RichTextEditor(), RichTextEditorProps

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (9): BASE, calculateNoteSize(), getNoteMass(), getNoteObjectTier(), MOON_TYPES, ObjectTier, PLANET_TYPES, RANGE (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (8): Common Components, Overview, Stardust System Heartbeat - Galactic Note Ring Overview, Structure, Usage, Variant 1: Notes Choice, Variant 2: Linking Notes, Variants

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (3): GlobalErrorBoundary, Props, State

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (4): id, InputController, note, targetEl

### Community 31 - "Community 31"
Cohesion: 0.36
Nodes (4): useKeyboardShortcuts(), ModeManager(), LandingUltimate(), App()

## Knowledge Gaps
- **133 isolated node(s):** `LOGICAL_SLOT_RADIUS`, `MODES`, `MODE_DOCK_COLORS`, `PALETTE`, `BlackHoleProps` (+128 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ViewMode` connect `Community 18` to `Community 0`, `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `NoteType` connect `Community 4` to `Community 0`, `Community 6`, `Community 8`, `Community 10`, `Community 22`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `WorkerBridge` connect `Community 7` to `Community 0`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `LOGICAL_SLOT_RADIUS`, `MODES`, `MODE_DOCK_COLORS` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._