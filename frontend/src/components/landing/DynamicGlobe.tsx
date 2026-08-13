"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import type { Arc, Marker } from "cobe";

const MARKER_DATA = [
  { lat: 48.8566, lng: 2.3522, label: "FLR — Flare FTSOv2" },
  { lat: 40.7128, lng: -74.006, label: "ETH — Ethereum Mainnet" },
  { lat: 37.7749, lng: -122.4194, label: "USDC — Base L2" },
  { lat: 51.5074, lng: -0.1278, label: "BTC — Arbitrum One" },
  { lat: 35.6762, lng: 139.65, label: "AVAX — Avalanche C-Chain" },
];

// Index pairs into MARKER_DATA — a connected mesh so assets have several
// non-overlapping paths to travel, keeping simultaneous transfers visually distinct.
const ROUTES: [number, number][] = [
  [1, 0],
  [0, 2],
  [1, 3],
  [0, 4],
  [2, 4],
  [3, 4],
  [1, 2],
  [3, 0],
];

// Two restrained brand tones, alternated per lane — enough to read as distinct
// flows without turning into a multicolor toy palette.
const ASSET_COLORS: [number, number, number][] = [
  [0.957, 0.945, 0.914], // ivory
  [0.698, 0.784, 0.729], // sage
];

const ASSET_COUNT = 4;
const TRAVEL_MS_MIN = 4200;
const TRAVEL_MS_MAX = 7000;
const RESPAWN_DELAY_MIN = 300;
const RESPAWN_DELAY_MAX = 1600;

type Vec3 = { x: number; y: number; z: number };

function toCartesian(lat: number, lng: number): Vec3 {
  const lr = (lat * Math.PI) / 180;
  const gr = (lng * Math.PI) / 180;
  return {
    x: Math.cos(lr) * Math.sin(gr),
    y: Math.sin(lr),
    z: Math.cos(lr) * Math.cos(gr),
  };
}

function toLatLng(v: Vec3): [number, number] {
  const lat = (Math.asin(Math.max(-1, Math.min(1, v.y))) * 180) / Math.PI;
  const lng = (Math.atan2(v.x, v.z) * 180) / Math.PI;
  return [lat, lng];
}

// Spherical linear interpolation — gives a natural great-circle path across the
// globe surface rather than a straight cut through lat/lng space.
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
  const theta = Math.acos(dot);
  if (theta < 1e-6) return a;
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;
  return {
    x: a.x * wa + b.x * wb,
    y: a.y * wa + b.y * wb,
    z: a.z * wa + b.z * wb,
  };
}

function dim(c: [number, number, number], f: number): [number, number, number] {
  return [c[0] * f, c[1] * f, c[2] * f];
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

interface AssetState {
  routeIdx: number;
  reversed: boolean;
  progress: number;
  speedPerMs: number;
  color: [number, number, number];
  state: "traveling" | "waiting";
  waitUntil: number;
}

function pickRoute(assets: AssetState[], forIdx: number): number {
  const inUse = new Set(
    assets
      .filter((a, i) => i !== forIdx && a.state === "traveling")
      .map((a) => a.routeIdx)
  );
  const free = ROUTES.map((_, i) => i).filter((i) => !inUse.has(i));
  const pool = free.length > 0 ? free : ROUTES.map((_, i) => i);
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnAsset(assets: AssetState[], idx: number, color: [number, number, number]): AssetState {
  return {
    routeIdx: pickRoute(assets, idx),
    reversed: Math.random() < 0.5,
    progress: 0,
    speedPerMs: 1 / randRange(TRAVEL_MS_MIN, TRAVEL_MS_MAX),
    color,
    state: "traveling",
    waitUntil: 0,
  };
}

function projectMarker(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  cssW: number,
  cssH: number,
  scale: number,
  offX: number,
  offY: number
): { x: number; y: number; visible: boolean } {
  const lr = (lat * Math.PI) / 180;
  const gr = (lng * Math.PI) / 180;

  let x = Math.cos(lr) * Math.sin(gr);
  let y = Math.sin(lr);
  let z = Math.cos(lr) * Math.cos(gr);

  const cp = Math.cos(phi),
    sp = Math.sin(phi);
  const x1 = x * cp + z * sp;
  const z1 = -x * sp + z * cp;

  const ct = Math.cos(theta),
    st = Math.sin(theta);
  const y1 = y * ct - z1 * st;
  const z2 = y * st + z1 * ct;

  const r = Math.min(cssW, cssH) * scale * 0.5;
  const cx = cssW / 2 + offX;
  const cy = cssH / 2 + offY;

  return { x: cx + x1 * r, y: cy - y1 * r, visible: z2 > 0 };
}

export function DynamicGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverTargetRefs = useRef<(HTMLDivElement | null)[]>([]);

  const phiRef = useRef(0.8);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cap DPR — full retina (2x) resolution on a globe this size is the single
    // biggest cost per frame and what mainly shows up as scroll jank.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let vw = window.innerWidth;
    let cW = vw * dpr;
    let cH = Math.round(vw * 0.56 * dpr);
    const SCALE = 1.65;
    const THETA = 0.25;
    const PHI_SPEED_PER_MS = 0.00012;

    const assets: AssetState[] = Array.from({ length: ASSET_COUNT }, (_, i) => {
      const a = spawnAsset([], i, ASSET_COLORS[i % ASSET_COLORS.length]);
      // Stagger initial progress so assets don't all appear to depart at once.
      a.progress = Math.random();
      return a;
    });

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: cW,
      height: cH,
      phi: 0.8,
      theta: THETA,
      dark: 1,
      diffuse: 1.35,
      scale: SCALE,
      offset: [0, cH * 0.28],
      mapSamples: 16000,
      mapBrightness: 4.8,
      baseColor: [0.06, 0.08, 0.1],
      markerColor: [0.85, 0.85, 0.85],
      glowColor: [0.12, 0.14, 0.18],
      markers: MARKER_DATA.map((m) => ({
        location: [m.lat, m.lng] as [number, number],
        size: 0.008,
      })),
      arcs: [],
      arcColor: [0.85, 0.85, 0.85],
      arcWidth: 0.028,
      arcHeight: 0.14,
    });

    // Pause all work while the globe is scrolled out of view — this is what was
    // causing the scroll lag, since the render loop kept driving WebGL redraws
    // even when nothing was visible.
    let isVisible = true;
    let animId: number | null = null;
    let lastFrameTime = performance.now();

    const buildFrame = (now: number) => {
      const dt = Math.min(now - lastFrameTime, 100);
      lastFrameTime = now;

      if (!isDraggingRef.current) {
        phiRef.current += PHI_SPEED_PER_MS * dt;
      }

      const hubMarkers: Marker[] = MARKER_DATA.map((m) => ({
        location: [m.lat, m.lng] as [number, number],
        size: 0.008,
      }));

      const travelMarkers: Marker[] = [];
      const activeArcs: Arc[] = [];

      assets.forEach((asset, i) => {
        if (asset.state === "waiting") {
          if (now >= asset.waitUntil) {
            assets[i] = spawnAsset(assets, i, asset.color);
          }
          return;
        }

        asset.progress += asset.speedPerMs * dt;
        if (asset.progress >= 1) {
          asset.state = "waiting";
          asset.waitUntil = now + randRange(RESPAWN_DELAY_MIN, RESPAWN_DELAY_MAX);
          return;
        }

        const [fromIdx, toIdx] = ROUTES[asset.routeIdx];
        const fromHub = MARKER_DATA[asset.reversed ? toIdx : fromIdx];
        const toHub = MARKER_DATA[asset.reversed ? fromIdx : toIdx];
        const a = toCartesian(fromHub.lat, fromHub.lng);
        const b = toCartesian(toHub.lat, toHub.lng);

        activeArcs.push({
          from: [fromHub.lat, fromHub.lng],
          to: [toHub.lat, toHub.lng],
          color: dim(asset.color, 0.2),
        });

        // A soft halo behind a small core, with a long, smoothly-fading tail —
        // reads as a signal traveling the wire rather than a bouncing marble.
        const t = asset.progress;
        [
          { t, size: 0.026, fade: 0.14 },
          { t, size: 0.015, fade: 1 },
          { t: Math.max(0, t - 0.02), size: 0.012, fade: 0.5 },
          { t: Math.max(0, t - 0.045), size: 0.009, fade: 0.3 },
          { t: Math.max(0, t - 0.075), size: 0.007, fade: 0.16 },
          { t: Math.max(0, t - 0.11), size: 0.005, fade: 0.08 },
        ].forEach((pt) => {
          const [lat, lng] = toLatLng(slerp(a, b, pt.t));
          travelMarkers.push({
            location: [lat, lng],
            size: pt.size,
            color: dim(asset.color, pt.fade),
          });
        });
      });

      globe.update({
        phi: phiRef.current,
        markers: [...hubMarkers, ...travelMarkers],
        arcs: activeArcs,
      });

      const cssW = cW / dpr;
      const cssH = cH / dpr;
      const offYcss = (cH * 0.28) / dpr;

      MARKER_DATA.forEach((m, i) => {
        const el = hoverTargetRefs.current[i];
        if (!el) return;
        const pos = projectMarker(
          m.lat,
          m.lng,
          phiRef.current,
          THETA,
          cssW,
          cssH,
          SCALE,
          0,
          offYcss
        );
        if (pos.visible && pos.y > 0 && pos.y < cssH) {
          el.style.left = `${pos.x}px`;
          el.style.top = `${pos.y}px`;
          el.style.opacity = "1";
          el.style.display = "block";
        } else {
          el.style.opacity = "0";
          el.style.display = "none";
        }
      });
    };

    const loop = () => {
      buildFrame(performance.now());
      animId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (animId !== null) return;
      lastFrameTime = performance.now();
      animId = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      if (animId === null) return;
      cancelAnimationFrame(animId);
      animId = null;
    };

    startLoop();

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    // Window-level mouse/touch drag handlers for 100% reliable rotation anywhere
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        phiRef.current += deltaX * 0.004;
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("pointerdown", onPointerDown);
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Scroll rotation
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const sy = window.scrollY;
      phiRef.current += (sy - lastScrollY) * 0.0003;
      lastScrollY = sy;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Resize (debounced to a single rAF so rapid resize events don't thrash layout)
    let resizeRaf: number | null = null;
    const onResize = () => {
      if (resizeRaf !== null) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        vw = window.innerWidth;
        cW = vw * dpr;
        cH = Math.round(vw * 0.56 * dpr);
        globe.update({
          width: cW,
          height: cH,
          scale: SCALE,
          offset: [0, cH * 0.28],
        });
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopLoop();
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      observer.disconnect();
      globe.destroy();
      if (container) {
        container.removeEventListener("pointerdown", onPointerDown);
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none -mb-16 touch-none"
    >
      <canvas
        ref={canvasRef}
        className="block w-full cursor-grab active:cursor-grabbing"
      />

      {/* Hover target overlays over projected dot positions */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
        {MARKER_DATA.map((m, i) => (
          <div
            key={m.label}
            ref={(el) => {
              hoverTargetRefs.current[i] = el;
            }}
            className="absolute pointer-events-auto cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
            style={{ top: 0, left: 0, width: "36px", height: "36px" }}
          >
            {/* Soft pulse/hover ring around dot */}
            <div className="absolute inset-1.5 rounded-full border border-white/40 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

            {/* Currency badge tooltip – pops up cleanly when hovering cursor over dot */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-30">
              <div className="px-3 py-1.5 rounded-lg border border-white/30 bg-[#0B0F12]/95 backdrop-blur-md shadow-2xl flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono-tech font-bold tracking-wider text-ivory">
                  {m.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0B0F12] via-[#0B0F12]/80 to-transparent pointer-events-none z-10" />
    </div>
  );
}
