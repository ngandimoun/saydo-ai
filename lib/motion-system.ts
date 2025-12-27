/**
 * Saydo Motion Design System
 * 
 * Airbnb-inspired animation patterns:
 * - Parent-to-child transitions
 * - Shared element animations
 * - Staggered reveals
 * - Breathing/living states
 * 
 * Uses both Framer Motion and GSAP for different use cases
 */

import { type Transition, type Variants } from "framer-motion"

// ============================================
// SPRING CONFIGURATIONS
// ============================================

/**
 * Spring presets for different interaction types
 * Based on natural physics and Airbnb's motion principles
 */
export const springs = {
  // Quick, snappy response for buttons and toggles
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },
  // Gentle, natural motion for cards and modals
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },
  // Bouncy motion for playful elements
  bouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 0.8,
  },
  // Slow, deliberate motion for page transitions
  slow: {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
    mass: 1.2,
  },
  // Quick micro-interactions
  quick: {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.5,
  },
  // Smooth easing for subtle movements
  smooth: {
    type: "spring" as const,
    stiffness: 150,
    damping: 22,
    mass: 1,
  },
} satisfies Record<string, Transition>

// ============================================
// DURATION PRESETS
// ============================================

export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
  slowest: 1,
}

// ============================================
// EASING CURVES
// ============================================

export const easings = {
  // Default smooth ease
  smooth: [0.4, 0, 0.2, 1] as const,
  // Ease out for exits
  easeOut: [0, 0, 0.2, 1] as const,
  // Ease in for entries
  easeIn: [0.4, 0, 1, 1] as const,
  // Anticipation (slight pullback before motion)
  anticipate: [0.68, -0.6, 0.32, 1.6] as const,
  // Bounce effect
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
}

// ============================================
// STAGGER UTILITIES
// ============================================

/**
 * Create stagger configuration for list animations
 * @param count - Number of items to stagger
 * @param baseDelay - Initial delay before stagger starts
 * @param staggerDelay - Delay between each item
 */
export function createStagger(
  count: number,
  baseDelay = 0,
  staggerDelay = 0.05
) {
  return {
    staggerChildren: staggerDelay,
    delayChildren: baseDelay,
  }
}

/**
 * Get delay for a specific item in a staggered list
 */
export function getStaggerDelay(
  index: number,
  baseDelay = 0,
  staggerDelay = 0.05
) {
  return baseDelay + index * staggerDelay
}

// ============================================
// ANIMATION VARIANTS
// ============================================

/**
 * Fade and slide up - perfect for content reveals
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.fast },
  },
}

/**
 * Fade and slide down - for dropdown menus
 */
export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.fast },
  },
}

/**
 * Scale up with fade - for modals and popovers
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
}

/**
 * Slide in from left - for side panels
 */
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: durations.fast },
  },
}

/**
 * Slide in from right - for navigation
 */
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: durations.fast },
  },
}

/**
 * Container with staggered children
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

/**
 * Child item for stagger container
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.fast },
  },
}

/**
 * Card hover effect
 */
export const cardHover: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: "var(--shadow-card)",
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: "var(--shadow-card-hover)",
    transition: springs.snappy,
  },
  tap: {
    y: -2,
    scale: 0.99,
    transition: springs.quick,
  },
}

/**
 * Button press effect
 */
export const buttonPress: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.97,
    transition: springs.quick,
  },
}

/**
 * Page transition - slide between tabs
 */
export const pageSlide: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: springs.gentle,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 30 : -30,
    opacity: 0,
    transition: { duration: durations.fast },
  }),
}

// ============================================
// BREATHING / LIVING ANIMATIONS
// ============================================

/**
 * Subtle breathing animation for "alive" elements
 */
export const breathing = {
  scale: [1, 1.02, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

/**
 * Pulsing glow for active/recording states
 */
export const pulsingGlow = {
  scale: [1, 1.05, 1],
  boxShadow: [
    "0 0 0 0 rgba(13, 148, 136, 0.4)",
    "0 0 0 12px rgba(13, 148, 136, 0)",
    "0 0 0 0 rgba(13, 148, 136, 0.4)",
  ],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeOut",
  },
}

/**
 * Floating animation for decorative elements
 */
export const floating = {
  y: [0, -8, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

/**
 * Shimmer effect for loading states
 */
export const shimmer = {
  backgroundPosition: ["-200% 0", "200% 0"],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear",
  },
}

// ============================================
// GSAP ANIMATION HELPERS
// ============================================

/**
 * GSAP timeline defaults for consistent animations
 */
export const gsapDefaults = {
  duration: 0.5,
  ease: "power2.out",
}

/**
 * GSAP scroll trigger defaults
 */
export const scrollTriggerDefaults = {
  start: "top 80%",
  end: "bottom 20%",
  toggleActions: "play none none reverse",
}

/**
 * Create GSAP fade-in animation config
 */
export function gsapFadeIn(delay = 0) {
  return {
    opacity: 0,
    y: 20,
    duration: 0.5,
    delay,
    ease: "power2.out",
  }
}

/**
 * Create GSAP stagger animation config
 */
export function gsapStagger(stagger = 0.1, delay = 0) {
  return {
    opacity: 0,
    y: 20,
    stagger,
    duration: 0.5,
    delay,
    ease: "power2.out",
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Get appropriate transition based on reduced motion preference
 */
export function getTransition(transition: Transition): Transition {
  if (prefersReducedMotion()) {
    return { duration: 0 }
  }
  return transition
}

/**
 * Create viewport animation props
 */
export function createViewportAnimation(
  variants: Variants,
  once = true,
  amount = 0.3
) {
  return {
    initial: "hidden",
    whileInView: "visible",
    viewport: { once, amount },
    variants,
  }
}

// ============================================
// COMPONENT-SPECIFIC ANIMATIONS
// ============================================

/**
 * Voice orb animations
 */
export const voiceOrbAnimations = {
  idle: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  listening: {
    scale: [1, 1.15, 1],
    boxShadow: [
      "0 0 20px rgba(13, 148, 136, 0.3)",
      "0 0 40px rgba(13, 148, 136, 0.5)",
      "0 0 20px rgba(13, 148, 136, 0.3)",
    ],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeOut",
    },
  },
  processing: {
    rotate: [0, 360],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

/**
 * Health ring animations
 */
export const healthRingAnimations = {
  fill: (percentage: number) => ({
    pathLength: percentage / 100,
    transition: {
      duration: 1.5,
      ease: [0.4, 0, 0.2, 1],
      delay: 0.2,
    },
  }),
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

/**
 * Tab switch animation
 */
export const tabSwitchAnimation = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: springs.gentle,
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: durations.fast },
  },
}

