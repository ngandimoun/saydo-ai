"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Sparkles, Check, ArrowRight, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"

export const HeroDemo = () => {
  const [step, setStep] = useState<"idle" | "recording" | "processing" | "result">("idle")
  const [user, setUser] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(!!session?.user)
    })
  }, [])

  const handleRecord = () => {
    if (step === "idle") {
      setStep("recording")
      // Simulate recording duration
      setTimeout(() => setStep("processing"), 3000)
    }
  }

  // Simulate processing and result
  useEffect(() => {
    if (step === "processing") {
      const timer = setTimeout(() => setStep("result"), 2000)
      return () => clearTimeout(timer)
    }
  }, [step])

  const handleLogin = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      console.error("Login error:", error)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-3xl mx-auto mt-4"
    >
      {/* The Dynamic Card */}
      <div className="saydo-card p-8 sm:p-10 min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* STATE 1: IDLE - The Signature Record Button */}
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              {/* The "Alive" Record Button */}
              <div className="relative flex items-center justify-center">
                {/* Outer breathing glow ring */}
                <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-saydo-breathe" />
                
                {/* Ping effect */}
                <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 animate-saydo-ping" />
                
                <button
                  onClick={handleRecord}
                  className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 touch-manipulation"
                  aria-label="Start recording demo"
                >
                  <Mic className="text-white w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110" />
                  
                  {/* Subtle inner highlight */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/15 pointer-events-none" />
                </button>
              </div>
              
              <p className="mt-8 text-muted-foreground font-medium text-lg">
                Tap to try
              </p>
              <p className="mt-2 text-muted-foreground/70 text-sm">
                See how it works
              </p>
            </motion.div>
          )}

          {/* STATE 2: RECORDING - Warm Teal Recording State */}
          {step === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <div className="saydo-recording-card text-center">
                {/* Timer */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-semibold mb-4 tabular-nums"
                >
                  00:03
                </motion.div>
                
                {/* Prompt text */}
                <p className="text-white/90 font-medium mb-2">
                  Not sure what to say?
                </p>
                <p className="text-white/70 text-sm mb-6">
                  Try talking about your goals. Don&apos;t be afraid to ramble!
                </p>
                
                {/* Waveform visualization */}
                <div className="flex items-end justify-center gap-1 h-12 mb-6">
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
                
                {/* Simulated transcript */}
                <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
                  <p className="text-white/90 text-sm italic">
                    &ldquo;Summarize my meeting with the investors...&rdquo;
                  </p>
                </div>
                
                {/* Stop button */}
                <div className="flex justify-center">
                  <button 
                    className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all border-4 border-white/40"
                    aria-label="Stop recording"
                  >
                    <Square className="w-5 h-5 text-white fill-white" />
                  </button>
                </div>
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
                  className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-foreground text-lg font-medium mt-6">
                Processing your voice...
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Extracting actions and insights
              </p>
            </motion.div>
          )}

          {/* STATE 4: RESULT - The Payoff */}
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full text-left"
            >
              {/* Success badge */}
              <div className="flex items-center gap-2 mb-5 text-primary">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <span className="text-xs uppercase font-bold tracking-wider">
                  Processed by Saydo
                </span>
              </div>
              
              {/* Summary */}
              <h3 className="saydo-headline text-xl sm:text-2xl text-foreground mb-4">
                Investor Meeting Summary
              </h3>
              
              <ul className="space-y-3 text-muted-foreground mb-8">
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span>Discussed Q3 roadmap pivot and new market opportunities</span>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span><strong className="text-foreground">Action:</strong> Send updated pitch deck by Friday EOD</span>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span><strong className="text-foreground">Follow-up:</strong> Schedule technical deep-dive next week</span>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                {!user ? (
                  <Button
                    onClick={handleLogin}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full h-12 shadow-md hover:shadow-lg transition-all"
                  >
                    Connect Google to Save
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
                  onClick={() => setStep("idle")}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary font-medium rounded-full h-12"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  )
}
