# Power Plant Predictive Maintenance — HOW TO RUN

## ⚡ Project Structure
```
VINHACK/
├── ml_models.py        ← ML training (NASA + Azure + Electrical patterns)
├── mqtt_publisher.py   ← Simulates live power plant sensor data → HiveMQ
├── backend_server.py   ← MQTT subscriber + FastAPI REST API
├── dashboard.html      ← Live web dashboard (open in browser)
├── requirements.txt    ← Python dependencies
├── models/             ← Saved ML models (auto-created)
└── data/               ← Training datasets (auto-created)
```

## 📦 MQTT Connection (HiveMQ Public Broker)
```
Host:             broker.hivemq.com
TCP Port:         1883
WebSocket Port:   8000
TLS TCP Port:     8883
TLS WebSocket:    8884
```

## 🚀 HOW TO RUN (3 Steps)

### Step 1: Train ML Models
```powershell
python ml_models.py
```
This generates training data + trains 3 models:
- `rul_model.pkl`       — Predicts hours until brush failure (NASA pattern)
- `anomaly_rf.pkl`      — Detects sensor anomalies (Azure pattern)
- `cascade_fault.pkl`   — Predicts grid fault type & blackout risk

### Step 2: Open Dashboard (Terminal 1)
```powershell
# Just open dashboard.html in browser — no server needed
# It connects directly to HiveMQ via WebSocket
start dashboard.html
```

### Step 3A: Run MQTT Publisher (Terminal 2) — Simulate sensor data
```powershell
python mqtt_publisher.py
```

### Step 3B: Run Backend API (Terminal 3) — Optional REST API
```powershell
python backend_server.py
```
- API Docs: http://localhost:8000/docs
- Live data: http://localhost:8000/api/live
- Health:    http://localhost:8000/api/health

## 📊 What You'll See

1. **BEFORE FAILURE**: Dashboard shows health dropping, RUL countdown
2. **CASCADE FLOW**: Grid blackout flow lights up step by step:
   ```
   Brush → Excitation → Generator → Phase A → Phase B → Relay → Section 3 → Blackout → Recovery
   ```
3. **ALERTS**: Real-time warnings with recommended actions
4. **PAST PATTERNS**: Charts show degradation curve history

## 🔗 Dataset Download Links (for real data)
- NASA PCoE:    https://ti.arc.nasa.gov/tech/dash/groups/pcoe/prognostic-data-repository/
- Azure PdM:    https://www.kaggle.com/datasets/arnabbiswas1/microsoft-azure-predictive-maintenance
- Elec Fault:   https://www.kaggle.com/datasets/esathyaprakash/electrical-fault-detection-and-classification
- UCI Power:    https://archive.ics.uci.edu/dataset/294/combined+cycle+power+plant

## ⚙️ ML Models Explained
| Model | Dataset | Purpose |
|-------|---------|---------|
| Gradient Boosting Regressor | NASA PCoE Bearing | RUL hours prediction |
| Isolation Forest + Random Forest | Azure PdM | Anomaly detection + failure type |
| XGBoost Classifier | Electrical Fault | Fault type + blackout risk |