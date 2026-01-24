// ============================================
// CONFIGURATION CONSTANTS
// ============================================

// Journey section phase configuration
const JOURNEY_PHASE_1_PERCENTAGE = 38;
const JOURNEY_PHASE_2_PERCENTAGE = 43;
const JOURNEY_PHASE_3_PERCENTAGE = 48;
const JOURNEY_EXIT_PERCENTAGE = 70;

// Agreements-specific tuning
const JOURNEY_VISUAL_AGREEMENTS_ENTRY_START_SCALE = 0.25; // Scale at the start of entry
const JOURNEY_VISUAL_AGREEMENTS_ENTRY_INITIAL_TRANSLATE_Y_FACTOR = 0.5; // initial translateY = sectionHeight * factor
const JOURNEY_VISUAL_AGREEMENTS_ENTRY_COMPLETE_AT_SCROLL_PROGRESS = 0.5; // entry completes when scrollProgress reaches this (0..1)
const JOURNEY_VISUAL_AGREEMENTS_SCROLL_SECTION_HEIGHT_FACTOR = 0.5; // affects scrollProgress denominator: viewportHeight + sectionHeight * factor
const JOURNEY_VISUAL_AGREEMENTS_EXIT_TRANSLATE_VIEWPORTS = 1.25; // How far down to translate on exit (multiples of viewport height)
const JOURNEY_VISUAL_AGREEMENTS_EXIT_END_SCALE = 0.25; // Scale at the end of exit animation
const JOURNEY_VISUAL_AGREEMENTS_EXIT_RATE = 3.5; // Exit easing strength (2 = faster at start, slower at end; does NOT change start/end scroll positions)
const JOURNEY_VISUAL_AGREEMENTS_EXIT_END_OPACITY = .75; // Opacity at the end of exit animation

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
const DISPLAY_PHASE_4_OPEN = 50; // Scroll percentage where phase-4 starts
const DISPLAY_PHASE_4_CLOSE = 100; // Scroll percentage where phase-4 ends

// Qualities section configuration
const QUALITIES_BASE_PERCENTAGE = 20; // Scroll percentage where the stagger sequence begins
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
let programmaticScrollTargetY = null;
let programmaticScrollStartedAt = 0;
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
    const denomFactor = visualJourneyId === 'agreements'
      ? JOURNEY_VISUAL_AGREEMENTS_SCROLL_SECTION_HEIGHT_FACTOR
      : 0.5;
    scrollProgress = Math.max(
      0,
      Math.min(1, (viewportHeight - sectionTop) / (viewportHeight + sectionHeight * denomFactor))
    );
  } else if (sectionTop < -sectionHeight) {
    scrollProgress = 1;
  }
  
  const initialTranslateYFactor = visualJourneyId === 'agreements'
    ? JOURNEY_VISUAL_AGREEMENTS_ENTRY_INITIAL_TRANSLATE_Y_FACTOR
    : 0.5;
  const initialTranslateY = sectionHeight * initialTranslateYFactor;
  
  const entryCompleteAt = visualJourneyId === 'agreements'
    ? JOURNEY_VISUAL_AGREEMENTS_ENTRY_COMPLETE_AT_SCROLL_PROGRESS
    : 0.5;
  const animationProgress = Math.min(1, scrollProgress / entryCompleteAt);
  let translateY = initialTranslateY * (1 - animationProgress);
  let opacity = animationProgress;
  const entryStartScale = visualJourneyId === 'agreements'
    ? JOURNEY_VISUAL_AGREEMENTS_ENTRY_START_SCALE
    : 0.25;
  let scale = entryStartScale + (animationProgress * (1 - entryStartScale));

  // Agreements-only exit animation driven by scroll percentage
  if (visualJourneyId === 'agreements') {
    const scrollPercentage = calculateJourneyScrollPercentage(sectionRect, sectionHeight);
    if (scrollPercentage >= JOURNEY_EXIT_PERCENTAGE) {
      const exitRange = 100 - JOURNEY_EXIT_PERCENTAGE;
      const baseExitProgress = exitRange > 0
        ? Math.min(1, Math.max(0, (scrollPercentage - JOURNEY_EXIT_PERCENTAGE) / exitRange))
        : 1;
      // Ease-out curve controlled by rate (keeps start/end positions the same)
      const exitProgress = 1 - Math.pow(1 - baseExitProgress, JOURNEY_VISUAL_AGREEMENTS_EXIT_RATE);

      translateY = exitProgress * (viewportHeight * JOURNEY_VISUAL_AGREEMENTS_EXIT_TRANSLATE_VIEWPORTS);
      scale = 1 - (exitProgress * (1 - JOURNEY_VISUAL_AGREEMENTS_EXIT_END_SCALE));
      opacity = 1 - (exitProgress * (1 - JOURNEY_VISUAL_AGREEMENTS_EXIT_END_OPACITY));
    }
  }
  
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

      // Scroll-scrubbed gradient morph on the display card overlay.
      // By the time we reach the exit phase start, the gradient has fully morphed.
      const exitStartForGradient = displayHeight > 0
        ? Math.max(50, (displayHeight / (viewportHeight + displayHeight)) * 100)
        : 50;
      const gradT = Math.min(1, Math.max(0, scrollPercentage / exitStartForGradient));

      const lerp = (a, b, t) => a + (b - a) * t;
      const angle = lerp(243, 262, gradT);
      const mid = lerp(62.28, 14.69, gradT);
      const end = lerp(124.55, 29.38, gradT);
      displayCard.style.setProperty("--display-card-angle", `${angle}deg`);
      displayCard.style.setProperty("--display-card-mid", `${mid}%`);
      displayCard.style.setProperty("--display-card-end", `${end}%`);
      
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
    
    // Reset programmatic scroll once we reach the intended scrollY target.
    // Using scrollY is more robust than checking a section's rect.top, because header/tabs offsets
    // can prevent the section from ever landing at exactly 0px.
    const now = Date.now();
    const y = window.scrollY || 0;
    const targetY = typeof programmaticScrollTargetY === "number" ? programmaticScrollTargetY : null;
    const reachedTarget = targetY !== null && Math.abs(y - targetY) <= 2;
    const safetyTimeout = programmaticScrollStartedAt && now - programmaticScrollStartedAt > 2000;

    if (reachedTarget || safetyTimeout) {
      setTimeout(() => {
        isProgrammaticScroll = false;
        programmaticScrollTarget = null;
        programmaticScrollTargetY = null;
        programmaticScrollStartedAt = 0;
      }, 50);
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
  programmaticScrollTargetY = null;
  programmaticScrollStartedAt = Date.now();
  
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
      programmaticScrollTargetY = targetScrollY;
      
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  });
}

function handleWheel(event) {
  // If the user scrolls manually, immediately release the "locked" active tab.
  if (isProgrammaticScroll) {
    isProgrammaticScroll = false;
    programmaticScrollTarget = null;
    programmaticScrollTargetY = null;
    programmaticScrollStartedAt = 0;
  }
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
  
  // Setup journey dots indicator for mobile horizontal scrolling
  function setupJourneyDots() {
    const journeyScrollContainer = document.querySelector('[data-journey-scroll-container]');
    const journeyDots = document.querySelectorAll('[data-journey-dot]');
    
    if (!journeyScrollContainer || journeyDots.length === 0) {
      // Retry if elements aren't ready yet
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupJourneyDots);
        return;
      }
      return;
    }
  
    // Simple function to find which section should be active
    function getActiveJourney() {
      let journeySections = Array.from(journeyScrollContainer.querySelectorAll('[data-journey]'));
      if (journeySections.length === 0) {
        journeySections = Array.from(document.querySelectorAll('[data-journey]'));
      }
      if (journeySections.length === 0) {
        return null;
      }
    
      const containerRect = journeyScrollContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerCenter = containerRect.left + (containerWidth / 2);
      
      let activeJourney = null;
      let closestDistance = Infinity;
      let bestVisibleSection = null;
      let bestVisibleDistance = Infinity;
    
      // Find section whose center is closest to viewport center
      // Use getBoundingClientRect for more reliable results on iOS
      for (let i = 0; i < journeySections.length; i++) {
        const section = journeySections[i];
        const sectionRect = section.getBoundingClientRect();
        const sectionCenter = sectionRect.left + (sectionRect.width / 2);
        const distance = Math.abs(sectionCenter - containerCenter);
        
        const sectionLeft = sectionRect.left;
        const sectionRight = sectionRect.right;
        const containerLeft = containerRect.left;
        const containerRight = containerRect.right;
        const isVisible = sectionRight > containerLeft && sectionLeft < containerRight;
        
        if (isVisible && distance < bestVisibleDistance) {
          bestVisibleDistance = distance;
          bestVisibleSection = section.getAttribute('data-journey');
        }
        
        if (distance < closestDistance) {
          closestDistance = distance;
          activeJourney = section.getAttribute('data-journey');
        }
      }
      
      return bestVisibleSection || activeJourney;
    }
    
    // Simple function to update dots: remove isActive from all, add to correct one
    function updateJourneyDots() {
      if (!journeyScrollContainer || journeyDots.length === 0) {
        return;
      }
    
      const activeJourney = getActiveJourney();
      
      // Step 1: Swap opacity-100 to opacity-25 for all dots (deactivate all)
      for (let i = 0; i < journeyDots.length; i++) {
        const dot = journeyDots[i];
        // Remove opacity-100 and add opacity-25
        dot.classList.remove('opacity-100');
        dot.classList.add('opacity-25');
        // Force iOS to repaint by toggling will-change
        dot.style.willChange = 'opacity';
      }
      
      // Step 2: Swap opacity-25 to opacity-100 for the appropriate dot (activate)
      if (activeJourney) {
        for (let i = 0; i < journeyDots.length; i++) {
          const dot = journeyDots[i];
          const dotJourney = dot.getAttribute('data-journey-dot');
          if (dotJourney === activeJourney) {
            // Remove opacity-25 and add opacity-100
            dot.classList.remove('opacity-25');
            dot.classList.add('opacity-100');
            // Force iOS to repaint
            dot.style.willChange = 'opacity';
            // Force a reflow
            void dot.offsetHeight;
            break;
          }
        }
      }
      
      // Clear will-change after a brief moment to let browser optimize
      setTimeout(() => {
        for (let i = 0; i < journeyDots.length; i++) {
          journeyDots[i].style.willChange = '';
        }
      }, 200);
    }
  
    if (journeyScrollContainer) {
      // Listen to scroll events - use requestAnimationFrame for smooth updates
      journeyScrollContainer.addEventListener('scroll', () => {
        requestAnimationFrame(updateJourneyDots);
      }, { passive: true });
    
      // Listen to scrollend if available
      if ('onscrollend' in journeyScrollContainer) {
        journeyScrollContainer.addEventListener('scrollend', updateJourneyDots);
      }
    
      // Update on resize
      window.addEventListener('resize', () => {
        setTimeout(updateJourneyDots, 50);
      });
    
      // Update on touch events for mobile - use requestAnimationFrame for smooth updates
      journeyScrollContainer.addEventListener('touchmove', () => {
        requestAnimationFrame(updateJourneyDots);
      }, { passive: true });
      journeyScrollContainer.addEventListener('touchstart', () => {
        requestAnimationFrame(updateJourneyDots);
      }, { passive: true });
      journeyScrollContainer.addEventListener('touchend', updateJourneyDots, { passive: true });
    
      // Add click handlers to dots to scroll to corresponding section
      journeyDots.forEach(dot => {
        dot.addEventListener('click', function() {
          const journeyId = this.getAttribute('data-journey-dot');
          const targetSection = document.querySelector(`[data-journey="${journeyId}"]`);
        
          if (targetSection && journeyScrollContainer) {
            // Get current scroll position
            const currentScroll = journeyScrollContainer.scrollLeft;
          
            // Get container and section positions in viewport
            const containerRect = journeyScrollContainer.getBoundingClientRect();
            const sectionRect = targetSection.getBoundingClientRect();
          
            // Calculate section's absolute position within scroll container
            // sectionRect.left is viewport position, containerRect.left is container's viewport position
            // The difference gives us the relative position, then add current scroll to get absolute
            const sectionLeftInContainer = (sectionRect.left - containerRect.left) + currentScroll;
            const containerWidth = journeyScrollContainer.clientWidth;
            const sectionWidth = sectionRect.width;
          
            // Calculate scroll position to center the section
            const targetScroll = sectionLeftInContainer - (containerWidth / 2) + (sectionWidth / 2);
          
            journeyScrollContainer.scrollTo({
              left: Math.max(0, targetScroll),
              behavior: 'smooth'
            });
          
            // Update after scroll completes
            if ('onscrollend' in journeyScrollContainer) {
              const scrollEndHandler = () => {
                updateJourneyDots();
                journeyScrollContainer.removeEventListener('scrollend', scrollEndHandler);
              };
              journeyScrollContainer.addEventListener('scrollend', scrollEndHandler, { once: true });
            } else {
              // Fallback for browsers without scrollend
              setTimeout(updateJourneyDots, 500);
              setTimeout(updateJourneyDots, 1000);
            }
          }
        });
      });
    
      // Initial update
      const doInitialUpdate = () => {
        const rect = journeyScrollContainer.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          updateJourneyDots();
        } else {
          setTimeout(doInitialUpdate, 100);
        }
      };
      
      if (document.readyState === 'complete') {
        setTimeout(doInitialUpdate, 300);
      } else {
        window.addEventListener('load', () => {
          setTimeout(doInitialUpdate, 300);
        });
      }
      
      // No polling needed - event handlers should be sufficient
      
    }
  }
  
  // Call setupJourneyDots
  setupJourneyDots();
  
  // Ensure updateScroll runs after DOM is ready and layout is calculated
  function runInitialScrollUpdate() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateScroll();
        // updateJourneyDots is called from within setupJourneyDots, not here
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
  // Mid-ribbon ripple at qualities section
  const MID_RIPPLE_CENTER = 0.62; // Where the ripple peaks (qualities section)
  const MID_RIPPLE_WIDTH = 0.08; // How wide the ripple effect is
  const MID_RIPPLE_TWIST = Math.PI * 0.75; // Extra twist amount
  const MID_RIPPLE_WAVE = 40; // Horizontal wave amplitude
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

  // Calculate the actual width needed for the ribbon
  function calculateRibbonWidth() {
    // Calculate maximum ribbon extent in object space
    const maxOffset = ((LINES - 1) / 2) * SPACING; // ~112px - maximum ribbon width from center
    const maxExitRight = EXIT_RIGHT_PX + MID_RIPPLE_WAVE; // 700 + 40 = 740px max rightward movement
    const maxLoopPull = EXIT_LOOP_AMPLITUDE; // 180px max leftward pull from loop
    
    // Account for perspective projection
    // Objects with negative z (closer) expand, max z is around maxOffset
    const maxZ = maxOffset;
    const maxProjectionFactor = PERSPECTIVE / Math.max(1, PERSPECTIVE - maxZ);
    
    // Calculate extents in projected space
    // The ribbon starts at some x0, moves right by exitRight, and can loop left
    // We'll calculate the maximum extent needed
    
    // Maximum right extent: exitRight + ribbon width (with projection)
    const maxRightExtent = (maxExitRight + maxOffset) * maxProjectionFactor;
    
    // Maximum left extent: loop pull + ribbon width (with projection)  
    const maxLeftExtent = (maxLoopPull + maxOffset) * maxProjectionFactor;
    
    // Total width needed (we'll center the ribbon in the canvas)
    const ribbonWidth = maxRightExtent + maxLeftExtent;
    
    // Add padding for safety and to account for animation variations
    const padding = 200;
    
    // For mobile, scale down since the viewport is smaller
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      // Mobile uses 72vw transform, so we need proportionally less width
      return Math.max(ribbonWidth * 0.5, window.innerWidth * 1.3) + padding;
    }
    
    return ribbonWidth + padding;
  }

  // INITIALIZATION
  function init() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    height = canvas.offsetHeight;

    if (height <= 0) {
      return;
    }
    
    // Calculate the actual width needed for the ribbon instead of using container width
    const ribbonWidth = calculateRibbonWidth();
    width = Math.max(ribbonWidth, 800); // Minimum width to ensure ribbon fits
    
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
          
          // Mid-ribbon ripple at qualities section
          const rippleDist = Math.abs(u - MID_RIPPLE_CENTER) / MID_RIPPLE_WIDTH;
          const rippleEnvelope = rippleDist < 1 ? Math.pow(1 - rippleDist, 2) : 0; // Smooth falloff
          const rippleTwist = rippleEnvelope * MID_RIPPLE_TWIST * Math.sin((u - MID_RIPPLE_CENTER) * 30);
          const rippleWave = rippleEnvelope * MID_RIPPLE_WAVE * Math.sin((u - MID_RIPPLE_CENTER) * 25);
          
          const theta = thetaField + sign * startF * START_TWIST_TOTAL + sign * exitF * EXIT_TWIST_TOTAL + sign * rippleTwist;
          // Smooth rightward curve starting earlier for gentle transition
          const exitRightF = ramp01(u, EXIT_RIGHT_START, EXIT_RIGHT_END, EXIT_RIGHT_POWER);
          let exitRight = EXIT_RIGHT_PX * exitRightF + rippleWave;
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

// ============================================
// FOOTER CLOSING (LOCATION ROTATOR)
// ============================================

(() => {
  const closing = document.querySelector("[data-footer-closing]");
  const locWrap = document.querySelector("[data-footer-location]");
  if (!closing || !locWrap) return;

  const currentEl = locWrap.querySelector(".loc.current");
  const nextEl = locWrap.querySelector(".loc.next");
  if (!currentEl || !nextEl) return;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Start with these; add more later.
  const locations = [
    "Orem, UT",
    "Miami, FL",
    "Tempe, AZ",
    "London, UK",
    "Prosper, TX",
    "Honolulu, HI",
    "Discovery, USA",
    "San Francisco, CA"
  ];

  const initial = (currentEl.textContent || "").trim() || "New York City";
  // Loop: NYC -> SF -> Prosper -> NYC -> ...
  const loop = [initial, ...locations];
  let idx = 1; // next item to show (current starts at `initial`)

  // Keep in sync with CSS transition duration.
  const DUR = 420;
  const PAUSE = 900;

  let intervalId = 0;
  let commitT = 0;
  let animating = false;

  const clearTimers = () => {
    if (intervalId) window.clearInterval(intervalId);
    if (commitT) window.clearTimeout(commitT);
    intervalId = 0;
    commitT = 0;
    animating = false;
  };

  const step = () => {
    if (animating) return;

    const text = loop[idx % loop.length];
    idx = (idx + 1) % loop.length;

    if (prefersReducedMotion) {
      currentEl.textContent = text;
      nextEl.textContent = "";
      return;
    }

    animating = true;
    nextEl.textContent = text;
    // force reflow so the transition reliably triggers
    void nextEl.offsetWidth;
    locWrap.classList.add("is-animating");

    commitT = window.setTimeout(() => {
      currentEl.textContent = text;
      // Snap to the resting state without animating back down (prevents flash).
      locWrap.classList.add("is-snap");
      // Ensure the "no transition" snap state is applied before we drop is-animating.
      void locWrap.offsetWidth;
      locWrap.classList.remove("is-animating");
      nextEl.textContent = "";
      animating = false;
      commitT = 0;

      // Keep is-snap for 2 frames to avoid any timing edge-cases.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          locWrap.classList.remove("is-snap");
        });
      });
    }, DUR);
  };

  const start = () => {
    if (intervalId) return;
    // Start from the item after whatever is currently displayed.
    const cur = (currentEl.textContent || "").trim();
    const curIdx = loop.findIndex((x) => x === cur);
    idx = curIdx >= 0 ? (curIdx + 1) % loop.length : 1;

    step();
    intervalId = window.setInterval(step, DUR + PAUSE);
  };

  const stop = () => {
    clearTimers();
    locWrap.classList.remove("is-snap");
    locWrap.classList.remove("is-animating");
    currentEl.textContent = initial;
    nextEl.textContent = "";
    idx = 1;
  };

  closing.addEventListener("mouseenter", start);
  closing.addEventListener("mouseleave", stop);

  // Optional: keyboard accessibility (tab focus)
  if (!closing.hasAttribute("tabindex")) closing.setAttribute("tabindex", "0");
  closing.addEventListener("focus", start);
  closing.addEventListener("blur", stop);
})();

// ============================================
// HEADER REVEAL ON SCROLL UP
// ============================================

(() => {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  // Keep layout stable when the header becomes fixed.
  // We wrap the header in a permanent spacer so there's no "0 -> height" jump
  // that can trigger scroll anchoring.
  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  // The hero is a flex-col with `items-center`, so flex items will shrink unless
  // we explicitly stretch to full width.
  wrap.style.alignSelf = "stretch";
  wrap.style.width = "100%";
  header.before(wrap);
  wrap.appendChild(header);
  const syncWrapHeight = () => {
    wrap.style.height = `${header.offsetHeight || 0}px`;
  };
  syncWrapHeight();

  // Sentinel sits immediately after the header in the normal flow.
  // When the sentinel has scrolled above the viewport, the header is out of view.
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.height = "1px";
  sentinel.style.width = "1px";
  sentinel.style.pointerEvents = "none";
  wrap.after(sentinel);

  let pastHeader = false;
  let lastY = window.scrollY || 0;
  let latestY = lastY;
  let ticking = false;
  let hiddenPx = 0; // 0 = fully shown, headerHeight = fully hidden
  let closeT = 0;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const setRevealVar = (px) => {
    document.documentElement.style.setProperty("--header-reveal", `${px}px`);
  };

  const setClosingTransition = (enabled) => {
    if (prefersReducedMotion) return;
    header.style.transition = enabled
      ? "transform 125ms ease-in-out, opacity 125ms ease-in-out"
      : "none";
  };

  const applyScrub = () => {
    const h = header.offsetHeight || 0;
    if (!pastHeader || h <= 0) return;

    hiddenPx = clamp(hiddenPx, 0, h);
    setRevealVar(h - hiddenPx);
    header.style.transform = `translate3d(0, ${-hiddenPx}px, 0)`;
    header.style.opacity = String(1 - hiddenPx / h);
    header.style.pointerEvents = hiddenPx >= h ? "none" : "auto";
  };

  const setPastHeader = (next) => {
    if (pastHeader === next) return;
    pastHeader = next;

    if (!pastHeader) {
      header.classList.remove("is-floating");
      if (closeT) window.clearTimeout(closeT);
      closeT = 0;
      header.style.transition = "";
      header.style.transform = "";
      header.style.opacity = "";
      header.style.pointerEvents = "";
      setRevealVar(0);
      syncWrapHeight();
      return;
    }

    header.classList.add("is-floating");
    syncWrapHeight();
    hiddenPx = header.offsetHeight || 0; // start fully hidden when it becomes floating
    setClosingTransition(false);
    lastY = window.scrollY || 0;
    latestY = lastY;
    applyScrub();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      const nextPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      setPastHeader(nextPast);
    },
    { threshold: [0] }
  );

  observer.observe(sentinel);

  // Track when the hero and display sections are fully out of view
  const heroSection = document.querySelector("[data-hero]");
  const displaySection = document.querySelector("[data-display]");
  let heroOutOfView = !heroSection;
  let displayOutOfView = !displaySection;

  const createSectionObserver = (section, callback) => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Section is out of view when not intersecting and its bottom is above viewport
        callback(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
      },
      { threshold: [0] }
    );
    sectionObserver.observe(section);
  };

  if (heroSection) {
    createSectionObserver(heroSection, (out) => { heroOutOfView = out; });
  }
  if (displaySection) {
    createSectionObserver(displaySection, (out) => { displayOutOfView = out; });
  }

  const tick = () => {
    ticking = false;
    if (!pastHeader) return;

    const dy = latestY - lastY;
    lastY = latestY;

    // Scroll-up: scrubbed reveal tied to scroll movement.
    // Scroll-down: flick closed immediately (not tied to scroll position).
    // Only reveal on scroll-up if both hero and display sections are fully out of view.
    const h = header.offsetHeight || 0;
    const canReveal = heroOutOfView && displayOutOfView;

    // During programmatic scroll (button tabs), always hide the header
    if (isProgrammaticScroll) {
      setClosingTransition(true);
      hiddenPx = h;
      if (closeT) window.clearTimeout(closeT);
      closeT = window.setTimeout(() => {
        closeT = 0;
        if (!pastHeader) return;
        setClosingTransition(false);
      }, 140);
      applyScrub();
      return;
    }

    if (dy > 0) {
      setClosingTransition(true);
      hiddenPx = h;
      if (closeT) window.clearTimeout(closeT);
      closeT = window.setTimeout(() => {
        closeT = 0;
        if (!pastHeader) return;
        setClosingTransition(false);
      }, 140);
    } else if (canReveal) {
      // Only reveal header on scroll-up when hero and display are fully scrolled out
      if (closeT) window.clearTimeout(closeT);
      closeT = 0;
      setClosingTransition(false);
      hiddenPx += dy; // dy is negative when scrolling up
    }
    applyScrub();
  };

  window.addEventListener(
    "scroll",
    () => {
      latestY = window.scrollY || 0;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(tick);
    },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      if (!pastHeader) return;
      syncWrapHeight();
      applyScrub();
    },
    { passive: true }
  );
})();

// ============================================
// MOBILE MENU
// ============================================
(function() {
  const menuToggle = document.querySelector('[data-mobile-menu-toggle]');
  const menuClose = document.querySelector('[data-mobile-menu-close]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const menuIconOpen = document.querySelector('[data-menu-icon-open]');
  const menuIconClose = document.querySelector('[data-menu-icon-close]');

  if (!menuToggle || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.remove('hidden');
    mobileMenu.classList.add('flex');
    menuToggle.setAttribute('aria-expanded', 'true');
    if (menuIconOpen) menuIconOpen.classList.add('hidden');
    if (menuIconClose) menuIconClose.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.add('hidden');
    mobileMenu.classList.remove('flex');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (menuIconOpen) menuIconOpen.classList.remove('hidden');
    if (menuIconClose) menuIconClose.classList.add('hidden');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', function() {
    const isOpen = mobileMenu.classList.contains('flex');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (menuClose) {
    menuClose.addEventListener('click', closeMenu);
  }

  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('flex')) {
      closeMenu();
    }
  });

  // Close menu when clicking a nav link
  mobileMenu.querySelectorAll('nav a').forEach(function(link) {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on resize to desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 1024 && mobileMenu.classList.contains('flex')) {
      closeMenu();
    }
  });
})();

// ============================================
// FOOTER ACCORDION
// ============================================
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const accordionToggles = document.querySelectorAll('[data-footer-accordion]');
    
    function closeAllAccordions(exceptId) {
      accordionToggles.forEach(function(toggle) {
        const accordionId = toggle.getAttribute('data-footer-accordion');
        if (accordionId !== exceptId) {
          const content = document.querySelector(`[data-footer-accordion-content="${accordionId}"]`);
          const icon = toggle.querySelector('.footer-accordion-icon');
          
          if (content) {
            content.classList.remove('is-open');
            content.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
            if (icon) {
              icon.style.transform = 'rotate(0deg)';
            }
          }
        }
      });
    }
    
    accordionToggles.forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        // Only handle clicks on mobile (when pointer-events is not disabled)
        if (window.getComputedStyle(toggle).pointerEvents === 'none') {
          return;
        }
        
        const accordionId = toggle.getAttribute('data-footer-accordion');
        const content = document.querySelector(`[data-footer-accordion-content="${accordionId}"]`);
        const icon = toggle.querySelector('.footer-accordion-icon');
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        if (content) {
          if (isExpanded) {
            // Collapse
            content.classList.remove('is-open');
            content.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
            if (icon) {
              icon.style.transform = 'rotate(0deg)';
            }
          } else {
            // Close all other accordions first
            closeAllAccordions(accordionId);
            
            // Expand this one
            content.classList.remove('hidden');
            // Use setTimeout to ensure the hidden class is removed before adding is-open
            setTimeout(function() {
              content.classList.add('is-open');
            }, 10);
            toggle.setAttribute('aria-expanded', 'true');
            if (icon) {
              icon.style.transform = 'rotate(180deg)';
            }
          }
        }
      });
    });
  });
})();
