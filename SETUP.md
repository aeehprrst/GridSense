# SETUP — How to run this project after cloning

Verified working on Windows 11 with Python 3.13.5, Node v24.13.0, npm 11.6.2.

---

## 0. Know what's in this repo

After cloning you get a nested folder, `VINHACK/VINHACK/`. Inside are **two separate projects**:

| Project | Folder | What it is |
|---|---|---|
| **GridSense** | `the exact presentation model to do here it is/final kushagra/` | **The main website.** FastAPI + PyTorch GNN backend, Next.js 16 frontend (13 pages). |
| ~~Power Plant PdM~~ | `legacy-pdm/` | Retired. Merged into GridSense; its panel is now on `/operations`. |

**If you just want "the website", you want GridSense.** Everything below is GridSense unless stated.

> Heads-up: the root `frontend/` folder (of the second project) is untouched
> `create-next-app` boilerplate — it still shows the default "edit page.tsx" page.
> That is not our UI. Don't get confused by it.

---

## 1. Prerequisites

Install these first:

- **Python 3.11+** — https://www.python.org/downloads/ (tick *"Add Python to PATH"* during install)
- **Node.js 18+** — https://nodejs.org (LTS is fine)

Check they work:

```bash
python --version
node --version
npm --version
```

---

## 2. Install dependencies

All commands run from the **`final kushagra`** folder:

```
VINHACK/VINHACK/the exact presentation model to do here it is/final kushagra
```

### Step 1 — Python packages

```bash
pip install -r requirements.txt
```

This pulls ~2 GB (PyTorch is large). Expect 5-15 minutes on a normal connection. Be patient — it can look frozen while downloading torch.

### Step 2 — Frontend packages

```bash
cd frontend
npm install
cd ..
```

Takes ~1 minute, installs ~431 packages.

That's it. **No `.env` file is needed** — the frontend proxies `/api/*` to the backend automatically (configured in `frontend/next.config.ts`).

---

## 3. Run it

### Windows

Double-click **`start_gridsense.bat`** in the `final kushagra` folder.

> **Important:** this script does *not* install anything. You must finish Section 2 first or it will just fail.

### Mac / Linux

```bash
./run_project.sh
```

This one *does* install everything for you (creates a `venv`, pip installs, npm installs) — so on Mac/Linux you can skip Section 2 entirely and just run this.

> **Windows users: do not use `run_project.sh`.** It needs `lsof`, which Windows
> doesn't have, and it looks for `venv/bin/python` (Windows uses `venv/Scripts/`).
> It will fail. Use the `.bat`.

### Or run the two halves manually (any OS)

Two terminals, both in `final kushagra`:

```bash
# Terminal 1 — backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

---

## 4. Open it

| URL | What |
|---|---|
| http://localhost:3000 | **The website** |
| http://localhost:3000/map-explorer | 3D grid map |
| http://localhost:3000/dashboard | Operational dashboard |
| http://localhost:8000/docs | Swagger API docs |
| http://localhost:8000/api/health | Quick backend health check |

Give the backend ~10 seconds on first start — it loads PyTorch and the trained model.

You should see this in the backend terminal when it's ready:

```
Loaded trained GNN weights from ...\backend\ml\trained_models\gridsense_gnn.pt
GridSense AI API Initialized with GNN Model, Conformal Coverage, and Grid Telemetry.
Application startup complete.
```

---

## 5. Running the tests (optional)

```bash
python -m pytest backend/tests -v
```

`httpx2` is now listed in `requirements.txt`, so step 02 already installed it. It is
required by Starlette's `TestClient`; without it every API test aborts at collection.

Expected result: **31 passed** (plus some harmless pandapower deprecation warnings).

---

## 6. Gotchas we hit

**Port 8000 is no longer contested.** The standalone Predictive Maintenance service
has been merged into GridSense, so one FastAPI process now serves both the grid GNN and
the plant models. The old service is retired in `legacy-pdm/` and does not run.

**The README's file paths are stale.** It refers to `dataset/`, `models/` and
`results/` folders at the project root. Those don't exist. The real files live under
`backend/ml/datasets/`, `backend/ml/trained_models/` and `backend/ml/results/`, which
is where the code actually looks. Nothing is missing — just ignore those paths.

**No model training needed.** The trained model `gridsense_gnn.pt` is committed to the
repo. You do *not* need to run `scripts/train.py`.

**`torch_geometric` is in `requirements.txt` but is never imported.** The Graph
Attention Network is hand-written in plain PyTorch (`backend/ml/models/gnn.py`). The
package installs fine and is harmless — just don't be surprised that it's unused.

**If port 3000 or 8000 is already in use**, kill the process first:

```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 8000 -State Listen | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

```bash
# Mac / Linux
lsof -ti:8000 | xargs kill -9
```

---

## 7. Plant predictive maintenance — now built in

The separate power-plant app has been merged into GridSense. There is nothing extra to
start: its models load with the API, and its panel renders on
`http://localhost:3000/operations`.

To stream simulated plant telemetry so the panel has live data, run this from
`final kushagra` in a third terminal:

```bash
python scripts/data_publisher.py
```

It publishes to the public HiveMQ broker; the API subscribes and scores every packet. Its
endpoints live under `/api/pdm/*` — for example `http://localhost:8000/api/pdm/status`.

The trained `.pkl` models are committed at `backend/ml/trained_models/maintenance/`, so
retraining is optional (`python scripts/train_maintenance_models.py`).

The retired standalone version is kept for reference in `legacy-pdm/` and does not run.
