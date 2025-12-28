"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"
import { Mic, FileText, Sparkles, Check, ArrowRight, Square, Heart, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { prefersReducedMotion } from "@/lib/animation-config"

type DemoMode = "voice" | "scan"
type DemoStep = "idle" | "active" | "processing" | "result"

interface DemoResult {
  mode: DemoMode
  badge: string
  title: string
  items: { text: string; highlight?: string }[]
  insight?: string
}

const demoResults: DemoResult[] = [
  {
    mode: "voice",
    badge: "Voice Captured",
    title: "Investor Meeting Summary",
    items: [
      { text: "Discussed Q3 roadmap pivot and new market opportunities" },
      { highlight: "Action:", text: "Send updated pitch deck by Friday EOD" },
      { highlight: "Follow-up:", text: "Schedule technical deep-dive next week" },
    ],
  },
  {
    mode: "scan",
    badge: "Labs Analyzed",
    title: "Your Energy Fix for Today",
    items: [
      { text: "Vitamin D levels are low — affecting your afternoon focus" },
      { highlight: "Today:", text: "Take 2000 IU with breakfast for best absorption" },
      { highlight: "This week:", text: "Added salmon & eggs to your grocery list" },
    ],
    insight: "Your 3 PM slump isn't laziness. It's biology. Now you know how to fix it.",
  },
  {
    mode: "voice",
    badge: "Thought Captured",
    title: "Quick Idea → Action Plan",
    items: [
      { text: "New feature idea for the mobile app captured" },
      { highlight: "Task:", text: "Draft wireframe by Wednesday" },
      { highlight: "Note:", text: "Your HRV shows good focus — perfect time for creative work" },
    ],
  },
]

// Magnetic button hook
function useMagneticButton(strength: number = 0.3) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isReduced = prefersReducedMotion()

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const button = buttonRef.current
      if (!button || isReduced) return

      const rect = button.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength

      gsap.to(button, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: "power2.out",
      })
    },
    [strength, isReduced]
  )

  const handleMouseLeave = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    gsap.to(button, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    })
  }, [])

  useEffect(() => {
    const button = buttonRef.current
    if (!button || isReduced) return

    const parent = button.parentElement
    if (!parent) return

    parent.addEventListener("mousemove", handleMouseMove)
    parent.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove)
      parent.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave, isReduced])

  return buttonRef
}

export const HeroDemo = () => {
  const [step, setStep] = useState<DemoStep>("idle")
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [user, setUser] = useState(false)
  const [activeMode, setActiveMode] = useState<DemoMode>("voice")
  
  const voiceButtonRef = useMagneticButton(0.25)
  const scanButtonRef = useMagneticButton(0.25)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(!!session?.user)
    })
  }, [])

  // Entrance animation
  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.5,
          ease: "power3.out",
        }
      )
    })

    return () => ctx.revert()
  }, [])

  const startDemo = useCallback((mode: DemoMode) => {
    if (step === "idle") {
      setActiveMode(mode)
      setStep("active")
      // Find a result that matches the mode
      const matchingIndex = demoResults.findIndex(r => r.mode === mode)
      setCurrentResultIndex(matchingIndex >= 0 ? matchingIndex : 0)
      setTimeout(() => setStep("processing"), 2500)
    }
  }, [step])

  useEffect(() => {
    if (step === "processing") {
      const timer = setTimeout(() => setStep("result"), 1800)
      return () => clearTimeout(timer)
    }
  }, [step])

  const handleReset = () => {
    setStep("idle")
    // Cycle to next result for variety
    setCurrentResultIndex((prev) => (prev + 1) % demoResults.length)
  }

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  const currentResult = demoResults[currentResultIndex]

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-3xl mx-auto mt-4 z-10"
    >
      {/* The Dynamic Card */}
      <div className="saydo-card p-8 sm:p-10 min-h-[360px] flex flex-col items-center justify-center relative overflow-hidden card-spotlight">
        <AnimatePresence mode="wait">
          {/* STATE 1: IDLE - Unified Input Area */}
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-center w-full"
            >
              {/* Dual Action Buttons */}
              <div className="flex items-center justify-center gap-6 sm:gap-10">
                {/* Voice Button */}
                <div className="flex flex-col items-center">
                  <div className="relative magnetic-button">
                    <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 animate-saydo-breathe" />
                    <button
                      ref={voiceButtonRef}
                      onClick={() => startDemo("voice")}
                      className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-shadow duration-300 touch-manipulation button-glow animate-glow-pulse"
                      aria-label="Start voice demo"
                    >
                      <Mic className="text-white w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/15 pointer-events-none" />
                    </button>
                  </div>
                  <span className="mt-3 text-sm text-muted-foreground font-medium">Speak</span>
                </div>

                {/* Divider */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-px h-10 bg-border" />
                  <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">or</span>
                  <div className="w-px h-10 bg-border" />
                </div>

                {/* Scan Button */}
                <div className="flex flex-col items-center">
                  <div className="relative magnetic-button">
                    <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rose-500/10 animate-saydo-breathe animation-delay-500" />
                    <button
                      ref={scanButtonRef}
                      onClick={() => startDemo("scan")}
                      className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 active:scale-95 transition-shadow duration-300 touch-manipulation button-glow"
                      style={{ 
                        "--glow-color": "rgba(244, 63, 94, 0.4)" 
                      } as React.CSSProperties}
                      aria-label="Start scan demo"
                    >
                      <FileText className="text-white w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/15 pointer-events-none" />
                    </button>
                  </div>
                  <span className="mt-3 text-sm text-muted-foreground font-medium">Scan</span>
                </div>
              </div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-8 text-muted-foreground font-medium text-lg"
              >
                Tap to try Saydo
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-2 text-muted-foreground/70 text-sm"
              >
                Voice notes or lab results — Saydo handles it all
              </motion.p>
            </motion.div>
          )}

          {/* STATE 2: ACTIVE - Recording or Scanning */}
          {step === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <div className={`rounded-2xl p-6 sm:p-8 text-center ${
                activeMode === "voice" 
                  ? "bg-gradient-to-br from-primary to-primary/80" 
                  : "bg-gradient-to-br from-rose-500 to-rose-600"
              }`}>
                {activeMode === "voice" ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl font-semibold text-white mb-3 tabular-nums"
                    >
                      00:03
                    </motion.div>
                    <p className="text-white/90 font-medium mb-2">Listening...</p>
                    <p className="text-white/70 text-sm mb-5">
                      Talk about anything — meetings, ideas, to-dos
                    </p>
                    
                    {/* Enhanced Waveform */}
                    <div className="flex items-end justify-center gap-1 h-12 mb-5">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: [
                              Math.random() * 12 + 8,
                              Math.random() * 28 + 20,
                              Math.random() * 12 + 8,
                            ],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.4 + Math.random() * 0.3,
                            delay: i * 0.03,
                            ease: "easeInOut",
                          }}
                          className="w-1 bg-white/60 rounded-full min-h-[8px]"
                        />
                      ))}
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/10 rounded-xl p-4 mb-5 text-left backdrop-blur-sm"
                    >
                      <p className="text-white/90 text-sm italic">
                        &ldquo;Summarize my meeting with the investors...&rdquo;
                      </p>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Heart className="w-8 h-8 text-white" />
                      </motion.div>
                    </div>
                    <p className="text-white/90 font-medium mb-2">Scanning your labs...</p>
                    <p className="text-white/70 text-sm mb-5">
                      Analyzing biomarkers & health patterns
                    </p>
                    
                    {/* Enhanced scanning animation */}
                    <div className="relative h-16 mb-5 flex items-center justify-center">
                      <motion.div
                        className="absolute w-full h-1 bg-white/30 rounded-full overflow-hidden"
                      >
                        <motion.div
                          className="h-full bg-white"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/10 rounded-xl p-4 mb-5 text-left backdrop-blur-sm"
                    >
                      <p className="text-white/90 text-sm">
                        Detecting: Vitamin D, Iron, Cortisol, HbA1c...
                      </p>
                    </motion.div>
                  </>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all border-2 border-white/40 mx-auto"
                  aria-label="Stop"
                >
                  <Square className="w-4 h-4 text-white fill-white" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STATE 3: PROCESSING */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className={`w-16 h-16 border-4 rounded-full ${
                    activeMode === "voice"
                      ? "border-primary/20 border-t-primary"
                      : "border-rose-500/20 border-t-rose-500"
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Sparkles className={`w-6 h-6 ${activeMode === "voice" ? "text-primary" : "text-rose-500"}`} />
                  </motion.div>
                </div>
              </div>
              <p className="text-foreground text-lg font-medium mt-6">
                Saydo is thinking...
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Connecting the dots across your life
              </p>
            </motion.div>
          )}

          {/* STATE 4: RESULT */}
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-left"
            >
              {/* Success badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`flex items-center gap-2 mb-5 ${
                  currentResult.mode === "voice" ? "text-primary" : "text-rose-500"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  currentResult.mode === "voice" ? "bg-primary/10" : "bg-rose-500/10"
                }`}>
                  {currentResult.mode === "voice" ? <Sparkles size={14} /> : <Zap size={14} />}
                </div>
                <span className="text-xs uppercase font-bold tracking-wider">
                  {currentResult.badge}
                </span>
              </motion.div>
              
              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="saydo-headline text-xl sm:text-2xl text-foreground mb-4"
              >
                {currentResult.title}
              </motion.h3>
              
              {/* Items */}
              <ul className="space-y-3 text-muted-foreground mb-4">
                {currentResult.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex gap-3 items-start"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      currentResult.mode === "voice" ? "bg-primary/10" : "bg-rose-500/10"
                    }`}>
                      <Check size={12} className={currentResult.mode === "voice" ? "text-primary" : "text-rose-500"} />
                    </div>
                    <span>
                      {item.highlight && (
                        <strong className="text-foreground">{item.highlight} </strong>
                      )}
                      {item.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* Insight callout for health results */}
              {currentResult.insight && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 mb-6"
                >
                  <p className="text-rose-700 dark:text-rose-300 text-sm italic">
                    {currentResult.insight}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 mt-6"
              >
                {!user ? (
                  <Button
                    onClick={handleLogin}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full h-12 shadow-md hover:shadow-lg transition-all button-glow"
                  >
                    Get Started Free
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-primary text-primary-foreground font-semibold rounded-full h-12"
                    disabled
                  >
                    Saved to your account
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary font-medium rounded-full h-12"
                >
                  Try Again
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
