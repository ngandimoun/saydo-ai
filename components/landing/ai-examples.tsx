"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Briefcase, Moon, Coffee, Dumbbell, ShoppingCart, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"

const aiMessages = [
  {
    id: 1,
    icon: Sun,
    time: "7:30 AM",
    scenario: "Morning Brief",
    message: "Good morning. Your sleep was short (5.2 hours). I've moved your deep work session to 2 PM when you'll be sharper. This morning, light tasks only.",
    gradient: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    id: 2,
    icon: Briefcase,
    time: "11:45 AM",
    scenario: "After Meeting",
    message: "Meeting with investors captured. 3 actions added to your list. Also: grab lunch soon — your glucose is dropping and you'll crash by 1 PM if you skip it.",
    gradient: "from-primary to-primary/80",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    id: 3,
    icon: Coffee,
    time: "3:15 PM",
    scenario: "Afternoon Nudge",
    message: "Heads up: you usually hit a slump now. Your iron was low in last month's labs. Skip the third coffee — have the spinach smoothie I added to your list instead.",
    gradient: "from-rose-500 to-pink-500",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    id: 4,
    icon: Dumbbell,
    time: "5:30 PM",
    scenario: "Gym Check",
    message: "Wait. Your HRV is low today and cortisol was high yesterday. That CrossFit session will hurt more than help. Swapped it for 20 mins yoga + a walk.",
    gradient: "from-violet-500 to-purple-500",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    id: 5,
    icon: ShoppingCart,
    time: "6:45 PM",
    scenario: "Grocery Store",
    message: "You're at the market! Grab salmon and walnuts. Your Omega-3 levels need a boost — it'll help with that knee inflammation you logged last week.",
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    id: 6,
    icon: Moon,
    time: "9:30 PM",
    scenario: "Evening Wind-Down",
    message: "You crushed it today. But your recovery score is low. Early night? I've cleared tomorrow morning and set your alarm for 7:30 instead of 6:00.",
    gradient: "from-indigo-500 to-blue-500",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
  },
]

export const AIExamples = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % aiMessages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goTo = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goNext = () => goTo((currentIndex + 1) % aiMessages.length)
  const goPrev = () => goTo((currentIndex - 1 + aiMessages.length) % aiMessages.length)

  const current = aiMessages[currentIndex]

  return (
    <section className="w-full py-20 sm:py-28 px-4 bg-gradient-to-b from-secondary/50 to-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-5">
            A Day with{" "}
            <span className="saydo-headline-italic text-primary">Saydo</span>
          </h2>
          <p className="saydo-body text-muted-foreground text-lg max-w-2xl mx-auto">
            See how Saydo naturally blends work and wellness throughout your day
          </p>
        </motion.div>

        {/* Phone Mockup with Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          {/* Phone Frame */}
          <div className="relative max-w-sm mx-auto">
            <div className="bg-card border-4 border-foreground/10 rounded-[2.5rem] p-3 shadow-2xl">
              {/* Screen */}
              <div className="bg-secondary rounded-[2rem] overflow-hidden min-h-[400px] sm:min-h-[450px] relative">
                {/* Status Bar */}
                <div className="bg-foreground/5 px-6 py-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{current.time}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles size={10} className="text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">Saydo</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-5 sm:p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Scenario Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 ${current.iconBg} rounded-lg flex items-center justify-center`}>
                          <current.icon size={16} className={current.iconColor} />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {current.scenario}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div className={`bg-gradient-to-br ${current.gradient} rounded-2xl rounded-tl-sm p-5 text-white shadow-lg`}>
                        <p className="text-sm sm:text-base leading-relaxed">
                          {current.message}
                        </p>
                      </div>

                      {/* Typing Indicator */}
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                            className="w-2 h-2 bg-muted-foreground/40 rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            className="w-2 h-2 bg-muted-foreground/40 rounded-full"
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                            className="w-2 h-2 bg-muted-foreground/40 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">Saydo is always learning</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 sm:-translate-x-16 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              aria-label="Previous example"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 sm:translate-x-16 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              aria-label="Next example"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {aiMessages.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to example ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Bottom Insight */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-muted-foreground mt-10 max-w-xl mx-auto"
        >
          This is what it feels like to have a partner that actually knows you — 
          not just your calendar, but your capacity.
        </motion.p>
      </div>
    </section>
  )
}

