# Development Progress Log

> Auto-maintained by Claude during development workflow. Manual edits are allowed for session notes.

---

## Current Focus

**Active Feature**: `feat-005` — Synthetic data generator + sandbox simulation (planning)

### Roadmap (kept intentionally lightweight)

- **Foundations**: Standard Gauge schema/types + local JSON persistence (no DB)
- **Phase 1 (Iron Horse)**: Editable service line DAG (React Flow) with save/load + import/export
- **Phase 2**: Sensors + dashboards + RAG overlays
- **Phase 3**: Synthetic data + sandbox simulation (scenarios)
- **Phase 4**: Dispatcher v1 rule-based reports/alerts (**AI integration later**)

> Note: as each phase is implemented, we’ll update docs (`VISION.md`, `PROGRESS.md`, and `features.json`) to reflect any scope/UX evolution so the repo stays current.

---

## Quick Stats

| Metric                | Value      |
| --------------------- | ---------- |
| Features Completed    | 5          |
| Currently In Progress | 1          |
| Backlog Items         | 2          |
| Last Updated          | 2025-12-29 |

---

## Stack Rules

These rules are validated after every implementation:

| Rule                    | Status              |
| ----------------------- | ------------------- |
| No TanStack/React Query | ✅ Validated        |
| Unit Tests Required     | ✅ Enabled (Vitest) |
| Recharts for Charts     | ✅ Validated        |
| shadcn/ui Components    | ✅ Validated        |
| Tailwind CSS v3.4.x     | ✅ Validated (v3.4.19) |

---

## Active Feature

### feat-005: Synthetic data generator + sandbox simulation

**Status**: complete  
**Complexity**: L (6-8 hours)  
**Started**: 2025-12-28

#### Summary

Generate realistic mock station metrics and provide sandbox sliders to stress-test service lines. Allow saving and comparing scenarios locally.

#### Planned Iterations (proposed)

| # | Iteration | Est. Time | Status |
|---|-----------|-----------|--------|
| 1 | Synthetic generator core | ~45 min | ✅ complete (`d850235`) |
| 2 | Scenario sliders (labor/time/quality) | ~45 min | ✅ complete (`15ffa7a`) |
| 3 | Apply scenarios to service lines (in-memory) | ~45 min | ✅ complete (`709c90e`) |
| 4 | Save/restore scenarios locally | ~45 min | ✅ complete (`0cba096`) |
| 5 | Dashboard toggle (base vs scenario) | ~45 min | ✅ complete (`4639ca3`) |

#### Progress

- Iteration 1: Added synthetic station metric generator with overrides and tests.  
- Iteration 2: Added additive scenario sliders (labor/time/quality) applied in-memory to view/RAG; base data untouched until save.
- Iteration 3: Scenario export (view-only) and build fixes; scenario-adjusted snapshot download without persisting changes.
- Iteration 4: Added local scenario save/load/reset (per service line) stored on server (no browser storage); auto-loads per service line on switch.
- Iteration 5: Dashboard toggle for base vs scenario view with named scenario selector; loads slider-delta scenarios per service line and overlays on cards/charts.

#### Upcoming architecture change (shared stations)

- Stations become global resources (single catalog). Service lines reference station_ids and layout; metrics/RAG remain global (no per-line overrides).
- No concurrency handling needed; last write is fine.
- Scenarios remain per-service-line overlays: deltas apply at view time on top of shared station metrics; shared store untouched.
- No migration script; regenerate sample data as needed to align with catalog model.
- Planned phases:
  1) Add station catalog + API/storage; service lines hold references only; reject embedded metrics.
  2) Editor resolves shared stations; editing writes to catalog; per-line props limited to layout/labels.
  3) Scenarios overlay per-line deltas atop shared base in editor/dashboard; exports resolve shared + overlay.
  4) Dashboard resolves shared metrics; scenario mode overlays per-line deltas; rollups/charts use resolved data.
  5) Cleanup: enforce validation that service lines cannot embed metrics; add basic `/api/stations` list/check; handle missing stations gracefully.

**Phase 2 status (2025-12-29)**  
- Manual smoke check: creating/editing stations in the editor writes via `/api/stations/[id]` and persists to `data/stations/*.json` (no layout saved to catalog).  
- New station creation seeds the catalog immediately; edits to name/department/metrics reflect on the node and in the catalog.  
- Add-station modal lets users choose an existing catalog station (shows department) or create a new one; new stations seed the catalog instantly.
- Next: quick UI pass to confirm save/reload hydrates from catalog; add `/api/stations` list + validation in Phase 5.

**Phase 3 progress:** Added shared scenario overlay helper (`applyScenarioToMetrics/serviceLine` + `defaultScenario`) and wired both editor and dashboard to apply deltas on top of hydrated shared metrics. Scenario export now uses the shared base + overlay helper for consistency.

**Phase 3 fix (2025-12-29):** API now returns default (zero) when no scenario name is provided, preventing auto-applying the first saved scenario. Editor loads/saves named scenarios and keeps the selected overlay applied; dashboard continues to use the shared overlay helper. Tests + build passing.

**UI enhancement (2025-12-29):** Added scenario name indicator to the editor top bar. When a named scenario (other than "default") is loaded, an emerald badge displays "Scenario: {name}" next to the service line title for clear visibility of the active scenario.

**Next (Phase 5 / validation & health):**
- Reject service-line saves that embed metrics or reference unknown stations; hydrate with fallbacks and surface a warning in the UI for missing stations. ✅ implemented
- Enforce catalog metrics as source of truth on service-line save; ignore embedded overrides. ✅ implemented
- Add a simple catalog/health view (list `/api/stations`, highlight duplicates/missing refs) for admin visibility. ✅ `/admin/stations`
- Update scenario selector copy to make “none” explicit when no overlays exist (avoid implying a default overlay). ✅ implemented
- Prep Simulation/AI alignment: plan for “Live toggle” (mock→api data_source) and Dispatcher/alerts reading the shared catalog + overlays; no code yet.

**Simulation/AI alignment:** Synthetic generation, capacity simulation, and AI what-if should operate on the shared station catalog as the base; per-line scenarios stay as overlays applied at view time. RAG/rollups compute on resolved metrics (shared + overlay).

#### Success Criteria

- [ ] Generate mock metrics per station with realistic ranges
- [ ] Scenario sliders adjust labor/time/quality and recompute RAG
- [ ] Scenarios do not mutate persisted data unless saved explicitly
- [ ] Can save/restore scenarios locally (per browser)
- [ ] Dashboard can toggle between base data and scenario view

---

## Completed Feature

### feat-004: Sensors + Dashboards (RAG v1)

**Status**: complete ✅  
**Complexity**: L (5-6 hours)  
**Completed**: 2025-12-28

#### Summary

Delivered sensor editing, RAG computation, edge styling, rollups, and dashboards:

* Metric editing for all station metrics
* Formal RAG computation + edge coloring
* Rollup stats in editor header
* Dashboard with summary cards
* Variance bar chart with RAG coloring
* QA distribution chart with benchmark overlay

#### Files Created/Modified

* `src/lib/rag/compute.ts` / `compute.test.ts`
* `src/lib/rag/rollup.ts` / `rollup.test.ts`
* `src/components/dag/ServiceLineEditor.tsx`
* `src/components/dag/StationNode.tsx`
* `src/components/dag/StationPanel.tsx`
* `src/app/dashboard/page.tsx`
* `src/components/dashboard/ServiceLineCard.tsx`
* `src/components/dashboard/VarianceChart.tsx`
* `src/components/dashboard/QADistributionChart.tsx`

#### Quality Gates Passed

* ✅ `pnpm type-check`
* ✅ `pnpm lint`
* ✅ `pnpm test`
* ✅ `pnpm build`

---

##### Iteration 1: Metric Editor Panel ⏱️ ~45 min

**Goal**: Allow editing all station metrics in the side panel.

| Task | Description |
|------|-------------|
| Expand `StationPanel` | Add form fields for `fair_pricing` (planned_hrs, actual_hrs, market_value) |
| Add World Class fields | Edit `internal_qa_score`, `standard_met`, `industry_benchmark` |
| Add Performance Proof | Dynamic key-value editor for flexible fields |
| Wire up `onUpdate` | Changes to metrics update the node in real-time |

**Verification**:
- Select a station in the editor
- See all metrics displayed in editable fields
- Edit `planned_hrs` → value updates on the node
- Change `actual_hrs` → variance recalculates automatically
- Toggle `standard_met` → RAG dot changes color
- Save → metrics persist to JSON file

---

##### Iteration 2: RAG Computation Library ⏱️ ~45 min

**Goal**: Formalize RAG logic in a tested, reusable module.

| Task | Description |
|------|-------------|
| Create `src/lib/rag/compute.ts` | Pure functions with clear interfaces |
| `computeStationRag()` | Returns RAG based on fair_pricing + world_class thresholds |
| Define thresholds | variance > 20% = red, > 10% = amber; QA < benchmark = red |
| Unit tests | Test edge cases: exactly on threshold, negative variance |
| Refactor `StationNode` | Use new `computeStationRag()` instead of inline logic |

**Verification**:
- Run `pnpm test` → RAG tests pass
- Station with variance > 20% shows red dot
- Station with variance 15% shows amber dot
- Station at/under budget with good QA shows green

---

##### Iteration 3: Edge RAG Styling ⏱️ ~30 min

**Goal**: Color edges based on the RAG status of connected stations.

| Task | Description |
|------|-------------|
| Compute edge RAG | Edge inherits worst RAG of source/target stations |
| Custom edge styles | Use React Flow's style prop for stroke colors |
| Color mapping | Green → emerald, Amber → amber, Red → red stroke |

**Verification**:
- Edge between two green stations is emerald
- Edge connecting to a red station turns red
- Change station metrics → connected edges update

---

##### Iteration 4: Service Line Rollups ⏱️ ~45 min

**Goal**: Aggregate metrics across all stations in a service line.

| Task | Description |
|------|-------------|
| Create `src/lib/rag/rollup.ts` | Aggregation functions |
| `computeServiceLineRollup()` | total_planned, total_actual, avg_qa, variance_pct |
| `computeServiceLineRag()` | red if any station red, amber if any amber |
| Add rollup display | Summary stats in editor header |
| Unit tests | Test with various station combinations |

**Verification**:
- Editor header shows "Total: 63h planned / 66h actual (+5%)"
- Shows "4/5 stations at standard"
- Overall RAG badge reflects worst station

---

##### Iteration 5: Dashboard + Summary Cards ⏱️ ~1 hour

**Goal**: Create a dedicated dashboard page with RAG summary cards.

| Task | Description |
|------|-------------|
| Create `/dashboard` route | New page with list of service lines |
| Fetch all service lines | Use existing API |
| RAG Summary Cards | Card per service line with key stats |
| Navigation | Link from home page + editor header |

**Verification**:
- Navigate to `/dashboard`
- See cards for each service line
- Cards show overall RAG status
- Click card → opens editor with that service line

---

##### Iteration 6: Variance Bar Chart ⏱️ ~45 min

**Goal**: Add a Recharts bar chart showing variance by station.

| Task | Description |
|------|-------------|
| Create `VarianceChart.tsx` | Recharts BarChart component |
| Show variance per station | X = station names, Y = variance hours |
| Color bars by RAG | Red/amber/green based on station RAG |

**Verification**:
- Dashboard shows bar chart
- Bars are colored by RAG
- Hover shows tooltip with exact values

---

##### Iteration 7: QA Distribution Chart ⏱️ ~30 min

**Goal**: Add a chart showing QA scores vs benchmark.

| Task | Description |
|------|-------------|
| Create `QADistributionChart.tsx` | Recharts AreaChart or BarChart |
| Plot QA scores | Each station's score vs benchmark line |
| Reference line | Horizontal line at industry benchmark |

**Verification**:
- Chart shows QA scores for all stations
- Benchmark line visible
- Stations below benchmark stand out

---

#### Files to be Created/Modified

```
src/
├── lib/
│   └── rag/
│       ├── compute.ts          # RAG computation (Iteration 2)
│       ├── compute.test.ts     # Unit tests (Iteration 2)
│       ├── rollup.ts           # Aggregation (Iteration 4)
│       └── rollup.test.ts      # Tests (Iteration 4)
├── app/
│   └── dashboard/
│       ├── page.tsx            # Dashboard (Iteration 5)
│       └── layout.tsx          # Layout (Iteration 5)
├── components/
│   ├── dag/
│   │   ├── StationPanel.tsx    # Expand metrics (Iteration 1)
│   │   └── ServiceLineEditor.tsx  # Edge styles, header (Iterations 3, 4)
│   └── dashboard/
│       ├── ServiceLineCard.tsx # Summary card (Iteration 5)
│       ├── VarianceChart.tsx   # Bar chart (Iteration 6)
│       └── QADistributionChart.tsx  # QA chart (Iteration 7)
```

---

#### Success Criteria

- [ ] Can edit all station metrics in the side panel
- [ ] RAG status computed with formal, tested logic
- [ ] Edges colored based on station RAG
- [ ] Service line rollups visible in editor
- [ ] Dashboard page with summary cards
- [ ] Variance bar chart with RAG coloring
- [ ] QA distribution chart with benchmark line

---

## Completed Features

### feat-003: Iron Horse — Editable Service Line DAG

**Status**: complete ✅  
**Complexity**: L (4-8 hours)  
**Completed**: 2025-12-27  
**Commits**: `cad0528`, `35c4ba6`, `4c3f590`, `1792334`, `3dd8ba4`, `1a2d2c5`, `cc8a293`

#### Summary

Built a full visual DAG editor using React Flow for creating and editing service lines:

* **View**: Display service lines as interactive node graphs
* **Custom Nodes**: Styled StationNode with RAG indicators, metrics, department badges
* **Selection Panel**: Side panel showing full station/edge details
* **Editing**: Edit station name, department, data source in real-time
* **Add/Delete**: Create new stations, remove with button or keyboard
* **Edge Management**: Draw connections, edit weights, delete tracks
* **Save/Load**: Persist to API, switch between service lines
* **Create/Import/Export**: New blank service lines, JSON file I/O

#### Iterations Completed

| # | Feature | Commit |
|---|---------|--------|
| 1 | View-Only DAG | `cad0528` |
| 2 | Custom Nodes + Selection | `35c4ba6` |
| 3 | Edit Station Properties | `4c3f590` |
| 4 | Add & Delete Stations | `1792334` |
| 5 | Edge Management | `3dd8ba4` |
| 6 | Save & Load | `1a2d2c5` |
| 7 | Create New & Import/Export | `cc8a293` |

#### Files Created

* `src/app/editor/page.tsx` - Editor page
* `src/app/editor/layout.tsx` - Full-screen layout
* `src/components/dag/ServiceLineEditor.tsx` - Main React Flow wrapper
* `src/components/dag/StationNode.tsx` - Custom station node
* `src/components/dag/StationPanel.tsx` - Station details panel
* `src/components/dag/EdgePanel.tsx` - Edge details panel
* `src/lib/dag/transforms.ts` - ServiceLine ↔ React Flow conversion
* `src/hooks/useServiceLine.ts` - API operations hook

#### Quality Gates Passed

* ✅ `pnpm type-check` - No type errors
* ✅ `pnpm lint` - No linting errors
* ✅ `pnpm test` - All tests pass
* ✅ `pnpm build` - Build successful

---

### feat-007: Unit tests + workflow gate (Vitest)

**Status**: complete ✅  
**Complexity**: M  
**Completed**: 2025-12-27  
**Commit**: `d9338f2`

---

#### Overview

Build a visual DAG editor using React Flow that allows users to create, edit, and manage service lines. This is the core UX of BlueprintOS — the "blueprint" where users design their operational workflows.

The editor will follow the **rail network metaphor**:
- **Nodes** = Stations (departments/processing points)
- **Edges** = Tracks (connections between stations with cost/time weights)
- **Canvas** = The service line blueprint

---

#### User Stories

1. **View**: User can see a visual DAG of an existing service line
2. **Navigate**: User can pan/zoom the canvas
3. **Add Station**: User can add new station nodes to the canvas
4. **Edit Station**: User can click a station to edit its properties (name, department, data source)
5. **Delete Station**: User can remove stations (and their connected edges)
6. **Connect Stations**: User can draw edges between stations
7. **Edit Edge**: User can set edge weights (cost, time)
8. **Delete Edge**: User can remove edges
9. **Save**: User can save the service line to the backend
10. **Load**: User can load existing service lines from the backend
11. **Create New**: User can create a new blank service line
12. **Import/Export**: User can import/export service lines as JSON files

---

#### Technical Approach

##### 1. Dependencies

```bash
pnpm add reactflow
```

React Flow v11+ is a mature library for building node-based editors. It handles:
- Canvas pan/zoom
- Node drag & drop
- Edge connection drawing
- Selection and deletion
- Keyboard shortcuts

##### 2. File Structure

```
src/
├── app/
│   └── editor/
│       ├── page.tsx          # Main editor page
│       └── layout.tsx        # Editor layout (no header)
├── components/
│   └── dag/
│       ├── ServiceLineEditor.tsx   # Main React Flow wrapper
│       ├── StationNode.tsx         # Custom node component
│       ├── TrackEdge.tsx           # Custom edge component (optional)
│       ├── EditorToolbar.tsx       # Top toolbar (save, load, export)
│       └── StationPanel.tsx        # Side panel for station details
├── hooks/
│   └── useServiceLine.ts     # Hook for service line CRUD
└── lib/
    └── dag/
        └── transforms.ts     # Convert ServiceLine <-> React Flow format
```

##### 3. Data Transform Layer

React Flow uses its own node/edge format. We need bidirectional transforms:

```typescript
// ServiceLine → React Flow
function toReactFlowNodes(stations: Station[]): Node[]
function toReactFlowEdges(edges: TrackEdge[]): Edge[]

// React Flow → ServiceLine
function fromReactFlowNodes(nodes: Node[]): Station[]
function fromReactFlowEdges(edges: Edge[]): TrackEdge[]
```

##### 4. Custom Node Design

The `StationNode` component will display:
- Station name (header)
- Department badge
- RAG status indicator (colored dot)
- Data source indicator (mock/api)
- Connection handles (top/bottom or left/right)

Visual style: Rail station aesthetic with dark slate background, emerald accents.

##### 5. Editor Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Toolbar: New | Open | Save | Import | Export]              │
├──────────────────────────────────────────────┬───────────────┤
│                                              │               │
│                                              │   Station     │
│           React Flow Canvas                  │   Details     │
│           (nodes + edges)                    │   Panel       │
│                                              │               │
│                                              │   (appears    │
│                                              │    when node  │
│                                              │    selected)  │
│                                              │               │
└──────────────────────────────────────────────┴───────────────┘
```

##### 6. State Management

Use React state + the existing API:
- `useServiceLine` hook for fetching/saving
- React Flow's internal state for canvas interactions
- `onNodesChange`, `onEdgesChange`, `onConnect` callbacks

##### 7. Keyboard Shortcuts

- `Delete` / `Backspace`: Remove selected nodes/edges
- `Ctrl+S`: Save
- `Ctrl+Z`: Undo (stretch goal)

---

#### Implementation Iterations

Each iteration is a testable checkpoint. After each one, you verify it works before proceeding.

---

##### Iteration 1: View-Only DAG ⏱️ ~1 hour

**Goal**: Display an existing service line as a visual DAG.

| Task | Description |
|------|-------------|
| Install React Flow | `pnpm add reactflow` |
| Create `/editor` route | Basic page with React Flow canvas |
| Build `transforms.ts` | Convert ServiceLine → React Flow nodes/edges |
| Load `SL-360-CAMPAIGN` | Fetch from API on page load |
| Render DAG | Display nodes and edges on canvas |

**You can verify**:
- Navigate to `/editor`
- See the 5 stations from SL-360-CAMPAIGN as boxes
- See the 4 edges connecting them
- Pan and zoom the canvas

---

##### Iteration 2: Custom Nodes + Selection Panel ⏱️ ~1 hour

**Goal**: Click a station to see its details in a side panel.

| Task | Description |
|------|-------------|
| Build `StationNode` | Custom styled node (name, department, RAG dot) |
| Build `StationPanel` | Side panel showing selected station details |
| Wire selection | Click node → panel shows that station's info |

**You can verify**:
- Nodes look styled (not default React Flow boxes)
- Click a station → side panel appears with its name, department, metrics
- Click another station → panel updates

---

##### Iteration 3: Edit Station Properties ⏱️ ~45 min

**Goal**: Modify station properties and see changes on canvas.

| Task | Description |
|------|-------------|
| Add form inputs to panel | Edit name, department, data source |
| Update node on change | Changes reflect immediately on the node |
| Mark unsaved changes | Visual indicator that there are unsaved edits |

**You can verify**:
- Select a station
- Change its name in the panel → node label updates
- Change department → badge updates
- See "unsaved changes" indicator

---

##### Iteration 4: Add & Delete Stations ⏱️ ~45 min

**Goal**: Create new stations and remove existing ones.

| Task | Description |
|------|-------------|
| Add "New Station" button | Creates a node at center of viewport |
| Delete selected station | Button in panel or Delete key |
| Handle orphaned edges | Remove edges when station is deleted |

**You can verify**:
- Click "Add Station" → new node appears
- Select it, edit name
- Select a station, press Delete → it's removed
- Connected edges are also removed

---

##### Iteration 5: Edge Management ⏱️ ~45 min

**Goal**: Connect stations and edit edge weights.

| Task | Description |
|------|-------------|
| Enable edge connections | Drag from handle to handle to create edge |
| Edge selection | Click edge to select it |
| Edit edge weights | Panel or popover to set cost/time |
| Delete edges | Delete key or button |

**You can verify**:
- Drag from one station to another → edge created
- Click an edge → see its weight
- Edit weight → edge updates
- Delete edge → it's removed

---

##### Iteration 6: Save & Load ⏱️ ~45 min

**Goal**: Persist changes and load different service lines.

| Task | Description |
|------|-------------|
| Build `EditorToolbar` | Top bar with actions |
| Save button | POST/PUT to API, clears unsaved indicator |
| Open dropdown | List available service lines |
| Load service line | Fetch and display selected one |
| `useServiceLine` hook | Encapsulate fetch/save logic |

**You can verify**:
- Make changes, click Save
- Refresh page → changes persisted
- Open dropdown, select `SL-RADIO-SPOT` → loads different service line
- Edit it, save, switch back → both persisted

---

##### Iteration 7: Create New & Import/Export ⏱️ ~45 min

**Goal**: Start fresh and transfer service lines as JSON files.

| Task | Description |
|------|-------------|
| "New" button | Prompts for ID/name, creates blank service line |
| Export button | Downloads current service line as `.json` file |
| Import button | File picker, loads JSON into editor |
| Validation | Validate imported JSON matches schema |

**You can verify**:
- Click New → enter name → blank canvas
- Add a few stations, save
- Click Export → downloads JSON file
- Edit JSON externally, Import → changes appear

---

**Total Estimate**: ~6 hours across 7 iterations

---

#### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| React Flow learning curve | Use official examples; stick to core features |
| Complex state sync | Keep transforms pure; single source of truth in React Flow |
| Large service lines slow | React Flow handles 1000+ nodes; not a concern for MVP |

---

#### Success Criteria

- [ ] Can view existing `SL-360-CAMPAIGN` as a visual DAG
- [ ] Can add/edit/delete stations
- [ ] Can connect/disconnect tracks between stations
- [ ] Can save changes back to the JSON file via API
- [ ] Can create a new blank service line
- [ ] Can export/import service lines as JSON

---

#### Decision Points for Review

1. **Side panel vs modal** for station editing — Planning for side panel (less disruptive)
2. **Edge labels** — Show cost/time on edges? (Yes, via custom edge or edge labels)
3. **New station defaults** — What default metrics? (Empty/zero values, user fills in)
4. **Auto-layout** — Add a "tidy" button later? (Deferred to future enhancement)

---

## Completed Features

### feat-001: Project Initialization

**Status**: complete  
**Complexity**: M  
**Completed**: 2025-12-27

#### Summary

Initial project setup with the full tech stack:

* Next.js 14.2.35 with App Router
* TypeScript 5.x with strict mode
* Tailwind CSS v3.4.19 (NOT v4.x)
* shadcn/ui components (button, card, input, label)
* Recharts 3.6.0 for charting
* ESLint + Prettier configured
* Project structure with src/, components/, hooks/, lib/, types/

#### Files Created/Modified

* `src/app/page.tsx` - Welcome page with tech stack showcase
* `src/app/layout.tsx` - Root layout
* `src/app/globals.css` - Global styles with CSS variables
* `src/lib/utils.ts` - Utility functions (cn)
* `src/types/index.ts` - TypeScript type definitions
* `src/hooks/index.ts` - Custom hooks placeholder
* `src/components/ui/*` - shadcn/ui components
* `src/components/charts/LineChartComponent.tsx` - Recharts wrapper
* `tailwind.config.ts` - Tailwind configuration
* `package.json` - Dependencies and scripts
* `.eslintrc.json` - ESLint configuration
* `.prettierrc` - Prettier configuration

#### Quality Gates Passed

* ✅ `pnpm type-check` - No type errors
* ✅ `pnpm lint` - No linting errors
* ✅ `pnpm build` - Build successful

---

### feat-002: Local JSON persistence for Service Lines (no DB)

**Status**: complete ✅  
**Complexity**: M  
**Completed**: 2025-12-27
**Commit**: `d9338f2`

#### Summary

Added local JSON file storage for Standard Gauge `ServiceLine` objects plus minimal validation/normalization:

* Server-only filesystem helpers in `src/lib/storage/serviceLines.ts`
* CRUD API routes:
  * `GET/POST /api/service-lines`
  * `GET/PUT/DELETE /api/service-lines/[id]`
* Seed service lines in `data/service-lines/*.json`
* Normalization keeps `labor_variance` and `updated_at` consistent on write

#### Quality Gates Passed

* ✅ `pnpm type-check` - No type errors
* ✅ `pnpm lint` - No linting errors
* ✅ `pnpm test` - All tests pass
* ✅ `pnpm build` - Build successful

---

### feat-007: Unit tests + workflow gate (Vitest)

**Status**: complete ✅  
**Complexity**: M  
**Completed**: 2025-12-27  
**Commit**: `d9338f2`

#### Summary

Added Vitest unit test framework with quality gates enforced in the development workflow:

* Vitest configuration with Node environment
* `server-only` aliased to no-op for test compatibility
* Unit tests for normalize, validate, and storage modules
* Tests are required to pass before merging

#### Files Created/Modified

* `vitest.config.ts` - Vitest configuration
* `src/test/noopServerOnly.ts` - server-only stub for tests
* `src/lib/blueprint/normalize.test.ts` - Normalization tests
* `src/lib/blueprint/validate.test.ts` - Validation tests
* `src/lib/storage/serviceLines.test.ts` - Storage tests

#### Quality Gates Passed

* ✅ `pnpm test` - 12 tests pass

---

## Session Notes

### Getting Started

Welcome to the project! Here's how to use the workflow:

1. **Start planning**: Tell Claude what feature you want to build
2. **Review the plan**: Claude will show you what it intends to do
3. **Accept**: Say "accept" or "proceed" when you're happy with the plan
4. **Watch implementation**: Claude will code, lint, and fix errors
5. **Verify**: Manually test and confirm everything works
6. **Commit**: Claude will commit and push when you approve

### Commands Cheat Sheet

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| /plan [feature]   | Start planning a new feature         |
| /status           | View current project state           |
| /accept           | Accept plan and start implementation |
| /implement        | Continue paused implementation       |
| /verify           | Confirm feature works                |
| /commit           | Commit and push changes              |
| /fix              | Fix reported issues                  |
| /validate-stack   | Check stack rules compliance         |

### Stack Reminders

* **Charts**: Use Recharts only (not Chart.js, D3, Victory)
* **Data Fetching**: Use fetch, Server Actions, or SWR (not TanStack Query)
* **UI Components**: Use shadcn/ui from `@/components/ui`
* **Styling**: Tailwind CSS v3.4.x (not v4.x)
* **Unit Tests**: Run `pnpm test` and do not proceed/merge with failing tests

---

### 2025-12-27 - Project Initialization

* Initialized Next.js 14 project using create-next-app
* Configured shadcn/ui with default settings
* Installed Recharts for charting
* Set up ESLint + Prettier integration
* Created project structure per CLAUDE.md specifications
* All quality checks pass (type-check, lint, build)

---

