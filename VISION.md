# BlueprintOS: Design & Implementation Specification

> **The Strategic Operating System for Stingray Media**

---

## 1. Project Vision

BlueprintOS is a strategic "Operating System" for Stingray Media. It uses a **Directed Acyclic Graph (DAG)** to model business operations as a rail network.

### Mission

> To ensure every service line is **"Fairly Priced"** (Operational Efficiency) and **"World-Class"** (Proven Impact).

### The Rail Network Analogy

| Concept | Business Equivalent |
|---------|---------------------|
| **Cargo** | Work / Projects |
| **Tracks** | Service Lines |
| **Stations** | Departments |
| **Destination** | Revenue Out |

Work flows like "Cargo" along "Tracks" (Service Lines) through "Stations" (Departments) until it reaches "Revenue Out."

---

## 2. Technical Architecture Concepts

### A. The "Standard Gauge" Schema

To avoid "messy" data, every station (node) must output a **standardized JSON format**. This allows the central engine to calculate health across different departments (Radio, Video, Tech).

### B. Decentralized Inference

Each station is responsible for its own internal sensors. A station "infers" its own `quality_score` or `labor_variance` and pushes it to the central OS.

### C. Interpretation Layer (AI Agent)

The system separates **Data** from **Story**:

| Layer | Description |
|-------|-------------|
| **The Data** | Hard metrics stored in JSON |
| **The Story** | AI agent reads the JSON on-the-fly to generate natural language "Dispatcher Reports" and "Global Alerts" |

---

## 3. The Core Data Structure (The "Sensor" Model)

Developers should build the system to consume and produce a JSON structure similar to this:

```json
{
  "service_line_id": "SL-360-CAMPAIGN",
  "nodes": [
    {
      "station_id": "Creative_Studio",
      "metrics": {
        "fair_pricing": {
          "planned_hrs": 20,
          "actual_hrs": 22,
          "labor_variance": 2
        },
        "world_class": {
          "internal_qa_score": 8.5,
          "standard_met": true
        },
        "performance_proof": {
          "client_approval_speed": "48h"
        }
      }
    }
  ]
}
```

### Metric Categories

| Category | Purpose | Example Metrics |
|----------|---------|-----------------|
| **fair_pricing** | Operational Efficiency | `planned_hrs`, `actual_hrs`, `labor_variance` |
| **world_class** | Quality Standards | `internal_qa_score`, `standard_met` |
| **performance_proof** | Client Impact | `client_approval_speed`, `engagement_rate` |

---

## 4. Phased Implementation Roadmap

### Phase 1: The Iron Horse (Core Engine)

**Goal:** Visualize the "Tracks"

| Aspect | Details |
|--------|---------|
| **What** | Build a DAG-based UI (using React Flow) |
| **Visuals** | Nodes = Stations; Edges = Process Flow |
| **Benefit** | Provides a visual "Blueprint" of how Stingray Media delivers value |

### Phase 2: The Dispatcher (AI & Synthetic Data)

**Goal:** Generate the "Story"

| Aspect | Details |
|--------|---------|
| **What** | Create a Synthetic Data Generator to mock business activity. Integrate an AI Agent to read the JSON and write a narrative "Dispatcher's Log" |
| **Benefit** | Managers get a text-based summary of operations without looking at spreadsheets |

### Phase 3: The Simulation & Sensor Suite

**Goal:** Transition to Real-World Monitoring

| Feature | Description |
|---------|-------------|
| **Sandbox Mode** | Sliders to "Stress Test" the mock data (e.g., "What if labor costs double?") |
| **Live Toggle** | Switch a node's data source from "Mock" to "API" (e.g., pulling real YouTube views or Harvest time logs) |
| **RAG Indicators** | Red-Amber-Green overlays on the track map to show live bottlenecks |

---

## 5. Key Design Choices for Developers

### DAG-First Architecture

Operations are **non-linear**; the system must support complex branching and merges.

```
[Intake] → [Creative Studio] → [Production] ↘
                                              → [QA] → [Delivery] → [Revenue Out]
          [Strategy]        → [Analytics]   ↗
```

### Decoupled Alerts

> ⚠️ **Do NOT hard-code "Alert" strings into the database.**

Let the AI Agent generate `global_alerts` dynamically based on the current state of the JSON.

### Plug-and-Play Connectors

Design nodes so they can accept data from **any source**:

| Node Type | Data Source Example |
|-----------|---------------------|
| Radio | SQL Database |
| Social Media | REST API |
| Video | YouTube Analytics API |
| Time Tracking | Harvest API |

### Weight-Based Pathfinding

- Assign **"Weights"** to edges (Cost/Time)
- Use graph algorithms (like **A\***) to suggest the **"Golden Path"** for a project to maximize profit

---

## 6. Business Mission Validation

The system is successful if it can prove these two things for **every project**:

### Success Criteria

| Criterion | Formula | Meaning |
|-----------|---------|---------|
| **Fairly Priced** | `actual_labor <= market_value` | Operational Efficiency |
| **World-Class** | `performance_proof >= industry_benchmark` | Proven Results |

### Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROJECT                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐         ┌─────────────────┐               │
│   │  FAIRLY PRICED  │         │  WORLD-CLASS    │               │
│   │                 │         │                 │               │
│   │  actual_labor   │         │  performance    │               │
│   │      <=         │   AND   │      >=         │               │
│   │  market_value   │         │  benchmark      │               │
│   │                 │         │                 │               │
│   └────────┬────────┘         └────────┬────────┘               │
│            │                           │                         │
│            └───────────┬───────────────┘                         │
│                        ▼                                         │
│                 ┌──────────────┐                                 │
│                 │   SUCCESS    │                                 │
│                 └──────────────┘                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Glossary

| Term | Definition |
|------|------------|
| **Cargo** | A unit of work flowing through the system |
| **Track** | A service line / workflow path |
| **Station** | A department or processing node |
| **Dispatcher** | The AI agent that narrates system state |
| **Sensor** | A metric-producing component within a station |
| **Golden Path** | The optimal route through the DAG for maximum efficiency/profit |
| **RAG** | Red-Amber-Green status indicators |
| **Standard Gauge** | The unified JSON schema all stations must use |

---

## 8. Technology Stack Alignment

This project is built with the following stack (see `CLAUDE.md` for details):

| Technology | Purpose in BlueprintOS |
|------------|------------------------|
| **Next.js 14** | App Router for the OS interface |
| **TypeScript** | Type-safe sensor/node definitions |
| **React Flow** | DAG visualization (Phase 1) |
| **Recharts** | Metric dashboards and analytics |
| **shadcn/ui** | Consistent UI components |
| **AI Integration** | Dispatcher narrative generation (Phase 2) |

---

*Last Updated: 2025-12-27*

