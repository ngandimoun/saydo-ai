"use client"

import { motion } from "framer-motion"
import { ArrowRight, Mic, Sparkles, FileText, CheckCircle2, Brain } from "lucide-react"
import { OptionalImage } from "@/components/ui/optional-image"
import { getLandingImageUrl } from "@/lib/landing-images"

const steps = [
  {
    icon: Mic,
    title: "Speak Naturally",
    description: "Just talk. No structure needed. Ramble, think out loud, brainstorm, or dictate quick updates.",
  },
  {
    icon: Brain,
    title: "Smart AI Processing",
    description: "Saydo understands context, extracts actions, and organizes your thoughts — not just transcription.",
  },
  {
    icon: FileText,
    title: "Polished Output",
    description: "Receive professional summaries, actionable tasks, and ready-to-send emails in seconds.",
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
            From voice to action in seconds
          </p>
          <p className="text-primary text-sm font-semibold uppercase tracking-wider">
            Not just transcription — intelligent AI processing
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
                <Brain className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground">AI Agent Workflow</h3>
            </div>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-secondary">
              <OptionalImage
                src={getLandingImageUrl("ai-agent-workflow")}
                alt="AI Agent Workflow - Voice to Action"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
              />
            </div>
            <p className="text-muted-foreground text-sm mt-4 text-center">
              Saydo&apos;s AI agent understands context, extracts actions, and creates structured workflows — not just words on a page
            </p>
          </div>
        </motion.div>

        {/* Before/After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-5 sm:gap-8 mb-12"
        >
          {/* Before */}
          <div className="saydo-card p-5 sm:p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">
                Without Saydo
              </span>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="italic leading-relaxed">
                &ldquo;um so like I had this meeting today with the investors and we
                talked about the Q3 roadmap and I think we need to pivot
                something about the market opportunity and oh yeah I need to send
                them the pitch deck by Friday and also schedule a follow-up
                meeting for next week maybe Tuesday or Wednesday...&rdquo;
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-muted-foreground/70 text-xs">
                  Raw transcript — hard to use, hard to find later
                </p>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="saydo-card p-5 sm:p-6 border border-primary/30 bg-gradient-to-br from-card to-accent/20 relative">
            <div className="absolute -top-3 left-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-1 text-xs font-bold rounded-full flex items-center gap-2 shadow-sm">
              <Brain size={12} />
              <span className="hidden sm:inline">WITH SAYDO AI AGENT</span>
              <span className="sm:hidden">SAYDO AI</span>
            </div>
            <div className="space-y-3 text-sm pt-2">
              <div>
                <h4 className="text-foreground font-semibold mb-2">Meeting Summary</h4>
                <p className="text-muted-foreground">
                  Investor meeting discussed Q3 roadmap pivot and new market
                  opportunities.
                </p>
              </div>
              <div className="pt-3 border-t border-border">
                <h4 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  Actions (Auto-Extracted)
                </h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Send updated pitch deck by Friday EOD
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Schedule technical deep-dive for next week
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Agent vs Transcription Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-foreground mb-2">Transcription vs AI Agent</h3>
            <p className="text-muted-foreground text-sm">
              See the difference between basic transcription and intelligent AI agent workflow
            </p>
          </div>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-secondary saydo-card">
            <OptionalImage
              src={getLandingImageUrl("agent-vs-transcription")}
              alt="Transcription vs AI Agent Comparison"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
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
              <div className="w-16 h-16 bg-accent border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all hover:shadow-md hover:border-primary/40">
                <step.icon className="text-primary w-7 h-7" />
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
