# legacy-pdm — retired standalone Predictive Maintenance app

Everything in this folder has been **merged into GridSense** and is kept only for
reference. None of it runs any more, and nothing here is needed to start the app.

The standalone service used to bind port 8000, which is the same port GridSense
uses — the two could never run at the same time. That conflict is what the merge
removed.

## Where each piece went

| Retired file | Replaced by |
|---|---|
| `backend_server.py` (MQTT subscriber + 9 routes) | `final kushagra/backend/api/maintenance.py` — an `APIRouter` mounted on the GridSense app under `/api/pdm` |
| `dashboard.html` (standalone Chart.js + MQTT.js page) | `final kushagra/frontend/src/components/maintenance/` — `PlantMaintenancePanel` and `SensorTrendChart`, rendered on `/operations` |
| `ml_models.py` — `PredictionEngine` | `final kushagra/backend/ml/maintenance/engine.py` — `MaintenancePredictionEngine` |
| `ml_models.py` — training code | `final kushagra/scripts/train_maintenance_models.py` |
| `models/*.pkl` (10 files) | `final kushagra/backend/ml/trained_models/maintenance/` |
| `data/*.csv` (4 files) | `final kushagra/backend/ml/datasets/maintenance/` |
| `data_publisher.py`, `mqtt_publisher.py` | `final kushagra/scripts/` |
| `START.bat` | `final kushagra/start_gridsense.bat` |

## Route mapping

The legacy routes were renamed because `/api/health` and `/api/alerts` already
existed in GridSense with different response shapes — mounting them unprefixed
would have shadowed the grid endpoints.

| Legacy | Merged |
|---|---|
| `/api/live` | `/api/pdm/live` |
| `/api/history` | `/api/pdm/history` |
| `/api/health` | `/api/pdm/health` |
| `/api/alerts` | `/api/pdm/alerts` |
| `/api/cascade` | `/api/pdm/cascade` |
| `/api/predictions` | `/api/pdm/predictions` |
| `/api/simulate/predict` | `/api/pdm/simulate` |
| `/api/db/status` | `/api/pdm/status` |
| — | `/api/pdm/rul` (new: NASA-pattern RUL inference) |
| — | `/api/pdm/anomaly` (new: Azure-pattern anomaly detection) |

## What was deliberately not carried over

**The PostgreSQL / InfluxDB / Redis persistence layer.** Every write path in
`backend_server.py` was already wrapped in a "graceful if not available" guard,
none of those clients are installed, and there is no local Docker. In practice it
never ran. The merged router keeps the same in-memory ring buffers the dashboard
actually read from. `docker-compose.yml`, `Dockerfile.backend` and `db/init.sql`
moved here with it.

> `docker-compose.yml` in this folder contains a hardcoded OpenWeatherMap API
> key. This repo is on GitHub — that key should be rotated.

## Two bugs found while merging

1. **The MQTT code could not have worked on the installed client library.** Both
   `backend_server.py` and the publishers called `mqtt.Client(client_id=...)`,
   which raises on paho-mqtt 2.x (2.1.0 is what `requirements.txt` pins). The
   merged code passes an explicit `CallbackAPIVersion`.
2. **`ml_models.py` used relative paths** (`MODELS_DIR = "models"`), so it only
   loaded models when the process happened to start in the repo root. The merged
   engine resolves paths from its own file location.
