// India geographic bounds
export const INDIA_BOUNDS = {
  minLon: 68.0,
  maxLon: 97.5,
  minLat: 6.5,
  maxLat: 37.0,
};

// Convert lat/lon to 3D scene coordinates
export function latLonToScene(lat: number, lon: number): [number, number, number] {
  const { minLon, maxLon, minLat, maxLat } = INDIA_BOUNDS;
  const width = 20;
  const depth = 20;
  const x = ((lon - minLon) / (maxLon - minLon)) * width - width / 2;
  const z = -(((lat - minLat) / (maxLat - minLat)) * depth - depth / 2);
  return [x, 0, z];
}

// Regional grid zones of India
export const INDIA_REGIONS = [
  { id: "NR", name: "Northern Region", color: "#00E5FF", states: ["Delhi", "Punjab", "Haryana", "UP", "Rajasthan", "J&K", "HP", "Uttarakhand"] },
  { id: "WR", name: "Western Region", color: "#39FF88", states: ["Maharashtra", "Gujarat", "MP", "Goa", "Chhattisgarh"] },
  { id: "SR", name: "Southern Region", color: "#FFD166", states: ["Tamil Nadu", "Karnataka", "AP", "Telangana", "Kerala"] },
  { id: "ER", name: "Eastern Region", color: "#B56CFF", states: ["West Bengal", "Odisha", "Bihar", "Jharkhand"] },
  { id: "NER", name: "North-Eastern Region", color: "#FF6B9D", states: ["Assam", "Meghalaya", "Manipur", "Nagaland", "Tripura", "Mizoram", "Arunachal", "Sikkim"] },
];

// Simplified India outline (major boundary points)
export const INDIA_OUTLINE: [number, number][] = [
  [77.0, 35.5], [78.5, 34.5], [80.0, 34.0], [82.0, 30.5], [88.5, 27.0],
  [89.5, 26.5], [92.0, 27.5], [94.0, 27.0], [95.5, 27.5], [97.0, 28.0],
  [97.5, 27.0], [96.5, 24.5], [94.5, 23.0], [93.5, 22.0], [92.5, 20.5],
  [91.0, 22.5], [89.0, 22.0], [88.0, 21.5], [87.0, 21.0], [85.0, 19.5],
  [83.5, 17.5], [82.0, 16.5], [80.5, 13.5], [79.5, 10.5], [78.0, 8.5],
  [77.5, 8.0], [76.5, 9.0], [75.0, 12.0], [73.5, 15.5], [72.5, 17.5],
  [72.5, 20.0], [72.0, 21.5], [69.5, 22.5], [68.5, 23.5], [69.5, 26.0],
  [70.5, 27.5], [71.0, 28.0], [74.0, 29.0], [76.0, 31.5], [75.5, 32.5],
  [74.0, 34.5], [75.0, 35.0], [77.0, 35.5],
];

// Grid asset definitions with real India geographic positions
export interface IndiaGridAsset {
  id: string;
  type: "generator" | "substation" | "transformer" | "feeder" | "switch" | "load_center";
  label: string;
  state: string;
  region: string;
  lat: number;
  lon: number;
  baseLoad: number;
  baseVoltage: number;
  baseTemp: number;
  age: number;
  capacity: number;
}

export const INDIA_GRID_ASSETS: IndiaGridAsset[] = [
  // ── Northern Region ──
  { id: "G1", type: "generator", label: "Bhakra Nangal Hydro", state: "Punjab", region: "NR", lat: 31.41, lon: 76.44, baseLoad: 55, baseVoltage: 1.02, baseTemp: 45, age: 40, capacity: 1325 },
  { id: "G2", type: "generator", label: "Dadri Thermal", state: "UP", region: "NR", lat: 28.57, lon: 77.60, baseLoad: 68, baseVoltage: 1.01, baseTemp: 62, age: 15, capacity: 1820 },
  { id: "S1", type: "substation", label: "Delhi 400kV Sub", state: "Delhi", region: "NR", lat: 28.61, lon: 77.20, baseLoad: 72, baseVoltage: 1.0, baseTemp: 58, age: 18, capacity: 500 },
  { id: "S2", type: "substation", label: "Jaipur Grid Sub", state: "Rajasthan", region: "NR", lat: 26.91, lon: 75.79, baseLoad: 62, baseVoltage: 1.0, baseTemp: 55, age: 12, capacity: 400 },
  { id: "T1", type: "transformer", label: "Panipat Trans", state: "Haryana", region: "NR", lat: 29.39, lon: 76.96, baseLoad: 68, baseVoltage: 0.99, baseTemp: 60, age: 14, capacity: 315 },
  { id: "T5", type: "transformer", label: "Lucknow Trans", state: "UP", region: "NR", lat: 26.85, lon: 80.94, baseLoad: 58, baseVoltage: 1.01, baseTemp: 54, age: 8, capacity: 250 },

  // ── Western Region (T17 lives here as our critical asset) ──
  { id: "G3", type: "generator", label: "Tarapur Nuclear", state: "Maharashtra", region: "WR", lat: 19.83, lon: 72.66, baseLoad: 65, baseVoltage: 1.02, baseTemp: 48, age: 25, capacity: 1400 },
  { id: "G4", type: "generator", label: "Sardar Sarovar", state: "Gujarat", region: "WR", lat: 21.83, lon: 73.75, baseLoad: 50, baseVoltage: 1.03, baseTemp: 42, age: 20, capacity: 1450 },
  { id: "S3", type: "substation", label: "Mumbai Central Sub", state: "Maharashtra", region: "WR", lat: 19.07, lon: 72.87, baseLoad: 78, baseVoltage: 0.99, baseTemp: 62, age: 22, capacity: 600 },
  { id: "S4", type: "substation", label: "Pune Grid Sub", state: "Maharashtra", region: "WR", lat: 18.52, lon: 73.85, baseLoad: 65, baseVoltage: 1.0, baseTemp: 56, age: 15, capacity: 450 },
  { id: "T17", type: "transformer", label: "Nashik Trans T17", state: "Maharashtra", region: "WR", lat: 19.99, lon: 73.78, baseLoad: 78, baseVoltage: 0.97, baseTemp: 65, age: 12, capacity: 25 },
  { id: "F8", type: "feeder", label: "Feeder F8 Nashik-Pune", state: "Maharashtra", region: "WR", lat: 19.25, lon: 73.83, baseLoad: 55, baseVoltage: 0.98, baseTemp: 48, age: 11, capacity: 20 },
  { id: "T3", type: "transformer", label: "Ahmedabad Trans", state: "Gujarat", region: "WR", lat: 23.03, lon: 72.58, baseLoad: 60, baseVoltage: 0.98, baseTemp: 57, age: 11, capacity: 280 },
  { id: "T14", type: "transformer", label: "Nagpur Trans T14", state: "Maharashtra", region: "WR", lat: 21.15, lon: 79.08, baseLoad: 48, baseVoltage: 1.01, baseTemp: 49, age: 6, capacity: 250 },
  { id: "T19", type: "transformer", label: "Aurangabad Trans T19", state: "Maharashtra", region: "WR", lat: 19.87, lon: 75.34, baseLoad: 52, baseVoltage: 1.0, baseTemp: 51, age: 7, capacity: 220 },

  // ── Southern Region ──
  { id: "G5", type: "generator", label: "Kudankulam Nuclear", state: "Tamil Nadu", region: "SR", lat: 8.17, lon: 77.71, baseLoad: 60, baseVoltage: 1.02, baseTemp: 46, age: 8, capacity: 2000 },
  { id: "G6", type: "generator", label: "Ramagundam Thermal", state: "Telangana", region: "SR", lat: 18.79, lon: 79.47, baseLoad: 70, baseVoltage: 1.01, baseTemp: 64, age: 30, capacity: 2600 },
  { id: "S5", type: "substation", label: "Chennai Grid Sub", state: "Tamil Nadu", region: "SR", lat: 13.08, lon: 80.27, baseLoad: 70, baseVoltage: 1.0, baseTemp: 58, age: 14, capacity: 500 },
  { id: "S6", type: "substation", label: "Bengaluru Grid Sub", state: "Karnataka", region: "SR", lat: 12.97, lon: 77.59, baseLoad: 75, baseVoltage: 0.99, baseTemp: 55, age: 12, capacity: 550 },
  { id: "S7", type: "substation", label: "Hyderabad Sub", state: "Telangana", region: "SR", lat: 17.38, lon: 78.48, baseLoad: 68, baseVoltage: 1.0, baseTemp: 60, age: 13, capacity: 480 },
  { id: "T6", type: "transformer", label: "Kochi Trans", state: "Kerala", region: "SR", lat: 9.93, lon: 76.27, baseLoad: 62, baseVoltage: 0.99, baseTemp: 56, age: 9, capacity: 200 },
  { id: "T7", type: "transformer", label: "Coimbatore Trans", state: "Tamil Nadu", region: "SR", lat: 11.01, lon: 76.96, baseLoad: 58, baseVoltage: 0.99, baseTemp: 55, age: 13, capacity: 180 },

  // ── Eastern Region ──
  { id: "G7", type: "generator", label: "Farakka Thermal", state: "West Bengal", region: "ER", lat: 24.80, lon: 87.90, baseLoad: 62, baseVoltage: 1.0, baseTemp: 60, age: 28, capacity: 2100 },
  { id: "S8", type: "substation", label: "Kolkata Grid Sub", state: "West Bengal", region: "ER", lat: 22.57, lon: 88.36, baseLoad: 72, baseVoltage: 0.99, baseTemp: 58, age: 20, capacity: 500 },
  { id: "S9", type: "substation", label: "Bhubaneswar Sub", state: "Odisha", region: "ER", lat: 20.29, lon: 85.82, baseLoad: 58, baseVoltage: 1.0, baseTemp: 54, age: 10, capacity: 400 },
  { id: "T8", type: "transformer", label: "Patna Trans", state: "Bihar", region: "ER", lat: 25.59, lon: 85.13, baseLoad: 45, baseVoltage: 1.01, baseTemp: 47, age: 5, capacity: 180 },
  { id: "T9", type: "transformer", label: "Ranchi Trans", state: "Jharkhand", region: "ER", lat: 23.34, lon: 85.30, baseLoad: 65, baseVoltage: 0.98, baseTemp: 59, age: 16, capacity: 220 },

  // ── North-Eastern Region ──
  { id: "G8", type: "generator", label: "Kameng Hydro", state: "Arunachal", region: "NER", lat: 27.10, lon: 92.60, baseLoad: 45, baseVoltage: 1.03, baseTemp: 40, age: 10, capacity: 600 },
  { id: "S10", type: "substation", label: "Guwahati Grid Sub", state: "Assam", region: "NER", lat: 26.14, lon: 91.74, baseLoad: 55, baseVoltage: 1.0, baseTemp: 52, age: 12, capacity: 350 },

  // ── Load Centers ──
  { id: "L1", type: "load_center", label: "Delhi Load Center", state: "Delhi", region: "NR", lat: 28.63, lon: 77.22, baseLoad: 82, baseVoltage: 0.98, baseTemp: 42, age: 10, capacity: 400 },
  { id: "L2", type: "load_center", label: "Mumbai Load Center", state: "Maharashtra", region: "WR", lat: 19.08, lon: 72.88, baseLoad: 85, baseVoltage: 0.97, baseTemp: 45, age: 15, capacity: 500 },
  { id: "L3", type: "load_center", label: "Bengaluru Load Center", state: "Karnataka", region: "SR", lat: 12.98, lon: 77.60, baseLoad: 78, baseVoltage: 0.98, baseTemp: 40, age: 12, capacity: 450 },
];

// Grid connections (edges) — realistic Indian inter-regional grid
export const INDIA_GRID_EDGES = [
  // Northern intra-region
  { source: "G1", target: "S1", type: "transmission", capacity: 800 },
  { source: "G2", target: "S1", type: "transmission", capacity: 900 },
  { source: "S1", target: "T1", type: "distribution", capacity: 400 },
  { source: "S1", target: "L1", type: "distribution", capacity: 400 },
  { source: "S2", target: "T5", type: "distribution", capacity: 300 },
  { source: "S1", target: "S2", type: "transmission", capacity: 500 },

  // Western intra-region — the CRITICAL cascade path lives here
  { source: "G3", target: "S3", type: "transmission", capacity: 900 },
  { source: "G4", target: "S3", type: "transmission", capacity: 950 },
  { source: "S3", target: "T17", type: "distribution", capacity: 300 },
  { source: "S3", target: "T3", type: "distribution", capacity: 350 },
  { source: "S3", target: "L2", type: "distribution", capacity: 500 },
  { source: "T17", target: "F8", type: "feeder", capacity: 200 },
  { source: "F8", target: "S4", type: "feeder", capacity: 200 },
  { source: "T17", target: "T14", type: "tie", capacity: 150 },
  { source: "T17", target: "T19", type: "tie", capacity: 150 },
  { source: "S4", target: "T14", type: "distribution", capacity: 250 },

  // Southern intra-region
  { source: "G5", target: "S5", type: "transmission", capacity: 800 },
  { source: "G6", target: "S7", type: "transmission", capacity: 900 },
  { source: "S5", target: "T7", type: "distribution", capacity: 250 },
  { source: "S6", target: "L3", type: "distribution", capacity: 450 },
  { source: "S6", target: "T6", type: "distribution", capacity: 300 },
  { source: "S7", target: "S6", type: "transmission", capacity: 500 },
  { source: "S5", target: "S6", type: "transmission", capacity: 450 },

  // Eastern intra-region
  { source: "G7", target: "S8", type: "transmission", capacity: 800 },
  { source: "S8", target: "T8", type: "distribution", capacity: 250 },
  { source: "S8", target: "T9", type: "distribution", capacity: 300 },
  { source: "S9", target: "S8", type: "transmission", capacity: 400 },

  // North-Eastern intra
  { source: "G8", target: "S10", type: "transmission", capacity: 500 },

  // ── INTER-REGIONAL BACKBONE (the National Grid HVDC/EHV) ──
  { source: "S1", target: "S3", type: "transmission", capacity: 600 }, // NR ↔ WR
  { source: "S3", target: "S7", type: "transmission", capacity: 600 }, // WR ↔ SR
  { source: "S7", target: "S6", type: "transmission", capacity: 500 }, // Intra SR
  { source: "S1", target: "S8", type: "transmission", capacity: 550 }, // NR ↔ ER
  { source: "S8", target: "S10", type: "transmission", capacity: 400 }, // ER ↔ NER
  { source: "S9", target: "S8", type: "transmission", capacity: 450 }, // Intra ER
  { source: "S3", target: "S9", type: "transmission", capacity: 500 }, // WR ↔ ER
];
