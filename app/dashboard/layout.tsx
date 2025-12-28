import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    // Redirect to home page if not authenticated
    redirect("/")
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_name")
    .eq("id", user.id)
    .single()

  // If preferred_name doesn't exist, user hasn't completed onboarding -> redirect to onboarding
  if (!profile?.preferred_name) {
    redirect("/onboarding")
  }

  // User is authenticated and has completed onboarding -> show dashboard
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}

// Re-export useAudioPlayer for components that need it
export { useAudioPlayer } from "@/components/dashboard/dashboard-layout-client"
export type { AudioTrack } from "@/components/dashboard/dashboard-layout-client"
