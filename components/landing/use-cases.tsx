"use client"

import { useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Rocket, Stethoscope, Users, Dna, Baby, Brain } from "lucide-react"
import { OptionalImage } from "@/components/ui/optional-image"
import { getLandingImageUrl } from "@/lib/landing-images"
import { prefersReducedMotion, durations } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const useCases = [
  {
    icon: Rocket,
    title: "The Founder",
    tagline: "Capture ideas. Protect energy.",
    description: "Investor meeting notes become action items instantly. But Saydo also knows when you're redlining — and blocks time for recovery before burnout hits.",
    gradient: "from-amber-50 to-yellow-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200/60",
    hoverBorder: "hover:border-amber-300",
    imageKey: "use-case-founder" as const,
  },
  {
    icon: Stethoscope,
    title: "The Healthcare Worker",
    tagline: "Document care. Track recovery.",
    description: "Patient notes captured hands-free between rooms. Saydo also tracks YOUR recovery between shifts — because you can't pour from an empty cup.",
    gradient: "from-rose-50 to-orange-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    borderColor: "border-rose-200/60",
    hoverBorder: "hover:border-rose-300",
    imageKey: "use-case-healthcare" as const,
  },
  {
    icon: Users,
    title: "The Caregiver",
    tagline: "Manage others. Don't forget yourself.",
    description: "Care logs, medication reminders, doctor's notes — all organized. Saydo also watches YOUR stress markers and reminds you to refill your own tank.",
    gradient: "from-sky-50 to-cyan-50",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    borderColor: "border-sky-200/60",
    hoverBorder: "hover:border-sky-300",
    imageKey: "use-case-caregiver" as const,
  },
  {
    icon: Dna,
    title: "The Biohacker",
    tagline: "Track biological age. Win daily.",
    description: "Labs, wearables, supplements — all in one place. Saydo correlates your sleep, HRV, and bloodwork to show what's actually moving the needle.",
    gradient: "from-violet-50 to-purple-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200/60",
    hoverBorder: "hover:border-violet-300",
    imageKey: "use-case-writer" as const,
  },
  {
    icon: Baby,
    title: "The Busy Parent",
    tagline: "Family chaos. Personal clarity.",
    description: "School pickups, meal planning, doctor visits — captured by voice. Saydo also builds grocery lists around everyone's needs, including yours.",
    gradient: "from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200/60",
    hoverBorder: "hover:border-emerald-300",
    imageKey: "use-case-technician" as const,
  },
  {
    icon: Brain,
    title: "Anyone Overwhelmed",
    tagline: "When life moves faster than you can type.",
    description: "Your brain dumps become organized plans. Your fatigue becomes understood. Saydo turns chaos into clarity — because you deserve both productivity AND peace.",
    gradient: "from-slate-50 to-gray-50",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    borderColor: "border-slate-200/60",
    hoverBorder: "hover:border-slate-300",
    imageKey: undefined,
  },
]

export const UseCases = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll(".use-case-card")

        gsap.fromTo(
          cards,
          {
            y: 60,
            opacity: 0,
            scale: 0.95,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: durations.slow,
            stagger: durations.staggerNormal,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="w-full py-20 sm:py-28 px-4 bg-gradient-to-b from-background to-secondary overflow-hidden">
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
            Built for People Who{" "}
            <span className="saydo-headline-italic text-primary">Live Full Lives</span>
          </h2>
          <p className="saydo-body text-muted-foreground text-lg max-w-2xl mx-auto">
            Saydo is for anyone who refuses to choose between ambition and wellbeing
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              whileHover={{ 
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 15 }
              }}
              className={`use-case-card saydo-card bg-gradient-to-br ${useCase.gradient} dark:bg-card/60 dark:border-primary/30 border ${useCase.borderColor} ${useCase.hoverBorder} p-5 sm:p-6 overflow-hidden group cursor-pointer transition-colors`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Spotlight effect on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(13, 148, 136, 0.06), transparent 40%)",
                }}
              />

              {useCase.imageKey && (
                <div className="relative w-full aspect-video mb-4 rounded-xl overflow-hidden bg-white/50 dark:bg-card/50">
                  <OptionalImage
                    src={getLandingImageUrl(useCase.imageKey)}
                    alt={`${useCase.title} using Saydo`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Image overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}

              <div className="flex items-start gap-4 relative z-10">
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={`w-12 h-12 ${useCase.iconBg} dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <useCase.icon className={`${useCase.iconColor} dark:text-primary w-6 h-6`} />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-foreground dark:text-foreground font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-primary dark:text-primary/80 text-sm font-medium mb-2">
                    {useCase.tagline}
                  </p>
                  <p className="text-muted-foreground dark:text-foreground/80 text-sm leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </div>

              {/* Bottom gradient line on hover */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary to-primary/50 origin-left"
              />
            </motion.div>
          ))}
        </div>

        {/* Social Proof Counter */}
        {isInView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border shadow-sm">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                  >
                    {["S", "M", "K", "J"][i]}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Join 1,000+ people</p>
                <p className="text-xs text-muted-foreground">who stopped guessing</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
