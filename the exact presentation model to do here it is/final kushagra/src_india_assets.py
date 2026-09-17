"""
GridSense Unified India Grid Assets Provider
Constructs and validates the core India national grid model with 3D topological scene coordinates,
real geographic coordinates, and electrical telemetry.
"""

from typing import Dict, List, Any

# Geographic Bounds
INDIA_BOUNDS = {
    "minLon": 68.0,
    "maxLon": 97.5,
    "minLat": 6.5,
    "maxLat": 37.0
}

def lat_lon_to_scene(lat: float, lon: float) -> Dict[str, float]:
    w, d = 20.0, 20.0
    x = ((lon - INDIA_BOUNDS["minLon"]) / (INDIA_BOUNDS["maxLon"] - INDIA_BOUNDS["minLon"])) * w - (w / 2.0)
    z = -(((lat - INDIA_BOUNDS["minLat"]) / (INDIA_BOUNDS["maxLat"] - INDIA_BOUNDS["minLat"])) * d - (d / 2.0))
    return {"x": round(x, 2), "y": 0.0, "z": round(z, 2)}

INDIA_RAW_NODES = [
    # Northern Region
    {"id": "G1", "type": "generator", "label": "Bhakra Nangal Hydro", "state": "Punjab", "region": "NR", "lat": 31.41, "lon": 76.44, "load": 55.0, "v": 1.02, "t": 45.0, "age": 40, "cap": 1325.0},
    {"id": "G2", "type": "generator", "label": "Dadri Thermal", "state": "UP", "region": "NR", "lat": 28.57, "lon": 77.60, "load": 68.0, "v": 1.01, "t": 62.0, "age": 15, "cap": 1820.0},
    {"id": "S1", "type": "substation", "label": "Delhi 400kV Sub", "state": "Delhi", "region": "NR", "lat": 28.61, "lon": 77.20, "load": 72.0, "v": 1.00, "t": 58.0, "age": 18, "cap": 500.0},
    {"id": "S2", "type": "substation", "label": "Jaipur Grid Sub", "state": "Rajasthan", "region": "NR", "lat": 26.91, "lon": 75.79, "load": 62.0, "v": 1.00, "t": 55.0, "age": 12, "cap": 400.0},
    {"id": "T1", "type": "transformer", "label": "Panipat Trans", "state": "Haryana", "region": "NR", "lat": 29.39, "lon": 76.96, "load": 68.0, "v": 0.99, "t": 60.0, "age": 14, "cap": 315.0},
    {"id": "T5", "type": "transformer", "label": "Lucknow Trans", "state": "UP", "region": "NR", "lat": 26.85, "lon": 80.94, "load": 58.0, "v": 1.01, "t": 54.0, "age": 8, "cap": 250.0},

    # Western Region (T17 Critical Asset Hub)
    {"id": "G3", "type": "generator", "label": "Tarapur Nuclear", "state": "Maharashtra", "region": "WR", "lat": 19.83, "lon": 72.66, "load": 65.0, "v": 1.02, "t": 48.0, "age": 25, "cap": 1400.0},
    {"id": "G4", "type": "generator", "label": "Sardar Sarovar", "state": "Gujarat", "region": "WR", "lat": 21.83, "lon": 73.75, "load": 50.0, "v": 1.03, "t": 42.0, "age": 20, "cap": 1450.0},
    {"id": "S3", "type": "substation", "label": "Mumbai Central Sub", "state": "Maharashtra", "region": "WR", "lat": 19.07, "lon": 72.87, "load": 78.0, "v": 0.99, "t": 62.0, "age": 22, "cap": 600.0},
    {"id": "S4", "type": "substation", "label": "Pune Grid Sub", "state": "Maharashtra", "region": "WR", "lat": 18.52, "lon": 73.85, "load": 65.0, "v": 1.00, "t": 56.0, "age": 15, "cap": 450.0},
    {"id": "T17", "type": "transformer", "label": "Nashik Trans T17", "state": "Maharashtra", "region": "WR", "lat": 19.99, "lon": 73.78, "load": 78.0, "v": 0.97, "t": 65.0, "age": 12, "cap": 250.0},
    {"id": "F8", "type": "feeder", "label": "Feeder F8 Nashik-Pune", "state": "Maharashtra", "region": "WR", "lat": 19.25, "lon": 73.83, "load": 55.0, "v": 0.98, "t": 48.0, "age": 11, "cap": 200.0},
    {"id": "T3", "type": "transformer", "label": "Ahmedabad Trans", "state": "Gujarat", "region": "WR", "lat": 23.03, "lon": 72.58, "load": 60.0, "v": 0.98, "t": 57.0, "age": 11, "cap": 280.0},
    {"id": "T14", "type": "transformer", "label": "Nagpur Trans T14", "state": "Maharashtra", "region": "WR", "lat": 21.15, "lon": 79.08, "load": 48.0, "v": 1.01, "t": 49.0, "age": 6, "cap": 250.0},
    {"id": "T19", "type": "transformer", "label": "Aurangabad Trans T19", "state": "Maharashtra", "region": "WR", "lat": 19.87, "lon": 75.34, "load": 52.0, "v": 1.00, "t": 51.0, "age": 7, "cap": 220.0},

    # Southern Region
    {"id": "G5", "type": "generator", "label": "Kudankulam Nuclear", "state": "Tamil Nadu", "region": "SR", "lat": 8.17, "lon": 77.71, "load": 60.0, "v": 1.02, "t": 46.0, "age": 8, "cap": 2000.0},
    {"id": "G6", "type": "generator", "label": "Ramagundam Thermal", "state": "Telangana", "region": "SR", "lat": 18.79, "lon": 79.47, "load": 70.0, "v": 1.01, "t": 64.0, "age": 30, "cap": 2600.0},
    {"id": "S5", "type": "substation", "label": "Chennai Grid Sub", "state": "Tamil Nadu", "region": "SR", "lat": 13.08, "lon": 80.27, "load": 70.0, "v": 1.00, "t": 58.0, "age": 14, "cap": 500.0},
    {"id": "S6", "type": "substation", "label": "Bengaluru Grid Sub", "state": "Karnataka", "region": "SR", "lat": 12.97, "lon": 77.59, "load": 75.0, "v": 0.99, "t": 55.0, "age": 12, "cap": 550.0},
    {"id": "S7", "type": "substation", "label": "Hyderabad Sub", "state": "Telangana", "region": "SR", "lat": 17.38, "lon": 78.48, "load": 68.0, "v": 1.00, "t": 60.0, "age": 13, "cap": 480.0},
    {"id": "T6", "type": "transformer", "label": "Kochi Trans", "state": "Kerala", "region": "SR", "lat": 9.93, "lon": 76.27, "load": 62.0, "v": 0.99, "t": 56.0, "age": 9, "cap": 200.0},
    {"id": "T7", "type": "transformer", "label": "Coimbatore Trans", "state": "Tamil Nadu", "region": "SR", "lat": 11.01, "lon": 76.96, "load": 58.0, "v": 0.99, "t": 55.0, "age": 13, "cap": 180.0},

    # Eastern Region
    {"id": "G7", "type": "generator", "label": "Farakka Thermal", "state": "West Bengal", "region": "ER", "lat": 24.80, "lon": 87.90, "load": 62.0, "v": 1.00, "t": 60.0, "age": 28, "cap": 2100.0},
    {"id": "S8", "type": "substation", "label": "Kolkata Grid Sub", "state": "West Bengal", "region": "ER", "lat": 22.57, "lon": 88.36, "load": 72.0, "v": 0.99, "t": 58.0, "age": 20, "cap": 500.0},
    {"id": "S9", "type": "substation", "label": "Bhubaneswar Sub", "state": "Odisha", "region": "ER", "lat": 20.29, "lon": 85.82, "load": 58.0, "v": 1.00, "t": 54.0, "age": 10, "cap": 400.0},
    {"id": "T8", "type": "transformer", "label": "Patna Trans", "state": "Bihar", "region": "ER", "lat": 25.59, "lon": 85.13, "load": 45.0, "v": 1.01, "t": 47.0, "age": 5, "cap": 180.0},
    {"id": "T9", "type": "transformer", "label": "Ranchi Trans", "state": "Jharkhand", "region": "ER", "lat": 23.34, "lon": 85.30, "load": 65.0, "v": 0.98, "t": 59.0, "age": 16, "cap": 220.0},

    # North-Eastern Region
    {"id": "G8", "type": "generator", "label": "Kameng Hydro", "state": "Arunachal", "region": "NER", "lat": 27.10, "lon": 92.60, "load": 45.0, "v": 1.03, "t": 40.0, "age": 10, "cap": 600.0},
    {"id": "S10", "type": "substation", "label": "Guwahati Grid Sub", "state": "Assam", "region": "NER", "lat": 26.14, "lon": 91.74, "load": 55.0, "v": 1.00, "t": 52.0, "age": 12, "cap": 350.0},

    # Load Centers
    {"id": "L1", "type": "load_center", "label": "Delhi Load Center", "state": "Delhi", "region": "NR", "lat": 28.63, "lon": 77.22, "load": 82.0, "v": 0.98, "t": 42.0, "age": 10, "cap": 400.0},
    {"id": "L2", "type": "load_center", "label": "Mumbai Load Center", "state": "Maharashtra", "region": "WR", "lat": 19.08, "lon": 72.88, "load": 85.0, "v": 0.97, "t": 45.0, "age": 15, "cap": 500.0},
    {"id": "L3", "type": "load_center", "label": "Bengaluru Load Center", "state": "Karnataka", "region": "SR", "lat": 12.98, "lon": 77.60, "load": 78.0, "v": 0.98, "t": 40.0, "age": 12, "cap": 450.0},
]

INDIA_RAW_EDGES = [
    # Northern intra-region
    {"source": "G1", "target": "S1", "type": "transmission", "capacity": 800.0},
    {"source": "G2", "target": "S1", "type": "transmission", "capacity": 900.0},
    {"source": "S1", "target": "T1", "type": "distribution", "capacity": 400.0},
    {"source": "S1", "target": "L1", "type": "distribution", "capacity": 400.0},
    {"source": "S2", "target": "T5", "type": "distribution", "capacity": 300.0},
    {"source": "S1", "target": "S2", "type": "transmission", "capacity": 500.0},

    # Western intra-region — the CRITICAL cascade path
    {"source": "G3", "target": "S3", "type": "transmission", "capacity": 900.0},
    {"source": "G4", "target": "S3", "type": "transmission", "capacity": 950.0},
    {"source": "S3", "target": "T17", "type": "distribution", "capacity": 300.0},
    {"source": "S3", "target": "T3", "type": "distribution", "capacity": 350.0},
    {"source": "S3", "target": "L2", "type": "distribution", "capacity": 500.0},
    {"source": "T17", "target": "F8", "type": "feeder", "capacity": 200.0},
    {"source": "F8", "target": "S4", "type": "feeder", "capacity": 200.0},
    {"source": "T17", "target": "T14", "type": "tie", "capacity": 150.0},
    {"source": "T17", "target": "T19", "type": "tie", "capacity": 150.0},
    {"source": "S4", "target": "T14", "type": "distribution", "capacity": 250.0},

    # Southern intra-region
    {"source": "G5", "target": "S5", "type": "transmission", "capacity": 800.0},
    {"source": "G6", "target": "S7", "type": "transmission", "capacity": 900.0},
    {"source": "S5", "target": "T7", "type": "distribution", "capacity": 250.0},
    {"source": "S6", "target": "L3", "type": "distribution", "capacity": 450.0},
    {"source": "S6", "target": "T6", "type": "distribution", "capacity": 300.0},
    {"source": "S7", "target": "S6", "type": "transmission", "capacity": 500.0},
    {"source": "S5", "target": "S6", "type": "transmission", "capacity": 450.0},

    # Eastern intra-region
    {"source": "G7", "target": "S8", "type": "transmission", "capacity": 800.0},
    {"source": "S8", "target": "T8", "type": "distribution", "capacity": 250.0},
    {"source": "S8", "target": "T9", "type": "distribution", "capacity": 300.0},
    {"source": "S9", "target": "S8", "type": "transmission", "capacity": 400.0},

    # North-Eastern intra
    {"source": "G8", "target": "S10", "type": "transmission", "capacity": 500.0},

    # INTER-REGIONAL NATIONAL BACKBONE
    {"source": "S1", "target": "S3", "type": "transmission", "capacity": 600.0},
    {"source": "S3", "target": "S7", "type": "transmission", "capacity": 600.0},
    {"source": "S7", "target": "S6", "type": "transmission", "capacity": 500.0},
    {"source": "S1", "target": "S8", "type": "transmission", "capacity": 550.0},
    {"source": "S8", "target": "S10", "type": "transmission", "capacity": 400.0},
    {"source": "S9", "target": "S8", "type": "transmission", "capacity": 450.0},
    {"source": "S3", "target": "S9", "type": "transmission", "capacity": 500.0},
]

def get_unified_india_grid() -> Dict[str, Any]:
    nodes = []
    for raw in INDIA_RAW_NODES:
        pos = lat_lon_to_scene(raw["lat"], raw["lon"])
        nodes.append({
            "id": raw["id"],
            "type": raw["type"],
            "label": raw["label"],
            "name": raw["label"],
            "state": raw["state"],
            "region": raw["region"],
            "lat": raw["lat"],
            "lon": raw["lon"],
            "position": pos,
            "features": {
                "load_pct": raw["load"],
                "voltage_pu": raw["v"],
                "temperature_c": raw["t"],
                "age_years": raw["age"],
                "capacity_mva": raw["cap"],
                "demand_mw": raw["cap"] * (raw["load"] / 100.0) * 0.8 if raw["type"] != "generator" else 0.0,
                "gen_mw": raw["cap"] * (raw["load"] / 100.0) if raw["type"] == "generator" else 0.0,
                "p_mw": raw["cap"] * (raw["load"] / 100.0),
                "q_mvar": raw["cap"] * (raw["load"] / 100.0) * 0.3,
                "is_tripped": False
            },
            "status": "healthy",
            "risk_score": 0.04,
            "is_root_cause": False,
            "is_in_cascade": False
        })

    edges = []
    for i, e in enumerate(INDIA_RAW_EDGES):
        edges.append({
            "id": f"E{i}",
            "source": e["source"],
            "target": e["target"],
            "type": e["type"],
            "capacity_mva": e["capacity"],
            "current_load_pct": 42.0 + (i % 15),
            "loading_pct": 42.0 + (i % 15),
            "status": "normal",
            "is_cascade_path": False,
            "length_km": 15.0 + (i * 4.5),
            "reactance_pu": 0.08,
            "is_tripped": False
        })

    return {
        "nodes": nodes,
        "edges": edges
    }
