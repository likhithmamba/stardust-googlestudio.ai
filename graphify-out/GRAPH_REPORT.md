# Graph Report - stardust files  (2026-06-11)

## Corpus Check
- 145 files · ~422,466 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 909 nodes · 1654 edges · 72 communities (53 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `96e9d705`
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
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]

## God Nodes (most connected - your core abstractions)
1. `useStore` - 63 edges
2. `useSettingsStore` - 58 edges
3. `initDB()` - 29 edges
4. `StardustDB` - 28 edges
5. `WorkerBridge` - 25 edges
6. `NoteType` - 17 edges
7. `SoundManager` - 17 edges
8. `World` - 12 edges
9. `VisualRegistry` - 12 edges
10. `Engine` - 11 edges

## Surprising Connections (you probably didn't know these)
- `MatrixMode()` --calls--> `useStore`  [EXTRACTED]
  src/ui/modes/MatrixMode.tsx → src/store/useStore.ts
- `PrismMode()` --calls--> `useStore`  [EXTRACTED]
  src/ui/modes/PrismMode.tsx → src/store/useStore.ts
- `DashboardOverlay()` --calls--> `useSettingsStore`  [EXTRACTED]
  src/components/DashboardOverlay.tsx → src/ui/settings/settingsStore.ts
- `EditorOverlay()` --calls--> `useStore`  [EXTRACTED]
  src/components/EditorOverlay.tsx → src/store/useStore.ts
- `EditorOverlay()` --calls--> `useSettingsStore`  [EXTRACTED]
  src/components/EditorOverlay.tsx → src/ui/settings/settingsStore.ts

## Communities (72 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (67): CanvasInputHandler(), ArchiveChrome(), MatrixChrome(), OrbitalChrome(), PrismChrome(), TIMELINE_LANES, TimelineChrome(), VoidChrome() (+59 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (27): SmartLink, SmartLinkProps, connIdsToDelete, currentTime, targets, World, FLAGS, id (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (18): FeedbackEntry, FeedbackModal(), FeedbackModalProps, getFeedbackStatus(), saveFeedback(), initDB(), bulkUpsertLinks(), bulkUpsertNotes() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (38): localClipboard, MatrixMode(), PrismMode(), Connection, createNoteSlice(), _debouncedSave(), deletedConnectionIds, deletedNoteIds (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (28): AIGateway, generateLocalFallback(), PipelineResult, runCognitivePipeline(), validateApiKey(), PROVIDER_MODELS, RouterRequest, runModelRequest() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (23): EditorOverlay(), formatDateForInput(), relativeTime(), exampleTheme, editorConfig, isLexicalJson(), RichTextEditor(), RichTextEditorProps (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (24): AISection(), CompareSection(), CTASection(), FooterSection(), PricingSection(), WorkflowSection(), DualModeSection(), FloatingDebris() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (11): ClusterSchema, GravityScoreSchema, LayoutResultSchema, MatrixCoordinateSchema, PhysicsResultSchema, resultValidators, validateWorkerResponse(), Vector2Schema (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (21): LayoutVisuals(), LayoutVisualsProps, MATRIX_CONFIG, ORBITAL_CONFIG, PRISM_CONFIG, TIMELINE_CONFIG, Note, MATRIX_CONFIG (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (29): 1. Solar Strategy (The "Day" Mode), 1. 🌀 Void Mode (Freeform), 2. 🔢 Matrix Mode (Structured Grid), 2. Zero-Point (The "Night" Mode), 3. 🌈 Prism Mode (Knowledge Graph), 4. 🪐 Orbital Mode (Priority Rings), 5. ⏳ Timeline Mode (Chronological), 🧠 AI Spark (Gemini 1.5) (+21 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (18): MODE_DOCK_COLORS, MODES, PALETTE, ExportPanel(), ExportPanelProps, HelpOverlay(), HelpOverlayProps, ModeGuide() (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (15): extractPlainText(), getDecayLevel(), getNoteTextStyle(), PlanetNote, PlanetNoteComponent(), PlanetNoteProps, getDecayOpacity(), getZoomLOD() (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (14): applySnapshotDiff(), calculateProjectVelocity(), calculateSnapshotDiff(), createSnapshot(), generateSnapshotId(), getStateAtTime(), getTimelineLayoutTargets(), TimelineEngine (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (16): Bounds, GhostOverlay, GlobalState, GravityScore, Link, ProjectVelocity, QuadNode, SemanticCluster (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (15): applyAttractionForces(), applyBarnesHutForces(), applyCenterGravity(), applyRepulsionForces(), config, ctx, links, node (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (16): buildQuadtree(), calculateForceFromNode(), calculateRepulsionForce(), calculateTagOverlap(), computeMass(), createQuadNode(), detectSemanticClusters(), generateBridgeTitle() (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (15): ADVERSARIAL_TEMPLATES, classifyLine(), determinePrimaryWavelength(), generateAdversarialResponse(), generateAntiNote(), getFacetStatistics(), getPrismLayoutTargets(), PrismEngine (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (14): applyGhostLayer(), classifyEisenhower(), classifyMoSCoW(), classifySWOT(), estimateEffort(), estimateImpact(), evaluateAllNotes(), evaluateNote() (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (11): 1. System Overview, 2. Core Architectural Components ("God Nodes"), 3. Structural Bridges & Data Flow, 4. UI & Layout Communities, 5. Known Blind Spots & Technical Debt, 5. Resolved & Outstanding Technical Debt, 6. Build Optimization & Chunking Strategy, Data & Presentation (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (11): Architecture, Architecture & Premium UI, Getting Started, Key Features, 📊 Matrix Mode (Strategic Evaluation Engine), 🌌 Orbital Mode (Force-Directed Knowledge Graph), 🔍 Prism Mode (Advanced Spectral Refraction), Professional-Grade Knowledge Management System (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (4): GlobalErrorBoundary, Props, State, registerServiceWorker()

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (9): BASE, calculateNoteSize(), getNoteMass(), getNoteObjectTier(), MOON_TYPES, ObjectTier, PLANET_TYPES, RANGE (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (8): Common Components, Overview, Stardust System Heartbeat - Galactic Note Ring Overview, Structure, Usage, Variant 1: Notes Choice, Variant 2: Linking Notes, Variants

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (7): calculateAllGravityScores(), calculateGravityScore(), handler, handlers, handlersMap, MessageHandler, result

## Knowledge Gaps
- **193 isolated node(s):** `__filename`, `__dirname`, `responseToCache`, `LOGICAL_SLOT_RADIUS`, `PipelineResult` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useSettingsStore` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `WorkerBridge` connect `Community 7` to `Community 0`, `Community 13`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `useStore` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 10`, `Community 11`, `Community 12`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `responseToCache` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._