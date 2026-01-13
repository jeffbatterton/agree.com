// ============================================
// CONFIGURATION CONSTANTS
// ============================================

// Journey section phase configuration
const JOURNEY_PHASE_1_PERCENTAGE = 37;
const JOURNEY_PHASE_2_PERCENTAGE = 43;
const JOURNEY_PHASE_3_PERCENTAGE = 48;
const JOURNEY_VISUAL_EXIT_START_PERCENTAGE = 58;

// Journey section animation configuration
const JOURNEY_ANIMATION_ENTRY_END = 25;
const JOURNEY_ANIMATION_EXIT_START = 50;
const JOURNEY_ANIMATION_EXIT_OPACITY_START = 75; // Scroll percentage at which opacity starts animating down during exit
const JOURNEY_EXIT_TRANSLATE_Y = 400;

// Journey-0 content animation configuration
const JOURNEY_0_CONTENT_INITIAL_TRANSLATE_Y_VH = 60; // Initial translateY in vh (positive = down)
const JOURNEY_0_HEIGHT_THRESHOLD_PX = 350; // Height threshold in px for journey-0 as it scrolls out
const JOURNEY_0_HEIGHT_REVERSE_START_PERCENTAGE = 50; // Display section scroll percentage at which height animation reverses (scrolls back up)

// Display section animation configuration
const DISPLAY_SECTION_MAX_TRANSLATE_Y_VH = 40; // Maximum translateY in vh (negative = up) for display section

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

// Track when exit phase starts for card animation
let displayCardExitStartPercentage = null;

// ============================================
// STATE VARIABLES
// ============================================

let isProgrammaticScroll = false;
let programmaticScrollTarget = null;
let lastScrollY = window.scrollY || window.pageYOffset;
let isAdjustingScroll = false;
let journey0HeightAnimationStartScrollY = null; // Store scroll position when height animation starts
let journey0InitialHeight = null; // Store journey-0's initial height when animation starts
let journey0FrozenHeight = null; // Store the height when journey-0 scrolls off the page

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


// ============================================
// JOURNEY SECTIONS HANDLERS
// ============================================

function handleJourneySectionAnimation(section, scrollPercentage, isIntegrations) {
  const childDiv = section.querySelector(':scope > div');
  if (!childDiv) return;
  
  const journeyId = section.getAttribute('data-journey');
  const isAgreements = journeyId === 'agreements';
  
  // For agreements section, start at full opacity and scale (no fade-in animation)
  let opacity = isAgreements ? 1.0 : 0.8;
  let scale = isAgreements ? 1.0 : 0.8;
  let translateY = 0;
  
  // Padding animation for non-agreements journey sections
  let paddingTop = null;
  let paddingBottom = null;
  
  if (scrollPercentage <= JOURNEY_ANIMATION_ENTRY_END) {
    const progress = scrollPercentage / JOURNEY_ANIMATION_ENTRY_END;
    // Only animate opacity and scale for non-agreements sections
    if (!isAgreements) {
      opacity = 0.8 + (progress * 0.2);
      scale = 0.8 + (progress * 0.2);
      // Animate top padding from 32px to 104px, keep bottom at 32px
      paddingTop = 32 + (progress * (104 - 32));
      paddingBottom = 32;
    }
  } else if (scrollPercentage >= JOURNEY_ANIMATION_EXIT_START && !isIntegrations) {
    const exitProgress = (scrollPercentage - JOURNEY_ANIMATION_EXIT_START) / (100 - JOURNEY_ANIMATION_EXIT_START);
    scale = 1.0 - (exitProgress * 0.3);
    translateY = exitProgress * JOURNEY_EXIT_TRANSLATE_Y * 2;
    
    // Opacity animation: only starts when scrollPercentage reaches opacity start threshold
    if (scrollPercentage < JOURNEY_ANIMATION_EXIT_OPACITY_START) {
      opacity = 1.0; // Keep at full opacity before opacity animation starts
    } else {
      // Animate opacity from 1.0 to 0.0 between opacity start and 100%
      const opacityRange = 100 - JOURNEY_ANIMATION_EXIT_OPACITY_START;
      const opacityProgress = (scrollPercentage - JOURNEY_ANIMATION_EXIT_OPACITY_START) / opacityRange;
      opacity = 1.0 - opacityProgress;
    }
    
    // Keep padding at full during exit for non-agreements sections
    if (!isAgreements) {
      paddingTop = 104;
      paddingBottom = 32;
    }
  } else {
    opacity = 1.0;
    scale = 1.0;
    // Keep padding at full when fully scrolled in for non-agreements sections
    if (!isAgreements) {
      paddingTop = 104;
      paddingBottom = 32;
    }
  }
  
  childDiv.style.opacity = opacity;
  childDiv.style.transform = `translateY(${translateY}px) scale(${scale})`;
  
  // Apply padding animation to section element for non-agreements sections
  if (!isAgreements) {
    if (paddingTop !== null && paddingBottom !== null) {
      section.style.paddingTop = `${paddingTop}px`;
      section.style.paddingBottom = `${paddingBottom}px`;
    }
  } else {
    // Clear inline padding styles for agreements section so CSS classes take precedence
    section.style.paddingTop = '';
    section.style.paddingBottom = '';
  }
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
  // Calculate and log display section scroll percentage
  const display = document.querySelector('[data-display]');
  let scrollPercentage = 0;
  let shouldBeFixed = true; // Default to fixed for ribbon canvas
  
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
    
    // Animate hero section translateY as display section scrolls in (push up)
    const heroElement = document.querySelector('[data-hero]');
    if (heroElement) {
      const maxTranslateY = DISPLAY_SECTION_MAX_TRANSLATE_Y_VH * viewportHeight / 100; // Convert vh to px
      // Animate from 0 to maxTranslateY (negative, pushing up) as scroll percentage goes from 0 to 100%
      const progress = Math.min(1, Math.max(0, scrollPercentage / 100));
      const translateY = -maxTranslateY * progress; // Negative value = up
      
      // Apply transform: set to none when translateY is 0, otherwise apply the transform
      if (translateY === 0) {
        heroElement.style.transform = 'none';
      } else {
        heroElement.style.transform = `translateY(${translateY}px)`;
      }
    }
    
    // Determine if ribbon canvas should be fixed based on scroll percentage
    if (scrollPercentage >= 50) {
      shouldBeFixed = false;
    } else {
      shouldBeFixed = true;
    }
      
    // Handle scroll phases
    display.classList.remove('scroll-entry', 'scroll-intermediate', 'scroll-exit');
    
    // Check if bottom of container has entered bottom of viewport
    const displayBottom = displayRect.bottom;
    const hasExited = displayBottom <= viewportHeight;
    const isCompletelyPast = displayTop + displayHeight < 0; // Display section has completely scrolled past viewport
    
    // Handle hero, journey-0, and journey-spacer based on exit state and scroll percentage
    const hero = document.querySelector('[data-hero]');
    const journey0 = document.querySelector('[data-journey-0]');
    const journeySpacer = document.querySelector('[data-journey--spacer]');
    
    // Check journey-0's own position to determine if it should be relative
    let journey0ShouldBeRelative = false;
    if (journey0) {
      const journey0Rect = journey0.getBoundingClientRect();
      // Journey-0 should be relative only if it has completely scrolled past the viewport
      // This prevents jumping when refreshing while journey-0 is still in view
      journey0ShouldBeRelative = journey0Rect.bottom < 0;
    }
    
    // Priority 1: If journey-0 has completely scrolled past, make it relative
    if (journey0ShouldBeRelative) {
      if (hero) {
        hero.classList.add('opacity-0');
      }
      if (journey0) {
        journey0.classList.remove('fixed');
        journey0.classList.add('relative', 'block');
      }
      if (journeySpacer) {
        journeySpacer.classList.remove('block');
        journeySpacer.classList.add('hidden');
      }
    }
    // Priority 2: If display section has completely scrolled past, journey0 should be relative
    else if (isCompletelyPast) {
      if (hero) {
        hero.classList.add('opacity-0');
      }
      if (journey0) {
        journey0.classList.remove('fixed');
        journey0.classList.add('relative', 'block');
        
        // Store journey-0's initial height (80vh) when display section fully scrolls out
        if (journey0InitialHeight === null) {
          const viewportHeight = window.innerHeight;
          journey0InitialHeight = 80 * viewportHeight / 100; // 80vh in px
          journey0HeightAnimationStartScrollY = window.scrollY || window.pageYOffset;
        }
      }
      if (journeySpacer) {
        journeySpacer.classList.remove('block');
        journeySpacer.classList.add('hidden');
      }
    }
    // Priority 3: If in exit phase but not completely past, keep journey0 fixed to prevent jumping
    else if (hasExited) {
      if (hero) {
        hero.classList.add('opacity-0');
      }
      if (journey0) {
        journey0.classList.remove('relative', 'block');
        journey0.classList.add('fixed');
      }
      if (journeySpacer) {
        journeySpacer.classList.remove('hidden');
        journeySpacer.classList.add('block');
      }
      // Reset height animation state when not completely past
      journey0InitialHeight = null;
      journey0HeightAnimationStartScrollY = null;
    }
    // Priority 4: Use scroll percentage for normal scroll behavior
    else if (scrollPercentage >= 50) {
      // When scroll percentage reaches 50% or above (but not in exit phase)
      if (hero) {
        hero.classList.add('opacity-0');
      }
      if (journey0) {
        journey0.classList.remove('relative', 'block');
        journey0.classList.add('fixed');
      }
      if (journeySpacer) {
        journeySpacer.classList.remove('hidden');
        journeySpacer.classList.add('block');
      }
    } else {
      // Revert when scroll percentage is below 50%
      if (hero) {
        hero.classList.remove('opacity-0');
      }
      if (journey0) {
        journey0.classList.remove('fixed', 'block');
        journey0.classList.add('relative');
      }
      if (journeySpacer) {
        journeySpacer.classList.remove('block');
        journeySpacer.classList.add('hidden');
      }
      // Reset height animation state when scroll percentage is below 50%
      journey0InitialHeight = null;
      journey0HeightAnimationStartScrollY = null;
    }
    
    // Animate journey-0 height based on scroll amount after display section fully scrolls out
    if (journey0 && journey0InitialHeight !== null && journey0HeightAnimationStartScrollY !== null) {
      // Check if journey-0 has scrolled entirely off the page
      const journey0Rect = journey0.getBoundingClientRect();
      const journey0IsOffPage = journey0Rect.bottom < 0;
      
      if (journey0IsOffPage) {
        // Freeze the height at its current state when journey-0 scrolls off the page
        if (journey0FrozenHeight === null) {
          journey0FrozenHeight = parseFloat(journey0.style.height) || journey0InitialHeight;
        }
        journey0.style.height = `${Math.max(JOURNEY_0_HEIGHT_THRESHOLD_PX, journey0FrozenHeight)}px`;
      } else {
        // Reset frozen height when journey-0 comes back into view
        journey0FrozenHeight = null;
        
        const currentScrollY = window.scrollY || window.pageYOffset;
        const scrollAmount = currentScrollY - journey0HeightAnimationStartScrollY;
        
        // Check if we should reverse the animation (scroll back up)
        // Only reverse if display section has scrolled back in by the threshold percentage
        if (scrollAmount < 0 && display && scrollPercentage > JOURNEY_0_HEIGHT_REVERSE_START_PERCENTAGE) {
          // Scroll is going back up, but display section hasn't scrolled back in enough yet
          // Hold the height at its current state (don't animate back up yet)
          // Get the current height from the element or use the last calculated height
          const currentHeight = parseFloat(journey0.style.height) || journey0InitialHeight;
          journey0.style.height = `${Math.max(JOURNEY_0_HEIGHT_THRESHOLD_PX, currentHeight)}px`;
        } else {
          // Normal animation: subtract scroll amount from initial height (1:1 ratio)
          const newHeight = Math.max(JOURNEY_0_HEIGHT_THRESHOLD_PX, journey0InitialHeight - Math.max(0, scrollAmount));
          journey0.style.height = `${newHeight}px`;
        }
      }
    }
    
    // Animate journey-0 content wrapper translateY based on display section scroll out
    const journey0Content = document.querySelector('[data-journey-0-content]');
    if (journey0Content && display) {
      const viewportHeight = window.innerHeight;
      const initialTranslateY = JOURNEY_0_CONTENT_INITIAL_TRANSLATE_Y_VH * viewportHeight / 100; // Convert vh to px
      
      // Animate from initialTranslateY (down) to 0 as display section scrolls out (scrollPercentage goes from 0 to 100%)
      // When display scrollPercentage is 0, translateY = initialTranslateY (40vh down)
      // When display scrollPercentage is 100%, translateY = 0
      const progress = Math.min(1, Math.max(0, scrollPercentage / 100));
      const translateY = initialTranslateY * (1 - progress); // Interpolate from initialTranslateY to 0
      
      // Cap translateY at 0 to prevent it from going negative (translating up)
      const clampedTranslateY = Math.max(0, translateY);
      
      // Set transform to none when translateY reaches 0, otherwise apply the transform
      if (clampedTranslateY === 0) {
        journey0Content.style.transform = 'none';
      } else {
        journey0Content.style.transform = `translateY(${clampedTranslateY}px)`;
      }
    }
    
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
  
  // Handle ribbon canvas - apply/remove fixed class based on display scroll percentage
  const ribbonCanvas = document.querySelector("[data-ribbon--canvas]");
  if (ribbonCanvas && window.ribbonInitialized) {
    if (shouldBeFixed) {
      ribbonCanvas.classList.add('fixed');
      ribbonCanvas.style.height = 'auto';
    } else {
      ribbonCanvas.classList.remove('fixed');
      ribbonCanvas.style.height = '';
    }
  }
  
  // Handle qualities spacer
  const qualitiesSpacer = document.querySelector('[data-parallax-system="qualities--spacer"]');
  // Note: Qualities spacer visibility logic removed - was previously controlled by CTA scroll
  
  
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
  let integrationsScrollPercentage = 0;
  let agreementsScrollPercentage = 0;
  
  journeySections.forEach(section => {
    const journeyId = section.getAttribute('data-journey');
    if (!journeyId) return;
    
    const rect = section.getBoundingClientRect();
    const sectionHeight = rect.height;
    const scrollPercentage = calculateJourneyScrollPercentage(rect, sectionHeight);
    const isIntegrations = journeyId === 'integrations';
    const isAgreements = journeyId === 'agreements';
    
    if (isIntegrations) {
      integrationsScrollPercentage = scrollPercentage;
    }
    
    if (isAgreements) {
      agreementsScrollPercentage = scrollPercentage;
    }
    
    handleJourneySectionAnimation(section, scrollPercentage, isIntegrations);
    
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
  if (integrationsScrollPercentage >= 50 && buttonTabs) {
    const integrationsSection = document.querySelector('[data-journey="integrations"]');
    if (integrationsSection) {
      const integrationsRect = integrationsSection.getBoundingClientRect();
      const integrationsTop = integrationsRect.top;
      const scrollAmount = integrationsTop < 0 ? Math.abs(integrationsTop) : 0;
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
  
  // Stop any ongoing scroll animations to prevent spillover
  window.scrollTo({
    top: window.scrollY,
    behavior: 'auto'
  });
  
  // Force layout recalculation and wait for layout changes to settle
  // This accounts for button tabs becoming fixed and journey 0 transitioning from fixed to relative
  requestAnimationFrame(() => {
    // Update scroll to apply layout changes (button tabs fixed, journey 0 relative, etc.)
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
  
  setTimeout(() => {
    isProgrammaticScroll = false;
    programmaticScrollTarget = null;
  }, 1000);
}

function handleWheel(event) {
  updateScroll();
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
  const journey0 = document.querySelector('[data-journey-0]');
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
        // Apply fixed class and height: auto as soon as ribbon is drawn
        if (canvas) {
          canvas.classList.add('fixed');
          canvas.style.height = 'auto';
        }
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
