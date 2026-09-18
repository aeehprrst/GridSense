# VINHACK — GridSense

**GridSense** is a power-grid cascading-failure platform: it predicts where a failure
starts, how it propagates across the transmission network, separates the true root cause
from downstream symptoms, and evaluates counterfactual interventions that would stop a
blackout. Plant-level predictive maintenance (brush wear, remaining useful life, anomaly
detection) is built into the same application.

The project lives in:

```
the exact presentation model to do here it is/final kushagra/
```

## Run it

From that folder:

```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

Then **Windows**: double-click `start_gridsense.bat` · **macOS/Linux**: `./run_project.sh`

Open **http://localhost:3000**. API docs at **http://localhost:8000/docs**.

Full instructions and known gotchas: [SETUP.md](SETUP.md).
Architecture, models, datasets and current status: [PROJECT-OVERVIEW.md](PROJECT-OVERVIEW.md).

## One server

A single FastAPI process on port 8000 serves both halves:

| Area | Routes |
|---|---|
| Grid GNN, simulation, interventions | `/api/health`, `/api/grid/*`, `/api/simulate`, `/api/predict`, `/api/intervention`, `/api/scenarios`, `/api/model/info` |
| Plant predictive maintenance | `/api/pdm/*` — `live`, `history`, `health`, `alerts`, `cascade`, `predictions`, `rul`, `anomaly`, `simulate`, `status` |

To stream simulated plant telemetry to the dashboard:

```bash
python scripts/data_publisher.py
```

## Layout

```
the exact presentation model to do here it is/final kushagra/
├── backend/
│   ├── api/            main.py (grid) + maintenance.py (plant, /api/pdm)
│   ├── ml/             GNN, causal, conformal, physics, maintenance engine
│   ├── simulation/     pandapower power flow, cascade, interventions
│   └── tests/          31 pytest tests
├── frontend/           Next.js 16 + React 19 + Three.js
└── scripts/            training + MQTT telemetry publishers

legacy-pdm/             Retired standalone PdM app — reference only, see its README
frontend/               Unused create-next-app boilerplate from the old second project
```

The standalone Power Plant Predictive Maintenance service that used to live at this repo
root has been merged into GridSense. Nothing in `legacy-pdm/` runs any more —
[legacy-pdm/README.md](legacy-pdm/README.md) maps every retired file to its replacement.
