"use client"

import { Mic, Activity, Heart } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Voice Stress Detector Use Case Component
 * 
 * Detailed view for Voice-Stress Detection interventions.
 * Shows voice frequency analysis, stress level, and recommended actions.
 * 
 * TODO (AI Integration):
 * - Voice frequency analysis API
 * - Tone and pitch detection
 * - Sympathetic nervous system arousal detection
 * - Real-time stress monitoring during voice recordings
 * 
 * TODO (Backend Integration):
 * - Store voice analysis results
 * - Track stress patterns over time
 * - Correlate with calendar events and tasks
 */

interface VoiceStressDetectorProps {
  intervention: UseCaseIntervention
  className?: string
}

export function VoiceStressDetector({ intervention, className }: VoiceStressDetectorProps) {
  const stressLevel = intervention.useCaseData?.stressLevel
  const voiceFrequency = intervention.useCaseData?.voiceFrequency
  const recommendedAction = intervention.useCaseData?.recommendedAction

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stress Level */}
      {stressLevel !== undefined && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-red-500" />
              <span className="text-xs text-muted-foreground">Stress Level</span>
            </div>
            <span className="text-lg font-bold text-red-600">{stressLevel}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            High sympathetic nervous system arousal detected
          </p>
        </div>
      )}

      {/* Voice Frequency */}
      {voiceFrequency && (
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <Mic size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Voice Frequency</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{voiceFrequency} Hz</p>
          <p className="text-xs text-muted-foreground mt-1">
            Higher frequency indicates increased stress
          </p>
        </div>
      )}

      {/* Recommended Action */}
      {recommendedAction && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-blue-500" />
            <h4 className="text-sm font-semibold text-foreground">Recommended Action</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {recommendedAction}
          </p>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Next Steps:</h4>
        <ul className="space-y-1.5">
          {intervention.actionItems?.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}






