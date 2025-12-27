# Development Progress Log

> Auto-maintained by Claude during development workflow. Manual edits are allowed for session notes.

---

## Current Focus

**No active feature.** Next up: **feat-003 (Iron Horse: editable service line DAG)**.

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
| Features Completed    | 3          |
| Currently In Progress | 0          |
| Backlog Items         | 4          |
| Last Updated          | 2025-12-27 |

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

_None currently active._

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

