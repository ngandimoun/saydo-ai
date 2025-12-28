"use client"

import { useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Mic, FileText, Watch, ArrowRight, Brain, Sparkles } from "lucide-react"
import { prefersReducedMotion, durations, gsapEase } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const inputSources = [
  { icon: Mic, label: "Voice", color: "text-primary", bg: "bg-primary/10", delay: 0 },
  { icon: FileText, label: "Documents", color: "text-rose-500", bg: "bg-rose-500/10", delay: 0.1 },
  { icon: Watch, label: "Wearables", color: "text-amber-500", bg: "bg-amber-500/10", delay: 0.2 },
]

export const WholeYou = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const brainRef = useRef<HTMLDivElement>(null)
  const inputsRef = useRef<HTMLDivElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Animate neural connection paths
      if (svgRef.current) {
        const paths = svgRef.current.querySelectorAll(".neural-path")
        paths.forEach((path) => {
          const length = (path as SVGPathElement).getTotalLength()
          gsap.set(path, {
            strokeDasharray: length,
            strokeDashoffset: length,
          })

          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 60%",
            },
          })
        })
      }

      // Brain glow burst on scroll
      if (brainRef.current) {
        gsap.fromTo(
          brainRef.current,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "back.out(1.7)",
            immediateRender: false,
            scrollTrigger: {
              trigger: brainRef.current,
              start: "top 80%",
            },
          }
        )
      }

      // Output card slide up
      if (outputRef.current) {
        gsap.fromTo(
          outputRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: gsapEase.smoothOut,
            immediateRender: false,
            scrollTrigger: {
              trigger: outputRef.current,
              start: "top 85%",
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="w-full py-20 sm:py-28 px-4 bg-gradient-to-b from-background to-secondary/50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-5">
            Other apps see{" "}
            <span className="saydo-headline-italic text-muted-foreground">pieces.</span>
            <br />
            Saydo sees{" "}
            <span className="saydo-headline-italic text-primary">patterns.</span>
          </h2>
          <p className="saydo-body text-muted-foreground text-lg max-w-2xl mx-auto">
            It notices you&apos;re tired before you do. It knows that 3 PM slump isn&apos;t laziness — 
            it&apos;s your iron levels. It doesn&apos;t just organize your tasks; 
            it protects your energy to complete them.
          </p>
        </motion.div>

        {/* Visual Flow Diagram */}
        <div className="relative mb-16">
          <div className="saydo-card p-8 sm:p-12 border border-primary/20 bg-gradient-to-br from-card to-accent/30 relative overflow-hidden">
            
            {/* Neural Connection SVG */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--saydo-teal)" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="var(--saydo-teal)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--saydo-teal)" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {/* Neural connection paths - positioned dynamically */}
              <path
                className="neural-path"
                d="M 33% 15% Q 50% 30% 50% 40%"
                stroke="url(#neural-gradient)"
                strokeWidth="2"
                fill="none"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
              <path
                className="neural-path"
                d="M 50% 15% Q 50% 30% 50% 40%"
                stroke="url(#neural-gradient)"
                strokeWidth="2"
                fill="none"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
              <path
                className="neural-path"
                d="M 67% 15% Q 50% 30% 50% 40%"
                stroke="url(#neural-gradient)"
                strokeWidth="2"
                fill="none"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
              <path
                className="neural-path"
                d="M 50% 55% Q 50% 65% 50% 75%"
                stroke="url(#neural-gradient)"
                strokeWidth="2"
                fill="none"
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            </svg>

            {/* Input Sources */}
            <div ref={inputsRef} className="grid grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12 relative z-10">
              {inputSources.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.5, 
                    delay: item.delay,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-3 shadow-sm`}
                  >
                    <item.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${item.color}`} />
                  </motion.div>
                  <span className="text-sm sm:text-base font-medium text-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Arrow Down - Animated */}
            <div className="flex justify-center mb-8 sm:mb-12 relative z-10">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="w-px h-8 bg-gradient-to-b from-border to-primary/50" />
                <ArrowRight className="w-5 h-5 text-primary rotate-90" />
              </motion.div>
            </div>

            {/* Saydo Brain */}
            <div className="flex justify-center mb-8 sm:mb-12 relative z-10">
              <div ref={brainRef} className="relative">
                {/* Outer glow rings */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute inset-[-20px] rounded-full bg-primary/20"
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                  className="absolute inset-[-10px] rounded-full bg-primary/30"
                />
                
                {/* Main brain orb */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 30px rgba(13, 148, 136, 0.4), 0 4px 20px rgba(13, 148, 136, 0.3)",
                      "0 0 50px rgba(13, 148, 136, 0.6), 0 8px 30px rgba(13, 148, 136, 0.4)",
                      "0 0 30px rgba(13, 148, 136, 0.4), 0 4px 20px rgba(13, 148, 136, 0.3)",
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center"
                >
                  <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  
                  {/* Sparkle particles around brain */}
                  {isInView && (
                    <>
                      <motion.div
                        className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full"
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0 }}
                      />
                      <motion.div
                        className="absolute top-0 -left-3 w-2 h-2 bg-primary rounded-full"
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      />
                      <motion.div
                        className="absolute -bottom-1 right-0 w-2.5 h-2.5 bg-primary rounded-full"
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                      />
                    </>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Arrow Down - Animated */}
            <div className="flex justify-center mb-8 sm:mb-12 relative z-10">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-border" />
                <ArrowRight className="w-5 h-5 text-primary rotate-90" />
              </motion.div>
            </div>

            {/* Output: Context-Aware Actions */}
            <motion.div
              ref={outputRef}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto relative z-10 card-depth"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider">Saydo Says</p>
                  <p className="text-sm text-muted-foreground">Just now</p>
                </div>
              </div>
              <p className="text-foreground leading-relaxed">
                &ldquo;Chris, skip the heavy lift today. Your cortisol is high from yesterday&apos;s 
                launch stress. I&apos;ve moved your workout to tomorrow and blocked 30 minutes 
                for a walk instead.&rdquo;
              </p>
            </motion.div>
          </div>
        </div>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <p className="saydo-body text-xl sm:text-2xl text-foreground max-w-3xl mx-auto">
            Your work and your body are connected.
            <br />
            <motion.span
              initial={{ backgroundSize: "0% 3px" }}
              whileInView={{ backgroundSize: "100% 3px" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-primary font-medium bg-gradient-to-r from-primary to-primary bg-no-repeat bg-bottom"
              style={{ backgroundPosition: "0 100%" }}
            >
              Finally, an AI that gets that.
            </motion.span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
