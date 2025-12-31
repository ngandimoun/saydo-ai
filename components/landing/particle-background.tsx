"use client"

import { useEffect, useRef, memo } from "react"
import { gsap } from "gsap"
import { getParticleConfig, prefersReducedMotion } from "@/lib/animation-config"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  element: HTMLDivElement
}

export const ParticleBackground = memo(function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const container = containerRef.current
    if (!container) return

    const config = getParticleConfig()
    const particles: Particle[] = []

    // Create particles
    for (let i = 0; i < config.count; i++) {
      const element = document.createElement("div")
      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0])
      const opacity = config.opacityRange[0] + Math.random() * (config.opacityRange[1] - config.opacityRange[0])

      element.className = "absolute rounded-full pointer-events-none"
      element.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, var(--saydo-teal-light), var(--saydo-teal));
        opacity: ${opacity};
        filter: blur(1px);
      `

      container.appendChild(element)

      const particle: Particle = {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: -0.3 - Math.random() * 0.5,
        opacity,
        element,
      }

      gsap.set(element, { x: particle.x, y: particle.y })
      particles.push(particle)
    }

    particlesRef.current = particles

    // Animation loop
    const animate = () => {
      const height = window.innerHeight
      const width = window.innerWidth

      particles.forEach((particle) => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Reset particle when it goes off screen
        if (particle.y < -particle.size) {
          particle.y = height + particle.size
          particle.x = Math.random() * width
        }
        if (particle.x < -particle.size) {
          particle.x = width + particle.size
        }
        if (particle.x > width + particle.size) {
          particle.x = -particle.size
        }

        gsap.set(particle.element, { x: particle.x, y: particle.y })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      particles.forEach((p) => p.element.remove())
      particlesRef.current = []
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    />
  )
})






