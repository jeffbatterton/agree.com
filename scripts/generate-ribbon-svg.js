#!/usr/bin/env node
/**
 * Generates 800×800 SVG ribbons: entry and exit edges are random (right, bottom, left, top).
 * Shape: open quarter-ellipse curve with strands, waves and twist (3D perspective).
 * Usage: node scripts/generate-ribbon-svg.js
 * Output: public/img/ribbons/ribbon-1.svg … ribbon-6.svg
 */

const fs = require("fs");
const path = require("path");

const SIZE = 800;
const ZOOM = 1.35;
const OUT_DIR = path.join(__dirname, "..", "public", "img", "ribbons");
const NUM_RIBBONS = 6;

function hash1(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

const HALF_PI = Math.PI / 2;

function randomConfig(seed) {
  const r = (offset, lo, hi) => lo + hash1(seed + offset) * (hi - lo);
  const startAngleIndex = Math.floor(hash1(seed + 50) * 4);
  const START_ANGLE = startAngleIndex * HALF_PI;
  return {
    SEED: seed,
    START_ANGLE,
    LINES: Math.floor(r(1, 45, 75)),
    STEPS: Math.floor(r(2, 320, 420)),
    PERSPECTIVE: 800,
    RIBBON_DEPTH: r(3, 280, 420),
    WAVE_FREQUENCY: r(4, 0.5, 4),
    WAVE_AMPLITUDE: r(5, 0, 32),
    TWIST_1_AMOUNT: r(6, 0.06, 0.25),
    TWIST_2_AMOUNT: r(7, 0.06, 0.25),
    TWIST_1_POSITION: r(8, 0.25, 0.45),
    TWIST_2_POSITION: r(9, 0.5, 0.75),
    TWIST_REGION_WIDTH: r(10, 0.28, 0.5),
    BASE_TWIST_TURNS: r(11, 0, 0.18),
  };
}

function generateRibbonSVG() {
  const seed = Math.random() * 10000;
  const cfg = randomConfig(seed);

  const width = SIZE;
  const height = SIZE;
  const drift = 0;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const TAU = Math.PI * 2;
  const a = width * 0.45;
  const b = height * 0.45;
  const startAngle = cfg.START_ANGLE;

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  const lineSpacing = cfg.RIBBON_DEPTH / (cfg.LINES - 1);
  const midLine = (cfg.LINES - 1) / 2;

  const allPoints = [];
  const paths = [];

  for (let i = 0; i < cfg.LINES; i++) {
    const zOffset = (i - midLine) * lineSpacing;
    const pts = [];
    let zSum = 0;

    for (let j = 0; j <= cfg.STEPS; j++) {
      const u = j / cfg.STEPS;
      const theta = startAngle + u * HALF_PI;

      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const centerX = cx + a * cosT;
      const centerY = cy + b * sinT;

      const tx = -a * sinT;
      const ty = b * cosT;
      const len = Math.hypot(tx, ty) || 1;
      const Nx = ty / len;
      const Ny = -tx / len;

      const wave = cfg.WAVE_AMPLITUDE * Math.sin(theta * cfg.WAVE_FREQUENCY + drift);

      let twistAmount = 0;
      const dist1 = Math.abs(u - cfg.TWIST_1_POSITION) / cfg.TWIST_REGION_WIDTH;
      const dist2 = Math.abs(u - cfg.TWIST_2_POSITION) / cfg.TWIST_REGION_WIDTH;
      const softness = 0.45;
      const envelope1 = 1 - smoothstep(Math.min(1, dist1 * softness));
      const envelope2 = 1 - smoothstep(Math.min(1, dist2 * softness));
      const twist1 = Math.sin(u * TAU + drift * 0.5) * cfg.TWIST_1_AMOUNT * envelope1;
      const twist2 =
        Math.sin(u * TAU + drift * 0.5 + Math.PI * 0.5) * cfg.TWIST_2_AMOUNT * envelope2;
      twistAmount += twist1 + twist2;

      const baseTwist = u * TAU * cfg.BASE_TWIST_TURNS;
      const twistAngle = twistAmount * Math.PI + baseTwist;
      const cosTwist = Math.cos(twistAngle);
      const sinTwist = Math.sin(twistAngle);

      const radialOffset = zOffset * cosTwist;
      const z3d = zOffset * sinTwist + wave;

      const x2d = centerX + Nx * radialOffset;
      const y2d = centerY + Ny * radialOffset;

      const scale = cfg.PERSPECTIVE / (cfg.PERSPECTIVE + z3d);
      const screenX = cx + (x2d - cx) * scale;
      const screenY = cy + (y2d - cy) * scale;

      pts.push({ x: screenX, y: screenY });
      zSum += z3d;
      allPoints.push({ x: screenX, y: screenY });
    }

    paths.push({ pts, avgZ: zSum / pts.length });
  }

  paths.sort((a, b) => a.avgZ - b.avgZ);

  const minX = Math.min(...allPoints.map((p) => p.x));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxY = Math.max(...allPoints.map((p) => p.y));
  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const fitScale = Math.min(SIZE / bboxW, SIZE / bboxH);
  const scale = fitScale * ZOOM;
  const half = SIZE / 2;

  const pathElements = paths
    .map(({ pts }) => {
      const d = pts
        .map((p, k) => {
          const nx = (p.x - centerX) * scale + half;
          const ny = (p.y - centerY) * scale + half;
          return k === 0 ? `M ${nx} ${ny}` : `L ${nx} ${ny}`;
        })
        .join(" ");
      return `<path fill="none" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
    })
    .join("\n    ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  ${pathElements}
</svg>
`;
  return svg;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (let i = 1; i <= NUM_RIBBONS; i++) {
  const svg = generateRibbonSVG();
  const outFile = path.join(OUT_DIR, `ribbon-${i}.svg`);
  fs.writeFileSync(outFile, svg, "utf8");
  console.log("Wrote", outFile);
}
