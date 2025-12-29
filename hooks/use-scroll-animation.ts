"use client"

import { useEffect, useRef, useCallback } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { 
  scrollTriggerDefaults, 
  durations, 
  distances, 
  gsapEase,
  prefersReducedMotion 
} from "@/lib/animation-config"

// Register plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface ScrollAnimationOptions {
  // ScrollTrigger options
  start?: string
  end?: string
  scrub?: boolean | number
  markers?: boolean
  toggleActions?: string
  
  // Animation options
  duration?: number
  delay?: number
  stagger?: number
  ease?: string
  
  // Transform options
  fromY?: number
  fromX?: number
  fromOpacity?: number
  fromScale?: number
  fromRotation?: number
  
  // Callbacks
  onEnter?: () => void
  onLeave?: () => void
  onComplete?: () => void
}

/**
 * Custom hook for scroll-triggered GSAP animations
 * Handles cleanup and respects reduced motion preferences
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
) {
  const elementRef = useRef<T>(null)
  const contextRef = useRef<gsap.Context | null>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)

  const {
    start = scrollTriggerDefaults.start,
    end = scrollTriggerDefaults.end,
    scrub = false,
    markers = false,
    toggleActions = scrollTriggerDefaults.toggleActions,
    duration = durations.normal,
    delay = 0,
    stagger = 0,
    ease = gsapEase.smoothOut,
    fromY = distances.normal,
    fromX = 0,
    fromOpacity = 0,
    fromScale = 1,
    fromRotation = 0,
    onEnter,
    onLeave,
    onComplete,
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Respect reduced motion
    if (prefersReducedMotion()) {
      gsap.set(element, { opacity: 1 })
      return
    }

    // Create GSAP context for cleanup
    contextRef.current = gsap.context(() => {
      // Set initial state
      gsap.set(element, {
        y: fromY,
        x: fromX,
        opacity: fromOpacity,
        scale: fromScale,
        rotation: fromRotation,
      })

      // Create the animation
      const tween = gsap.to(element, {
        y: 0,
        x: 0,
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration,
        delay,
        ease,
        stagger,
        onComplete,
        scrollTrigger: {
          trigger: element,
          start,
          end,
          scrub,
          markers,
          toggleActions,
          onEnter,
          onLeave,
          fastScrollEnd: true,
        },
      })

      // Store trigger reference
      triggerRef.current = tween.scrollTrigger as ScrollTrigger
    }, element)

    return () => {
      contextRef.current?.revert()
      triggerRef.current?.kill()
    }
  }, [
    start, end, scrub, markers, toggleActions,
    duration, delay, stagger, ease,
    fromY, fromX, fromOpacity, fromScale, fromRotation,
    onEnter, onLeave, onComplete
  ])

  return elementRef
}

/**
 * Hook for staggered children animations on scroll
 */
export function useScrollStagger<T extends HTMLElement = HTMLDivElement>(
  childSelector: string,
  options: ScrollAnimationOptions = {}
) {
  const containerRef = useRef<T>(null)
  const contextRef = useRef<gsap.Context | null>(null)

  const {
    start = scrollTriggerDefaults.start,
    duration = durations.normal,
    stagger = durations.staggerNormal,
    ease = gsapEase.smoothOut,
    fromY = distances.normal,
    fromOpacity = 0,
    onComplete,
  } = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const children = container.querySelectorAll(childSelector)
    if (children.length === 0) return

    if (prefersReducedMotion()) {
      gsap.set(children, { opacity: 1 })
      return
    }

    contextRef.current = gsap.context(() => {
      gsap.set(children, { y: fromY, opacity: fromOpacity })

      gsap.to(children, {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        ease,
        onComplete,
        scrollTrigger: {
          trigger: container,
          start,
          fastScrollEnd: true,
        },
      })
    }, container)

    return () => {
      contextRef.current?.revert()
    }
  }, [childSelector, start, duration, stagger, ease, fromY, fromOpacity, onComplete])

  return containerRef
}

/**
 * Hook for parallax scroll effects
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  speed: number = 0.5,
  direction: "y" | "x" = "y"
) {
  const elementRef = useRef<T>(null)
  const contextRef = useRef<gsap.Context | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || prefersReducedMotion()) return

    contextRef.current = gsap.context(() => {
      gsap.to(element, {
        [direction]: () => speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      })
    }, element)

    return () => {
      contextRef.current?.revert()
    }
  }, [speed, direction])

  return elementRef
}

/**
 * Hook for text split and reveal animations
 */
export function useTextReveal<T extends HTMLElement = HTMLDivElement>(
  options: {
    type?: "chars" | "words" | "lines"
    stagger?: number
    duration?: number
    delay?: number
  } = {}
) {
  const elementRef = useRef<T>(null)
  const contextRef = useRef<gsap.Context | null>(null)

  const {
    type = "words",
    stagger = durations.staggerTight,
    duration = durations.normal,
    delay = 0,
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element || prefersReducedMotion()) return

    const text = element.textContent || ""
    let items: string[] = []

    switch (type) {
      case "chars":
        items = text.split("")
        break
      case "words":
        items = text.split(" ")
        break
      case "lines":
        items = [text] // Simplified - would need more complex line detection
        break
    }

    // Wrap each item in a span
    element.innerHTML = items
      .map(item => `<span class="inline-block opacity-0 translate-y-4">${item}${type === "words" ? "&nbsp;" : ""}</span>`)
      .join("")

    const spans = element.querySelectorAll("span")

    contextRef.current = gsap.context(() => {
      gsap.to(spans, {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        delay,
        ease: gsapEase.heroReveal,
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
        },
      })
    }, element)

    return () => {
      contextRef.current?.revert()
      // Restore original text
      element.textContent = text
    }
  }, [type, stagger, duration, delay])

  return elementRef
}

/**
 * Hook for magnetic hover effect (for buttons)
 */
export function useMagneticHover<T extends HTMLElement = HTMLButtonElement>(
  strength: number = 0.3
) {
  const elementRef = useRef<T>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const element = elementRef.current
    if (!element || prefersReducedMotion()) return

    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: "power2.out",
    })
  }, [strength])

  const handleMouseLeave = useCallback(() => {
    const element = elementRef.current
    if (!element) return

    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    })
  }, [])

  useEffect(() => {
    const element = elementRef.current
    if (!element || prefersReducedMotion()) return

    element.addEventListener("mousemove", handleMouseMove)
    element.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      element.removeEventListener("mousemove", handleMouseMove)
      element.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return elementRef
}

/**
 * Hook for counter animation
 */
export function useCountUp(
  endValue: number,
  options: {
    duration?: number
    startOnView?: boolean
    prefix?: string
    suffix?: string
  } = {}
) {
  const elementRef = useRef<HTMLElement>(null)
  const hasAnimated = useRef(false)

  const {
    duration = 2,
    startOnView = true,
    prefix = "",
    suffix = "",
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element || hasAnimated.current) return

    if (prefersReducedMotion()) {
      element.textContent = `${prefix}${endValue}${suffix}`
      return
    }

    const counter = { value: 0 }

    const animate = () => {
      if (hasAnimated.current) return
      hasAnimated.current = true

      gsap.to(counter, {
        value: endValue,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          element.textContent = `${prefix}${Math.round(counter.value)}${suffix}`
        },
      })
    }

    if (startOnView) {
      ScrollTrigger.create({
        trigger: element,
        start: "top 85%",
        onEnter: animate,
        once: true,
      })
    } else {
      animate()
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === element) t.kill()
      })
    }
  }, [endValue, duration, startOnView, prefix, suffix])

  return elementRef
}




