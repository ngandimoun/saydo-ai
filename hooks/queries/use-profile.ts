/**
 * Query hook for user profile
 * 
 * Caches user profile data with 10 minute stale time.
 * Invalidates on profile updates.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { UserProfile } from '@/lib/dashboard/types'

const QUERY_KEY = ['profile']

async function fetchProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile) {
    return {
      id: profile.id,
      preferredName: profile.preferred_name || 'there',
      language: profile.language || 'en',
      profession: profile.profession || 'Professional',
      avatarUrl: profile.avatar_url,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    }
  }

  // Return default profile for new users
  return {
    id: user.id,
    preferredName: user.user_metadata?.name || 'there',
    language: 'en',
    profession: 'Professional',
    avatarUrl: user.user_metadata?.avatar_url,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}

