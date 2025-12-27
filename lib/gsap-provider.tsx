"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { prefersReducedMotion } from "./animation-config"

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface GSAPContextValue {
  isReady: boolean
  isReducedMotion: boolean
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
}

const GSAPContext = createContext<GSAPContextValue | null>(null)

interface GSAPProviderProps {
  children: ReactNode
}

export function GSAPProvider({ children }: GSAPProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    // Check reduced motion preference
    const reducedMotion = prefersReducedMotion()
    setIsReducedMotion(reducedMotion)

    // Configure GSAP defaults
    gsap.defaults({
      ease: "power2.out",
      duration: reducedMotion ? 0.01 : 0.6,
    })

    // Configure ScrollTrigger defaults
    ScrollTrigger.defaults({
      toggleActions: "play none none none",
    })

    // Refresh ScrollTrigger on resize
    const handleResize = () => {
      ScrollTrigger.refresh()
    }

    window.addEventListener("resize", handleResize)
    
    // Mark as ready after hydration
    setIsReady(true)

    // Listen for reduced motion changes
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }
    mediaQuery.addEventListener("change", handleMotionChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      mediaQuery.removeEventListener("change", handleMotionChange)
      // Kill all ScrollTriggers on unmount
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <GSAPContext.Provider
      value={{
        isReady,
        isReducedMotion,
        gsap,
        ScrollTrigger,
      }}
    >
      {children}
    </GSAPContext.Provider>
  )
}

export function useGSAP() {
  const context = useContext(GSAPContext)
  if (!context) {
    throw new Error("useGSAP must be used within a GSAPProvider")
  }
  return context
}

// Export for direct use when needed
export { gsap, ScrollTrigger }

