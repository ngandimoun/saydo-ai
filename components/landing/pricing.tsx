"use client"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Perfect for getting started",
    features: [
      "5 minutes/day",
      "Basic summaries",
      "1 device",
      "Standard processing",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For professionals who need more",
    features: [
      "Unlimited voice",
      "Smart workflows",
      "Email integration",
      "Priority support",
      "Multi-device sync",
      "Advanced AI features",
    ],
    cta: "Go Pro",
    popular: true,
  },
]

export const Pricing = () => {
  return (
    <section className="w-full py-20 sm:py-28 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Subtle section divider */}
        <div className="saydo-section-divider mb-20" />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            Simple Pricing
          </h2>
          <p className="saydo-body text-muted-foreground text-lg">
            Invest in your productivity.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-7 sm:p-8 rounded-3xl transition-all duration-300 ${
                tier.popular
                  ? "bg-gradient-to-br from-card to-accent/40 border-2 border-primary/30 shadow-xl shadow-primary/5"
                  : "saydo-card border border-border"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 text-xs font-bold rounded-full flex items-center gap-2 shadow-md">
                  <Sparkles size={12} />
                  MOST POPULAR
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-foreground mb-1">{tier.name}</h3>
                <p className="text-muted-foreground text-sm">{tier.description}</p>
              </div>
              
              <div className="text-5xl font-bold text-foreground mb-8">
                {tier.price}
                <span className="text-base font-normal text-muted-foreground ml-1">
                  {tier.period}
                </span>
              </div>
              
              <ul className="space-y-4 mb-8 text-left">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tier.popular ? "bg-primary/10" : "bg-secondary"
                    }`}>
                      <Check size={12} className={tier.popular ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className={`w-full h-12 rounded-full font-semibold transition-all duration-300 ${
                  tier.popular
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg"
                    : "bg-secondary hover:bg-muted text-foreground"
                }`}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </div>
        
        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-muted-foreground/70 text-sm mt-10"
        >
          Cancel anytime. No questions asked.
        </motion.p>
      </div>
    </section>
  )
}
