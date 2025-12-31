/**
 * Query hooks for skincare features
 * 
 * Caches skincare profile, routines, products, analyses, and routine logs.
 * Invalidates on skincare activities.
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'

const QUERY_KEY = ['skincare']

// Skincare Profile
async function fetchSkincareProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('skincare_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return profile
}

export function useSkincareProfile() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'profile'],
    queryFn: fetchSkincareProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Skincare Routines
async function fetchSkincareRoutines() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: routines } = await supabase
    .from('skincare_routines')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('routine_type', { ascending: true })

  return routines || []
}

export function useSkincareRoutines() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'routines'],
    queryFn: fetchSkincareRoutines,
    staleTime: 5 * 60 * 1000,
  })
}

// Skincare Products
async function fetchSkincareProducts() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: products } = await supabase
    .from('skincare_products')
    .select('*')
    .eq('user_id', user.id)
    .order('analyzed_at', { ascending: false })

  return products || []
}

export function useSkincareProducts() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'products'],
    queryFn: fetchSkincareProducts,
    staleTime: 5 * 60 * 1000,
  })
}

// Skin Analyses
async function fetchSkinAnalyses() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: analyses } = await supabase
    .from('skin_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('analyzed_at', { ascending: false })
    .limit(10)

  return analyses || []
}

export function useSkinAnalyses() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'analyses'],
    queryFn: fetchSkinAnalyses,
    staleTime: 5 * 60 * 1000,
  })
}

// Routine Streak
async function fetchRoutineStreak() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: streak } = await supabase
    .from('health_streaks')
    .select('*')
    .eq('user_id', user.id)
    .eq('streak_type', 'skincare_routine')
    .single()

  return streak
}

export function useRoutineStreak() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'streak'],
    queryFn: fetchRoutineStreak,
    staleTime: 5 * 60 * 1000,
  })
}

// Routine Logs (recent)
async function fetchRoutineLogs() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: logs } = await supabase
    .from('skincare_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(30)

  return logs || []
}

export function useRoutineLogs() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'logs'],
    queryFn: fetchRoutineLogs,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Update Skincare Profile
export function useUpdateSkincareProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: {
      skinType?: string
      skinConditions?: string[]
      skinGoals?: string[]
      skinConcerns?: string
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Map camelCase to snake_case for database columns
      const dbUpdates: Record<string, unknown> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }
      
      if (updates.skinType) {
        dbUpdates.skin_type = updates.skinType
      }
      if (updates.skinConditions) {
        dbUpdates.skin_conditions = updates.skinConditions
      }
      if (updates.skinGoals) {
        dbUpdates.skin_goals = updates.skinGoals
      }
      if (updates.skinConcerns) {
        dbUpdates.skin_concerns = updates.skinConcerns
      }

      console.log('[useUpdateSkincareProfile] Upserting profile:', { userId: user.id, updates: dbUpdates })

      const { error } = await supabase
        .from('skincare_profiles')
        .upsert(dbUpdates)

      if (error) {
        // Create a more descriptive error message
        const errorMessage = error.message || error.details || 'Failed to save skincare profile'
        const enhancedError = new Error(errorMessage)
        // Preserve original error for debugging
        ;(enhancedError as any).originalError = error
        throw enhancedError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'profile'] })
    },
  })
}

// Generate Skincare Routine
export function useGenerateRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { routineType: 'am' | 'pm' }) => {
      const response = await fetch('/api/skincare/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineType: data.routineType }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate routine')
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'routines'] })
    },
  })
}

// Log Routine Completion
export function useLogRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      routineId: string
      routineType: 'am' | 'pm'
      completedProducts?: string[]
      skippedProducts?: string[]
      notes?: string
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Get routine to calculate completion
      const { data: routine } = await supabase
        .from('skincare_routines')
        .select('product_ids')
        .eq('id', data.routineId)
        .single()

      const totalProducts = routine?.product_ids?.length || 0
      const completedCount = data.completedProducts?.length || 0
      const completionPercentage = totalProducts > 0
        ? Math.round((completedCount / totalProducts) * 100)
        : 0

      const { error } = await supabase
        .from('skincare_logs')
        .insert({
          user_id: user.id,
          routine_id: data.routineId,
          routine_type: data.routineType,
          completed_products: data.completedProducts || [],
          skipped_products: data.skippedProducts || [],
          is_completed: completionPercentage >= 80,
          completion_percentage: completionPercentage,
          notes: data.notes,
          log_date: new Date().toISOString().split('T')[0],
          completed_at: completionPercentage >= 80 ? new Date().toISOString() : null,
        })

      if (error) {
        throw error
      }

      // Update streak if completed
      if (completionPercentage >= 80) {
        // Call API to update streak
        await fetch('/api/health/update-streak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streakType: 'skincare_routine',
          }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'logs'] })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'streak'] })
    },
  })
}

