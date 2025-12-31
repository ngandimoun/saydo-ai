/**
 * Smart Health Metrics Hook
 * 
 * Calculates health metrics from actual uploaded health documents:
 * - Lab Health Score: % of biomarkers in normal range
 * - Intake Quality: Average health score from food/drinks/supplements
 * - Recent Uploads: Activity indicator for the week
 * - Allergy Safety: Safety score based on allergy warnings
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Activity, Apple, Upload, Shield, type LucideIcon } from 'lucide-react'

export interface SmartHealthMetric {
  id: string
  label: string
  value: string
  percentage?: number
  icon: LucideIcon
  color: string
  bg: string
  trend?: 'up' | 'down' | 'stable'
  hasData: boolean
}

export interface SmartHealthMetricsData {
  metrics: SmartHealthMetric[]
  hasAnyData: boolean
  isLoading: boolean
}

/**
 * Fetch and calculate smart health metrics from uploaded data
 */
async function fetchSmartHealthMetrics(): Promise<SmartHealthMetric[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return getEmptyMetrics()
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Fetch all data in parallel
  const [biomarkersResult, intakeResult, uploadsResult, allergyResult] = await Promise.all([
    // Lab Health Score - Biomarkers from last 30 days
    supabase
      .from('biomarkers')
      .select('status')
      .eq('user_id', user.id)
      .gte('measured_at', thirtyDaysAgo.toISOString()),
    
    // Intake Quality - Health scores from last 7 days
    supabase
      .from('intake_log')
      .select('health_score')
      .eq('user_id', user.id)
      .gte('logged_at', sevenDaysAgo.toISOString())
      .not('health_score', 'is', null),
    
    // Recent Uploads - Last 7 days
    supabase
      .from('health_documents')
      .select('id, document_type')
      .eq('user_id', user.id)
      .gte('uploaded_at', sevenDaysAgo.toISOString()),
    
    // Allergy Safety - Documents with allergy warnings in last 30 days
    supabase
      .from('health_documents')
      .select('allergy_warnings')
      .eq('user_id', user.id)
      .gte('uploaded_at', thirtyDaysAgo.toISOString()),
  ])

  const metrics: SmartHealthMetric[] = []

  // 1. Lab Health Score
  const biomarkers = biomarkersResult.data || []
  if (biomarkers.length > 0) {
    const normalCount = biomarkers.filter(b => b.status === 'normal').length
    const percentage = Math.round((normalCount / biomarkers.length) * 100)
    
    metrics.push({
      id: 'lab-health',
      label: 'Lab Health',
      value: `${percentage}%`,
      percentage,
      icon: Activity,
      color: percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500',
      bg: percentage >= 80 ? 'bg-green-500/10' : percentage >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10',
      trend: percentage >= 80 ? 'up' : percentage >= 60 ? 'stable' : 'down',
      hasData: true,
    })
  } else {
    metrics.push({
      id: 'lab-health',
      label: 'Lab Health',
      value: '—',
      icon: Activity,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      hasData: false,
    })
  }

  // 2. Intake Quality
  const intakeLogs = intakeResult.data || []
  if (intakeLogs.length > 0) {
    const scores = intakeLogs.map(i => i.health_score).filter(s => s !== null) as number[]
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    
    metrics.push({
      id: 'intake-quality',
      label: 'Intake',
      value: `${avgScore}%`,
      percentage: avgScore,
      icon: Apple,
      color: avgScore >= 70 ? 'text-green-500' : avgScore >= 50 ? 'text-yellow-500' : 'text-red-500',
      bg: avgScore >= 70 ? 'bg-green-500/10' : avgScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10',
      trend: avgScore >= 70 ? 'up' : avgScore >= 50 ? 'stable' : 'down',
      hasData: true,
    })
  } else {
    metrics.push({
      id: 'intake-quality',
      label: 'Intake',
      value: '—',
      icon: Apple,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      hasData: false,
    })
  }

  // 3. Recent Uploads
  const uploads = uploadsResult.data || []
  const uploadCount = uploads.length
  metrics.push({
    id: 'recent-uploads',
    label: 'Uploads',
    value: uploadCount > 0 ? `${uploadCount}` : '0',
    percentage: Math.min(uploadCount * 10, 100), // Cap at 100% for 10+ uploads
    icon: Upload,
    color: uploadCount > 0 ? 'text-blue-500' : 'text-muted-foreground',
    bg: uploadCount > 0 ? 'bg-blue-500/10' : 'bg-muted/50',
    trend: uploadCount >= 5 ? 'up' : uploadCount > 0 ? 'stable' : undefined,
    hasData: uploadCount > 0,
  })

  // 4. Allergy Safety
  const documentsWithAllergyData = allergyResult.data || []
  const warningCount = documentsWithAllergyData.filter(
    d => d.allergy_warnings && Array.isArray(d.allergy_warnings) && d.allergy_warnings.length > 0
  ).length
  
  const safetyPercentage = documentsWithAllergyData.length > 0
    ? Math.round(((documentsWithAllergyData.length - warningCount) / documentsWithAllergyData.length) * 100)
    : 100

  if (documentsWithAllergyData.length > 0) {
    metrics.push({
      id: 'allergy-safety',
      label: 'Safety',
      value: warningCount === 0 ? '100%' : `${warningCount} alerts`,
      percentage: safetyPercentage,
      icon: Shield,
      color: warningCount === 0 ? 'text-green-500' : warningCount <= 2 ? 'text-yellow-500' : 'text-red-500',
      bg: warningCount === 0 ? 'bg-green-500/10' : warningCount <= 2 ? 'bg-yellow-500/10' : 'bg-red-500/10',
      trend: warningCount === 0 ? 'up' : 'down',
      hasData: true,
    })
  } else {
    metrics.push({
      id: 'allergy-safety',
      label: 'Safety',
      value: '—',
      icon: Shield,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      hasData: false,
    })
  }

  return metrics
}

/**
 * Get empty metrics for when there's no data
 */
function getEmptyMetrics(): SmartHealthMetric[] {
  return [
    {
      id: 'lab-health',
      label: 'Lab Health',
      value: '—',
      icon: Activity,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      hasData: false,
    },
    {
      id: 'intake-quality',
      label: 'Intake',
      value: '—',
      icon: Apple,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      hasData: false,
    },
    {
      id: 'recent-uploads',
      label: 'Uploads',
      value: '0',
      icon: Upload,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      hasData: false,
    },
    {
      id: 'allergy-safety',
      label: 'Safety',
      value: '—',
      icon: Shield,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      hasData: false,
    },
  ]
}

/**
 * Hook to get smart health metrics calculated from uploaded data
 */
export function useSmartHealthMetrics() {
  const query = useQuery({
    queryKey: ['health', 'smart-metrics'],
    queryFn: fetchSmartHealthMetrics,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const metrics = query.data || getEmptyMetrics()
  const hasAnyData = metrics.some(m => m.hasData)

  return {
    metrics,
    hasAnyData,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}



