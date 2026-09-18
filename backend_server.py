"""
=============================================================
  POWER PLANT — ENHANCED FastAPI BACKEND
  Supports: PostgreSQL + InfluxDB + Redis + MQTT
=============================================================
"""
import paho.mqtt.client as mqtt
import json, time, random, threading, os
from datetime import datetime
from collections import deque
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, sys

sys.path.append(os.path.dirname(__file__))
from ml_models import PredictionEngine

# ─── DB CLIENT SETUP (graceful if not available) ──────────
try:
    import psycopg2, psycopg2.extras
    PG_URL = os.getenv("POSTGRES_URL", "postgresql://admin:powerplant123@localhost:5432/powerplant")
    pg_conn = psycopg2.connect(PG_URL)
    pg_conn.autocommit = True
    pg_cursor = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    PG_AVAILABLE = True
    print("[DB] PostgreSQL connected")
except Exception as e:
    PG_AVAILABLE = False
    print(f"[DB] PostgreSQL not available: {e} (running without DB)")

try:
    from influxdb_client import InfluxDBClient, Point
    from influxdb_client.client.write_api import SYNCHRONOUS
    INFLUX_URL   = os.getenv("INFLUXDB_URL", "http://localhost:8086")
    INFLUX_TOKEN = os.getenv("INFLUXDB_TOKEN", "powerplant-super-secret-token")
    INFLUX_ORG   = os.getenv("INFLUXDB_ORG", "powerplant_org")
    INFLUX_BUCKET= os.getenv("INFLUXDB_BUCKET", "sensors")
    influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
    influx_write  = influx_client.write_api(write_options=SYNCHRONOUS)
    INFLUX_AVAILABLE = True
    print("[DB] InfluxDB connected")
except Exception as e:
    INFLUX_AVAILABLE = False
    print(f"[DB] InfluxDB not available: {e} (running without InfluxDB)")

try:
    import redis as redis_lib
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis_lib.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("[DB] Redis connected")
except Exception as e:
    REDIS_AVAILABLE = False
    print(f"[DB] Redis not available: {e} (running without Redis)")

# ─── MQTT CONFIG ──────────────────────────────────────────
BROKER    = os.getenv("MQTT_BROKER", "broker.hivemq.com")
PORT      = int(os.getenv("MQTT_PORT", 1883))
CLIENT_ID = f"backend_{random.randint(1000,9999)}"

SUBSCRIBE_TOPICS = [
    ("powerplant/telemetry/full", 1),
    ("powerplant/alerts/#", 1),
    ("powerplant/grid/#", 1),
    ("powerplant/brush/#", 1),
]

# ─── IN-MEMORY STORE ──────────────────────────────────────
store = {
    "latest"        : {},
    "history"       : deque(maxlen=1000),
    "predictions"   : deque(maxlen=100),
    "cascade_events": deque(maxlen=50),
    "alerts"        : deque(maxlen=200),
    "connected"     : False,
    "message_count" : 0,
}

engine = PredictionEngine()


# ─── DB WRITERS ──────────────────────────────────────────
def write_to_postgres(data: dict, prediction: dict):
    if not PG_AVAILABLE:
        return
    try:
        pg_cursor.execute("""
            INSERT INTO sensor_readings
            (temperature,vibration,current,resistance,voltage_a,voltage_b,voltage_c,
             health_score,rul_hours,wear_pct,phase,source)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            data.get("temperature"), data.get("vibration"), data.get("current"),
            data.get("resistance"), data.get("voltage_a"), data.get("voltage_b"),
            data.get("voltage_c"), data.get("health_score"), data.get("rul_hours"),
            data.get("wear_pct"), data.get("phase"), data.get("source"),
        ))
        if prediction:
            cascade = prediction.get("cascade") or {}
            health  = prediction.get("health") or {}
            pg_cursor.execute("""
                INSERT INTO ml_predictions
                (rul_hours,health_score,is_anomaly,failure_type,fault_type,
                 blackout_risk,blackout_proba,sections_affected,mw_loss,alert_level,summary)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                prediction.get("rul_hours"),
                health.get("health_score"),
                health.get("is_anomaly"),
                health.get("failure_type"),
                cascade.get("fault_type"),
                cascade.get("blackout_risk"),
                cascade.get("blackout_proba"),
                cascade.get("sections_affected"),
                cascade.get("estimated_mw_loss"),
                prediction.get("alert_level"),
                prediction.get("summary"),
            ))
    except Exception as e:
        print(f"[DB] Postgres write error: {e}")


def write_to_influx(data: dict):
    if not INFLUX_AVAILABLE:
        return
    try:
        point = (
            Point("sensor_reading")
            .tag("source", data.get("source", "unknown"))
            .tag("phase",  data.get("phase", "UNKNOWN"))
            .field("temperature",  float(data.get("temperature", 0)))
            .field("vibration",    float(data.get("vibration", 0)))
            .field("current",      float(data.get("current", 0)))
            .field("resistance",   float(data.get("resistance", 0)))
            .field("voltage_a",    float(data.get("voltage_a", 0)))
            .field("voltage_b",    float(data.get("voltage_b", 0)))
            .field("voltage_c",    float(data.get("voltage_c", 0)))
            .field("health_score", float(data.get("health_score", 100)))
            .field("rul_hours",    float(data.get("rul_hours", 0)))
            .field("wear_pct",     float(data.get("wear_pct", 0)))
        )
        influx_write.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=point)
    except Exception as e:
        print(f"[DB] InfluxDB write error: {e}")


def write_to_redis(data: dict, prediction: dict):
    if not REDIS_AVAILABLE:
        return
    try:
        redis_client.setex("latest_sensor",  30, json.dumps(data))
        redis_client.setex("latest_predict", 30, json.dumps(prediction))
        redis_client.lpush("sensor_history", json.dumps({
            "ts"  : data.get("timestamp"),
            "temp": data.get("temperature"),
            "vib" : data.get("vibration"),
            "h"   : data.get("health_score"),
        }))
        redis_client.ltrim("sensor_history", 0, 999)
    except Exception as e:
        print(f"[DB] Redis write error: {e}")


# ─── MQTT CALLBACKS ───────────────────────────────────────
def on_connect(client, userdata, flags, rc):
    store["connected"] = True
    print(f"[MQTT] Connected to {BROKER}:{PORT}")
    for topic, qos in SUBSCRIBE_TOPICS:
        client.subscribe(topic, qos)

def on_disconnect(client, userdata, rc):
    store["connected"] = False

def on_message(client, userdata, msg):
    store["message_count"] += 1
    try:
        payload = json.loads(msg.payload.decode())
        topic   = msg.topic

        if topic == "powerplant/telemetry/full":
            store["latest"] = payload
            row = {
                "timestamp"  : payload.get("timestamp"),
                "temperature": payload.get("temperature"),
                "vibration"  : payload.get("vibration"),
                "current"    : payload.get("current"),
                "resistance" : payload.get("resistance"),
                "health_score": payload.get("health_score"),
                "rul_hours"  : payload.get("rul_hours"),
                "phase"      : payload.get("phase"),
            }
            store["history"].append(row)

            prediction = engine.full_prediction(payload)
            store["predictions"].append(prediction)

            # Write to all databases
            threading.Thread(target=write_to_postgres, args=(payload, prediction), daemon=True).start()
            threading.Thread(target=write_to_influx,   args=(payload,), daemon=True).start()
            threading.Thread(target=write_to_redis,    args=(payload, prediction), daemon=True).start()

            # Alert
            if prediction["alert_level"] in ["WARNING", "CRITICAL", "FAILURE"]:
                alert = {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "level"    : prediction["alert_level"],
                    "message"  : prediction["summary"],
                    "rul_hours": prediction.get("rul_hours"),
                }
                store["alerts"].append(alert)
                if PG_AVAILABLE:
                    try:
                        pg_cursor.execute(
                            "INSERT INTO alerts (level, message, rul_hours) VALUES (%s,%s,%s)",
                            (alert["level"], alert["message"], alert["rul_hours"])
                        )
                    except Exception:
                        pass

        elif topic == "powerplant/grid/cascade_event":
            store["cascade_events"].append(payload)
            if PG_AVAILABLE:
                try:
                    pg_cursor.execute("""
                        INSERT INTO cascade_events (cascade_step, event, component, severity, failure_mode)
                        VALUES (%s,%s,%s,%s,%s)
                    """, (
                        payload.get("cascade_step"), payload.get("event"),
                        payload.get("component"), payload.get("severity"),
                        payload.get("failure_mode")
                    ))
                except Exception:
                    pass

    except Exception as e:
        print(f"[MQTT] Parse error on {msg.topic}: {e}")


# ─── FastAPI ──────────────────────────────────────────────
app = FastAPI(
    title="Power Plant Predictive Maintenance API",
    description="Brush wear prediction + grid blackout prevention + live MQTT + PostgreSQL + InfluxDB + Redis",
    version="2.0.0"
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/")
def root():
    return {
        "service"   : "Power Plant Predictive Maintenance v2",
        "status"    : "running",
        "mqtt"      : "connected" if store["connected"] else "disconnected",
        "databases" : {
            "postgres": "connected" if PG_AVAILABLE else "not available",
            "influxdb": "connected" if INFLUX_AVAILABLE else "not available",
            "redis"   : "connected" if REDIS_AVAILABLE else "not available",
        },
        "messages"  : store["message_count"],
    }

@app.get("/api/live")
def get_live():
    # Try Redis first (fastest)
    if REDIS_AVAILABLE:
        cached = redis_client.get("latest_sensor")
        pred   = redis_client.get("latest_predict")
        if cached:
            return {
                "sensors"   : json.loads(cached),
                "prediction": json.loads(pred) if pred else {},
                "source"    : "redis_cache",
                "timestamp" : datetime.utcnow().isoformat() + "Z",
            }
    return {
        "sensors"   : store["latest"],
        "prediction": list(store["predictions"])[-1] if store["predictions"] else {},
        "source"    : "memory",
        "timestamp" : datetime.utcnow().isoformat() + "Z",
    }

@app.get("/api/history")
def get_history(limit: int = 200):
    # Try PostgreSQL for real historical data
    if PG_AVAILABLE:
        try:
            pg_cursor.execute(
                "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT %s", (limit,)
            )
            rows = pg_cursor.fetchall()
            return {"data": [dict(r) for r in rows], "source": "postgresql", "total": len(rows)}
        except Exception:
            pass
    data = list(store["history"])
    return {"data": data[-limit:], "source": "memory", "total": len(data)}

@app.get("/api/health")
def get_health():
    latest = store["latest"]
    preds  = list(store["predictions"])
    last   = preds[-1] if preds else {}
    cascade = last.get("cascade") or {}
    health  = last.get("health")  or {}

    # Try Redis
    if REDIS_AVAILABLE:
        pred_cached = redis_client.get("latest_predict")
        if pred_cached:
            last    = json.loads(pred_cached)
            cascade = last.get("cascade") or {}
            health  = last.get("health")  or {}

    return {
        "health_score"    : latest.get("health_score", 100),
        "rul_hours"       : latest.get("rul_hours", 999),
        "phase"           : latest.get("phase", "HEALTHY"),
        "alert_level"     : last.get("alert_level", "HEALTHY"),
        "blackout_risk"   : cascade.get("blackout_risk", False),
        "blackout_proba"  : cascade.get("blackout_proba", 0),
        "fault_type"      : cascade.get("fault_type", "NO"),
        "sections_affected": cascade.get("sections_affected", 0),
        "mw_loss"         : cascade.get("estimated_mw_loss", 0),
        "action"          : cascade.get("recommended_action", "No action needed"),
        "is_anomaly"      : health.get("is_anomaly", False),
        "failure_type"    : health.get("failure_type", "none"),
        "timestamp"       : datetime.utcnow().isoformat() + "Z",
        "databases"       : {
            "postgres": PG_AVAILABLE,
            "influxdb": INFLUX_AVAILABLE,
            "redis"   : REDIS_AVAILABLE,
        }
    }

@app.get("/api/alerts")
def get_alerts(limit: int = 50):
    # Try PostgreSQL
    if PG_AVAILABLE:
        try:
            pg_cursor.execute(
                "SELECT * FROM alerts ORDER BY timestamp DESC LIMIT %s", (limit,)
            )
            rows = pg_cursor.fetchall()
            return {"alerts": [dict(r) for r in rows], "source": "postgresql"}
        except Exception:
            pass
    data = list(store["alerts"])
    return {"alerts": data[-limit:], "source": "memory"}

@app.get("/api/cascade")
def get_cascade():
    # Try PostgreSQL
    if PG_AVAILABLE:
        try:
            pg_cursor.execute("SELECT * FROM cascade_events ORDER BY timestamp DESC LIMIT 50")
            rows = pg_cursor.fetchall()
            return {"events": [dict(r) for r in rows], "source": "postgresql"}
        except Exception:
            pass
    return {"events": list(store["cascade_events"]), "source": "memory"}

@app.get("/api/predictions")
def get_predictions(limit: int = 50):
    if PG_AVAILABLE:
        try:
            pg_cursor.execute(
                "SELECT * FROM ml_predictions ORDER BY timestamp DESC LIMIT %s", (limit,)
            )
            rows = pg_cursor.fetchall()
            return {"data": [dict(r) for r in rows], "source": "postgresql"}
        except Exception:
            pass
    data = list(store["predictions"])
    return {"data": data[-limit:], "source": "memory"}

@app.get("/api/simulate/predict")
def simulate(
    temperature: float = 75.0, vibration: float = 2.5,
    current: float = 140.0,    resistance: float = 0.12,
    voltage_a: float = 10500.0, voltage_b: float = 10800.0, voltage_c: float = 11000.0,
):
    return engine.full_prediction({
        "temperature": temperature, "vibration": vibration,
        "current": current, "resistance": resistance,
        "voltage_a": voltage_a, "voltage_b": voltage_b, "voltage_c": voltage_c,
    })

@app.get("/api/db/status")
def db_status():
    rows = {}
    if PG_AVAILABLE:
        try:
            for table in ["sensor_readings","ml_predictions","cascade_events","alerts"]:
                pg_cursor.execute(f"SELECT COUNT(*) as cnt FROM {table}")
                rows[table] = pg_cursor.fetchone()["cnt"]
        except Exception:
            pass
    return {
        "postgres" : {"connected": PG_AVAILABLE, "rows": rows},
        "influxdb" : {"connected": INFLUX_AVAILABLE},
        "redis"    : {"connected": REDIS_AVAILABLE},
    }


# ─── STARTUP ──────────────────────────────────────────────
def start_mqtt():
    client = mqtt.Client(client_id=CLIENT_ID)
    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect
    client.on_message    = on_message
    while True:
        try:
            client.connect(BROKER, PORT, keepalive=60)
            client.loop_forever()
        except Exception as e:
            print(f"[MQTT] Connection failed: {e}. Retrying in 5s...")
            time.sleep(5)


if __name__ == "__main__":
    threading.Thread(target=start_mqtt, daemon=True).start()
    time.sleep(2)
    print("\n[API] Starting FastAPI on http://localhost:8000")
    print("[API] Swagger UI: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
