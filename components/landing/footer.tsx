"use client"

import { Github, Twitter, Mail } from "lucide-react"

export const Footer = () => {
  return (
    <footer className="w-full py-14 px-4 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-sm">
                S
              </div>
              <span className="font-semibold text-xl tracking-tight text-foreground">
                Saydo
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Turn messy thoughts into clear action.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-primary transition-colors">
                  Use Cases
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  FAQs
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - AudioPen Style */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© NGANDIMOUN TECHNOLOGIES LTD</span>
            <span className="text-border">|</span>
            <span>
              Saydo™ built by{" "}
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
          <div className="flex items-center gap-3">
            <a
              href="https://x.com/ChrisNGAND14511"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
              aria-label="Twitter / X"
            >
              <Twitter size={16} />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
            <a
              href="mailto:contact@saydo.app"
              className="w-9 h-9 rounded-full bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
              aria-label="Email"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
