# CLAUDE.md – Next.js + TypeScript Project Guide with Developer Workflow

> **Quick Start**: Run `claude /init-project` to set up tracking files, then `claude /plan [feature]` to begin development.

---

## 🔄 Developer Workflow System

This project uses a structured workflow to ensure quality, traceability, and user control at every stage.

### Workflow Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. PLAN  →  2. REVIEW  →  3. ACCEPT  →  4. IMPLEMENT  →  5. VERIFY  →  6. COMMIT  │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Phase         | Description                                                                 | User Action Required          |
| ------------- | --------------------------------------------------------------------------- | ----------------------------- |
| **PLAN**      | Claude analyzes requirements, proposes approach, identifies files to change | None (automatic)              |
| **REVIEW**    | User reviews the plan, asks questions, requests changes                     | Review & provide feedback     |
| **ACCEPT**    | User approves the plan to proceed                                           | Say "accept" or "proceed"     |
| **IMPLEMENT** | Claude writes code, runs linting, fixes build errors, validates stack rules | None (automatic)              |
| **VERIFY**    | User manually tests functionality, confirms it works                        | Confirm "works" or "verified" |
| **COMMIT**    | Claude stages, commits with conventional message, pushes                    | Approve commit message        |

### Phase Details

#### 1️⃣ PLAN Mode

When user requests a feature, Claude will:

* Parse the requirement and break into subtasks
* Identify all files that need to be created/modified
* List dependencies and potential breaking changes
* Estimate complexity (S/M/L/XL)
* Update `features.json` with status `"planning"`
* Output a structured plan in `PROGRESS.md`

**Trigger phrases**: "plan", "design", "how would you", "think about"

#### 2️⃣ REVIEW Phase

Claude presents the plan and waits for user feedback:

* Answers clarifying questions
* Adjusts approach based on feedback
* Does NOT write any implementation code yet

**User options**: "looks good", "change X", "what about Y?", "accept"

#### 3️⃣ ACCEPT Gate

User explicitly approves the plan:

* Claude updates `features.json` status to `"accepted"`
* Logs acceptance timestamp in `PROGRESS.md`

**Trigger phrases**: "accept", "approved", "proceed", "go ahead", "implement"

#### 4️⃣ IMPLEMENT Phase

Claude executes the plan with quality gates:

```
# Implementation Checklist (Claude runs automatically)
□ Write/modify code files
□ Run: pnpm lint --fix
□ Run: pnpm tsc --noEmit (clear type errors)
□ Run: pnpm build (clear build errors)
□ Fix any errors found (loop until clean)
□ Validate Stack Rules (see below)
□ Update features.json status to "implemented"
□ Log implementation details in PROGRESS.md
```

##### Stack Rules Validation (MANDATORY)

After implementation, Claude MUST verify:

| Rule                        | Check                                                             | Fix If Violated                                          |
| --------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| **No TanStack/React Query** | Search for @tanstack, react-query, useQuery, useMutation          | Remove and use native fetch/SWR or server actions        |
| **No Testing Libraries**    | Search for jest, vitest, @testing-library, \*.test.\*, \*.spec.\* | Remove test files and dependencies                       |
| **Recharts for Graphs**     | Any chart/graph uses recharts                                     | Replace Chart.js, D3 direct, Victory, etc. with Recharts |
| **shadcn/ui Components**    | UI components from @/components/ui                                | Install via npx shadcn@latest add \[component\]          |
| **Tailwind CSS v3.4.x**     | Check tailwindcss version in package.json                         | Downgrade if v4.x detected                               |

#### 5️⃣ VERIFY Phase

User confirms the implementation works:

* User manually tests the feature
* User reports: "works", "verified" or describes issues
* If issues found → Claude fixes → User re-verifies

**Trigger phrases**: "works", "verified", "looks good", "issues with X"

#### 6️⃣ COMMIT Phase

Claude prepares the commit:

* Generates conventional commit message
* Shows user: files changed, commit message, target branch
* User approves → Claude runs `git add`, `git commit`, `git push`
* Updates `features.json` status to `"complete"`

---

## 📋 Tracking Files

### features.json

Location: `./features.json` (project root)

```json
{
  "projectName": "my-project",
  "lastUpdated": "2025-01-15T10:30:00Z",
  "features": [
    {
      "id": "feat-001",
      "title": "User authentication with OAuth",
      "description": "Implement Google and GitHub OAuth login",
      "status": "complete",
      "priority": "high",
      "complexity": "L",
      "createdAt": "2025-01-10T09:00:00Z",
      "phases": {
        "planning": { "completedAt": "2025-01-10T09:30:00Z" },
        "accepted": { "completedAt": "2025-01-10T10:00:00Z" },
        "implemented": { "completedAt": "2025-01-10T14:00:00Z" },
        "verified": { "completedAt": "2025-01-10T15:00:00Z" },
        "committed": { "completedAt": "2025-01-10T15:15:00Z", "commitHash": "abc123" }
      },
      "files": [
        "app/api/auth/[...nextauth]/route.ts",
        "lib/auth.ts",
        "components/LoginButton.tsx"
      ],
      "dependencies": ["next-auth", "@auth/prisma-adapter"],
      "notes": "Used NextAuth v5 beta for App Router compatibility"
    }
  ],
  "backlog": []
}
```

**Status Values**: `"backlog"` → `"planning"` → `"accepted"` → `"implementing"` → `"implemented"` → `"verifying"` → `"complete"` | `"blocked"`

**Complexity**: `"S"` (< 1hr) | `"M"` (1-4hr) | `"L"` (4-8hr) | `"XL"` (> 8hr)

---

### PROGRESS.md

Location: `./PROGRESS.md` (project root)

See the PROGRESS.md file for the current development progress log.

---

## 🛠️ Development Environment

* **Language**: TypeScript (`^5.0.0`)
* **Framework**: Next.js 14+ (App Router)
* **Styling**: Tailwind CSS v3.4.x (NOT v4.x)
* **Component Library**: shadcn/ui
* **Charts/Graphs**: Recharts (default and required)
* **Data Fetching**: Native fetch, Server Actions, or SWR
* **Linting**: ESLint with `@typescript-eslint`
* **Formatting**: Prettier

---

## 📁 Project Structure

```
blueprintos/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── charts/             # Recharts wrappers
│   ├── lib/                    # Utility functions
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript type definitions
├── CLAUDE.md                   # This file
├── PROGRESS.md                 # Development progress log
├── features.json               # Feature tracking
├── tailwind.config.ts          # Tailwind configuration
└── package.json                # Dependencies
```

---

## 🚫 Stack Rules (MANDATORY)

These rules are enforced after every implementation:

| Rule                        | Allowed                           | NOT Allowed                                    |
| --------------------------- | --------------------------------- | ---------------------------------------------- |
| **Data Fetching**           | fetch, Server Actions, SWR        | TanStack Query, React Query                    |
| **Testing**                 | None (no tests in this project)   | Jest, Vitest, @testing-library                 |
| **Charts**                  | Recharts                          | Chart.js, D3 direct, Victory, Nivo             |
| **UI Components**           | shadcn/ui (@/components/ui)       | Material UI, Chakra, Ant Design                |
| **Styling**                 | Tailwind CSS v3.4.x               | Tailwind v4.x, styled-components, CSS Modules  |

---

## 🎯 Commands Cheat Sheet

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

---

## 📝 Conventional Commits

Format: `type(scope): description`

| Type     | Description                           |
| -------- | ------------------------------------- |
| feat     | New feature                           |
| fix      | Bug fix                               |
| docs     | Documentation only                    |
| style    | Formatting, missing semicolons, etc.  |
| refactor | Code change that neither fixes nor adds |
| perf     | Performance improvement               |
| chore    | Maintenance tasks                     |

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build
```

