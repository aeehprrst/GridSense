"use client";
import { useMemo } from "react";
import { INDIA_OUTLINE, latLonToScene, INDIA_REGIONS } from "@/lib/indiaGeo";
import * as THREE from "three";

// Cast Three.js line element to any to prevent JSX SVG conflict
const ThreeLine = "line" as any;

export function IndiaMap3D() {
  const outlinePoints = useMemo(() => {
    return INDIA_OUTLINE.map(([lon, lat]) => {
      const [x, , z] = latLonToScene(lat, lon);
      return new THREE.Vector3(x, 0.01, z);
    });
  }, []);

  const outlineGeometry = useMemo(() => {
    const closed = [...outlinePoints, outlinePoints[0]];
    return new THREE.BufferGeometry().setFromPoints(closed);
  }, [outlinePoints]);

  // Create filled India shape
  const fillShape = useMemo(() => {
    const shape = new THREE.Shape();
    outlinePoints.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, p.z);
      else shape.lineTo(p.x, p.z);
    });
    shape.closePath();
    return shape;
  }, [outlinePoints]);

  return (
    <group>
      {/* Filled landmass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <shapeGeometry args={[fillShape]} />
        <meshBasicMaterial color="#0a1420" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Glowing outline */}
      <ThreeLine geometry={outlineGeometry}>
        <lineBasicMaterial color="#00E5FF" transparent opacity={0.7} />
      </ThreeLine>

      {/* Second outline for glow */}
      <ThreeLine geometry={outlineGeometry} position={[0, 0.02, 0]}>
        <lineBasicMaterial color="#00E5FF" transparent opacity={0.3} />
      </ThreeLine>

      {/* Region labels */}
      {INDIA_REGIONS.map((region) => {
        const positions: Record<string, [number, number]> = {
          NR: [77, 30],
          WR: [74, 20],
          SR: [78, 12],
          ER: [86, 24],
          NER: [93, 26],
        };
        const [lon, lat] = positions[region.id];
        const [x, , z] = latLonToScene(lat, lon);
        return (
          <mesh key={region.id} position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.35, 32]} />
            <meshBasicMaterial color={region.color} transparent opacity={0.08} />
          </mesh>
        );
      })}
    </group>
  );
}
