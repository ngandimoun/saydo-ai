"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/landing/navbar"
import { HeroDemo } from "@/components/landing/hero-demo"
import { HowItWorks } from "@/components/landing/how-it-works"
import { UseCases } from "@/components/landing/use-cases"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-teal-500/20">
      {/* Sticky Nav */}
      <Navbar />

      <main className="flex flex-col items-center">
        {/* Hero: The Product IS the Hero */}
        <section className="w-full pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="saydo-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 sm:mb-8 px-2">
              Turn messy thoughts <br className="hidden sm:block" />
              into{" "}
              <span className="saydo-headline-italic text-primary">
                clear action.
              </span>
            </h1>
            <p className="saydo-body text-muted-foreground text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mb-10 sm:mb-12 px-4">
              Just speak. Saydo transforms your voice into polished notes, 
              actionable tasks, and ready-to-send emails.
            </p>
          </motion.div>

          {/* THE MAGIC BUTTON (Interactive Demo) */}
          <HeroDemo />
        </section>

        {/* The "Before vs After" (How it works) */}
        <HowItWorks />

        {/* For Who? (Use Cases) */}
        <UseCases />

        {/* Pricing (Simple tiers) */}
        <Pricing />

        {/* Smart FAQs */}
        <FAQ />
      </main>

      <Footer />
    </div>
  )
}
