"use client"

import { motion } from "framer-motion"
import { ArrowRight, Upload, Zap, Target, CheckCircle2, Brain } from "lucide-react"
import { OptionalImage } from "@/components/ui/optional-image"
import { getLandingImageUrl } from "@/lib/landing-images"

const steps = [
  {
    icon: Upload,
    title: "Feed Saydo",
    description: "Speak your thoughts. Snap a lab result. Connect your watch. Saydo accepts it all.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "Saydo Connects the Dots",
    description: "Not just transcription. Not just tracking. Saydo sees how your work, sleep, and biology interact.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Live Smarter",
    description: "Receive actions that actually fit YOUR life. A grocery list based on YOUR labs. A schedule that respects YOUR energy.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
]

export const HowItWorks = () => {
  return (
    <section className="w-full py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Subtle section divider */}
        <div className="saydo-section-divider mb-20" />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-5">
            How It Works
          </h2>
          <p className="saydo-body text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            One simple flow for your whole life
          </p>
          <p className="text-primary text-sm font-semibold uppercase tracking-wider">
            Feed it anything. Get back clarity.
          </p>
        </motion.div>

        {/* AI Agent Workflow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="saydo-card p-5 sm:p-8 border border-primary/20 bg-gradient-to-br from-card to-accent/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">Your Personal Intelligence</h3>
            </div>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-secondary">
              <OptionalImage
                src={getLandingImageUrl("ai-agent-workflow")}
                alt="AI Agent Workflow - Voice and Health to Action"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
              />
            </div>
            <p className="text-muted-foreground text-sm mt-4 text-center">
              Saydo understands context across your whole life — work, health, energy — and gives you actions that actually work for you
            </p>
          </div>
        </motion.div>

        {/* Before/After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-5 sm:gap-8 mb-16"
        >
          {/* Before */}
          <div className="saydo-card p-5 sm:p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">
                Without Saydo
              </span>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="italic leading-relaxed">
                &ldquo;I have 10 apps for productivity and 5 for health. None of them talk to each other. 
                My calendar says 'work harder' when my body is screaming 'rest.' I&apos;m drowning in data 
                but still feel lost.&rdquo;
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-muted-foreground/70 text-xs">
                  Data rich. Insight poor. Sound familiar?
                </p>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="saydo-card p-5 sm:p-6 border border-primary/30 bg-gradient-to-br from-card to-accent/20 relative">
            <div className="absolute -top-3 left-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-1 text-xs font-bold rounded-full flex items-center gap-2 shadow-sm">
              <Zap size={12} />
              <span className="hidden sm:inline">WITH SAYDO</span>
              <span className="sm:hidden">SAYDO</span>
            </div>
            <div className="space-y-3 text-sm pt-2">
              <div>
                <h4 className="text-foreground font-semibold mb-2">One Partner. Your Whole Life.</h4>
                <p className="text-muted-foreground">
                  Saydo connects your voice notes, lab results, and wearable data into one intelligent picture.
                </p>
              </div>
              <div className="pt-3 border-t border-border">
                <h4 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  What You Actually Get
                </h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Tasks scheduled around YOUR energy levels
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Grocery lists built from YOUR lab results
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Nudges that know when to push and when to rest
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center relative"
            >
              <div className={`w-16 h-16 ${step.bg} border border-border rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all hover:shadow-md`}>
                <step.icon className={`${step.color} w-7 h-7`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight
                  className="hidden md:block absolute top-8 right-[-1.5rem] text-muted-foreground/50"
                  size={20}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
