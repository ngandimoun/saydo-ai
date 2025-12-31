/**
 * Query hooks for health engagement features
 * 
 * Caches health scores, streaks, achievements, daily challenges, and recommendations.
 * Invalidates on health activities.
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'

const QUERY_KEY = ['health-engagement']

// Health Score
async function fetchHealthScore() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: score } = await supabase
    .from('health_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  return score
}

export function useHealthScore() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'score'],
    queryFn: fetchHealthScore,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Streaks
async function fetchStreaks() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: streaks } = await supabase
    .from('health_streaks')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  return streaks || []
}

export function useStreaks() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'streaks'],
    queryFn: fetchStreaks,
    staleTime: 5 * 60 * 1000,
  })
}

// Achievements
async function fetchAchievements() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: achievements } = await supabase
    .from('health_achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  return achievements || []
}

export function useAchievements() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'achievements'],
    queryFn: fetchAchievements,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Daily Challenges
async function fetchDailyChallenges() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: challenges } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('challenge_date', today)
    .order('created_at', { ascending: true })

  return challenges || []
}

export function useDailyChallenges() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'challenges', new Date().toISOString().split('T')[0]],
    queryFn: fetchDailyChallenges,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Health Recommendations (today's)
async function fetchRecommendations() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: recommendations } = await supabase
    .from('health_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_completed', false)
    .or(`expires_at.is.null,expires_at.gte.${today.toISOString()}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  return recommendations || []
}

export function useRecommendations() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'recommendations'],
    queryFn: fetchRecommendations,
    staleTime: 5 * 60 * 1000,
  })
}

// Complete Challenge
export function useCompleteChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ challengeId, completed }: { challengeId: string; completed: boolean }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('daily_challenges')
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', challengeId)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'challenges'] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'score'] })
    },
  })
}

// Complete Recommendation
export function useCompleteRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recommendationId, completed }: { recommendationId: string; completed: boolean }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('health_recommendations')
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', recommendationId)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'recommendations'] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'score'] })
    },
  })
}


