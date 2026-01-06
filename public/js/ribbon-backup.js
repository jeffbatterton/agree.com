
/////////////////////////////
// Contract to Cash Ribbon //
/////////////////////////////
// Get canvas element from HTML
const canvas = document.querySelector("[data-contract-to-cash-ribbon='canvas']");
if (!canvas) {
  console.warn("Canvas element not found for contract-to-cash-ribbon");
} else {
  const ctx = canvas.getContext("2d");

/* ==========================
    Baseline / layout
    ========================== */

const ENABLE_MOTION = true;
const LINES = 33;
const SPACING = 7;
const LINE_WIDTH = 1;
const PIN_X = 0.20;

const SEED = Math.random() * 10000;
const STEPS = 260;

/* ==========================
    Motion
    ========================== */

const TIME_SPEED = 0.003;
const PHASE_DRIFT_SPEED = 0.55;

/* ==========================
    Torsion field
    ========================== */

const BASE_TWIST = 0.26;
const TWIST_AMP = 0.78;

const TWIST_CYCLES = 1.55;
const H2_RATIO = 2.25;
const H3_RATIO = 3.65;

const H2_GAIN = 0.62;
const H3_GAIN = 0.28;

const PHASE_PER_LINE = 0.18;

/* ==========================
    Entry / Exit twists
    ========================== */

const START_TWIST_START = 0.00;
const START_TWIST_END = 0.16;
const START_TWIST_POWER = 2.0;
const START_TWIST_TOTAL = Math.PI;

const EXIT_TWIST_START = 0.84;
const EXIT_TWIST_END = 0.985;
const EXIT_TWIST_POWER = 1.9;
const EXIT_TWIST_TOTAL = Math.PI;

const EXIT_LEFT_START = 0.84;
const EXIT_LEFT_END = 0.998;
const EXIT_LEFT_POWER = 1.7;
const EXIT_LEFT_PX = 520;

/* ==========================
    3D projection
    ========================== */

const PERSPECTIVE = 760;
const Z_Y_TILT = 0.05;

/* ==========================
    Gradient (RGBA)
    ========================== */

const GRADIENT_A = { r: 244, g: 51,  b: 171, a: .25 };
const GRADIENT_B = { r: 242, g: 169, b: 0,   a: .25 };
const GRADIENT_C = { r: 77,  g: 60,  b: 255, a: .25 };

/* ==========================
    Helpers
    ========================== */

const TAU = Math.PI * 2;

function hash1(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function ramp01(u, a, b, power) {
  const t = clamp01((u - a) / Math.max(1e-6, (b - a)));
  let x = smoothstep(t);
  if (power > 1) x = Math.pow(x, power);
  return x;
}

function fadeOut01(u, start, end, power) {
  const t = clamp01((u - start) / Math.max(1e-6, (end - start)));
  return 1 - Math.pow(smoothstep(t), power);
}

function projectX(x, xCenter, z) {
  const p = PERSPECTIVE / (PERSPECTIVE - z);
  return (x - xCenter) * p + xCenter;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpRGBA(c1, c2, t) {
  return {
    r: lerp(c1.r, c2.r, t),
    g: lerp(c1.g, c2.g, t),
    b: lerp(c1.b, c2.b, t),
    a: lerp(c1.a, c2.a, t)
  };
}

function rgbaToString(c) {
  return `rgba(${c.r.toFixed(0)}, ${c.g.toFixed(0)}, ${c.b.toFixed(0)}, ${c.a.toFixed(3)})`;
}

function gradientColor(t) {
  t = clamp01(t);
  if (t <= 0.5) {
    return rgbaToString(lerpRGBA(GRADIENT_A, GRADIENT_B, t / 0.5));
  } else {
    return rgbaToString(lerpRGBA(GRADIENT_B, GRADIENT_C, (t - 0.5) / 0.5));
  }
}

/* ==========================
    Geometry + draw
    ========================== */

  let width = 0, height = 0, dpr = 1;
  let offsets = [];
  let t = 0;
  let isAnimating = false;
  let initialHeight = null;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    
    // Set height only on first load
    if (initialHeight === null) {
      initialHeight = rect.height;
      height = initialHeight;
      canvas.style.height = height + 'px';
      canvas.height = Math.floor(height * dpr);
    } else {
      height = initialHeight;
    }

    canvas.width = Math.floor(width * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    offsets = [];
    const mid = (LINES - 1) / 2;
    for (let i = 0; i < LINES; i++) {
      offsets.push((i - mid) * SPACING);
    }

    if (!ENABLE_MOTION) {
      draw();
    }
  }

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = LINE_WIDTH;

  const x0 = width * PIN_X;

  const basePA = hash1(SEED + 10.1) * TAU;
  const basePB = hash1(SEED + 20.2) * TAU;
  const basePC = hash1(SEED + 30.3) * TAU;

  const drift = ENABLE_MOTION ? (t * PHASE_DRIFT_SPEED) : 0;
  const pA = basePA + drift;
  const pB = basePB - drift * 0.7;
  const pC = basePC + drift * 0.35;

  const sign = (hash1(SEED + 99.9) < 0.5) ? -1 : 1;

  const minOff = offsets[0];
  const maxOff = offsets[offsets.length - 1];
  const denom = Math.max(1e-6, (maxOff - minOff));

  for (let i = 0; i < LINES; i++) {
    const s0 = offsets[i];
    const gT = (s0 - minOff) / denom;
    ctx.strokeStyle = gradientColor(gT);

    const lp = (i - (LINES - 1) / 2) * PHASE_PER_LINE;
    ctx.beginPath();

    for (let j = 0; j <= STEPS; j++) {
      const u = j / STEPS;
      const y = u * height;

      const a1 = Math.sin(u * TWIST_CYCLES * TAU + pA + lp);
      const a2 = Math.sin(u * (TWIST_CYCLES * H2_RATIO) * TAU + pB - lp * 0.65);
      const a3 = Math.sin(u * (TWIST_CYCLES * H3_RATIO) * TAU + pC + lp * 0.35);

      const thetaField =
        sign * (BASE_TWIST + TWIST_AMP * (a1 + H2_GAIN * a2 + H3_GAIN * a3));

      const startF = fadeOut01(u, START_TWIST_START, START_TWIST_END, START_TWIST_POWER);
      const exitF  = ramp01(u, EXIT_TWIST_START, EXIT_TWIST_END, EXIT_TWIST_POWER);

      const theta = thetaField
        + sign * startF * START_TWIST_TOTAL
        + sign * exitF  * EXIT_TWIST_TOTAL;

      const exitLeftF = ramp01(u, EXIT_LEFT_START, EXIT_LEFT_END, EXIT_LEFT_POWER);
      const exitLeft = -EXIT_LEFT_PX * exitLeftF;

      const xObj = (x0 + exitLeft) + (s0 * Math.cos(theta));
      const zObj = (s0 * Math.sin(theta));

      const x = projectX(xObj, x0, zObj);
      const y2 = y + zObj * Z_Y_TILT;

      if (j === 0) ctx.moveTo(x, y2);
      else ctx.lineTo(x, y2);
    }

    ctx.stroke();
  }

  if (ENABLE_MOTION) {
    t += TIME_SPEED;
    isAnimating = true;
    requestAnimationFrame(draw);
  } else {
    isAnimating = false;
  }
}

function startAnimation() {
  if (ENABLE_MOTION && !isAnimating) {
    isAnimating = true;
    requestAnimationFrame(draw);
  }
}

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  window.addEventListener("resize", resize);
  resize();
  startAnimation();
}
////////////////////////////////////
// End of Contract to Cash Ribbon //
////////////////////////////////////