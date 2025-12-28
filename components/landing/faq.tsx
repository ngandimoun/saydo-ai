"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Sparkles } from "lucide-react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"
import { prefersReducedMotion, durations } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const faqs = [
  {
    question: "What is Saydo?",
    answer: "Saydo is your personal AI partner that knows your whole life — work and wellness together. Speak your thoughts, scan your lab results, connect your wearables. Saydo turns it all into actions that actually fit YOU: tasks scheduled around your energy, groceries based on your biology, and nudges that know when to push and when to rest.",
  },
  {
    question: "What can I feed to Saydo?",
    answer: "Everything. Voice notes, meeting recordings, lab result PDFs, clinic reports, photos of documents. Connect your wearables (Oura, Apple Watch, Garmin) and Saydo syncs your sleep, HRV, and activity data. The more you give it, the smarter it gets about YOU.",
  },
  {
    question: "How does Saydo know when I'm tired?",
    answer: "Saydo connects the dots. It sees your sleep data from your wearable, correlates it with your lab results (iron, vitamin D, cortisol), and notices patterns in your voice notes. When you say 'I'm stressed about the launch,' Saydo doesn't just log it — it checks if your biology backs that up and adjusts your day accordingly.",
  },
  {
    question: "Is this a productivity app or a health app?",
    answer: "Neither. It's both. That's the whole point. Your work and your body aren't separate — why should your apps be? Saydo is the first AI that sees the whole you: your tasks, your energy, your biology, your goals. One partner for your whole life.",
  },
  {
    question: "Is my health data private?",
    answer: "Absolutely. Your data is encrypted, stored securely, and never shared with anyone. We don't sell your information. We don't use it for ads. Your voice notes, lab results, and health data belong to you — period. You can export or delete everything anytime.",
  },
  {
    question: "What wearables and devices work with Saydo?",
    answer: "Saydo connects with Oura Ring, Apple Watch, Apple Health, Google Fit, Garmin, Whoop, and Fitbit. We're adding more all the time. Your wearable data syncs automatically — no manual entry needed.",
  },
  {
    question: "Do I need to learn special commands?",
    answer: "No. Just speak naturally. Ramble, think out loud, or give quick updates. Saydo figures out what you need and creates it. Say 'I had a rough night and I'm worried about the investor meeting tomorrow' — Saydo will reschedule your deep work AND suggest the right foods to boost your energy.",
  },
  {
    question: "How accurate is the lab analysis?",
    answer: "Saydo uses advanced AI to parse standard lab reports from clinics and labs. It identifies biomarkers, flags abnormals, and translates them into actionable advice. While it's not a replacement for your doctor, it helps you understand your results and take daily action to improve them.",
  },
  {
    question: "Can Saydo connect to my calendar and email?",
    answer: "Yes. With Pro, connect Google Calendar, Outlook, and your email. Saydo can schedule tasks, send meeting summaries, and block time for recovery — all based on what it knows about your capacity that day.",
  },
  {
    question: "What languages does Saydo support?",
    answer: "Saydo understands over 100 languages. Speak in any language, and Saydo processes it correctly. You can even mix languages in the same recording — perfect for multilingual households and global teams.",
  },
  {
    question: "Does Saydo work offline?",
    answer: "Saydo needs an internet connection to process your voice and run AI analysis. But you can record offline — Saydo will process everything when you're back online. Your data syncs seamlessly across devices.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer: "Free gives you 5 minutes of voice per day and basic features — enough to see how Saydo works. Pro unlocks everything: unlimited voice and scans, full health intelligence, wearable connections, and multi-device sync. One price, no feature gates.",
  },
]

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const faqsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      if (faqsRef.current) {
        const items = faqsRef.current.querySelectorAll(".faq-item")

        gsap.fromTo(
          items,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: durations.normal,
            stagger: 0.05,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: faqsRef.current,
              start: "top 85%",
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section ref={sectionRef} className="w-full py-20 sm:py-28 px-4 bg-gradient-to-b from-secondary to-background overflow-hidden">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            Common Questions
          </h2>
          <p className="saydo-body text-muted-foreground text-lg">
            Everything you need to know about Saydo
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div ref={faqsRef} className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={cn(
                "faq-item saydo-card border overflow-hidden transition-all duration-300",
                openIndex === index 
                  ? "border-primary/30 bg-card shadow-md" 
                  : "border-border bg-card/80 hover:bg-card hover:shadow-sm"
              )}
            >
              <motion.button
                onClick={() => toggleQuestion(index)}
                className="w-full px-5 sm:px-6 py-5 text-left flex items-center justify-between gap-4 transition-colors"
                whileHover={{ backgroundColor: "rgba(13, 148, 136, 0.02)" }}
              >
                <h3 className={cn(
                  "text-base sm:text-lg font-medium pr-4 transition-colors",
                  openIndex === index ? "text-primary" : "text-foreground"
                )}>
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    openIndex === index 
                      ? "bg-primary/10" 
                      : "bg-secondary"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-colors",
                      openIndex === index ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </motion.div>
              </motion.button>
              
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: "auto", 
                      opacity: 1,
                      transition: {
                        height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.2, delay: 0.1 }
                      }
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.1 }
                      }
                    }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="px-5 sm:px-6 pb-5 pt-0"
                    >
                      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground text-sm">
            Still have questions?{" "}
            <motion.a
              href="mailto:contact@saydo.app"
              whileHover={{ scale: 1.05 }}
              className="text-primary hover:underline font-medium"
            >
              Reach out to us
            </motion.a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
