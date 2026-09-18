-- PostgreSQL Init Script
-- Power Plant Predictive Maintenance Database

CREATE TABLE IF NOT EXISTS sensor_readings (
    id          SERIAL PRIMARY KEY,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature FLOAT,
    vibration   FLOAT,
    current     FLOAT,
    resistance  FLOAT,
    voltage_a   FLOAT,
    voltage_b   FLOAT,
    voltage_c   FLOAT,
    health_score FLOAT,
    rul_hours   FLOAT,
    wear_pct    FLOAT,
    phase       VARCHAR(20),
    source      VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS ml_predictions (
    id              SERIAL PRIMARY KEY,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rul_hours       FLOAT,
    health_score    FLOAT,
    is_anomaly      BOOLEAN,
    failure_type    VARCHAR(50),
    fault_type      VARCHAR(20),
    blackout_risk   BOOLEAN,
    blackout_proba  FLOAT,
    sections_affected INT,
    mw_loss         FLOAT,
    alert_level     VARCHAR(20),
    summary         TEXT
);

CREATE TABLE IF NOT EXISTS cascade_events (
    id            SERIAL PRIMARY KEY,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cascade_step  INT,
    event         TEXT,
    component     VARCHAR(100),
    severity      VARCHAR(20),
    failure_mode  VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level       VARCHAR(20),
    message     TEXT,
    rul_hours   FLOAT,
    acknowledged BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS weather_readings (
    id           SERIAL PRIMARY KEY,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    city         VARCHAR(100),
    temperature  FLOAT,
    feels_like   FLOAT,
    humidity     INT,
    pressure     INT,
    wind_speed   FLOAT,
    condition    VARCHAR(100),
    brush_stress FLOAT,
    power_derating FLOAT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON ml_predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level, timestamp DESC);

-- Insert sample historical data
INSERT INTO alerts (level, message, rul_hours) VALUES
('WARNING', 'Brush degradation detected - temperature rising', 24.5),
('CRITICAL', 'Brush failure imminent - schedule maintenance', 6.2),
('WARNING', 'Vibration anomaly detected on bearing', 18.0);
