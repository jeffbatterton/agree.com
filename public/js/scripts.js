/////////////////////
// Parallax System //
/////////////////////

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
        hero.classList.add('isHidden');
      }
    } else {
      journey0.classList.remove('isVisible');
      // Reset hero opacity when journey--0 is hidden
      if (hero) {
        hero.classList.remove('isHidden');
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

  // Draw blue to red gradient
  requestAnimationFrame(() => {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Set canvas drawing buffer dimensions (with device pixel ratio for crisp rendering)
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Create gradient from blue to red
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'blue');
    gradient.addColorStop(1, 'red');

    // Fill canvas with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}
////////////////////////////////////
// End of Contract to Cash Ribbon //
////////////////////////////////////