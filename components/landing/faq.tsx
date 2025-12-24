"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "What is Saydo?",
    answer: "Saydo is your voice-first AI co-pilot. You speak, and Saydo turns your words into real work: notes, tasks, reminders, emails, and summaries. No typing needed. Just talk naturally, and Saydo handles the rest.",
  },
  {
    question: "How does it work?",
    answer: "You tap record and speak. Saydo listens, understands what you mean, and creates the right thing automatically. If you mention a task, it creates a reminder. If you share an idea, it saves it as a note. You don't need to tell Saydo what to do—it just knows.",
  },
  {
    question: "Who is Saydo for?",
    answer: "Saydo is perfect for busy professionals whose hands are already full. Nurses documenting patient care, pharmacists managing prescriptions, caregivers tracking daily activities, mechanics writing service reports, or founders capturing quick ideas. If you think faster than you type, Saydo is for you.",
  },
  {
    question: "Do I need to learn commands?",
    answer: "No. Just speak naturally. Saydo understands regular speech. You can ramble, think out loud, or give quick updates. Saydo figures out what you need and creates it automatically.",
  },
  {
    question: "What languages does Saydo support?",
    answer: "Saydo understands over 100 languages. You can speak in any language, and Saydo will process it correctly. You can even mix languages in the same recording.",
  },
  {
    question: "Can I whisper or speak quietly?",
    answer: "Yes. Saydo works great even when you whisper or speak quietly. It's designed to understand your voice in any situation, whether you're in a busy hospital, quiet office, or noisy workshop.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes. Your voice notes and data are encrypted and stored securely. We never share your information with anyone. Your notes belong to you, and you can delete them anytime.",
  },
  {
    question: "Can Saydo connect to my email and calendar?",
    answer: "Yes. With Pro, you can connect your email and calendar. Saydo can create emails from your voice notes, schedule reminders, and help you stay organized across all your tools.",
  },
  {
    question: "Can I export my notes?",
    answer: "Yes. You can export your notes, summaries, and documents in multiple formats. Share them, save them, or use them anywhere you need.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer: "Free gives you 5 minutes of voice recording per day with basic summaries. Pro gives you unlimited voice recording, AI agent workflows, email integration, and advanced features. Try Free first, then upgrade when you're ready.",
  },
  {
    question: "Does Saydo work offline?",
    answer: "Saydo needs an internet connection to process your voice and create actions. But you can record offline, and Saydo will process everything when you're back online.",
  },
  {
    question: "How accurate is Saydo?",
    answer: "Saydo is highly accurate. It understands context, recognizes names, and captures your meaning precisely—even when you speak quickly or use specialized terminology.",
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
