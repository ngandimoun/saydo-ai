"use client"

import { motion } from "framer-motion"
import { Mic, FileText, Watch, ArrowRight, Brain, Sparkles } from "lucide-react"

export const WholeYou = () => {
  return (
    <section className="w-full py-20 sm:py-28 px-4 bg-gradient-to-b from-background to-secondary/50">
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
            Other apps see{" "}
            <span className="saydo-headline-italic text-muted-foreground">pieces.</span>
            <br />
            Saydo sees{" "}
            <span className="saydo-headline-italic text-primary">patterns.</span>
          </h2>
          <p className="saydo-body text-muted-foreground text-lg max-w-2xl mx-auto">
            It notices you&apos;re tired before you do. It knows that 3 PM slump isn&apos;t laziness — 
            it&apos;s your iron levels. It doesn&apos;t just organize your tasks; 
            it protects your energy to complete them.
          </p>
        </motion.div>

        {/* Visual Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mb-16"
        >
          <div className="saydo-card p-8 sm:p-12 border border-primary/20 bg-gradient-to-br from-card to-accent/30">
            {/* Input Sources */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
              {[
                { icon: Mic, label: "Voice", color: "text-primary", bg: "bg-primary/10" },
                { icon: FileText, label: "Documents", color: "text-rose-500", bg: "bg-rose-500/10" },
                { icon: Watch, label: "Wearables", color: "text-amber-500", bg: "bg-amber-500/10" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-3`}>
                    <item.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${item.color}`} />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center mb-8 sm:mb-12">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="w-px h-8 bg-gradient-to-b from-border to-primary/50" />
                <ArrowRight className="w-5 h-5 text-primary rotate-90" />
              </motion.div>
            </div>

            {/* Saydo Brain */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center mb-8 sm:mb-12"
            >
              <div className="relative">
                <div className="absolute inset-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/20 animate-saydo-breathe" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                  <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Arrow Down */}
            <div className="flex justify-center mb-8 sm:mb-12">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-border" />
                <ArrowRight className="w-5 h-5 text-primary rotate-90" />
              </motion.div>
            </div>

            {/* Output: Context-Aware Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider">Saydo Says</p>
                  <p className="text-sm text-muted-foreground">Just now</p>
                </div>
              </div>
              <p className="text-foreground leading-relaxed">
                &ldquo;Chris, skip the heavy lift today. Your cortisol is high from yesterday&apos;s 
                launch stress. I&apos;ve moved your workout to tomorrow and blocked 30 minutes 
                for a walk instead.&rdquo;
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Key Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <p className="saydo-body text-xl sm:text-2xl text-foreground max-w-3xl mx-auto">
            Your work and your body are connected.
            <br />
            <span className="text-primary font-medium">Finally, an AI that gets that.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

