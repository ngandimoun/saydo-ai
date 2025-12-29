"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { createClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { LogOut, User as UserIcon } from "lucide-react"
import { prefersReducedMotion } from "@/lib/animation-config"

export const Navbar = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [showCTAGlow, setShowCTAGlow] = useState(false)
  const logoRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const isReduced = prefersReducedMotion()

  // Scroll progress for navbar effects
  const { scrollY } = useScroll()
  const navOpacity = useTransform(scrollY, [0, 100], [0, 1])
  const navBlur = useTransform(scrollY, [0, 100], [0, 12])

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Track scroll for navbar background and CTA glow
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setScrolled(scrollPosition > 20)
      // Show CTA glow after scrolling past hero (roughly 500px)
      setShowCTAGlow(scrollPosition > 500)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Logo entrance animation
  useEffect(() => {
    if (isReduced || !logoRef.current) return

    gsap.fromTo(
      logoRef.current,
      { scale: 0, opacity: 0, rotation: -180 },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.6,
        delay: 0.1,
        ease: "back.out(1.7)",
      }
    )
  }, [isReduced])

  const handleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      console.error("Login error:", error)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  const handleNavigateToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 w-full z-50 h-16 flex items-center justify-between px-4 sm:px-6 md:px-20"
    >
      {/* Animated background */}
      <motion.div
        style={{ 
          opacity: navOpacity,
          backdropFilter: isReduced ? "blur(12px)" : `blur(${navBlur}px)`,
        }}
        className={`absolute inset-0 transition-all duration-300 ${
          scrolled 
            ? "bg-card/80 shadow-sm border-b border-border" 
            : "bg-transparent"
        }`}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 relative z-10">
        <motion.div
          ref={logoRef}
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-sm cursor-pointer"
        >
          S
        </motion.div>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="font-semibold text-xl tracking-tight text-foreground"
        >
          Saydo
        </motion.span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3 relative z-10">
        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <ThemeToggle />
        </motion.div>
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-20 sm:w-24 h-9"
            />
          ) : user ? (
            <motion.div
              key="user"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-1 sm:gap-2"
            >
              <motion.button
                onClick={handleNavigateToDashboard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors rounded-md px-1 py-1 -ml-1"
                aria-label="Go to dashboard"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex-shrink-0"
                >
                  <UserIcon size={16} />
                </motion.div>
                <span className="hidden sm:inline truncate max-w-[100px]">
                  {user.email?.split("@")[0] || "User"}
                </span>
              </motion.button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary min-w-[44px] min-h-[44px]"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative flex items-center gap-2"
            >
              {/* Glow effect when scrolled past hero */}
              <AnimatePresence>
                {showCTAGlow && !isReduced && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
                  />
                )}
              </AnimatePresence>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={showCTAGlow && !isReduced ? { 
                  boxShadow: [
                    "0 0 0 0 rgba(13, 148, 136, 0)",
                    "0 0 20px 4px rgba(13, 148, 136, 0.3)",
                    "0 0 0 0 rgba(13, 148, 136, 0)",
                  ]
                } : {}}
                transition={{ 
                  duration: 2, 
                  repeat: showCTAGlow ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <Button
                  ref={ctaRef}
                  onClick={handleLogin}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm rounded-full px-5 sm:px-6 min-h-[44px] shadow-sm hover:shadow-md transition-all duration-300 ease-out touch-manipulation"
                >
                  <span className="hidden sm:inline">Login with Google</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
