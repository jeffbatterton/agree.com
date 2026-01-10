// ============================================
// CONFIGURATION CONSTANTS
// ============================================

// Canvas configuration
const CANVAS_ISFIXED_THRESHOLD = 25;

// Journey section phase configuration
const JOURNEY_PHASE_1_PERCENTAGE = 37;
const JOURNEY_PHASE_2_PERCENTAGE = 43;
const JOURNEY_PHASE_3_PERCENTAGE = 48;
const JOURNEY_VISUAL_EXIT_START_PERCENTAGE = 58;

// Display scroll phase configuration
const DISPLAY_SCROLL_PHASE_1_START = 2;
const DISPLAY_SCROLL_PHASE_2_START = 8;
const DISPLAY_SCROLL_PHASE_3_START = 14;
const DISPLAY_SCROLL_PHASE_4_START = 20;
const DISPLAY_SCROLL_PHASE_END = 62;

// Card scroll configuration
const CARD_SCROLL_IN_RATE = 0.75;
const CARD_SCROLL_OUT_RATE = 0.9;
const CARD_SCROLL_OUT_TRIGGER = 50;
const CARD_HEIGHT = 730;
const CARD_START_TOP_VH = 87;

// Journey section animation configuration
const JOURNEY_ANIMATION_ENTRY_END = 25;
const JOURNEY_ANIMATION_EXIT_START = 50;
const JOURNEY_EXIT_TRANSLATE_Y = 400;

// ============================================
// STATE VARIABLES
// ============================================

let isProgrammaticScroll = false;
let programmaticScrollTarget = null;
let lastScrollY = window.scrollY || window.pageYOffset;
let isAdjustingScroll = false;

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDisplayProgress(displayRect) {
  const displayHeight = displayRect.height;
  const displayTop = displayRect.top;
  
  if (displayTop > 0) {
    return -(displayTop / displayHeight) * 100;
  } else {
    const progress = (-displayTop / displayHeight) * 100;
    return Math.max(0, Math.min(110, progress));
  }
}


function calculateJourneyScrollPercentage(sectionRect, sectionHeight) {
  const viewportHeight = window.innerHeight;
  const sectionTop = sectionRect.top;
  const sectionBottom = sectionRect.bottom;
  
  if (sectionBottom < 0) {
    return 100;
  } else if (sectionTop > viewportHeight) {
    return 0;
  } else {
    const scrollRange = viewportHeight + sectionHeight;
    const scrolledAmount = viewportHeight - sectionTop;
    return Math.min(100, Math.max(0, (scrolledAmount / scrollRange) * 100));
  }
}

// ============================================
// DISPLAY SECTION HANDLERS
// ============================================

function handleDisplayPhases(progress, card) {
  if (!card) return;
  
  let currentPhase = 0;
  if (progress >= DISPLAY_SCROLL_PHASE_4_START) {
    currentPhase = 4;
  } else if (progress >= DISPLAY_SCROLL_PHASE_3_START) {
    currentPhase = 3;
  } else if (progress >= DISPLAY_SCROLL_PHASE_2_START) {
    currentPhase = 2;
  } else if (progress >= DISPLAY_SCROLL_PHASE_1_START) {
    currentPhase = 1;
  }
  
  const phaseClasses = ['parallax-system--display--phase1', 'parallax-system--display--phase2', 
                        'parallax-system--display--phase3', 'parallax-system--display--phase4'];
  
  if (progress >= DISPLAY_SCROLL_PHASE_END) {
    card.classList.remove(...phaseClasses);
  } else {
    card.classList.remove(...phaseClasses);
    if (currentPhase > 0) {
      card.classList.add(`parallax-system--display--phase${currentPhase}`);
    }
  }
}

function handleCardAnimation(progress, card) {
  if (!card) return;
  
  card.classList.remove('isScrollingOut', 'isCentered', 'isScrollingIn');
  
  if (progress >= CARD_SCROLL_OUT_TRIGGER) {
    handleCardScrollOut(progress, card);
  } else {
    handleCardScrollIn(card);
  }
}

function handleCardScrollOut(progress, card) {
  const scrollOutProgress = (progress - CARD_SCROLL_OUT_TRIGGER) / (100 - CARD_SCROLL_OUT_TRIGGER);
  const viewportHeight = window.innerHeight;
  const centerTop = (viewportHeight / 2) - (CARD_HEIGHT / 2);
  const scrollOutDistance = centerTop + CARD_HEIGHT;
  const cardTranslateY = -scrollOutDistance * scrollOutProgress * CARD_SCROLL_OUT_RATE;
  
  card.classList.add('isScrollingOut');
  card.style.setProperty('--card-top', `${centerTop + cardTranslateY}px`);
  card.style.removeProperty('--card-translate-y');
  card.style.setProperty('--card-scale', '1');
}

function handleCardScrollIn(card) {
  if (typeof window.cardInitialScrollY === 'undefined') {
    window.cardInitialScrollY = 0;
  }
  
  const currentScrollY = window.scrollY || window.pageYOffset;
  const scrollDelta = currentScrollY - window.cardInitialScrollY;
  const viewportHeight = window.innerHeight;
  
  const cardStartTop = CARD_START_TOP_VH * viewportHeight / 100;
  const cardStartCenter = cardStartTop + (CARD_HEIGHT / 2);
  const targetCenter = viewportHeight / 2;
  const centerDistance = cardStartCenter - targetCenter;
  const scrollToReachCenter = centerDistance / CARD_SCROLL_IN_RATE;
  
  if (scrollDelta >= scrollToReachCenter && !card.dataset.scrolledPastCenter) {
    card.dataset.scrollYAtCenter = currentScrollY.toString();
    card.dataset.scrolledPastCenter = 'true';
  }
  
  if (card.dataset.scrollYAtCenter) {
    const scrollYAtCenter = parseFloat(card.dataset.scrollYAtCenter);
    if (currentScrollY < scrollYAtCenter) {
      delete card.dataset.scrolledPastCenter;
      delete card.dataset.scrollYAtCenter;
    }
  }
  
  if (card.dataset.scrolledPastCenter) {
    card.classList.add('isCentered');
    card.style.removeProperty('--card-top');
    card.style.removeProperty('--card-translate-y');
    card.style.setProperty('--card-scale', '1');
  } else {
    const cardTranslateY = -scrollDelta * CARD_SCROLL_IN_RATE;
    card.classList.add('isScrollingIn');
    card.style.setProperty('--card-top', '87vh');
    card.style.setProperty('--card-translate-y', `${cardTranslateY}px`);
    
    const maxScrollForScale = scrollToReachCenter;
    const scaleProgress = Math.min(1, Math.max(0, scrollDelta / maxScrollForScale));
    const cardScale = 0.9 + (scaleProgress * 0.1);
    card.style.setProperty('--card-scale', cardScale.toString());
  }
}

// ============================================
// JOURNEY SECTIONS HANDLERS
// ============================================

function handleJourneySectionAnimation(section, scrollPercentage, isConnectors) {
  const childDiv = section.querySelector(':scope > div');
  if (!childDiv) return;
  
  let opacity = 0.8;
  let scale = 0.8;
  let translateY = 0;
  
  if (scrollPercentage <= JOURNEY_ANIMATION_ENTRY_END) {
    const progress = scrollPercentage / JOURNEY_ANIMATION_ENTRY_END;
    opacity = 0.8 + (progress * 0.2);
    scale = 0.8 + (progress * 0.2);
  } else if (scrollPercentage >= JOURNEY_ANIMATION_EXIT_START && !isConnectors) {
    const progress = (scrollPercentage - JOURNEY_ANIMATION_EXIT_START) / (100 - JOURNEY_ANIMATION_EXIT_START);
    opacity = 1.0 - (progress * 1.0);
    scale = 1.0 - (progress * 0.6);
    translateY = -progress * JOURNEY_EXIT_TRANSLATE_Y;
  } else {
    opacity = 1.0;
    scale = 1.0;
  }
  
  childDiv.style.opacity = opacity;
  childDiv.style.transform = `translateY(${translateY}px) scale(${scale})`;
}

function handleJourneyPhaseClasses(section, scrollPercentage, isInViewport) {
  if (isInViewport) {
    if (scrollPercentage >= JOURNEY_PHASE_1_PERCENTAGE) {
      section.classList.add('journey-visuals--phase-1');
    } else {
      section.classList.remove('journey-visuals--phase-1');
    }
    
    if (scrollPercentage >= JOURNEY_PHASE_2_PERCENTAGE) {
      section.classList.add('journey-visuals--phase-2');
    } else {
      section.classList.remove('journey-visuals--phase-2');
    }
    
    if (scrollPercentage >= JOURNEY_PHASE_3_PERCENTAGE) {
      section.classList.add('journey-visuals--phase-3');
    } else {
      section.classList.remove('journey-visuals--phase-3');
    }
  } else {
    section.classList.remove('journey-visuals--phase-1', 'journey-visuals--phase-2', 'journey-visuals--phase-3');
  }
}

function handleJourneyVisuals(visual, parentSection, sectionRect, sectionHeight) {
  const visualJourneyId = visual.getAttribute('data-journey-visual');
  if (!visualJourneyId) return;
  
  const viewportHeight = window.innerHeight;
  const sectionTop = sectionRect.top;
  
  let scrollProgress = 0;
  if (sectionTop <= viewportHeight && sectionTop >= -sectionHeight) {
    scrollProgress = Math.max(0, Math.min(1, (viewportHeight - sectionTop) / (viewportHeight + sectionHeight * 0.5)));
  } else if (sectionTop < -sectionHeight) {
    scrollProgress = 1;
  }
  
  const initialTranslateY = sectionHeight * 0.5;
  const isAgreements = visualJourneyId === 'agreements';
  let agreementsScrollPercentage = 0;
  
  if (isAgreements) {
    agreementsScrollPercentage = calculateJourneyScrollPercentage(sectionRect, sectionHeight);
  }
  
  const animationProgress = Math.min(1, scrollProgress / 0.5);
  let translateY = initialTranslateY * (1 - animationProgress);
  let opacity = animationProgress;
  let scale = 0.25 + (animationProgress * 0.75);
  
  if (isAgreements && agreementsScrollPercentage > JOURNEY_VISUAL_EXIT_START_PERCENTAGE) {
    const exitRange = 100 - JOURNEY_VISUAL_EXIT_START_PERCENTAGE;
    const exitProgress = (agreementsScrollPercentage - JOURNEY_VISUAL_EXIT_START_PERCENTAGE) / exitRange;
    const exitTranslateY = exitProgress * viewportHeight * 4;
    translateY += exitTranslateY;
    opacity = Math.max(0, opacity - (exitProgress * opacity));
    scale = scale * (1 - exitProgress * 0.5);
  }
  
  visual.style.transform = `translateY(${translateY}px) scale(${scale})`;
  visual.style.opacity = opacity;
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

function updateScroll() {
  const display = document.querySelector('[data-parallax-system="display"]');
  if (!display) return;
  
  const displayRect = display.getBoundingClientRect();
  const progress = calculateDisplayProgress(displayRect);
  
  // Handle display phases and card animation
  const card = document.querySelector('[data-parallax-system="display--card"]');
  handleDisplayPhases(progress, card);
  handleCardAnimation(progress, card);
  
  // Handle qualities spacer
  const qualitiesSpacer = document.querySelector('[data-parallax-system="qualities--spacer"]');
  // Note: Qualities spacer visibility logic removed - was previously controlled by CTA scroll
  
  // Handle journey--0 visibility
  const journey0 = document.querySelector('[data-parallax-system="journey--0"]');
  const hero = document.querySelector('[data-parallax-system="hero"]');
  if (journey0) {
    if (progress >= 50) {
      journey0.classList.add('isVisible');
      hero?.classList.add('opacity-0');
    } else {
      journey0.classList.remove('isVisible');
      hero?.classList.remove('opacity-0');
    }
    
    if (progress >= 100) {
      journey0.classList.add('isRelative');
    } else {
      journey0.classList.remove('isRelative');
    }
  }
  
  // Handle journey spacer
  const journeySpacer = document.querySelector('[data-parallax-system="journey--spacer"]');
  if (journeySpacer) {
    if (progress >= 100) {
      journeySpacer.classList.add('isHidden');
    } else {
      journeySpacer.classList.remove('isHidden');
    }
  }
  
  // Handle ribbon canvas
  const ribbonCanvas = document.querySelector("[data-contract-to-cash-ribbon='canvas']");
  if (ribbonCanvas && window.ribbonInitialized) {
    if (progress < CANVAS_ISFIXED_THRESHOLD) {
      ribbonCanvas.classList.add('isFixed');
    } else {
      ribbonCanvas.classList.remove('isFixed');
    }
  }
  
  // Handle button tabs
  const buttonTabs = document.querySelector('[data-button-tabs]');
  const buttonTabsOpener = document.querySelector('[data-button-tabs-opener]');
  const buttonTabsSpacer = document.querySelector('[data-button-tabs-spacer]');
  
  if (buttonTabs && buttonTabsOpener) {
    const openerRect = buttonTabsOpener.getBoundingClientRect();
    if (openerRect.bottom < 0) {
      buttonTabs.classList.add('fixed');
      buttonTabsSpacer?.classList.remove('hidden');
    } else {
      buttonTabs.classList.remove('fixed');
      buttonTabsSpacer?.classList.add('hidden');
    }
  }
  
  // Handle journey sections
  const journeySections = document.querySelectorAll('[data-journey]');
  const tabs = document.querySelectorAll('[data-button-tab]');
  const viewportHeight = window.innerHeight;
  const activationThreshold = viewportHeight * 0.5;
  let activeJourney = null;
  let closestSection = null;
  let closestDistance = Infinity;
  let connectorsScrollPercentage = 0;
  
  journeySections.forEach(section => {
    const journeyId = section.getAttribute('data-journey');
    if (!journeyId) return;
    
    const rect = section.getBoundingClientRect();
    const sectionHeight = rect.height;
    const scrollPercentage = calculateJourneyScrollPercentage(rect, sectionHeight);
    const isConnectors = journeyId === 'connectors';
    
    if (isConnectors) {
      connectorsScrollPercentage = scrollPercentage;
    }
    
    handleJourneySectionAnimation(section, scrollPercentage, isConnectors);
    
    if (rect.top <= activationThreshold && rect.bottom > activationThreshold) {
      const distance = Math.abs(rect.top - activationThreshold);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSection = journeyId;
      }
    }
    
    const isInViewport = rect.top <= viewportHeight && rect.bottom >= 0;
    handleJourneyPhaseClasses(section, scrollPercentage, isInViewport);
  });
  
  // Handle journey visuals
  const journeyVisuals = document.querySelectorAll('[data-journey-visual]');
  journeyVisuals.forEach(visual => {
    const visualJourneyId = visual.getAttribute('data-journey-visual');
    if (!visualJourneyId) return;
    
    const parentSection = document.querySelector(`[data-journey="${visualJourneyId}"]`);
    if (!parentSection) return;
    
    const sectionRect = parentSection.getBoundingClientRect();
    const sectionHeight = sectionRect.height;
    handleJourneyVisuals(visual, parentSection, sectionRect, sectionHeight);
  });
  
  // Handle tabs animation
  if (connectorsScrollPercentage >= 50 && buttonTabs) {
    const connectorsSection = document.querySelector('[data-journey="connectors"]');
    if (connectorsSection) {
      const connectorsRect = connectorsSection.getBoundingClientRect();
      const connectorsTop = connectorsRect.top;
      const scrollAmount = connectorsTop < 0 ? Math.abs(connectorsTop) : 0;
      buttonTabs.style.top = `${-scrollAmount}px`;
    }
  } else if (buttonTabs) {
    buttonTabs.style.top = '';
  }
  
  // Update active tab
  if (!isProgrammaticScroll) {
    activeJourney = closestSection;
  } else {
    activeJourney = programmaticScrollTarget;
  }
  
  tabs.forEach(tab => {
    const tabId = tab.getAttribute('data-button-tab');
    if (tabId === activeJourney) {
      tab.classList.add('isActive');
    } else {
      tab.classList.remove('isActive');
    }
  });
}

// ============================================
// EVENT HANDLERS
// ============================================

function handleTabClick(e) {
  e.preventDefault();
  const tabId = this.getAttribute('data-button-tab');
  if (!tabId) return;
  
  const tabs = document.querySelectorAll('[data-button-tab]');
  tabs.forEach(t => {
    if (t.getAttribute('data-button-tab') === tabId) {
      t.classList.add('isActive');
    } else {
      t.classList.remove('isActive');
    }
  });
  
  isProgrammaticScroll = true;
  programmaticScrollTarget = tabId;
  
  const section = document.querySelector(`[data-journey="${tabId}"]`);
  if (!section) return;
  
  const sectionRect = section.getBoundingClientRect();
  const sectionTop = sectionRect.top + window.scrollY;
  
  window.scrollTo({
    top: sectionTop,
    behavior: 'smooth'
  });
  
  setTimeout(() => {
    isProgrammaticScroll = false;
    programmaticScrollTarget = null;
  }, 1000);
}

function handleWheel(event) {
  const display = document.querySelector('[data-parallax-system="display"]');
  if (!display) {
    updateScroll();
    return;
  }
  
  const displayRect = display.getBoundingClientRect();
  const progress = calculateDisplayProgress(displayRect);
  
  if (progress < 100 && !isAdjustingScroll) {
    event.preventDefault();
    isAdjustingScroll = true;
    
    const scrollAmount = event.deltaY * 2;
    const currentScrollY = window.scrollY || window.pageYOffset;
    const newScrollY = Math.max(0, currentScrollY + scrollAmount);
    
    window.scrollTo({
      top: newScrollY,
      behavior: 'auto'
    });
    
    setTimeout(() => {
      isAdjustingScroll = false;
      lastScrollY = window.scrollY || window.pageYOffset;
      updateScroll();
    }, 10);
  } else {
    updateScroll();
  }
}

// ============================================
// INITIALIZATION
// ============================================

function initializeButtonTabsSpacer() {
  const buttonTabs = document.querySelector('[data-button-tabs]');
  const buttonTabsSpacer = document.querySelector('[data-button-tabs-spacer]');
  if (buttonTabs && buttonTabsSpacer) {
    const tabsRect = buttonTabs.getBoundingClientRect();
    const tabsHeight = tabsRect.height;
    if (tabsHeight > 0) {
      buttonTabsSpacer.style.height = tabsHeight + 'px';
    } else {
      setTimeout(initializeButtonTabsSpacer, 100);
    }
  }
}

function initialize() {
  window.cardInitialScrollY = 0;
  
  const card = document.querySelector('[data-parallax-system="display--card"]');
  if (card) {
    card.style.setProperty('--card-scale', '0.9');
  }
  
  const journey0 = document.querySelector('[data-parallax-system="journey--0"]');
  if (journey0) {
    journey0.classList.add('isLoaded');
  }
  
  // Initialize button tabs spacer
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      initializeButtonTabsSpacer();
    });
  });
  
  // Setup tab click handlers
  document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('[data-button-tab]');
    tabs.forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });
  });
  
  // Setup scroll and wheel handlers
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('scroll', function() {
    if (!isAdjustingScroll) {
      updateScroll();
    }
  });
  
  // Initial scroll update
  updateScroll();
}

// Initialize on load
initialize();

// ============================================
// CONTRACT TO CASH RIBBON
// ============================================

const canvas = document.querySelector("[data-contract-to-cash-ribbon='canvas']");
if (!canvas) {
  console.warn("Canvas element not found for contract-to-cash-ribbon");
} else {
  const ctx = canvas.getContext("2d");

  // CONFIGURATION
  const ENABLE_MOTION = true;
  const LINES = 33;
  const SPACING = 7;
  const LINE_WIDTH = 1;
  const PIN_X = 0.20;
  const SEED = Math.random() * 10000;
  const STEPS = 260;
  const TIME_SPEED = 0.003;
  const PHASE_DRIFT_SPEED = 0.55;
  const BASE_TWIST = 0.26;
  const TWIST_AMP = 0.78;
  const TWIST_CYCLES = 1.55;
  const H2_RATIO = 2.25;
  const H3_RATIO = 3.65;
  const H2_GAIN = 0.62;
  const H3_GAIN = 0.28;
  const PHASE_PER_LINE = 0.18;
  const START_TWIST_START = 0.00;
  const START_TWIST_END = 0.1;
  const START_TWIST_POWER = 2.0;
  const START_TWIST_TOTAL = Math.PI;
  const EXIT_TWIST_START = 0.86; // Start twist when loop begins
  const EXIT_TWIST_END = 0.985;
  const EXIT_TWIST_POWER = 1.9;
  const EXIT_TWIST_TOTAL = Math.PI;
  const EXIT_RIGHT_START = 0.85; // Start later to push ribbon down further before turning right
  const EXIT_RIGHT_END = 0.998;
  const EXIT_RIGHT_POWER = 1.0; // Use smoothstep without power modification for gentle curve
  const EXIT_RIGHT_PX = 700; // Total rightward movement
  const EXIT_LOOP_START = 0.86;
  const EXIT_LOOP_END = 0.97;
  const EXIT_LOOP_AMPLITUDE = 180; // Increased for more pronounced loop
  const EXIT_LOOP_VERTICAL = 100; // Vertical component for 3D loop
  const PERSPECTIVE = 760;
  const Z_Y_TILT = 0.05;
  const GRADIENT_A = { r: 244, g: 51,  b: 171, a: .25 };
  const GRADIENT_B = { r: 242, g: 169, b: 0,   a: .25 };
  const GRADIENT_C = { r: 77,  g: 60,  b: 255, a: .25 };

  // HELPER FUNCTIONS
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

  // STATE
  let width = 0, height = 0, dpr = 1;
  let offsets = [];
  let t = 0;
  let isAnimating = false;
  let frameCount = 0;
  let skipFrames = 0;

  // INITIALIZATION
  function init() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;

    if (width <= 0 || height <= 0) {
      console.warn("Canvas dimensions are invalid:", width, height);
      return;
    }
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const maxHeight = 5000;
    if (height > maxHeight) {
      console.warn(`Canvas height (${height}px) exceeds maximum (${maxHeight}px). Limiting for performance.`);
      height = maxHeight;
    }

    if (height > 3000) {
      skipFrames = 1;
    } else if (height > 2000) {
      skipFrames = 0;
    } else {
      skipFrames = 0;
    }

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
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

  // DRAWING
  function draw() {
    if (width <= 0 || height <= 0) {
      if (ENABLE_MOTION) {
        isAnimating = false;
      }
      return;
    }

    frameCount++;
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
          const thetaField = sign * (BASE_TWIST + TWIST_AMP * (a1 + H2_GAIN * a2 + H3_GAIN * a3));
          const startF = fadeOut01(u, START_TWIST_START, START_TWIST_END, START_TWIST_POWER);
          const exitF  = ramp01(u, EXIT_TWIST_START, EXIT_TWIST_END, EXIT_TWIST_POWER);
          const theta = thetaField + sign * startF * START_TWIST_TOTAL + sign * exitF * EXIT_TWIST_TOTAL;
          // Smooth rightward curve starting earlier for gentle transition
          const exitRightF = ramp01(u, EXIT_RIGHT_START, EXIT_RIGHT_END, EXIT_RIGHT_POWER);
          let exitRight = EXIT_RIGHT_PX * exitRightF;
          let loopYOffset = 0;
          
          // Create smooth 3D loop pattern: move right, loop up and back, then continue right
          if (u >= EXIT_LOOP_START && u <= EXIT_LOOP_END) {
            const rawProgress = clamp01((u - EXIT_LOOP_START) / (EXIT_LOOP_END - EXIT_LOOP_START));
            // Use smoothstep for smooth easing throughout
            const easedProgress = smoothstep(rawProgress);
            // Create envelope that smoothly fades in and out at boundaries
            const envelope = smoothstep(rawProgress) * smoothstep(1 - rawProgress);
            // Use cosine for smooth loop curve: 1 -> 0 -> -1 -> 0 -> 1
            // This creates a smooth arc pattern
            const loopPhase = easedProgress * Math.PI * 2;
            const loopCurve = Math.cos(loopPhase);
            // Transform to create loop: (1 - cos) gives 0 -> 1 -> 2 -> 1 -> 0
            // Scale and apply envelope for smooth transitions
            const loopShape = (1 - loopCurve) * 0.5 * envelope;
            // Apply loop offset - pulls left during loop, creating the loop-back
            const loopOffset = loopShape * EXIT_LOOP_AMPLITUDE;
            exitRight -= loopOffset;
            // Add vertical component to create 3D loop effect
            // Use sine to create vertical arc: 0 -> 1 -> 0 (peaks in middle of loop)
            const loopVerticalCurve = Math.sin(easedProgress * Math.PI);
            loopYOffset = loopVerticalCurve * EXIT_LOOP_VERTICAL * envelope;
          }
          
          const xObj = (x0 + exitRight) + (s0 * Math.cos(theta));
          const zObj = (s0 * Math.sin(theta));
          const x = projectX(xObj, x0, zObj);
          const y2 = y + zObj * Z_Y_TILT - loopYOffset; // Subtract to create upward loop

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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      init();
      if (width > 0 && height > 0) {
        startAnimation();
        window.ribbonInitialized = true;
        updateScroll();
      }
    });
  });
}

// ============================================
// SHINY BUTTONS
// ============================================

document.querySelectorAll("[data-button-shiny]").forEach((btn) => {
  const OUTER = 200;
  const INNER = 100;
  const BASE = 90;
  let raf = 0;

  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const norm = (deg) => ((deg % 360) + 360) % 360;

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

    if (dist > OUTER) {
      btn.style.setProperty("--glow-angle", `${BASE}deg`);
      return;
    }

    const mouseAngle = norm(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
    let p = (OUTER - dist) / (OUTER - INNER);
    p = smoothstep(clamp01(p));
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

// ============================================
// CUSTOMER LOGOS
// ============================================

(() => {
  const TRACK_SEL = "[data-customer-logos]";

  function setupTrack(track) {
    if (track.dataset.loopReady === "true") return;
    track.dataset.loopReady = "true";

    const firstSet = track.querySelector(":scope > div");
    if (!firstSet) return;

    const sets = Array.from(track.querySelectorAll(":scope > div"));
    if (sets.length < 2) {
      const clone = firstSet.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    }

    const updateDistance = () => {
      const w = firstSet.getBoundingClientRect().width;
      track.style.setProperty("--loop-distance", `-${w}px`);
    };

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

    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(updateDistance, 150);
    });
  }

  document.querySelectorAll(TRACK_SEL).forEach(setupTrack);
})();
