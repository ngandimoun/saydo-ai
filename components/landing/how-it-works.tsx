"use client"

import { useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowRight, Upload, Zap, Target, CheckCircle2, Brain } from "lucide-react"
import { OptionalImage } from "@/components/ui/optional-image"
import { getLandingImageUrl } from "@/lib/landing-images"
import { prefersReducedMotion, durations, gsapEase } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const steps = [
  {
    icon: Upload,
    title: "Feed Saydo",
    description: "Speak your thoughts. Snap a lab result. Connect your watch. Saydo accepts it all.",
    color: "text-primary",
    bg: "bg-primary/10",
    ringColor: "ring-primary/20",
  },
  {
    icon: Brain,
    title: "Saydo Connects the Dots",
    description: "Not just transcription. Not just tracking. Saydo sees how your work, sleep, and biology interact.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    ringColor: "ring-amber-500/20",
  },
  {
    icon: Target,
    title: "Live Smarter",
    description: "Receive actions that actually fit YOUR life. A grocery list based on YOUR labs. A schedule that respects YOUR energy.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    ringColor: "ring-rose-500/20",
  },
]

export const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Timeline progress animation
      if (timelineRef.current) {
        gsap.fromTo(
          timelineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            duration: 1.2,
            ease: gsapEase.smoothInOut,
            immediateRender: false,
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 80%",
            },
          }
        )
      }

      // Step icons sequential reveal
      if (stepsRef.current) {
        const stepIcons = stepsRef.current.querySelectorAll(".step-icon")
        const stepContent = stepsRef.current.querySelectorAll(".step-content")

        gsap.fromTo(
          stepIcons,
          { scale: 0, rotation: -180, opacity: 0 },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.2,
            ease: "back.out(1.7)",
            immediateRender: false,
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 80%",
            },
          }
        )

        gsap.fromTo(
          stepContent,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.2,
            delay: 0.3,
            ease: gsapEase.smoothOut,
            immediateRender: false,
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 80%",
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="w-full py-20 sm:py-28 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Subtle section divider */}
        <div className="saydo-section-divider mb-20" />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-5">
            How It Works
          </h2>
          <p className="saydo-body text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            One simple flow for your whole life
          </p>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-primary text-sm font-semibold uppercase tracking-wider"
          >
            Feed it anything. Get back clarity.
          </motion.p>
        </motion.div>

        {/* AI Agent Workflow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="saydo-card p-5 sm:p-8 border border-primary/20 bg-gradient-to-br from-card to-accent/30 card-spotlight overflow-hidden">
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                animate={isInView ? { rotate: [0, 360] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <Zap className="text-primary w-5 h-5" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">Your Personal Intelligence</h3>
            </div>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-secondary">
              <OptionalImage
                src={getLandingImageUrl("ai-agent-workflow")}
                alt="AI Agent Workflow - Voice and Health to Action"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
              />
              {/* Overlay shimmer effect */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={isInView ? { x: "200%" } : {}}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </div>
            <p className="text-muted-foreground text-sm mt-4 text-center">
              Saydo understands context across your whole life — work, health, energy — and gives you actions that actually work for you
            </p>
          </div>
        </motion.div>

        {/* Before/After Comparison */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-8 mb-16">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="saydo-card p-5 sm:p-6 border border-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2.5 h-2.5 rounded-full bg-red-400"
              />
              <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">
                Without Saydo
              </span>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="italic leading-relaxed">
                &ldquo;I have 10 apps for productivity and 5 for health. None of them talk to each other. 
                My calendar says 'work harder' when my body is screaming 'rest.' I&apos;m drowning in data 
                but still feel lost.&rdquo;
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-muted-foreground/70 text-xs">
                  Data rich. Insight poor. Sound familiar?
                </p>
              </div>
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="saydo-card p-5 sm:p-6 border border-primary/30 bg-gradient-to-br from-card to-accent/20 relative card-depth"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.3 }}
              className="absolute -top-3 left-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-1 text-xs font-bold rounded-full flex items-center gap-2 shadow-sm"
            >
              <Zap size={12} />
              <span className="hidden sm:inline">WITH SAYDO</span>
              <span className="sm:hidden">SAYDO</span>
            </motion.div>
            <div className="space-y-3 text-sm pt-2">
              <div>
                <h4 className="text-foreground font-semibold mb-2">One Partner. Your Whole Life.</h4>
                <p className="text-muted-foreground">
                  Saydo connects your voice notes, lab results, and wearable data into one intelligent picture.
                </p>
              </div>
              <div className="pt-3 border-t border-border">
                <h4 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  What You Actually Get
                </h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  {[
                    "Tasks scheduled around YOUR energy levels",
                    "Grocery lists built from YOUR lab results",
                    "Nudges that know when to push and when to rest",
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Process Steps with Timeline */}
        <div ref={stepsRef} className="relative">
          {/* Timeline connector - desktop only */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%-2rem)] right-[calc(16.67%-2rem)] h-1 bg-border rounded-full">
            <div
              ref={timelineRef}
              className="h-full bg-gradient-to-r from-primary via-amber-500 to-rose-500 rounded-full"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center relative">
                {/* Step icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={`step-icon w-16 h-16 ${step.bg} border border-border rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10 bg-card ring-4 ${step.ringColor}`}
                >
                  <step.icon className={`${step.color} w-7 h-7`} />
                </motion.div>

                {/* Content */}
                <div className="step-content">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow between steps - desktop only */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.2 }}
                    className="hidden md:block absolute top-8 right-[-1.5rem] z-20"
                  >
                    <ArrowRight className="text-muted-foreground/50 w-5 h-5" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
