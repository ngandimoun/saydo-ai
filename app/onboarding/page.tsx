import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { OnboardingPageClient } from "@/components/onboarding/onboarding-page-client"

export default async function OnboardingPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    // Redirect to home page if not authenticated
    redirect("/")
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_name")
    .eq("id", user.id)
    .single()

  // If preferred_name exists, user has completed onboarding -> redirect to dashboard
  if (profile?.preferred_name) {
    redirect("/dashboard")
  }

  // User is authenticated and hasn't completed onboarding -> show onboarding form
  return <OnboardingPageClient />
}
