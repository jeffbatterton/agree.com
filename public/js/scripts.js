/////////////////////
// Parallax System //
/////////////////////

// Canvas isFixed threshold - adjust this value to change when canvas switches from fixed to absolute
const CANVAS_ISFIXED_THRESHOLD = 25;

function updateScroll() {
  const display = document.querySelector('[data-attr-parallax-system="display"]');
  if (!display) return;
  
  const displayRect = display.getBoundingClientRect();
  const displayHeight = displayRect.height;
  const displayTop = displayRect.top; // Distance from viewport top (negative when scrolled past)
  const displayBottom = displayRect.bottom; // Distance from viewport top
  
  // Calculate progress:
  // Negative values when display hasn't reached viewport top yet
  // 0% when top of display reaches viewport top (displayTop = 0)
  // 100% when bottom of display reaches viewport top (displayBottom = 0)
  
  let progress = 0;
  
  if (displayTop > 0) {
    // Display hasn't reached viewport top yet - show negative value
    // Calculate how far away it is as a percentage of display height
    progress = -(displayTop / displayHeight) * 100;
  } else {
    // Display is scrolling through viewport or has scrolled past
    // displayTop goes from 0 to -displayHeight and continues decreasing
    // Progress = how far past the top we've scrolled / total height
    progress = (-displayTop / displayHeight) * 100;
    progress = Math.max(0, Math.min(110, progress)); // Clamp between 0 and 110
  }
  
  // Display scroll phases (adjustable)
  const displayScrollPhase1Start = 2;  
  const displayScrollPhase2Start = 8; 
  const displayScrollPhase3Start = 14; 
  const displayScrollPhase4Start = 20;
  const displayScrollPhaseEnd = 62;
  
  // Determine current phase
  let currentPhase = 0;
  if (progress >= displayScrollPhase4Start) {
    currentPhase = 4;
  } else if (progress >= displayScrollPhase3Start) {
    currentPhase = 3;
  } else if (progress >= displayScrollPhase2Start) {
    currentPhase = 2;
  } else if (progress >= displayScrollPhase1Start) {
    currentPhase = 1;
  }
  
  // Apply phase class to card
  const card = document.querySelector('[data-attr-parallax-system="display--card"]');
  if (card) {
    if (progress >= displayScrollPhaseEnd) {
      // Remove all phase classes when display scroll reaches phase end
      card.classList.remove('parallax-system--display--phase1', 'parallax-system--display--phase2', 'parallax-system--display--phase3', 'parallax-system--display--phase4');
    } else {
      // Remove all phase classes first
      card.classList.remove('parallax-system--display--phase1', 'parallax-system--display--phase2', 'parallax-system--display--phase3', 'parallax-system--display--phase4');
      
      // Add current phase class if phase > 0
      if (currentPhase > 0) {
        card.classList.add(`parallax-system--display--phase${currentPhase}`);
      }
    }
  }
  
  // Calculate CTA scroll percentage
  const cta = document.querySelector('[data-attr-parallax-system="cta"]');
  let ctaScrollProgress = 0;
  if (cta) {
    const ctaRect = cta.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const ctaTop = ctaRect.top;
    
    // 0% when cta top hits viewport bottom (ctaTop = viewportHeight)
    // 100% when cta top hits viewport top (ctaTop = 0)
    // Progress = (viewportHeight - ctaTop) / viewportHeight * 100
    if (ctaTop <= viewportHeight && ctaTop >= 0) {
      ctaScrollProgress = ((viewportHeight - ctaTop) / viewportHeight) * 100;
    } else if (ctaTop < 0) {
      ctaScrollProgress = 100;
    } else {
      ctaScrollProgress = 0;
    }
    
    // Cap at 100%
    ctaScrollProgress = Math.min(100, ctaScrollProgress);
  }
  
  // Fix qualities section and show spacer when CTA scroll > 0%
  const qualities = document.querySelector('[data-attr-parallax-system="qualities"]');
  const qualitiesSpacer = document.querySelector('[data-attr-parallax-system="qualities--spacer"]');
  
  if (ctaScrollProgress > 0) {
    if (qualities) {
      qualities.classList.add('isFixed');
    }
    
    if (qualitiesSpacer) {
      qualitiesSpacer.classList.add('isVisible');
    }
  } else {
    // Reset when CTA scroll <= 0%
    if (qualities) {
      qualities.classList.remove('isFixed');
    }
    
    if (qualitiesSpacer) {
      qualitiesSpacer.classList.remove('isVisible');
    }
  }
  
  // Card scroll rates (adjustable)
  const cardScrollInRate = 0.75; // Adjust this value to change card scroll-in rate (0.5 = half speed)
  const cardScrollOutRate = .9; // Adjust this value to change card scroll-out rate
  const cardScrollOutTrigger = 50; // Adjust this value to change when scroll-out begins (percentage of display scroll)
  
  if (card) {
    // Remove all state classes first
    card.classList.remove('isScrollingOut', 'isCentered', 'isScrollingIn');
    
    if (progress >= cardScrollOutTrigger) {
      // Display scroll >= trigger point, apply scroll-out animation
      // Calculate scroll-out progress from trigger point (progress can exceed 100%)
      const scrollOutProgress = (progress - cardScrollOutTrigger) / (100 - cardScrollOutTrigger); // Can exceed 1
      
      const viewportHeight = window.innerHeight;
      const cardHeight = 730;
      const centerTop = (viewportHeight / 2) - (cardHeight / 2);
      
      // Calculate how far the card should move from center to fully exit viewport
      // Card needs to move from center to beyond viewport top (centerTop + cardHeight to clear it)
      const scrollOutDistance = centerTop + cardHeight; // Distance from center to fully off viewport top
      const cardTranslateY = -scrollOutDistance * scrollOutProgress * cardScrollOutRate;
      
      card.classList.add('isScrollingOut');
      card.style.setProperty('--card-top', `${centerTop + cardTranslateY}px`);
      card.style.removeProperty('--card-translate-y');
    } else {
      // Display scroll < trigger point, use scroll-in logic
      // Initialize scroll tracking to 0 so scroll delta is calculated from page start
      if (typeof window.cardInitialScrollY === 'undefined') {
        window.cardInitialScrollY = 0;
      }
      
      const currentScrollY = window.scrollY || window.pageYOffset;
      const scrollDelta = currentScrollY - window.cardInitialScrollY;
      const viewportHeight = window.innerHeight;
      const cardHeight = 730;
      
      // Calculate the scroll position where card would reach center
      const cardStartTop = 87 * viewportHeight / 100;
      const cardStartCenter = cardStartTop + (cardHeight / 2);
      const targetCenter = viewportHeight / 2;
      const centerDistance = cardStartCenter - targetCenter;
      
      // Calculate scroll position needed to reach center (accounting for parallax rate)
      const scrollToReachCenter = centerDistance / cardScrollInRate;
      
      if (scrollDelta >= scrollToReachCenter && !card.dataset.scrolledPastCenter) {
        // Card has reached center, fix it there
        card.dataset.scrollYAtCenter = currentScrollY.toString();
        card.dataset.scrolledPastCenter = 'true';
      }
      
      // Check if we've scrolled back before the center position
      if (card.dataset.scrollYAtCenter) {
        const scrollYAtCenter = parseFloat(card.dataset.scrollYAtCenter);
        if (currentScrollY < scrollYAtCenter) {
          // Scrolled back before center, remove fixed state
          delete card.dataset.scrolledPastCenter;
          delete card.dataset.scrollYAtCenter;
        }
      }
      
      // Clear scroll-out tracking when below trigger
      if (card.dataset.scrollYAt60) {
        delete card.dataset.scrollYAt60;
      }
      
      if (card.dataset.scrolledPastCenter) {
        // Card is fixed at center
        card.classList.add('isCentered');
        card.style.removeProperty('--card-top');
        card.style.removeProperty('--card-translate-y');
      } else {
        // Apply parallax (scroll-in)
        const cardTranslateY = -scrollDelta * cardScrollInRate;
        card.classList.add('isScrollingIn');
        card.style.setProperty('--card-top', '87vh');
        card.style.setProperty('--card-translate-y', `${cardTranslateY}px`);
      }
    }
  }
  
  // Show journey--0 when display scroll reaches 50%
  const journey0 = document.querySelector('[data-attr-parallax-system="journey--0"]');
  const hero = document.querySelector('[data-attr-parallax-system="hero"]');
  if (journey0) {
    if (progress >= 50) {
      journey0.classList.add('isVisible');
      // Add opacity: 0 to hero when journey--0 is first shown
      if (hero) {
        hero.classList.add('opacity-0');
      }
    } else {
      journey0.classList.remove('isVisible');
      // Reset hero opacity when journey--0 is hidden
      if (hero) {
        hero.classList.remove('opacity-0');
      }
    }
    
    // Set journey--0 to position: relative when display scroll reaches 100%
    if (progress >= 100) {
      journey0.classList.add('isRelative');
    } else {
      journey0.classList.remove('isRelative');
    }
  }
  
  // Hide journey--spacer when display scroll reaches 100%
  const journeySpacer = document.querySelector('[data-attr-parallax-system="journey--spacer"]');
  if (journeySpacer) {
    if (progress >= 100) {
      journeySpacer.classList.add('isHidden');
    } else {
      journeySpacer.classList.remove('isHidden');
    }
  }
  
  // Toggle isFixed class on canvas based on display scroll (only after ribbon is initialized)
  const ribbonCanvas = document.querySelector("[data-contract-to-cash-ribbon='canvas']");
  if (ribbonCanvas && window.ribbonInitialized) {
    if (progress < CANVAS_ISFIXED_THRESHOLD) {
      ribbonCanvas.classList.add('isFixed');
    } else {
      ribbonCanvas.classList.remove('isFixed');
    }
  }
}

// Track scroll position and double scroll rate when display scroll < 100%
let lastScrollY = window.scrollY || window.pageYOffset;
let isAdjustingScroll = false;

window.addEventListener('wheel', function(event) {
  // Check if display scroll is less than 100%
  const display = document.querySelector('[data-attr-parallax-system="display"]');
  if (!display) {
    updateScroll();
    return;
  }
  
  const displayRect = display.getBoundingClientRect();
  const displayHeight = displayRect.height;
  const displayTop = displayRect.top;
  
  let progress = 0;
  if (displayTop > 0) {
    // Show negative values when display hasn't reached viewport top
    progress = -(displayTop / displayHeight) * 100;
  } else if (displayRect.bottom <= 0) {
    progress = 100;
  } else {
    progress = (-displayTop / displayHeight) * 100;
    progress = Math.max(0, Math.min(100, progress));
  }
  
  // Double scroll rate when progress < 100%
  if (progress < 100 && !isAdjustingScroll) {
    event.preventDefault();
    isAdjustingScroll = true;
    
    const scrollAmount = event.deltaY * 2; // Double the scroll amount
    const currentScrollY = window.scrollY || window.pageYOffset;
    const newScrollY = Math.max(0, currentScrollY + scrollAmount);
    
    window.scrollTo({
      top: newScrollY,
      behavior: 'auto'
    });
    
    // Update scroll after a brief delay
    setTimeout(() => {
      isAdjustingScroll = false;
      lastScrollY = window.scrollY || window.pageYOffset;
      updateScroll();
    }, 10);
  } else {
    updateScroll();
  }
}, { passive: false });

window.addEventListener('scroll', function() {
  if (!isAdjustingScroll) {
    updateScroll();
  }
});

// Initialize scroll tracking on page load
window.cardInitialScrollY = 0;

// Initialize journey--0 styles on page load
const journey0 = document.querySelector('[data-attr-parallax-system="journey--0"]');
if (journey0) {
  journey0.classList.add('isLoaded');
}

// Initialize on page load
updateScroll();
////////////////////////////
// End of Parallax System //
////////////////////////////

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
  let frameCount = 0;
  let skipFrames = 0; // Skip every N frames for performance

  function init() {
    // Use offsetWidth/offsetHeight instead of getBoundingClientRect to avoid layout thrashing
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;

    // Safety check: if dimensions are invalid or too large, don't initialize
    if (width <= 0 || height <= 0) {
      console.warn("Canvas dimensions are invalid:", width, height);
      return;
    }

    // Safety check: limit canvas height to prevent performance issues
    // If canvas is larger than 5000px, cap it (this is a very large canvas)
    const maxHeight = 5000;
    if (height > maxHeight) {
      console.warn(`Canvas height (${height}px) exceeds maximum (${maxHeight}px). Limiting for performance.`);
      height = maxHeight;
    }

    // Adjust frame skipping based on canvas size for performance
    // Larger canvases need more frame skipping
    if (height > 3000) {
      skipFrames = 1; // Skip every other frame for very large canvases
    } else if (height > 2000) {
      skipFrames = 0; // Draw every frame for medium canvases
    } else {
      skipFrames = 0; // Draw every frame for small canvases
    }

    // Set canvas drawing buffer dimensions (with device pixel ratio for crisp rendering)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Initialize offsets array
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
    // Don't draw if dimensions are invalid
    if (width <= 0 || height <= 0) {
      if (ENABLE_MOTION) {
        isAnimating = false;
      }
      return;
    }

    frameCount++;
    // Skip drawing frames for performance on large canvases
    const shouldDraw = skipFrames === 0 || frameCount % (skipFrames + 1) === 0;

    if (shouldDraw) {
      ctx.clearRect(0, 0, width, height);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = LINE_WIDTH;
    }

    const x0 = width * PIN_X;

    const basePA = hash1(SEED + 10.1) * TAU;
    const basePB = hash1(SEED + 20.2) * TAU;
    const basePC = hash1(SEED + 30.3) * TAU;

    const drift = ENABLE_MOTION ? (t * PHASE_DRIFT_SPEED) : 0;
    const pA = basePA + drift;
    const pB = basePB - drift * 0.7;
    const pC = basePC + drift * 0.35;

    const sign = (hash1(SEED + 99.9) < 0.5) ? -1 : 1;

    if (shouldDraw) {
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

  // Initialize once on load - wait for canvas to be properly sized
  // Use double requestAnimationFrame to ensure layout is complete
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      init();
      // Only start animation if initialization was successful (width and height are valid)
      if (width > 0 && height > 0) {
        startAnimation();
        // Mark ribbon as initialized so isFixed class can be applied
        window.ribbonInitialized = true;
        // Trigger updateScroll to apply isFixed class on initial load
        updateScroll();
      }
    });
  });
}
////////////////////////////////////
// End of Contract to Cash Ribbon //
////////////////////////////////////

///////////////////
// Shiny Buttons //
///////////////////
document.querySelectorAll("[data-attr-button-shiny]").forEach((btn) => {
  const OUTER = 200;     // starts influencing
  const INNER = 100;     // full influence
  const BASE = 90;       // base angle when far away
  let raf = 0;

  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const smoothstep = (t) => t * t * (3 - 2 * t);

  // Normalize degrees to [0, 360)
  const norm = (deg) => ((deg % 360) + 360) % 360;

  // Shortest signed difference from a->b in degrees, range (-180..180]
  const shortestDelta = (a, b) => {
    let d = norm(b) - norm(a);
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    return d;
  };

  const update = (clientX, clientY) => {
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    const dist = Math.hypot(dx, dy);

    // Outside OUTER: reset
    if (dist > OUTER) {
      btn.style.setProperty("--glow-angle", `${BASE}deg`);
      return;
    }

    // Mouse angle in degrees (0..360)
    const mouseAngle = norm(Math.atan2(dy, dx) * (180 / Math.PI) + 90);

    // Proximity: 0 at OUTER, 1 at INNER (and inside)
    let p = (OUTER - dist) / (OUTER - INNER);
    p = smoothstep(clamp01(p)); // optional smoothing

    // Blend BASE -> mouseAngle along shortest rotation
    const out = norm(BASE + shortestDelta(BASE, mouseAngle) * p);

    btn.style.setProperty("--glow-angle", `${out}deg`);
  };

  const onMove = (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      update(e.clientX, e.clientY);
    });
  };

  window.addEventListener("pointermove", onMove);
});
//////////////////////////
// End of Shiny Buttons //
//////////////////////////

////////////////////
// Customer Logos //
////////////////////
(() => {
  const TRACK_SEL = "[data-customer-logos]";

  function setupTrack(track) {
    if (track.dataset.loopReady === "true") return;
    track.dataset.loopReady = "true";

    // Find the first child div (the set containing logos)
    const firstSet = track.querySelector(":scope > div");
    if (!firstSet) return;

    // Clone the set and append to the track if less than 2 sets exist
    const sets = Array.from(track.querySelectorAll(":scope > div"));
    if (sets.length < 2) {
      const clone = firstSet.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    }

    const updateDistance = () => {
      // Measure the width of the first set using getBoundingClientRect().width
      const w = firstSet.getBoundingClientRect().width;
      // Set CSS custom property --loop-distance on the track element (negative for left translation)
      track.style.setProperty("--loop-distance", `-${w}px`);
    };

    // Wait for images to load before calculating distance
    const imgs = Array.from(track.querySelectorAll("img"));
    const pending = imgs.filter((img) => !img.complete);

    if (pending.length === 0) {
      updateDistance();
    } else {
      let done = 0;
      const onDone = () => {
        done++;
        if (done >= pending.length) updateDistance();
      };
      pending.forEach((img) => {
        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true });
      });
    }

    // Handle window resize with debounce (150ms timeout)
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(updateDistance, 150);
    });
  }

  // Query all track elements using [data-customer-logos] selector
  document.querySelectorAll(TRACK_SEL).forEach(setupTrack);
})();
///////////////////////////
// End of Customer Logos //
///////////////////////////