"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Check, Sparkles, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prefersReducedMotion, durations } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const tiers = [
  {
    name: "Free",
    price: 0,
    period: "",
    tagline: "Try Saydo",
    description: "See what it feels like to have an AI that knows you",
    features: [
      "5 minutes voice/day",
      "Basic summaries & tasks",
      "1 device",
      "See how it works",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: 15,
    period: "/month",
    tagline: "Your whole life, organized",
    description: "Unlimited access to everything. No feature gates.",
    features: [
      "Unlimited voice & scans",
      "Full AI intelligence",
      "Health insights & tracking",
      "Wearable connections",
      "Multi-device sync",
      "Priority support",
    ],
    cta: "Go Pro",
    popular: true,
  },
]

// Counter animation component
function AnimatedPrice({ value, isInView }: { value: number; isInView: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)
  const isReduced = prefersReducedMotion()

  useEffect(() => {
    if (!isInView || isReduced) {
      setDisplayValue(value)
      return
    }

    let start = 0
    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (value - start) * eased)
      
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, isInView, isReduced])

  return <span>${displayValue}</span>
}

export const Pricing = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const proCardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Spotlight glow animation on Pro card
      if (proCardRef.current) {
        gsap.to(proCardRef.current, {
          scrollTrigger: {
            trigger: proCardRef.current,
            start: "top 80%",
            onEnter: () => {
              gsap.to(proCardRef.current, {
                boxShadow: "0 0 60px rgba(13, 148, 136, 0.3), 0 25px 50px -12px rgba(13, 148, 136, 0.2)",
                duration: 0.8,
                ease: "power2.out",
              })
            },
          },
        })
      }

      // Staggered card entrance
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll(".pricing-card")
        gsap.fromTo(
          cards,
          {
            y: 40,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: durations.slow,
            stagger: 0.15,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 85%",
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="w-full py-20 sm:py-28 px-4 bg-background overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Subtle section divider */}
        <div className="saydo-section-divider mb-20" />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            Simple Pricing
          </h2>
          <p className="saydo-body text-muted-foreground text-lg">
            One price. Everything included. No feature gates.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div ref={cardsRef} className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              ref={tier.popular ? proCardRef : null}
              whileHover={{ 
                y: -8, 
                transition: { type: "spring", stiffness: 400, damping: 15 } 
              }}
              className={`pricing-card relative p-7 sm:p-8 rounded-3xl transition-all duration-300 ${
                tier.popular
                  ? "bg-gradient-to-br from-card to-accent/40 border-2 border-primary/30"
                  : "saydo-card border border-border"
              }`}
            >
              {/* Popular badge */}
              {tier.popular && (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.3 }}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-2 shadow-md"
                >
                  <Sparkles size={12} />
                  RECOMMENDED
                </motion.div>
              )}

              {/* Spotlight overlay for Pro */}
              {tier.popular && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
                  />
                </div>
              )}
              
              <div className="mb-6 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  {tier.popular && (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                  <h3 className="text-2xl font-semibold text-foreground">{tier.name}</h3>
                </div>
                <p className="text-primary text-sm font-medium">{tier.tagline}</p>
                <p className="text-muted-foreground text-sm mt-1">{tier.description}</p>
              </div>
              
              <div className="text-5xl font-bold text-foreground mb-8 relative z-10">
                {tier.price === 0 ? (
                  "$0"
                ) : (
                  <AnimatedPrice value={tier.price} isInView={isInView} />
                )}
                <span className="text-base font-normal text-muted-foreground ml-1">
                  {tier.period}
                </span>
              </div>
              
              <ul className="space-y-4 mb-8 text-left relative z-10">
                {tier.features.map((feature, i) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 10, 
                        delay: 0.4 + i * 0.05 
                      }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tier.popular ? "bg-primary/10" : "bg-secondary"
                      }`}
                    >
                      <Check size={12} className={tier.popular ? "text-primary" : "text-muted-foreground"} />
                    </motion.div>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10"
              >
                <Button
                  className={`w-full h-12 rounded-full font-semibold transition-all duration-300 ${
                    tier.popular
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg button-glow"
                      : "bg-secondary hover:bg-muted text-foreground"
                  }`}
                >
                  {tier.cta}
                  {tier.popular && <ArrowRight size={16} className="ml-2" />}
                </Button>
              </motion.div>

              {/* Animated border for Pro on hover */}
              {tier.popular && (
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.3), transparent)",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Trust note with urgency */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-10 space-y-3"
        >
          {/* Limited time badge */}
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-primary"
            />
            <span className="text-sm font-medium text-primary">Early-bird pricing • Limited time</span>
          </motion.div>
          
          <p className="text-muted-foreground/70 text-sm">
            Cancel anytime. No questions asked.
          </p>
          <p className="text-muted-foreground/50 text-xs">
            Your data stays private. Always.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
