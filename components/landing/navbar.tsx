"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { createClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { LogOut, User as UserIcon } from "lucide-react"

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)

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

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogin = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
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

  return (
    <nav 
      className={`fixed top-0 w-full z-50 h-16 flex items-center justify-between px-4 sm:px-6 md:px-20 transition-all duration-300 ${
        scrolled 
          ? "bg-card/90 backdrop-blur-md shadow-sm border-b border-border" 
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Teal Logo */}
        <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-sm">
          S
        </div>
        <span className="font-semibold text-xl tracking-tight text-foreground">
          Saydo
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {loading ? (
          <div className="w-20 sm:w-24 h-9" />
        ) : user ? (
          <>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <UserIcon size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline truncate max-w-[100px]">
                {user.email?.split("@")[0] || "User"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary min-w-[44px] min-h-[44px]"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </Button>
          </>
        ) : (
          <Button
            onClick={handleLogin}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm rounded-full px-5 sm:px-6 min-h-[44px] shadow-sm hover:shadow-md transition-all duration-300 touch-manipulation"
          >
            <span className="hidden sm:inline">Login with Google</span>
            <span className="sm:hidden">Login</span>
          </Button>
        )}
      </div>
    </nav>
  )
}
