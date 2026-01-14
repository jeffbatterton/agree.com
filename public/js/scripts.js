// ============================================
// CONFIGURATION CONSTANTS
// ============================================

// Journey section phase configuration
const JOURNEY_PHASE_1_PERCENTAGE = 37;
const JOURNEY_PHASE_2_PERCENTAGE = 43;
const JOURNEY_PHASE_3_PERCENTAGE = 48;
const JOURNEY_VISUAL_EXIT_START_PERCENTAGE = 58;

// Display card animation configuration
const DISPLAY_CARD_TRANSLATE_Y_THRESHOLD = 50; // Scroll percentage where translateY reaches 0
const DISPLAY_CARD_EXIT_TRANSLATE_Y = 18; // Final translateY in exit phase (vh) - for fine-tuning
const DISPLAY_CARD_SCALE_THRESHOLD = 50; // Scroll percentage where scale reaches 1
const DISPLAY_CARD_START_SCALE = 0.9; // Starting scale value

// Display phase configuration
const DISPLAY_PHASE_1_OPEN = 25; // Scroll percentage where phase-1 starts
const DISPLAY_PHASE_1_CLOSE = 100; // Scroll percentage where phase-1 ends
const DISPLAY_PHASE_2_OPEN = 35; // Scroll percentage where phase-2 starts
const DISPLAY_PHASE_2_CLOSE = 100; // Scroll percentage where phase-2 ends
const DISPLAY_PHASE_3_OPEN = 48; // Scroll percentage where phase-3 starts
const DISPLAY_PHASE_3_CLOSE = 100; // Scroll percentage where phase-3 ends
const DISPLAY_PHASE_4_OPEN = 55; // Scroll percentage where phase-4 starts
const DISPLAY_PHASE_4_CLOSE = 100; // Scroll percentage where phase-4 ends

// Qualities section configuration
const QUALITIES_BASE_PERCENTAGE = 10; // Scroll percentage where the stagger sequence begins
const QUALITIES_NOTIFICATION_1_DELAY_MS = 100; // Delay after base threshold (ms)
const QUALITIES_NOTIFICATION_2_DELAY_MS = 320; // Delay after base threshold (ms)
const QUALITIES_NOTIFICATION_3_DELAY_MS = 500; // Delay after base threshold (ms)
const QUALITIES_ICON_DOT_1_DELAY_MS = 0; // Delay after base threshold (ms)
const QUALITIES_ICON_DOT_2_DELAY_MS = 150; // Delay after base threshold (ms)
const QUALITIES_ICON_DOT_3_DELAY_MS = 230; // Delay after base threshold (ms)
const QUALITIES_ICON_DOT_4_DELAY_MS = 400; // Delay after base threshold (ms)

// Button tabs activation configuration
const TAB_ACTIVATION_SCROLL_IN_PERCENTAGE = 51; // Percentage of the section's "scroll-in" needed to activate its tab

// Track when exit phase starts for card animation
let displayCardExitStartPercentage = null;

// ============================================
// STATE VARIABLES
// ============================================

let isProgrammaticScroll = false;
let programmaticScrollTarget = null;
const qualitiesNumbersAnimated = new Set(); // Track which number elements have been animated
let qualitiesStaggerStarted = false;
const qualitiesClassTimeouts = new Map();

// ============================================
// HELPER FUNCTIONS
// ============================================



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

function calculateSectionScrollInPercentage(sectionRect) {
  const viewportHeight = window.innerHeight;
  const sectionTop = sectionRect.top;

  // 0% when section top is at the bottom of the viewport, 100% when section top reaches the top of the viewport.
  const progress = (viewportHeight - sectionTop) / viewportHeight;
  return Math.min(100, Math.max(0, progress * 100));
}


// ============================================
// JOURNEY SECTIONS HANDLERS
// ============================================

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

function animateNumber(element, startValue, endValue, suffix) {
  const duration = 1000; // Animation duration in milliseconds
  const steps = 60; // Number of animation steps
  const stepDuration = duration / steps;
  const valueDifference = endValue - startValue;
  let currentStep = 0;
  
  const animate = () => {
    if (currentStep >= steps) {
      // Animation complete - set final value
      element.textContent = Math.round(endValue) + suffix;
      return;
    }
    
    // Calculate current value for this step
    const progress = currentStep / steps;
    const currentValue = startValue + (valueDifference * progress);
    
    // Show whole number during animation (no decimal)
    element.textContent = Math.round(currentValue) + suffix;
    
    currentStep++;
    setTimeout(animate, stepDuration);
  };
  
  animate();
}

function handleQualitiesSection(section, scrollPercentage, isInViewport) {
  if (!isInViewport) {
    // Remove all classes when section is out of viewport
    section.classList.remove('notification-1', 'notification-2', 'notification-3', 'icon-dot-1', 'icon-dot-2', 'icon-dot-3', 'icon-dot-4');
    qualitiesStaggerStarted = false;
    qualitiesClassTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    qualitiesClassTimeouts.clear();
    return;
  }

  if (scrollPercentage >= QUALITIES_BASE_PERCENTAGE && !qualitiesStaggerStarted) {
    qualitiesStaggerStarted = true;
    qualitiesClassTimeouts.clear();

    const scheduleClass = (className, delayMs) => {
      const timeoutId = setTimeout(() => {
        section.classList.add(className);
      }, delayMs);
      qualitiesClassTimeouts.set(className, timeoutId);
    };

    scheduleClass('notification-1', QUALITIES_NOTIFICATION_1_DELAY_MS);
    scheduleClass('notification-2', QUALITIES_NOTIFICATION_2_DELAY_MS);
    scheduleClass('notification-3', QUALITIES_NOTIFICATION_3_DELAY_MS);
    scheduleClass('icon-dot-1', QUALITIES_ICON_DOT_1_DELAY_MS);
    scheduleClass('icon-dot-2', QUALITIES_ICON_DOT_2_DELAY_MS);
    scheduleClass('icon-dot-3', QUALITIES_ICON_DOT_3_DELAY_MS);
    scheduleClass('icon-dot-4', QUALITIES_ICON_DOT_4_DELAY_MS);
  }
  
  // Handle number animation - animate each number individually when it scrolls into view
  const numberElements = section.querySelectorAll('[data-number]');
  const viewportHeight = window.innerHeight;
  
  numberElements.forEach(element => {
    // Skip if already animated
    if (qualitiesNumbersAnimated.has(element)) {
      return;
    }
    
    // Check if element is in viewport
    const elementRect = element.getBoundingClientRect();
    const isInViewport = elementRect.top < viewportHeight && elementRect.bottom > 0;
    
    if (isInViewport) {
      // Get target value from data-number attribute
      const endValue = parseFloat(element.getAttribute('data-number'));
      if (!isNaN(endValue)) {
        // Get current displayed value
        const currentText = element.textContent.trim();
        const numericMatch = currentText.match(/[\d.]+/);
        if (numericMatch) {
          const startValue = parseFloat(numericMatch[0]);
          // Preserve suffix (like "+" in "90%+")
          const suffix = currentText.replace(/[\d.]+/, '');
          
          // Mark as animated and start animation
          qualitiesNumbersAnimated.add(element);
          animateNumber(element, startValue, endValue, suffix);
        }
      }
    }
  });
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
  
  const animationProgress = Math.min(1, scrollProgress / 0.5);
  let translateY = initialTranslateY * (1 - animationProgress);
  let opacity = animationProgress;
  let scale = 0.25 + (animationProgress * 0.75);
  
  visual.style.transform = `translateY(${translateY}px) scale(${scale})`;
  visual.style.opacity = opacity;
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

function updateScroll() {
  // Calculate and log display section scroll percentage
  const display = document.querySelector('[data-display]');
  let scrollPercentage = 0;
  
  if (display) {
    const displayRect = display.getBoundingClientRect();
    const displayHeight = displayRect.height;
    const displayTop = displayRect.top;
    const viewportHeight = window.innerHeight;
    
    if (displayTop > viewportHeight) {
      // Section hasn't entered viewport yet
      scrollPercentage = 0;
    } else if (displayTop + displayHeight < 0) {
      // Section has completely scrolled past
      scrollPercentage = 100;
    } else {
      // Section is in viewport - calculate scroll percentage
      // Percentage based on how much of the section has entered the viewport
      const scrolledAmount = viewportHeight - displayTop;
      const totalScrollableDistance = viewportHeight + displayHeight;
      scrollPercentage = Math.min(100, Math.max(0, (scrolledAmount / totalScrollableDistance) * 100));
    }
    
    // Handle scroll phases
    display.classList.remove('scroll-entry', 'scroll-intermediate', 'scroll-exit');
    
    // Check if bottom of container has entered bottom of viewport
    const displayBottom = displayRect.bottom;
    const hasExited = displayBottom <= viewportHeight;
    const isCompletelyPast = displayTop + displayHeight < 0; // Display section has completely scrolled past viewport
    
    
    if (hasExited) {
      display.classList.add('scroll-exit');
      // Calculate exit start percentage: exit starts when displayBottom === viewportHeight
      // Only set if null (on page load/refresh), preserve during scroll
      if (displayCardExitStartPercentage === null) {
        // When refreshing mid-exit, we need to calculate when exit started based on current position
        // Exit starts when the bottom of the container reaches the bottom of the viewport
        // At that point: displayTop = viewportHeight - displayHeight
        // We calculate this using the scroll percentage formula to find when exit started
        
        // Calculate exit start based on geometry: exit starts when displayBottom === viewportHeight
        // At that point: displayTop = viewportHeight - displayHeight
        const exitStartTop = viewportHeight - displayHeight;
        
        // Calculate scroll percentage when exit started using same formula as scrollPercentage
        if (exitStartTop > viewportHeight) {
          // Section hasn't entered yet (edge case)
          displayCardExitStartPercentage = 0;
        } else if (exitStartTop + displayHeight < 0) {
          // Section has completely scrolled past (edge case)
          displayCardExitStartPercentage = 100;
        } else {
          // Normal case: calculate exit start scroll percentage
          const exitStartScrolledAmount = viewportHeight - exitStartTop;
          const exitStartTotalDistance = viewportHeight + displayHeight;
          displayCardExitStartPercentage = Math.min(100, Math.max(0, (exitStartScrolledAmount / exitStartTotalDistance) * 100));
        }
        
        // Ensure exit start is reasonable: must be >= 50% (after entry completes)
        if (displayCardExitStartPercentage < 50) {
          displayCardExitStartPercentage = 50;
        }
        
        // When refreshing mid-exit, ensure exit start is before current scroll position
        // This is critical: if exit start >= current scroll, the exit progress calculation breaks
        if (displayCardExitStartPercentage >= scrollPercentage) {
          // Use a value safely before current scroll (at least 0.5% gap to avoid division issues)
          // But ensure it's still >= 50%
          displayCardExitStartPercentage = Math.max(50, scrollPercentage - 0.5);
        }
      }
    } else {
      display.classList.remove('scroll-exit');
      // Reset exit start percentage when not in exit phase
      if (scrollPercentage <= 50) {
        display.classList.add('scroll-entry');
        displayCardExitStartPercentage = null;
      } else {
        display.classList.add('scroll-intermediate');
        displayCardExitStartPercentage = null;
      }
    }
  
    // Handle display notification classes (can all coexist)
    if (scrollPercentage >= DISPLAY_PHASE_1_OPEN && scrollPercentage < DISPLAY_PHASE_1_CLOSE) {
      display.classList.add('notification-1');
    } else {
      display.classList.remove('notification-1');
    }
    
    if (scrollPercentage >= DISPLAY_PHASE_2_OPEN && scrollPercentage < DISPLAY_PHASE_2_CLOSE) {
      display.classList.add('notification-2');
    } else {
      display.classList.remove('notification-2');
    }
    
    if (scrollPercentage >= DISPLAY_PHASE_3_OPEN && scrollPercentage < DISPLAY_PHASE_3_CLOSE) {
      display.classList.add('notification-3');
    } else {
      display.classList.remove('notification-3');
    }
    
    if (scrollPercentage >= DISPLAY_PHASE_4_OPEN && scrollPercentage <= DISPLAY_PHASE_4_CLOSE) {
      display.classList.add('notification-4');
    } else {
      display.classList.remove('notification-4');
    }
  
    // Animate display card translateY and scale as container scrolls in and out
    const displayCard = document.querySelector('[data-display--card]');
    if (displayCard) {
      const cardStartTranslateY = -23; // Starting translateY in vh
      
      let cardTranslateY = cardStartTranslateY; // Default to start position
      let cardScale = DISPLAY_CARD_START_SCALE; // Default to start scale
      
      if (hasExited && displayCardExitStartPercentage !== null) {
        // Exit phase: animate from 0 to exit translateY as scroll goes from exit start to 100%
        const exitStart = displayCardExitStartPercentage;
        const exitRange = 100 - exitStart;
        // Handle edge case: if exitRange is 0 or negative, or scrollPercentage is less than exitStart
        if (exitRange > 0 && scrollPercentage >= exitStart) {
          const exitProgress = Math.min(1, Math.max(0, (scrollPercentage - exitStart) / exitRange));
          cardTranslateY = 0 + (exitProgress * DISPLAY_CARD_EXIT_TRANSLATE_Y); // Interpolate from 0 to exit translateY
        } else if (scrollPercentage < exitStart) {
          // Edge case: scrollPercentage is less than exit start (shouldn't happen, but handle it)
          // Stay at intermediate phase position (translateY = 0)
          cardTranslateY = 0;
        } else {
          // Edge case: exitRange is 0 or negative, or we're at/ past 100%
          cardTranslateY = DISPLAY_CARD_EXIT_TRANSLATE_Y; // Fully exited
        }
        cardScale = 1.0; // Keep at full scale during exit
      } else if (scrollPercentage <= DISPLAY_CARD_SCALE_THRESHOLD) {
        // Entry phase: animate from -23vh to 0 and scale from 0.9 to 1 as scroll goes from 0% to threshold%
        const progress = Math.min(1, Math.max(0, scrollPercentage / DISPLAY_CARD_SCALE_THRESHOLD));
        cardTranslateY = cardStartTranslateY + (progress * -cardStartTranslateY); // Interpolate from -23 to 0
        cardScale = DISPLAY_CARD_START_SCALE + (progress * (1.0 - DISPLAY_CARD_START_SCALE)); // Interpolate from 0.9 to 1
      } else {
        // Intermediate phase: keep translateY at 0 and scale at 1
        cardTranslateY = 0;
        cardScale = 1.0;
      }
      
      // Apply both translateY and scale using vh units (flexbox handles horizontal centering)
      displayCard.style.transform = `translateY(${cardTranslateY}vh) scale(${cardScale})`;
    }
  }
  
  // Handle qualities spacer
  const qualitiesSpacer = document.querySelector('[data-parallax-system="qualities--spacer"]');
  // Note: Qualities spacer visibility logic removed - was previously controlled by CTA scroll
  
  // Handle journey sections
  const journeySections = document.querySelectorAll('[data-journey]');
  const tabs = document.querySelectorAll('[data-button-tab]');
  const viewportHeight = window.innerHeight;
  
  // Handle qualities section
  const qualitiesSection = document.querySelector('[data-qualities]');
  if (qualitiesSection) {
    const qualitiesRect = qualitiesSection.getBoundingClientRect();
    const qualitiesHeight = qualitiesRect.height;
    const qualitiesScrollPercentage = calculateJourneyScrollPercentage(qualitiesRect, qualitiesHeight);
    const isQualitiesInViewport = qualitiesRect.top <= viewportHeight && qualitiesRect.bottom >= 0;
    handleQualitiesSection(qualitiesSection, qualitiesScrollPercentage, isQualitiesInViewport);
  }
  let activeJourney = null;
  let closestSection = null;
  let closestDistance = Infinity;
  
  journeySections.forEach(section => {
    const journeyId = section.getAttribute('data-journey');
    if (!journeyId) return;
    
    const rect = section.getBoundingClientRect();
    const sectionHeight = rect.height;
    const scrollPercentage = calculateJourneyScrollPercentage(rect, sectionHeight);
    const scrollInPercentage = calculateSectionScrollInPercentage(rect);
    
    // Activate tab when its section is at least N% scrolled in.
    // We select the section whose top is closest to the top of the viewport among eligible sections.
    const isEligibleForTabActivation = scrollInPercentage >= TAB_ACTIVATION_SCROLL_IN_PERCENTAGE && rect.bottom > 0;
    if (isEligibleForTabActivation) {
      const distance = Math.abs(rect.top);
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
  
  // Update active tab
  if (isProgrammaticScroll && programmaticScrollTarget) {
    // During programmatic scroll, keep the target tab active
    activeJourney = programmaticScrollTarget;
    
    // Check if target section has reached the top of viewport, then reset programmatic scroll flag
    const targetSection = document.querySelector(`[data-journey="${programmaticScrollTarget}"]`);
    if (targetSection) {
      const targetRect = targetSection.getBoundingClientRect();
      // If target section's top is at or very close to viewport top, we've reached the destination
      if (targetRect.top <= 0 && targetRect.top >= -10) {
        // Reset after a small delay to ensure smooth transition
        setTimeout(() => {
          isProgrammaticScroll = false;
          programmaticScrollTarget = null;
        }, 100);
      }
    }
  } else {
    // Activate tab when its section is at least N% scrolled in
    activeJourney = closestSection;
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
  
  // Stop any ongoing scroll animations to prevent spillover
  window.scrollTo({
    top: window.scrollY,
    behavior: 'auto'
  });
  
  // Force layout recalculation and wait for layout changes to settle
  requestAnimationFrame(() => {
    updateScroll();
    
    // Force a layout recalculation by reading layout properties
    void section.offsetHeight;
    
    // Wait another frame to ensure all layout changes have fully settled
    requestAnimationFrame(() => {
      // Calculate target scroll position: section's top should be at viewport top (0)
      const sectionRect = section.getBoundingClientRect();
      const currentScrollY = window.scrollY;
      // sectionRect.top is relative to viewport, so we scroll by that amount
      const targetScrollY = currentScrollY + sectionRect.top;
      
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  });
}

function handleWheel(event) {
  updateScroll();
}

// ============================================
// INITIALIZATION
// ============================================

function initialize() {
  const journey0 = document.querySelector('[data-journey-0]');
  if (journey0) {
    journey0.classList.add('isLoaded');
  }
  
  // Setup tab click handlers
  document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('[data-button-tab]');
    tabs.forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });
    
    // Randomize notification card animation variables
    document.querySelectorAll('.notification-wrapper').forEach(card => {
      const rand = (min, max) => Math.random() * (max - min) + min;

      card.style.setProperty('--tx', `${rand(4, 10).toFixed(1)}px`);
      card.style.setProperty('--ty', `${rand(6, 14).toFixed(1)}px`);
      card.style.setProperty('--rot', `${rand(0.15, 0.4).toFixed(2)}deg`);
      card.style.setProperty('--dur', `${rand(12, 15).toFixed(1)}s`);
      card.style.animationDelay = `${rand(-5, 0).toFixed(1)}s`;
    });
  });
  
  // Setup scroll and wheel handlers
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('scroll', function() {
    updateScroll();
  });
  
  // Ensure updateScroll runs after DOM is ready and layout is calculated
  function runInitialScrollUpdate() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateScroll();
      });
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitialScrollUpdate);
  } else {
    // DOM already loaded, call after next frame
    runInitialScrollUpdate();
  }
  
  // Also ensure it runs on full page load (after images, etc.)
  window.addEventListener('load', runInitialScrollUpdate);
}

// Initialize on load
initialize();

// ============================================
// CONTRACT TO CASH RIBBON
// ============================================

const canvas = document.querySelector("[data-ribbon--canvas]");
if (!canvas) {
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
      return;
    }
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const maxHeight = 5000;
    if (height > maxHeight) {
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
