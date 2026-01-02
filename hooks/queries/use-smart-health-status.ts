/**
 * Smart Health Status Hook
 * 
 * Calculates Energy, Stress, and Recovery scores from actual uploaded health data:
 * - Energy: Based on energy-related biomarkers, intake quality, and recovery trends
 * - Stress: Based on abnormal biomarkers, allergy warnings, and health concerns
 * - Recovery: Based on biomarker improvements, intake improvements, and time since issues
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { HealthStatus } from '@/lib/dashboard/types'

export interface SmartHealthStatus extends HealthStatus {
  trends: {
    energy: 'up' | 'down' | 'stable'
    stress: 'up' | 'down' | 'stable'
    recovery: 'up' | 'down' | 'stable'
  }
}

/**
 * Energy-related biomarker names
 */
const ENERGY_BIOMARKERS = [
  'iron', 'ferritin', 'b12', 'vitamin b12', 'folate', 'folic acid',
  'tsh', 't3', 't4', 'thyroid', 'vitamin d', '25-hydroxyvitamin d',
  'hemoglobin', 'hgb', 'rbc', 'red blood cell'
]

/**
 * Calculate energy score from biomarkers, intake, and recovery
 */
function calculateEnergyScore(
  biomarkers: any[],
  intakeLogs: any[],
  previousBiomarkers: any[]
): number {
  // 1. Biomarker Energy Indicators (40% weight)
  const energyBiomarkers = biomarkers.filter(b => 
    ENERGY_BIOMARKERS.some(name => b.name.toLowerCase().includes(name))
  )

  let biomarkerScore = 70 // Default if no energy biomarkers
  if (energyBiomarkers.length > 0) {
    const scores = energyBiomarkers.map(b => {
      if (b.status === 'normal') return 100
      if (b.status === 'low' || b.status === 'critical_low') {
        // Low energy indicators = lower score
        return b.status === 'critical_low' ? 30 : 50
      }
      if (b.status === 'high' || b.status === 'critical_high') {
        // High can also indicate issues (e.g., high TSH = low thyroid function)
        return b.status === 'critical_high' ? 40 : 60
      }
      return 70
    })
    biomarkerScore = scores.reduce((a, b) => a + b, 0) / scores.length
  }

  // 2. Intake Quality (30% weight)
  const recentIntake = intakeLogs.filter(i => {
    const daysAgo = (Date.now() - new Date(i.logged_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo <= 7 && i.health_score !== null
  })

  let intakeScore = 70 // Default
  if (recentIntake.length > 0) {
    const scores = recentIntake.map(i => i.health_score).filter(s => s !== null) as number[]
    intakeScore = scores.reduce((a, b) => a + b, 0) / scores.length
  }

  // 3. Recovery Indicators (30% weight)
  let recoveryScore = 70 // Default
  if (previousBiomarkers.length > 0 && energyBiomarkers.length > 0) {
    // Compare current vs previous energy biomarkers
    const improvements = energyBiomarkers.map(current => {
      const previous = previousBiomarkers.find(
        p => p.name.toLowerCase() === current.name.toLowerCase()
      )
      if (!previous) return 50 // No comparison available

      // Improvement: abnormal -> normal = 100, worse = 0, same = 50
      if (current.status === 'normal' && previous.status !== 'normal') return 100
      if (current.status !== 'normal' && previous.status === 'normal') return 0
      if (current.status === previous.status) return 50
      
      // Moving toward normal
      const currentSeverity = current.status === 'critical_low' || current.status === 'critical_high' ? 2 :
                              current.status === 'low' || current.status === 'high' ? 1 : 0
      const previousSeverity = previous.status === 'critical_low' || previous.status === 'critical_high' ? 2 :
                              previous.status === 'low' || previous.status === 'high' ? 1 : 0
      
      if (currentSeverity < previousSeverity) return 75 // Improving
      if (currentSeverity > previousSeverity) return 25 // Worsening
      return 50
    })

    if (improvements.length > 0) {
      recoveryScore = improvements.reduce((a, b) => a + b, 0) / improvements.length
    }
  }

  // Weighted average
  const energyScore = (biomarkerScore * 0.4) + (intakeScore * 0.3) + (recoveryScore * 0.3)
  return Math.round(Math.max(0, Math.min(100, energyScore)))
}

/**
 * Calculate stress score from abnormal biomarkers, allergies, and concerns
 */
function calculateStressScore(
  biomarkers: any[],
  documents: any[],
  intakeLogs: any[]
): number {
  // 1. Abnormal Biomarkers (50% weight)
  const abnormalBiomarkers = biomarkers.filter(b => b.status !== 'normal' && b.status !== null)
  let abnormalPenalty = 0

  abnormalBiomarkers.forEach(b => {
    if (b.status === 'critical_low' || b.status === 'critical_high') {
      abnormalPenalty += 20 // Critical = 20 points
    } else if (b.status === 'low' || b.status === 'high') {
      abnormalPenalty += 10 // High/Low = 10 points
    }
  })

  // Normalize to 0-100 scale (max 50 points from biomarkers)
  const biomarkerPenalty = Math.min(50, (abnormalPenalty / biomarkers.length) * 100) || 0

  // 2. Allergy Warnings (30% weight)
  const recentDocuments = documents.filter(d => {
    const daysAgo = (Date.now() - new Date(d.uploaded_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo <= 30
  })

  const allergyWarnings = recentDocuments.filter(d => 
    d.allergy_warnings && Array.isArray(d.allergy_warnings) && d.allergy_warnings.length > 0
  )

  // Each warning = 15 points, max 30 points
  const allergyPenalty = Math.min(30, allergyWarnings.length * 15)

  // 3. Health Concerns (20% weight)
  const recentIntake = intakeLogs.filter(i => {
    const daysAgo = (Date.now() - new Date(i.logged_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo <= 7
  })

  const concerns = recentIntake.filter(i => 
    i.concerns && Array.isArray(i.concerns) && i.concerns.length > 0
  )

  // Each concern = 5 points, max 20 points
  const concernPenalty = Math.min(20, concerns.length * 5)

  // Calculate stress score (higher penalty = higher stress = lower score)
  const totalPenalty = (biomarkerPenalty * 0.5) + (allergyPenalty * 0.3) + (concernPenalty * 0.2)
  const stressScore = 100 - totalPenalty

  return Math.round(Math.max(0, Math.min(100, stressScore)))
}

/**
 * Calculate recovery score from trends, improvements, and time since issues
 */
function calculateRecoveryScore(
  biomarkers: any[],
  previousBiomarkers: any[],
  intakeLogs: any[],
  previousIntakeLogs: any[],
  documents: any[]
): number {
  // 1. Biomarker Trends (50% weight)
  let trendScore = 50 // Default
  if (biomarkers.length > 0 && previousBiomarkers.length > 0) {
    const improvements = biomarkers.map(current => {
      const previous = previousBiomarkers.find(
        p => p.name.toLowerCase() === current.name.toLowerCase()
      )
      if (!previous) return 50

      // Improvement scoring
      if (current.status === 'normal' && previous.status !== 'normal') return 100
      if (current.status !== 'normal' && previous.status === 'normal') return 0
      if (current.status === previous.status) {
        // Same status, check if moving toward normal
        if (current.status === 'normal') return 100
        return 50
      }

      // Status change
      const statusOrder = ['critical_low', 'low', 'normal', 'high', 'critical_high']
      const currentIndex = statusOrder.indexOf(current.status)
      const previousIndex = statusOrder.indexOf(previous.status)

      if (currentIndex < previousIndex) return 75 // Moving toward normal (left)
      if (currentIndex > previousIndex) return 25 // Moving away from normal (right)
      return 50
    })

    if (improvements.length > 0) {
      trendScore = improvements.reduce((a, b) => a + b, 0) / improvements.length
    }
  }

  // 2. Intake Improvements (30% weight)
  let intakeImprovement = 50 // Default
  if (intakeLogs.length > 0 && previousIntakeLogs.length > 0) {
    const currentAvg = intakeLogs
      .filter(i => i.health_score !== null)
      .map(i => i.health_score)
      .reduce((a, b) => a + b, 0) / intakeLogs.filter(i => i.health_score !== null).length || 70

    const previousAvg = previousIntakeLogs
      .filter(i => i.health_score !== null)
      .map(i => i.health_score)
      .reduce((a, b) => a + b, 0) / previousIntakeLogs.filter(i => i.health_score !== null).length || 70

    // Improvement: if current > previous, score increases
    const improvement = currentAvg - previousAvg
    intakeImprovement = 50 + (improvement * 0.5) // Scale improvement
  }

  // 3. Time Since Issues (20% weight)
  const criticalBiomarkers = biomarkers.filter(b => 
    b.status === 'critical_low' || b.status === 'critical_high'
  )

  const recentAllergyWarnings = documents.filter(d => {
    const daysAgo = (Date.now() - new Date(d.uploaded_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo <= 30 && d.allergy_warnings && Array.isArray(d.allergy_warnings) && d.allergy_warnings.length > 0
  })

  let timeRecovery = 50 // Default
  if (criticalBiomarkers.length === 0 && recentAllergyWarnings.length === 0) {
    timeRecovery = 100 // No recent issues
  } else {
    // Calculate days since most recent critical issue
    const mostRecentCritical = biomarkers
      .filter(b => b.status === 'critical_low' || b.status === 'critical_high')
      .map(b => new Date(b.measured_at || b.created_at).getTime())
      .sort((a, b) => b - a)[0]

    const mostRecentAllergy = recentAllergyWarnings
      .map(d => new Date(d.uploaded_at).getTime())
      .sort((a, b) => b - a)[0]

    const mostRecent = Math.max(mostRecentCritical || 0, mostRecentAllergy || 0)
    if (mostRecent > 0) {
      const daysSince = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24)
      // More days = better recovery (max 30 days = 100%)
      timeRecovery = Math.min(100, (daysSince / 30) * 100)
    }
  }

  // Weighted average
  const recoveryScore = (trendScore * 0.5) + (intakeImprovement * 0.3) + (timeRecovery * 0.2)
  return Math.round(Math.max(0, Math.min(100, recoveryScore)))
}

/**
 * Calculate trends by comparing current vs previous period
 */
function calculateTrends(
  current: { energy: number; stress: number; recovery: number },
  previous: { energy: number; stress: number; recovery: number } | null
): SmartHealthStatus['trends'] {
  if (!previous) {
    return { energy: 'stable', stress: 'stable', recovery: 'stable' }
  }

  const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const diff = current - previous
    if (Math.abs(diff) < 2) return 'stable' // Less than 2% change = stable
    return diff > 0 ? 'up' : 'down'
  }

  return {
    energy: getTrend(current.energy, previous.energy),
    stress: getTrend(100 - current.stress, 100 - previous.stress), // Invert stress (lower is better)
    recovery: getTrend(current.recovery, previous.recovery),
  }
}

/**
 * Fetch and calculate smart health status
 */
async function fetchSmartHealthStatus(): Promise<SmartHealthStatus> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Return default values if no user
    return {
      userId: '',
      energy: 70,
      stress: 30,
      recovery: 65,
      lastUpdated: new Date(),
      source: 'calculated',
      trends: { energy: 'stable', stress: 'stable', recovery: 'stable' },
    }
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Fetch current period data
  const [biomarkersResult, intakeResult, documentsResult] = await Promise.all([
    supabase
      .from('biomarkers')
      .select('*')
      .eq('user_id', user.id)
      .gte('measured_at', thirtyDaysAgo.toISOString())
      .order('measured_at', { ascending: false }),
    
    supabase
      .from('intake_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', sevenDaysAgo.toISOString())
      .order('logged_at', { ascending: false }),
    
    supabase
      .from('health_documents')
      .select('uploaded_at, allergy_warnings')
      .eq('user_id', user.id)
      .gte('uploaded_at', thirtyDaysAgo.toISOString())
      .order('uploaded_at', { ascending: false }),
  ])

  // Fetch previous period data for trends
  const [previousBiomarkersResult, previousIntakeResult] = await Promise.all([
    supabase
      .from('biomarkers')
      .select('*')
      .eq('user_id', user.id)
      .gte('measured_at', sixtyDaysAgo.toISOString())
      .lt('measured_at', thirtyDaysAgo.toISOString())
      .order('measured_at', { ascending: false }),
    
    supabase
      .from('intake_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', thirtyDaysAgo.toISOString())
      .lt('logged_at', sevenDaysAgo.toISOString())
      .order('logged_at', { ascending: false }),
  ])

  const biomarkers = biomarkersResult.data || []
  const intakeLogs = intakeResult.data || []
  const documents = documentsResult.data || []
  const previousBiomarkers = previousBiomarkersResult.data || []
  const previousIntakeLogs = previousIntakeResult.data || []

  // Calculate scores
  const energy = calculateEnergyScore(biomarkers, intakeLogs, previousBiomarkers)
  const stress = calculateStressScore(biomarkers, documents, intakeLogs)
  const recovery = calculateRecoveryScore(
    biomarkers,
    previousBiomarkers,
    intakeLogs,
    previousIntakeLogs,
    documents
  )

  // Calculate previous period scores for trends
  const previousEnergy = biomarkers.length > 0 && previousBiomarkers.length > 0
    ? calculateEnergyScore(previousBiomarkers, previousIntakeLogs, [])
    : energy

  const previousStress = biomarkers.length > 0
    ? calculateStressScore(previousBiomarkers, documents, previousIntakeLogs)
    : stress

  const previousRecovery = biomarkers.length > 0 && previousBiomarkers.length > 0
    ? calculateRecoveryScore(previousBiomarkers, [], previousIntakeLogs, [], documents)
    : recovery

  const trends = calculateTrends(
    { energy, stress, recovery },
    { energy: previousEnergy, stress: previousStress, recovery: previousRecovery }
  )

  return {
    userId: user.id,
    energy,
    stress,
    recovery,
    lastUpdated: new Date(),
    source: 'calculated',
    trends,
  }
}

/**
 * Hook to get smart health status calculated from uploaded data
 */
export function useSmartHealthStatus() {
  return useQuery({
    queryKey: ['health', 'smart-status'],
    queryFn: fetchSmartHealthStatus,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}



