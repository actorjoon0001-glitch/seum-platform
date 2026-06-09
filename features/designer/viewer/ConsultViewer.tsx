"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Grid } from "@react-three/drei";
import { HouseModel } from "./HouseModel";
import {
  createBaseSpec,
  OPTION_LABELS,
  type OptionKey,
  type SceneSpec,
} from "../spec/schema";
import {
  calculateQuote,
  formatKRW,
  OPTION_PRICE,
} from "@/lib/pricing/calculate";

type Pyeong = 10 | 14 | 19 | 25;
const PYEONGS: Pyeong[] = [10, 14, 19, 25];

type PresetKey = "front" | "aerial" | "side" | "interior";
const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "front", label: "정면" },
  { key: "aerial", label: "조감" },
  { key: "side", label: "측면" },
  { key: "interior", label: "내부" },
];

export function ConsultViewer() {
  const [spec, setSpec] = useState<SceneSpec>(() => createBaseSpec(19));
  const camRef = useRef<CameraControls | null>(null);

  const { lines, total } = calculateQuote(spec);

  function selectPyeong(p: Pyeong) {
    setSpec((prev) => ({
      ...createBaseSpec(p),
      options: prev.options, // 옵션 유지하며 평형만 변경
    }));
  }

  function toggle(key: OptionKey) {
    setSpec((prev) => ({
      ...prev,
      options: { ...prev.options, [key]: !prev.options[key] },
    }));
  }

  function applyPreset(key: PresetKey) {
    const cam = camRef.current;
    if (!cam) return;
    const w = spec.footprint.w * 0.001;
    const d = spec.footprint.d * 0.001;
    const h = spec.footprint.h * 0.001;
    const r = Math.max(w, d);
    const t = true;
    switch (key) {
      case "front":
        cam.setLookAt(0, h * 0.6, d * 0.5 + r * 1.6, 0, h * 0.5, 0, t);
        break;
      case "aerial":
        cam.setLookAt(r * 1.3, r * 1.8, r * 1.3, 0, h * 0.4, 0, t);
        break;
      case "side":
        cam.setLookAt(w * 0.5 + r * 1.5, h * 0.7, r * 0.4, 0, h * 0.5, 0, t);
        break;
      case "interior":
        cam.setLookAt(0, h * 0.5, 0, 0, h * 0.5, d, t);
        break;
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 lg:flex-row">
      {/* 3D 뷰 */}
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
        {/* 카메라 프리셋 */}
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="rounded-lg border border-neutral-700 bg-neutral-950/70 px-3 py-1.5 text-sm text-neutral-200 backdrop-blur transition hover:border-brand hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>

        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [8, 6, 9], fov: 45 }}
        >
          <color attach="background" args={["#141414"]} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[8, 12, 6]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-6, 5, -6]} intensity={0.4} />
          <Suspense fallback={null}>
            <HouseModel spec={spec} />
          </Suspense>
          <Grid
            args={[40, 40]}
            cellColor="#2a2a2a"
            sectionColor="#3a3a3a"
            fadeDistance={35}
            position={[0, -0.1, 0]}
            infiniteGrid
          />
          <CameraControls
            ref={camRef}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.05}
          />
        </Canvas>

        <p className="absolute bottom-3 left-3 z-10 text-xs text-neutral-500">
          드래그: 회전 · 휠: 확대 · 상단 버튼: 시점 전환
        </p>
      </div>

      {/* 옵션 + 견적 패널 */}
      <aside className="flex w-full flex-col rounded-2xl border border-neutral-800 bg-neutral-900 p-5 lg:w-80">
        <h2 className="text-lg font-semibold">상담 견적</h2>

        {/* 평형 선택 */}
        <div className="mt-4">
          <p className="mb-2 text-sm text-neutral-400">평형</p>
          <div className="grid grid-cols-4 gap-1.5">
            {PYEONGS.map((p) => (
              <button
                key={p}
                onClick={() => selectPyeong(p)}
                className={`rounded-lg border py-2 text-sm transition ${
                  spec.pyeong === p
                    ? "border-brand bg-brand/15 text-white"
                    : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                }`}
              >
                {p}평
              </button>
            ))}
          </div>
        </div>

        {/* 옵션 토글 */}
        <div className="mt-5">
          <p className="mb-2 text-sm text-neutral-400">옵션</p>
          <div className="space-y-1.5">
            {(Object.keys(OPTION_LABELS) as OptionKey[]).map((key) => {
              const on = spec.options[key];
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition ${
                    on
                      ? "border-brand bg-brand/15 text-white"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        on ? "border-brand bg-brand" : "border-neutral-600"
                      }`}
                    >
                      {on && <span className="text-[10px]">✓</span>}
                    </span>
                    {OPTION_LABELS[key]}
                  </span>
                  <span className="text-xs text-neutral-400">
                    +{formatKRW(OPTION_PRICE[key])}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 견적 내역 */}
        <div className="mt-5 flex-1 border-t border-neutral-800 pt-4">
          <div className="space-y-1.5 text-sm">
            {lines.map((l) => (
              <div key={l.key} className="flex justify-between text-neutral-300">
                <span>{l.label}</span>
                <span>{formatKRW(l.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 총액 */}
        <div className="mt-4 rounded-xl bg-brand/10 p-4">
          <p className="text-sm text-neutral-400">예상 총액</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatKRW(total)}
          </p>
          <button className="mt-3 w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark">
            이대로 견적서 만들기
          </button>
        </div>
      </aside>
    </div>
  );
}
