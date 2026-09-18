# Project Overview — VINHACK

A complete picture of what is in this repository and what state it is in.
Written so it can be pasted into a fresh conversation as context.

Last audited: 2026-09-18. **Updated after the PdM merge** — the standalone Power Plant
Predictive Maintenance service has been merged into GridSense; one server now serves both.

Original audit date: 2026-09-18. Repo: `github.com/rajsekharsingh5242523/VINHACK`, branch `main`, 4 commits.

---

## 1. TL;DR

The repo contains **one application: GridSense**, a power-grid cascading-failure
prediction platform. A FastAPI + PyTorch backend runs a Graph Attention Network over a
model of the Indian national grid; a Next.js 16 frontend renders it as an interactive 3D
map. Plant-level predictive maintenance (brush wear, remaining useful life, anomaly
detection) used to be a separate service and is now part of the same app, served under
`/api/pdm` and surfaced on `/operations`.

Verified end to end: one server on port 8000 loads the trained GNN weights and the 10
maintenance models, `/api/simulate` performs a genuine AC power-flow simulation plus GNN
inference, live MQTT telemetry flows from the publisher through the API to the UI, **31
backend tests pass**, and all frontend routes compile and serve.

---

## 2. Repository layout

Cloning produces a nested folder, `VINHACK/VINHACK/`. Inside:

```
VINHACK/                                  <- repo root
├── README.md                             Start here
├── SETUP.md                              How to run, with every gotcha
├── PROJECT-OVERVIEW.md                   This file
├── legacy-pdm/                           Retired standalone PdM app (reference only)
├── frontend/                             (!) unused create-next-app boilerplate
│
└── the exact presentation model to do here it is/
    └── final kushagra/                   <- GridSense: the application
        ├── backend/
        │   ├── api/                      main.py (grid) + maintenance.py (/api/pdm)
        │   ├── ml/                       GNN, causal, conformal, physics, maintenance
        │   ├── simulation/               pandapower power flow, cascade, interventions
        │   └── tests/                    31 pytest tests
        ├── frontend/                     Next.js 16 + React 19 + Three.js
        ├── scripts/                      training + MQTT telemetry publishers
        ├── requirements.txt
        └── start_gridsense.bat / run_project.sh
```

> The `frontend/` at the repo root is **default `create-next-app` boilerplate** left over
> from the old second project — it still renders the stock "edit page.tsx" page. It is not
> anyone's UI and nothing depends on it.

---

## 3. GridSense — the main project

### What it claims to do

Predict where a power-grid failure starts, how it propagates across the transmission
network, separate the true root cause from downstream symptoms, and evaluate
counterfactual interventions that would stop a blackout.

### Pipeline

```
India grid topology (22,753 assets, 23,337 lines)
   |
   v  Graph construction - 14 node features + 3 edge physical attributes
   |
   v  3-layer multi-head Graph Attention Network (PyTorch)
        |- failure-risk probability head      [0,1]
        |- time-to-critical regression head   (hours)
        |- peak-loading regression head       (%)
   |
   v  Temporal root-cause disambiguation (upstream precedence + graph traversal)
   |
   v  Split-conformal prediction -> 90% confidence intervals
   |
   v  Kirchhoff / thermal physics validation (pandapower AC power flow)
   |
   v  Counterfactual intervention optimiser (load shedding, redispatch)
   |
   v  Next.js + Three.js 3D digital-twin map
```

### Tech stack

| Layer | Technology |
|---|---|
| API | FastAPI, Pydantic v2, Uvicorn — port 8000 |
| ML | PyTorch (GAT written by hand, no torch_geometric) |
| Power flow | pandapower, networkx |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4 — port 3000 |
| 3D | Three.js via @react-three/fiber + @react-three/drei |
| Maps | Leaflet, d3-geo, topojson-client |
| State | Zustand |
| Motion | Framer Motion |

### Backend structure — ~3,540 lines of Python

| Path | Lines | Purpose |
|---|---|---|
| `backend/api/main.py` | 1,095 | All routes, data loading, orchestration |
| `backend/simulation/grid_loader.py` | 370 | Builds pandapower networks from CSV topology |
| `backend/ml/training/train.py` | 284 | GNN training loop |
| `backend/ml/models/gnn.py` | 203 | GraphAttentionLayer + multi-task GAT |
| `backend/simulation/interventions.py` | 181 | Counterfactual load shed / redispatch |
| `backend/simulation/scenarios.py` | 174 | Scenario catalogue |
| `backend/simulation/cascade.py` | 163 | Iterative AC power flow + overload tripping |
| `backend/ml/causal/root_cause.py` | 163 | Originator vs. symptom disambiguation |
| `backend/ml/inference/predict.py` | 162 | Model loading + real-time inference |
| `backend/api/schemas.py` | 159 | Pydantic contracts |
| `backend/ml/physics/validation.py` | 80 | Kirchhoff / thermal constraint checks |
| `backend/ml/explainability/attribution.py` | 63 | Permutation feature importance |
| `backend/ml/uncertainty/conformal.py` | 43 | Split-conformal intervals |
| `backend/api/maintenance.py` | ~330 | Plant PdM router + MQTT subscriber (`/api/pdm`) |
| `backend/ml/maintenance/engine.py` | ~230 | RUL / anomaly / cascade inference engine |
| `backend/tests/` | ~480 | 31 pytest tests |

Roughly 29 route decorators over ~22 handlers — several are aliases
(`/api/simulate` = `/api/predict/cascade`; `/api/intervention` = `/api/intervene` =
`/api/what-if`). Main groups: `/api/health`, `/api/grid/*`, `/api/simulate`,
`/api/predict`, `/api/intervention`, `/api/scenarios`, `/api/alerts/*`,
`/api/realtime/transformers`, `/api/cities`, `/api/model/info`, `/api/datasets/custom`.

### The model

3-layer multi-head GAT with edge-feature conditioning, implemented directly in PyTorch
(`nn.Module`, custom attention) — **`torch_geometric` is listed in requirements.txt but
never imported**.

- Input: 14 node features, edge_dim 3, hidden 64, 4 heads, dropout 0.1
- Checkpoint: `backend/ml/trained_models/gridsense_gnn.pt` (145 KB, committed)
- Trained 8 epochs, best val loss 0.7005

14 features: load %, temperature °C, voltage p.u. proxy, capacity MVA, age years,
demand MW, generation MW, node degree, ambient °C, headroom %, stress multiplier,
load multiplier, weather factor, hops from initiator.

**Evaluated metrics** (`backend/ml/results/metrics.json`, 200 test scenarios / 6,872 nodes):

| Metric | Value |
|---|---|
| ROC-AUC | 0.9887 |
| F1 | 0.8392 |
| Precision | 0.8204 |
| Recall | 0.8589 |
| Accuracy | 0.9847 |
| Time-to-critical MAE | 0.1758 |

Positive-class ratio is 4.64%, so the 0.9847 accuracy is inflated by class imbalance —
ROC-AUC and F1 are the meaningful figures here. Worth saying plainly if asked.

### Datasets — all committed, under `backend/ml/datasets/`

| File | Rows |
|---|---|
| `cascade_steps.csv` | 351,834 |
| `edges.csv` | 168,757 |
| `node_samples.csv` | 158,923 |
| `synthetic_telemetry_5min.csv` | 120,000 |
| `india_national_edges.csv` | 23,337 |
| `india_national_nodes.csv` | 22,753 |
| `synthetic_asset_profiles.csv` | 22,753 |
| `india_cities_20000.csv` | 20,000 |
| `scenarios.csv` | 5,000 |

### Frontend — ~4,620 lines of TS/TSX, 13 routes

`/` · `/map-explorer` · `/dashboard` · `/intelligence` · `/operations` · `/analytics` ·
`/alerts` · `/admin` · `/custom-data` · `/all-in-one` · `/documentation` · `/about` · `/login`

Component groups:

- **`components/grid/`** — the 3D layer: `IndiaMap3D`, `GridScene`, `GridNodes`,
  `GridEdges`, `EnergyFlow`, `CascadeAnimation`, `CameraController`, `GridGround`
- **`components/dashboard/`** — `IntelligencePanel` (315 lines), `WhatIfSimulator`,
  `NodeDetailPanel`, `DemoControls`, `LiveTelemetryUpdater`, `TopBar`, `BottomBar`, `Legend`
- **`components/home/`** — `Hero`, `HeroVideo`, `GridPreview`, `HowItWorks`,
  `StatsSection`, `FluidCursor`, `CTASection`
- **`lib/`** — `api.ts` (typed client), `types.ts`, `mockData.ts`, `indiaGeo.ts`, `customGrid.ts`
- **`store/gridStore.ts`** — Zustand, drives a scripted 7-phase demo:
  `healthy -> stress_applied -> predicting -> root_cause_found -> cascade_visualized ->
  intervention_applied -> mitigated`

No `.env` needed: `next.config.ts` rewrites `/api/*` to `http://127.0.0.1:8000`.

---

## 4. What is verified working vs. what is scaffolding

### Verified working (tested directly)

- Backend boots and loads the real trained GNN checkpoint
- `POST /api/simulate` runs genuine pandapower AC power flow + GNN inference and returns
  node risks, root-cause ranking, cascade path, confidence intervals and physics checks
- `GET /api/grid/nodes` returns real named Indian assets with geo-coordinates
  (e.g. "Bhakra Nangal Hydro", Punjab, 31.41 / 76.44)
- **24 / 24 backend tests pass**
- All frontend routes compile and return HTTP 200
- Frontend to backend proxy works

### Scaffolding / cosmetic — be honest about these

- **`/login` is not authentication.** It collects a password into React state and calls
  `router.push("/map-explorer")`. No check, no session, no backend call.
- **~~The frontend silently falls back to mock data.~~ FIXED.** `lib/api.ts` still falls
  back to `buildHealthyScenario()` / `buildStressScenario()` when the backend is
  unreachable, but every fallback now reports through `lib/dataSource.ts` and a persistent
  banner appears: *"Backend unreachable — displaying mock demo data"*, naming the failed
  endpoints. A dead backend can no longer be mistaken for a working one.
- `lib/mockData.ts` (231 lines) also supplies the `DEMO_SCENARIOS` used by
  `/intelligence` and `DemoControls`.

---

## 5. Known issues found during the audit

**1. ~~`/api/model/info` reports the wrong metrics.~~ FIXED.**
`METRICS_JSON` resolves to `backend/results/metrics.json`, but the file is actually at
`backend/ml/results/metrics.json`. The path never matches, so the endpoint silently returns
its hardcoded fallback — ROC-AUC **0.912**, F1 **0.624** — instead of the real trained
figures of 0.9887 / 0.8392. **The UI currently understates the model.** One-line fix:
point `METRICS_JSON` at `backend/ml/results/metrics.json`. Done — the endpoint now
returns the real 0.9887 / 0.8392, covered by a regression test.

**2. ~~`httpx2` is missing from `requirements.txt`.~~ FIXED — now listed.** Starlette's `TestClient` requires it;
without it all API tests abort at collection. Needed for tests only.

**3. README paths are stale.** It references `dataset/`, `models/` and `results/` at the
project root. None exist — the real locations are `backend/ml/datasets/`,
`backend/ml/trained_models/` and `backend/ml/results/`, which is where the code looks.

**4. ~~Both projects bind port 8000.~~ RESOLVED by the merge.** A single FastAPI process
serves the grid GNN and the plant models; the plant routes are namespaced under `/api/pdm`.

**5. `torch_geometric` is a dependency that is never imported.** Harmless, installs fine,
but misleading — the GAT is hand-written.

**6. The legacy GIS mount is dead code.** `main.py` tries to mount a static frontend from
`backend/C2C - raj/frontend`, but that prototype actually lives at
`backend/legacy/C2C - raj/frontend`. The mount never activates.

**7. `metrics.json` contains a hardcoded absolute path** from the original author's
machine: `C:\GridSense\new files(raj backend and bibek frontend\dataset`.

**8. `run_project.sh` is Unix-only.** It needs `lsof` and `venv/bin/python`; on Windows use
`start_gridsense.bat`. Note the asymmetry: `run_project.sh` installs dependencies
automatically, `start_gridsense.bat` installs nothing.

---

## 6. Plant predictive maintenance (merged in — see 8b)

Originally a separate service at the repo root, now part of GridSense. Simulates power-plant sensor telemetry,
publishes it over MQTT to the public HiveMQ broker, and predicts equipment failure.

- **`ml_models.py`** — trains three models: Gradient Boosting Regressor for remaining
  useful life (NASA bearing pattern), Isolation Forest + Random Forest for anomaly
  detection (Azure PdM pattern), XGBoost for grid fault type and blackout risk.
  All 10 `.pkl` artifacts are committed to `models/`, so no retraining is needed.
- **`data_publisher.py` / `mqtt_publisher.py`** — replay sensor data to
  `broker.hivemq.com:1883` on topics `powerplant/brush/*`, `powerplant/alerts/*`,
  `powerplant/grid/cascade_event`, `powerplant/telemetry/full`, `powerplant/environment/weather`.
- **`backend_server.py`** — FastAPI MQTT subscriber exposing 9 endpoints
  (`/api/live`, `/api/history`, `/api/alerts`, `/api/cascade`, `/api/predictions`,
  `/api/simulate/predict`, `/api/health`, `/api/db/status`).
- **`dashboard.html`** — a single self-contained page (Chart.js + MQTT.js over CDN) that
  connects straight to HiveMQ over WebSocket. No build step; just open it.
- **`docker-compose.yml`** — a fuller stack (Postgres, InfluxDB, Redis, backend, frontend,
  publisher). Not used in the verified setup; Docker is not installed locally.

The narrative it demonstrates: brush degradation -> excitation loss -> generator trip ->
phase faults -> relay operation -> section blackout -> recovery.

> `docker-compose.yml` contains a hardcoded OpenWeatherMap API key. If this repo is ever
> made public, rotate that key.

---

## 7. Environment and setup

Verified on Windows 11 · Python 3.13.5 · Node v24.13.0 · npm 11.6.2.

Installed for GridSense: torch 2.14.0, pandapower 3.5.4, fastapi 0.141.1, uvicorn 0.53.0,
pydantic 2.13.5, numpy 2.4.6, pandas 2.3.3, scikit-learn 1.9.1, networkx 3.6.1, pytest 9.1.1,
plus httpx2 for tests. Frontend: 431 npm packages, 0 vulnerabilities.

Quick start (from `final kushagra`):

```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
# Windows: double-click start_gridsense.bat
# macOS/Linux: ./run_project.sh
```

Then open `http://localhost:3000`. Full instructions, including every gotcha above, are in
`SETUP.md`.

---

## 8. Git state

Branch `main`, 4 commits, no other branches:

| Commit | Description |
|---|---|
| `1055ca8` | `push run buutn` — added launcher scripts, `.vscode` configs, alert workflow data |
| `3a12368` | `RAJ FIRST DAY FROM KUSHAGRA` — Project 2 (MQTT, dashboard, datasets, docker-compose) |
| `a509389` | `RAJ FIRST DAY FROM KUSHAGRA` |
| `909f8f5` | `Initial commit` |

Contributors visible in code and paths: Raj (backend), Kushagra, Bibek (frontend).

---

## 8b. The predictive-maintenance merge

The second project no longer exists as a separate app. What changed:

**Backend** — `backend/api/maintenance.py` is an `APIRouter` mounted on the GridSense app
under `/api/pdm`, carrying the MQTT subscriber and 10 routes (`live`, `history`, `health`,
`alerts`, `cascade`, `predictions`, `status`, `simulate`, plus new `rul` and `anomaly`
endpoints that expose the NASA-RUL and Azure-anomaly heads directly). Namespacing was
required because `/api/health` and `/api/alerts` already existed in GridSense.

**Models** — the 10 `.pkl` files moved to `backend/ml/trained_models/maintenance/`, and the
inference engine became `backend/ml/maintenance/engine.py`
(`MaintenancePredictionEngine`), with absolute path resolution and lazy thread-safe
loading. Training stayed behind in `scripts/train_maintenance_models.py`.

**Frontend** — `dashboard.html` is retired. Its HiveMQ WebSocket subscription became
`hooks/usePlantTelemetry.ts` and its Chart.js dual-axis trend became
`components/maintenance/SensorTrendChart.tsx`; `PlantMaintenancePanel` renders on
`/operations`. The hook prefers the broker and falls back to polling `/api/pdm/live`,
labelling which source is on screen.

**Two real bugs surfaced during the merge:**

1. The MQTT code could never have run on the pinned client library. Both the old server and
   the publishers called `mqtt.Client(client_id=...)`, which raises on paho-mqtt 2.x
   (`requirements.txt` pins `>=2.1.0`). All call sites now pass an explicit
   `CallbackAPIVersion`.
2. `ml_models.py` resolved models from a bare relative `"models"` directory, so it only
   loaded when the process started in the repo root.

**Not carried over:** the optional Postgres / InfluxDB / Redis persistence layer. Every
write path was already guarded as "graceful if not available", none of the clients are
installed, and there is no local Docker — it never actually ran. Those files moved to
`legacy-pdm/` alongside `docker-compose.yml`.

---

## 9. Honest summary for a judge or a new collaborator

**Real:** the GNN is genuinely trained and its weights are committed; the power-flow
simulation is real pandapower, not a mock; root-cause analysis, conformal uncertainty,
physics validation and the counterfactual intervention engine are all implemented modules,
not stubs; the grid topology uses real Indian substation names and coordinates; the test
suite is green.

**Not real:** login is a redirect with no auth (left deliberately unchanged); the Docker
stack is untested. The mock-data fallback and the `/api/model/info` path bug have both been
fixed — the UI now announces mock data, and the endpoint reports the real metrics.

**Remaining known gaps:** `/login` is cosmetic by design; the Docker stack in
`legacy-pdm/` is untested and its `docker-compose.yml` still carries a hardcoded
OpenWeatherMap key that should be rotated.

Test suite: **31 passing** (24 original plus 7 covering the merged maintenance endpoints
and a regression test for the metrics path).
