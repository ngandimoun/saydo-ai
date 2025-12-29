"use client"

import { motion } from "framer-motion"
import { Edit2, Droplet, Activity, Sun, AlertTriangle, Calendar, TrendingDown } from "lucide-react"
import type { BiologicalProfile, HealthStatus } from "@/lib/dashboard/types"
import { HealthStatusRings } from "./health-status-rings"
import { cn } from "@/lib/utils"

/**
 * Biological Twin Dashboard Component
 * 
 * The central display showing user's biological profile and current health status.
 * This is the "Biological Twin" - it shows how Saydo understands the user's body.
 * 
 * Displays:
 * - Biological Profile: Blood Group, Body Type, Skin Tone, Allergies
 * - Health Status Rings: Energy, Stress, Recovery
 * - Biological Age vs Chronological Age
 * - Quick Stats: Days since last lab, Active interventions
 * 
 * TODO (Backend Integration):
 * - Fetch biological profile from Supabase profiles table
 * - Fetch health status from health_status table
 * - Calculate biological age from biomarkers
 * - Track days since last lab upload
 * 
 * TODO (Real-time Updates):
 * - Subscribe to health status changes
 * - Update biological age when new labs are analyzed
 * - Refresh stats when interventions are created/dismissed
 * 
 * TODO (Profile Editing):
 * - Add edit button to update biological profile
 * - Show modal for editing blood group, body type, etc.
 * - Save changes to Supabase
 */

interface BiologicalTwinDashboardProps {
  biologicalProfile: BiologicalProfile
  healthStatus: HealthStatus
  biologicalAge?: number
  chronologicalAge?: number
  daysSinceLastLab?: number
  activeInterventionsCount?: number
  className?: string
}

// Helper to get body type display name
const getBodyTypeName = (bodyType: string): string => {
  const names: Record<string, string> = {
    'mesomorph': 'Mesomorph',
    'ectomorph': 'Ectomorph',
    'endomorph': 'Endomorph',
    'athletic': 'Athletic',
    'muscular': 'Muscular',
    'slimFit': 'Slim Fit',
    'thin': 'Thin',
    'curvy': 'Curvy',
    'plusSize': 'Plus Size',
    'balanced': 'Balanced'
  }
  return names[bodyType] || bodyType
}

// Helper to get skin tone display name
const getSkinToneName = (skinTone: string): string => {
  const names: Record<string, string> = {
    'veryFair': 'Very Fair',
    'fair': 'Fair',
    'light': 'Light',
    'lightBeige': 'Light Beige',
    'mediumLight': 'Medium Light',
    'medium': 'Medium',
    'olive': 'Olive',
    'tan': 'Tan',
    'mediumBrown': 'Medium Brown',
    'brown': 'Brown',
    'darkBrown': 'Dark Brown',
    'deep': 'Deep',
    'veryDeep': 'Very Deep'
  }
  return names[skinTone] || skinTone
}

export function BiologicalTwinDashboard({
  biologicalProfile,
  healthStatus,
  biologicalAge,
  chronologicalAge,
  daysSinceLastLab,
  activeInterventionsCount,
  className
}: BiologicalTwinDashboardProps) {
  const hasAgeImprovement = biologicalAge && chronologicalAge && biologicalAge < chronologicalAge

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card p-4 space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Your Biological Twin</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Saydo understands your body's unique needs
          </p>
        </div>
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors"
          onClick={() => {
            // TODO: Open profile edit modal
            console.log('Edit biological profile')
          }}
        >
          <Edit2 size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Health Status Rings */}
      <HealthStatusRings healthStatus={healthStatus} />

      {/* Biological Profile Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Blood Group */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <Droplet size={16} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Blood Group</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {biologicalProfile.bloodGroup}
            </p>
          </div>
        </div>

        {/* Body Type */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Activity size={16} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Body Type</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {getBodyTypeName(biologicalProfile.bodyType)}
            </p>
          </div>
        </div>

        {/* Skin Tone */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Sun size={16} className="text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Skin Tone</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {getSkinToneName(biologicalProfile.skinTone)}
            </p>
          </div>
        </div>

        {/* Allergies */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Allergies</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {biologicalProfile.allergies.length > 0 
                ? `${biologicalProfile.allergies.length} tracked`
                : 'None'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Biological Age (if available) */}
      {biologicalAge && chronologicalAge && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Biological Age</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-foreground">{biologicalAge}</p>
                {hasAgeImprovement && (
                  <div className="flex items-center gap-1 text-green-500">
                    <TrendingDown size={14} />
                    <span className="text-xs font-medium">
                      {chronologicalAge - biologicalAge} years younger
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Chronological</p>
            <p className="text-sm font-semibold text-foreground">{chronologicalAge}</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        {daysSinceLastLab !== undefined && (
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground">Last Lab</p>
            <p className="text-sm font-semibold text-foreground">
              {daysSinceLastLab === 0 ? 'Today' : `${daysSinceLastLab}d ago`}
            </p>
          </div>
        )}
        {activeInterventionsCount !== undefined && (
          <div className="text-center flex-1 border-l border-border">
            <p className="text-xs text-muted-foreground">Active Alerts</p>
            <p className="text-sm font-semibold text-foreground">
              {activeInterventionsCount}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}




