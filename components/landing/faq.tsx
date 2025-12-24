"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

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

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full py-20 sm:py-28 px-4 bg-gradient-to-b from-secondary to-background">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            Common Questions
          </h2>
          <p className="saydo-body text-muted-foreground text-lg">
            Everything you need to know about Saydo
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              className={cn(
                "saydo-card border overflow-hidden transition-all duration-300",
                openIndex === index 
                  ? "border-primary/30 bg-card shadow-md" 
                  : "border-border bg-card/80 hover:bg-card hover:shadow-sm"
              )}
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-5 sm:px-6 py-5 text-left flex items-center justify-between gap-4 transition-colors"
              >
                <h3 className={cn(
                  "text-base sm:text-lg font-medium pr-4 transition-colors",
                  openIndex === index ? "text-primary" : "text-foreground"
                )}>
                  {faq.question}
                </h3>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  openIndex === index 
                    ? "bg-primary/10 rotate-180" 
                    : "bg-secondary"
                )}>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-colors",
                      openIndex === index ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-5 pt-0">
                      <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
