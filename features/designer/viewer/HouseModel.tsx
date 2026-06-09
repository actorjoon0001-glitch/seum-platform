"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { SceneSpec } from "../spec/schema";

/** mm → m */
const S = 0.001;

const COLORS = {
  wall: "#e7e2d8",
  wallTrim: "#cfc7b8",
  roof: "#6b7280",
  loft: "#c9a87c",
  deck: "#a97c50",
  solar: "#1e3a5f",
  porch: "#b8b2a6",
  glass: "#7fb6d8",
  ground: "#1a1a1a",
  highlight: "#2563eb",
};

export function HouseModel({ spec }: { spec: SceneSpec }) {
  const w = spec.footprint.w * S;
  const d = spec.footprint.d * S;
  const h = spec.footprint.h * S;

  const roofHeight = Math.min(w, d) * 0.35;

  // 박공지붕(삼각 프리즘) 지오메트리
  const roofGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - 0.15, 0);
    shape.lineTo(w / 2 + 0.15, 0);
    shape.lineTo(0, roofHeight);
    shape.lineTo(-w / 2 - 0.15, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d + 0.3,
      bevelEnabled: false,
    });
    geo.translate(0, 0, -(d + 0.3) / 2);
    return geo;
  }, [w, d, roofHeight]);

  return (
    <group position={[0, 0, 0]}>
      {/* 바닥 슬래브 */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[w + 0.2, 0.1, d + 0.2]} />
        <meshStandardMaterial color={COLORS.wallTrim} />
      </mesh>

      {/* 본체 벽 */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={COLORS.wall} />
      </mesh>

      {/* 정면 창문 2개 + 문 */}
      <Window x={-w * 0.25} y={h * 0.5} z={d / 2 + 0.01} />
      <Window x={w * 0.25} y={h * 0.5} z={d / 2 + 0.01} />
      <Door x={0} z={d / 2 + 0.01} h={h} />

      {/* 측면 창 */}
      <Window x={w / 2 + 0.01} y={h * 0.5} z={0} rotY={Math.PI / 2} />

      {/* 박공지붕 */}
      <mesh geometry={roofGeo} position={[0, h, 0]} castShadow>
        <meshStandardMaterial color={COLORS.roof} side={THREE.DoubleSide} />
      </mesh>

      {/* 옵션: 다락 (지붕 아래 매스 + 측면 작은 창) */}
      {spec.options.loft && (
        <group>
          <mesh position={[0, h + roofHeight * 0.35, 0]}>
            <boxGeometry args={[w * 0.9, roofHeight * 0.6, d * 0.9]} />
            <meshStandardMaterial
              color={COLORS.loft}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh position={[0, h + roofHeight * 0.45, d / 2 + 0.02]}>
            <boxGeometry args={[w * 0.3, roofHeight * 0.3, 0.05]} />
            <meshStandardMaterial
              color={COLORS.glass}
              emissive={COLORS.glass}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      )}

      {/* 옵션: 데크 (정면 바닥 확장) */}
      {spec.options.deck && (
        <group position={[0, 0, d / 2 + (d * 0.4) / 2]}>
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[w * 0.8, 0.12, d * 0.4]} />
            <meshStandardMaterial color={COLORS.deck} />
          </mesh>
          {/* 데크 난간 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(s * w * 0.8) / 2, 0.4, 0]}>
              <boxGeometry args={[0.06, 0.7, d * 0.4]} />
              <meshStandardMaterial color={COLORS.deck} />
            </mesh>
          ))}
        </group>
      )}

      {/* 옵션: 포치 (현관 지붕 + 기둥) */}
      {spec.options.porch && (
        <group position={[0, 0, d / 2 + 0.6]}>
          <mesh position={[0, h * 0.92, 0]} castShadow>
            <boxGeometry args={[w * 0.5, 0.12, 1.2]} />
            <meshStandardMaterial color={COLORS.porch} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(s * w * 0.5) / 2 - s * 0.1, h * 0.46, 0.5]}>
              <cylinderGeometry args={[0.07, 0.07, h * 0.92]} />
              <meshStandardMaterial color={COLORS.porch} />
            </mesh>
          ))}
        </group>
      )}

      {/* 옵션: 태양광 (지붕 패널) */}
      {spec.options.solar &&
        [-1, 1].map((side) => (
          <mesh
            key={side}
            position={[
              side * w * 0.22,
              h + roofHeight * 0.5,
              0,
            ]}
            rotation={[0, 0, side * (Math.atan2(roofHeight, w / 2) - Math.PI / 2) * -1]}
          >
            <boxGeometry args={[w * 0.34, 0.04, d * 0.7]} />
            <meshStandardMaterial
              color={COLORS.solar}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        ))}
    </group>
  );
}

function Window({
  x,
  y,
  z,
  rotY = 0,
}: {
  x: number;
  y: number;
  z: number;
  rotY?: number;
}) {
  return (
    <mesh position={[x, y, z]} rotation={[0, rotY, 0]}>
      <boxGeometry args={[1, 1, 0.04]} />
      <meshStandardMaterial
        color={COLORS.glass}
        emissive={COLORS.glass}
        emissiveIntensity={0.15}
        metalness={0.4}
        roughness={0.1}
      />
    </mesh>
  );
}

function Door({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <mesh position={[x, (h * 0.7) / 2, z]}>
      <boxGeometry args={[0.9, h * 0.7, 0.05]} />
      <meshStandardMaterial color="#5b4636" />
    </mesh>
  );
}
