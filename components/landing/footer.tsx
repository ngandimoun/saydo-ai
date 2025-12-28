"use client"

import { useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Github, Twitter, Mail, Heart } from "lucide-react"
import { prefersReducedMotion, durations } from "@/lib/animation-config"

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const footerLinks = {
  product: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Pricing", href: "#pricing" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Use", href: "#" },
    { label: "FAQs", href: "#" },
  ],
}

const socialLinks = [
  { icon: Twitter, href: "https://x.com/ChrisNGAND14511", label: "Twitter / X" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "mailto:contact@saydo.app", label: "Email" },
]

export const Footer = () => {
  const footerRef = useRef<HTMLElement>(null)
  const columnsRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(footerRef, { once: true, margin: "-50px" })

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      if (columnsRef.current) {
        const columns = columnsRef.current.querySelectorAll(".footer-column")

        gsap.fromTo(
          columns,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: durations.normal,
            stagger: 0.1,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 95%",
            },
          }
        )
      }
    }, footerRef)

    return () => ctx.revert()
  }, [])

  return (
    <footer ref={footerRef} className="w-full py-14 px-4 border-t border-border bg-card overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div ref={columnsRef} className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="footer-column"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-sm"
              >
                S
              </motion.div>
              <span className="font-semibold text-xl tracking-tight text-foreground">
                Saydo
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The first AI that knows your mind and your body.
            </p>
          </motion.div>

          {/* Product */}
          <div className="footer-column">
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {footerLinks.product.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <a 
                    href={link.href} 
                    className="hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer-column">
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {footerLinks.company.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.15 + i * 0.05 }}
                >
                  <a 
                    href={link.href} 
                    className="hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-column">
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {footerLinks.legal.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <a 
                    href={link.href} 
                    className="hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap justify-center md:justify-start">
            <span>© NGANDIMOUN TECHNOLOGIES LTD</span>
            <span className="text-border hidden sm:inline">|</span>
            <span className="flex items-center gap-1">
              Made with{" "}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Heart size={14} className="text-rose-500 fill-rose-500" />
              </motion.span>
              {" "}by{" "}
              <a
                href="https://x.com/ChrisNGAND14511"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                @ChrisNGAND14511
              </a>
            </span>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social, i) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 10, 
                  delay: 0.4 + i * 0.1 
                }}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                aria-label={social.label}
              >
                <social.icon size={16} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Scroll to top indicator */}
        {isInView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mt-8"
          >
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <motion.span
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ↑
              </motion.span>
              Back to top
            </motion.button>
          </motion.div>
        )}
      </div>
    </footer>
  )
}
