"use client"

import { motion } from "framer-motion"

export const WhyDifferent = () => {
  return (
    <section className="w-full py-20 sm:py-28 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Subtle section divider */}
        <div className="saydo-section-divider mb-20" />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* The Reveal */}
          <div className="space-y-6 sm:space-y-8 mb-12">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="saydo-headline text-2xl sm:text-3xl md:text-4xl text-muted-foreground"
            >
              Productivity apps don&apos;t know you&apos;re exhausted.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="saydo-headline text-2xl sm:text-3xl md:text-4xl text-muted-foreground"
            >
              Health apps don&apos;t know you have a deadline.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="saydo-headline text-2xl sm:text-3xl md:text-4xl text-foreground"
            >
              Saydo knows{" "}
              <span className="saydo-headline-italic text-primary">both.</span>
            </motion.p>
          </div>

          {/* The Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-3xl" />
            <div className="relative py-10 sm:py-14 px-6 sm:px-12">
              <p className="saydo-body text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed">
                That&apos;s the difference between an app you{" "}
                <span className="text-muted-foreground">use</span>
                <br className="hidden sm:block" />
                <br className="sm:hidden" />
                and a partner you{" "}
                <span className="text-primary font-medium">trust.</span>
              </p>
            </div>
          </motion.div>

          {/* Additional Insight */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-muted-foreground mt-10 max-w-2xl mx-auto leading-relaxed"
          >
            You don&apos;t need another app that tells you what you did yesterday. 
            You need one that tells you what to do <em>now</em> — 
            based on everything it knows about you.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

