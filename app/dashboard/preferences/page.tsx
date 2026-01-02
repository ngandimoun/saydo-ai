import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { PreferencesPageClient } from "@/components/dashboard/preferences/preferences-page-client"

export default async function PreferencesPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect("/")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/onboarding")
  }

  // Fetch related data
  const [allergiesResult, healthInterestsResult, criticalArtifactsResult, socialIntelligenceResult, newsFocusResult] = await Promise.all([
    supabase
      .from("user_allergies")
      .select("allergy")
      .eq("user_id", user.id),
    supabase
      .from("user_health_interests")
      .select("interest")
      .eq("user_id", user.id),
    supabase
      .from("user_critical_artifacts")
      .select("*")
      .eq("user_id", user.id),
    supabase
      .from("user_social_intelligence")
      .select("source_id")
      .eq("user_id", user.id),
    supabase
      .from("user_news_focus")
      .select("vertical_id")
      .eq("user_id", user.id),
  ])

  // Transform data for the form
  const preferencesData = {
    language: profile.language || 'en',
    preferredName: profile.preferred_name || '',
    profession: profile.profession ? {
      id: profile.profession_id || profile.profession.toLowerCase().replace(/\s+/g, '-'),
      name: profile.profession,
      isCustom: false
    } : null,
    criticalArtifacts: (criticalArtifactsResult.data || []).map(a => ({
      id: a.artifact_id,
      name: a.artifact_name,
      isCustom: a.is_custom,
      description: a.description || undefined
    })),
    socialIntelligence: (socialIntelligenceResult.data || []).map(s => s.source_id),
    newsFocus: (newsFocusResult.data || []).map(n => n.vertical_id),
    gender: profile.gender || '',
    age: profile.age || null,
    bloodGroup: profile.blood_group || '',
    bodyType: profile.body_type || '',
    weight: profile.weight ? Number(profile.weight) : null,
    allergies: (allergiesResult.data || []).map(a => a.allergy),
    skinTone: profile.skin_tone || '',
    healthInterests: (healthInterestsResult.data || []).map(h => h.interest),
  }

  return <PreferencesPageClient initialData={preferencesData} />
}





