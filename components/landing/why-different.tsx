"use client"

import { useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { prefersReducedMotion, durations, gsapEase } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const cascadeTexts = [
  { text: "Productivity apps don't know you're exhausted.", emphasis: false },
  { text: "Health apps don't know you have a deadline.", emphasis: false },
  { text: "Saydo knows", emphasis: true, highlight: "both." },
]

export const WhyDifferent = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const textsRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Cascade text reveal
      if (textsRef.current) {
        const lines = textsRef.current.querySelectorAll(".cascade-line")

        lines.forEach((line, i) => {
          gsap.fromTo(
            line,
            { y: 30, opacity: 0, filter: "blur(10px)" },
            {
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: durations.slow,
              delay: i * 0.3,
              ease: gsapEase.smoothOut,
              immediateRender: false,
              scrollTrigger: {
                trigger: textsRef.current,
                start: "top 80%",
              },
            }
          )
        })
      }

      // Highlight animation for "both"
      if (highlightRef.current) {
        gsap.fromTo(
          highlightRef.current,
          { scale: 1.2, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: durations.normal,
            delay: 1,
            ease: gsapEase.backOut,
            immediateRender: false,
            scrollTrigger: {
              trigger: highlightRef.current,
              start: "top 85%",
            },
          }
        )

        // Continuous subtle glow
        gsap.to(highlightRef.current, {
          textShadow: "0 0 20px rgba(13, 148, 136, 0.5)",
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          scrollTrigger: {
            trigger: highlightRef.current,
            start: "top 85%",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="w-full py-20 sm:py-28 px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Subtle section divider */}
        <div className="saydo-section-divider mb-20" />

        {/* Main Content */}
        <div className="text-center">
          {/* The Reveal - Cascade Text */}
          <div ref={textsRef} className="space-y-6 sm:space-y-8 mb-12">
            {cascadeTexts.map((item, i) => (
              <motion.p
                key={i}
                className={`cascade-line saydo-headline text-2xl sm:text-3xl md:text-4xl ${
                  item.emphasis ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.text}
                {item.highlight && (
                  <>
                    {" "}
                    <span
                      ref={item.emphasis ? highlightRef : null}
                      className="saydo-headline-italic text-primary inline-block"
                    >
                      {item.highlight}
                    </span>
                  </>
                )}
              </motion.p>
            ))}
          </div>

          {/* The Insight - with gradient sweep */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            {/* Animated gradient background */}
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              whileInView={{ opacity: 1, x: "0%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-3xl"
            />
            
            <div className="relative py-10 sm:py-14 px-6 sm:px-12">
              <p className="saydo-body text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed">
                That&apos;s the difference between an app you{" "}
                <motion.span
                  initial={{ opacity: 0.5 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="text-muted-foreground"
                >
                  use
                </motion.span>
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                and a partner you{" "}
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 1 }}
                  className="text-primary font-medium inline-block"
                >
                  trust.
                </motion.span>
              </p>
            </div>

            {/* Decorative elements */}
            {isInView && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.3 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/20 blur-xl"
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.3 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/20 blur-xl"
                />
              </>
            )}
          </motion.div>

          {/* Additional Insight */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-muted-foreground mt-10 max-w-2xl mx-auto leading-relaxed"
          >
            You don&apos;t need another app that tells you what you did yesterday. 
            You need one that tells you what to do{" "}
            <motion.em
              initial={{ fontStyle: "normal" }}
              whileInView={{ fontStyle: "italic" }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="text-foreground font-medium"
            >
              now
            </motion.em>{" "}
            — based on everything it knows about you.
          </motion.p>

          {/* Final emphasis with animated underline */}
          {isInView && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="mt-12"
            >
              <div className="inline-flex items-center gap-3 text-primary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 40 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                  className="h-px bg-primary"
                />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  That&apos;s Saydo
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 40 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                  className="h-px bg-primary"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
