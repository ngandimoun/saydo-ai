/**
 * Query hooks for health data
 * 
 * Caches health status, biological profile, interventions, documents, insights, recommendations, meal plan.
 * Invalidates on health document upload/analysis.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { 
  HealthStatus, 
  BiologicalProfile, 
  ProactiveIntervention,
  HealthDocument,
  HealthInsight,
  HealthRecommendation,
  MealPlan
} from '@/lib/dashboard/types'

const QUERY_KEY = ['health']

// Health Status
async function fetchHealthStatus(): Promise<HealthStatus | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: status } = await supabase
    .from('health_status')
    .select('*')
    .eq('user_id', user.id)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single()

  if (status) {
    return {
      userId: status.user_id,
      energy: status.energy,
      stress: status.stress,
      recovery: status.recovery,
      lastUpdated: new Date(status.last_updated),
      source: status.source as HealthStatus['source'],
    }
  }

  // Default health status
  return {
    userId: user.id,
    energy: 70,
    stress: 30,
    recovery: 65,
    lastUpdated: new Date(),
    source: 'manual',
  }
}

// Biological Profile
async function fetchBiologicalProfile(): Promise<BiologicalProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('blood_group, body_type, skin_tone, allergies, age, weight, gender')
    .eq('id', user.id)
    .single()

  if (profile) {
    return {
      userId: user.id,
      bloodGroup: profile.blood_group,
      bodyType: profile.body_type,
      skinTone: profile.skin_tone,
      allergies: profile.allergies || [],
      age: profile.age,
      weight: profile.weight,
      gender: profile.gender,
    }
  }

  return {
    userId: user.id,
    allergies: [],
  }
}

// Interventions
async function fetchInterventions(): Promise<ProactiveIntervention[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: interventionsData } = await supabase
    .from('proactive_interventions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!interventionsData) {
    return []
  }

  return interventionsData.map(i => ({
    id: i.id,
    userId: i.user_id,
    type: i.type as ProactiveIntervention['type'],
    title: i.title,
    description: i.description,
    urgencyLevel: i.urgency_level as ProactiveIntervention['urgencyLevel'],
    category: i.category as ProactiveIntervention['category'],
    context: i.context,
    biologicalReason: i.biological_reason,
    actionItems: i.action_items || [],
    dismissible: i.dismissible,
    validUntil: i.valid_until ? new Date(i.valid_until) : undefined,
    createdAt: new Date(i.created_at),
    isDismissed: i.is_dismissed,
  }))
}

// Health Documents
async function fetchHealthDocuments(): Promise<HealthDocument[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: docs } = await supabase
    .from('health_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(10)

  if (!docs) {
    return []
  }

  return docs.map(d => ({
    id: d.id,
    userId: d.user_id,
    fileName: d.file_name,
    fileType: d.file_type,
    fileUrl: d.file_url,
    documentType: d.document_type as HealthDocument['documentType'],
    status: d.status as HealthDocument['status'],
    extractedData: d.extracted_data,
    uploadedAt: new Date(d.uploaded_at),
    analyzedAt: d.analyzed_at ? new Date(d.analyzed_at) : undefined,
  }))
}

// Health Insights
async function fetchHealthInsights(): Promise<HealthInsight[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: insightsData } = await supabase
    .from('health_insights')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: true })
    .limit(10)

  if (!insightsData) {
    return []
  }

  return insightsData.map(i => ({
    id: i.id,
    userId: i.user_id,
    category: i.category as HealthInsight['category'],
    title: i.title,
    description: i.description,
    iconName: i.icon_name,
    color: i.color,
    priority: i.priority,
    sourceDocumentId: i.source_document_id,
    createdAt: new Date(i.created_at),
    validUntil: i.valid_until ? new Date(i.valid_until) : undefined,
  }))
}

// Health Recommendations
async function fetchHealthRecommendations(): Promise<HealthRecommendation[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: recs } = await supabase
    .from('health_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!recs) {
    return []
  }

  return recs.map(r => ({
    id: r.id,
    userId: r.user_id,
    type: r.type as HealthRecommendation['type'],
    title: r.title,
    description: r.description,
    reason: r.reason,
    imageUrl: r.image_url,
    timing: r.timing,
    frequency: r.frequency,
    createdAt: new Date(r.created_at),
  }))
}

// Meal Plan
async function fetchMealPlan(): Promise<MealPlan | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: mealPlanData } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!mealPlanData) {
    return null
  }

  return {
    id: mealPlanData.id,
    userId: mealPlanData.user_id,
    type: mealPlanData.type,
    startDate: new Date(mealPlanData.start_date),
    endDate: new Date(mealPlanData.end_date),
    days: mealPlanData.days || [],
    basedOnLabs: mealPlanData.based_on_labs || [],
    basedOnInsights: mealPlanData.based_on_insights || [],
    createdAt: new Date(mealPlanData.created_at),
    updatedAt: new Date(mealPlanData.updated_at),
  }
}

// Biological Age
async function fetchBiologicalAge(): Promise<{ biological: number | null; chronological: number | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { biological: null, chronological: null }
  }

  // Get chronological age from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('age')
    .eq('id', user.id)
    .single()

  const chronologicalAge = profile?.age || null

  // Get biological age from health insights
  const { data: ageInsight } = await supabase
    .from('health_insights')
    .select('data')
    .eq('user_id', user.id)
    .eq('insight_type', 'biological_age')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  const biologicalAge = ageInsight?.data?.biological_age || chronologicalAge

  return {
    biological: biologicalAge,
    chronological: chronologicalAge,
  }
}

// Hooks
export function useHealthStatus() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'status'],
    queryFn: fetchHealthStatus,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useBiologicalProfile() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'biological-profile'],
    queryFn: fetchBiologicalProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useInterventions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'interventions'],
    queryFn: fetchInterventions,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useHealthDocuments() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'documents'],
    queryFn: fetchHealthDocuments,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useHealthInsights() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'insights'],
    queryFn: fetchHealthInsights,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useHealthRecommendations() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'recommendations'],
    queryFn: fetchHealthRecommendations,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useMealPlan() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'meal-plan'],
    queryFn: fetchMealPlan,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useBiologicalAge() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'biological-age'],
    queryFn: fetchBiologicalAge,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useInvalidateHealthData() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}

