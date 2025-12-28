"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Navbar } from "@/components/landing/navbar"
import { HeroDemo } from "@/components/landing/hero-demo"
import { WholeYou } from "@/components/landing/whole-you"
import { HowItWorks } from "@/components/landing/how-it-works"
import { AIExamples } from "@/components/landing/ai-examples"
import { UseCases } from "@/components/landing/use-cases"
import { WhyDifferent } from "@/components/landing/why-different"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { Footer } from "@/components/landing/footer"
import { ParticleBackground } from "@/components/landing/particle-background"
import { prefersReducedMotion, durations, gsapEase } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtextRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Hero entrance timeline
      const heroTl = gsap.timeline({ delay: 0.2 })

      // Headline word-by-word reveal
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll(".hero-word")
        heroTl.from(words, {
          y: 40,
          opacity: 0,
          rotationX: -15,
          stagger: 0.06,
          duration: durations.slow,
          ease: gsapEase.heroReveal,
        })
      }

      // Subtext fade in
      if (subtextRef.current) {
        heroTl.from(
          subtextRef.current,
          {
            y: 20,
            opacity: 0,
            duration: durations.normal,
            ease: gsapEase.smoothOut,
          },
          "-=0.3"
        )
      }
    }, heroRef)

    return () => ctx.revert()
  }, [])

  // Split headline into individual words for animation with proper spacing
  const renderHeadline = () => {
    const line1 = "The first AI that knows"
    const line2Words = [
      { text: "your", italic: false, primary: false },
      { text: "mind", italic: true, primary: true },
      { text: "and", italic: false, primary: false },
      { text: "your", italic: false, primary: false },
      { text: "body.", italic: true, primary: true },
    ]

    return (
      <>
        {/* First line */}
        <span className="hero-word block mb-2">
          {line1}
        </span>
        {/* Second line with styled words */}
        <span className="block">
          {line2Words.map((word, i) => (
            <span key={i}>
              <span
                className={`hero-word inline-block ${
                  word.italic ? "saydo-headline-italic" : ""
                } ${word.primary ? "text-primary" : ""}`}
              >
                {word.text}
              </span>
              {i < line2Words.length - 1 && <span className="hero-word inline-block">&nbsp;</span>}
            </span>
          ))}
        </span>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-teal-500/20 overflow-x-hidden">
      {/* Sticky Nav */}
      <Navbar />

      <main className="flex flex-col items-center">
        {/* Hero: The Unified Promise */}
        <section
          ref={heroRef}
          className="relative w-full pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 flex flex-col items-center text-center overflow-hidden"
        >
          {/* Particle Background */}
          <ParticleBackground />

          {/* Gradient Orb Background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <h1
              ref={headlineRef}
              className="saydo-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 sm:mb-8 px-2"
              style={{ perspective: "1000px" }}
            >
              {renderHeadline()}
            </h1>
            <p
              ref={subtextRef}
              className="saydo-body text-muted-foreground text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-10 sm:mb-12 px-4"
            >
              Voice notes become tasks. Lab results become daily guides. One app.
              Your whole life.
            </p>
          </div>

          {/* THE MAGIC BUTTON (Interactive Demo) */}
          <HeroDemo />
        </section>

        {/* The Whole You - Unified Intelligence */}
        <WholeYou />

        {/* How it works - Unified Flow */}
        <HowItWorks />

        {/* AI Interaction Examples */}
        <AIExamples />

        {/* For Who? (Use Cases) */}
        <UseCases />

        {/* Why Different */}
        <WhyDifferent />

        {/* Pricing (Simple tiers) */}
        <Pricing />

        {/* Smart FAQs */}
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}
