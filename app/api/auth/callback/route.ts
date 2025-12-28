import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists and has preferred_name (indicates onboarding completion)
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_name")
          .eq("id", user.id)
          .single()

        // If preferred_name exists, user has completed onboarding -> go to dashboard
        // Otherwise, redirect to onboarding
        const redirectTo = profile?.preferred_name ? "/dashboard" : "/onboarding"
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
      
      // Fallback to next parameter if user check fails
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
}

