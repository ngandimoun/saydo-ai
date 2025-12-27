"use client"

import { FileText, TrendingUp, TrendingDown } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * PDF Interpreter Use Case Component
 * 
 * Detailed view for Clinical PDF Interpretation interventions.
 * Shows extracted biomarker values, clinical summary, and actionable insights.
 * 
 * TODO (AI Integration):
 * - OCR processing for PDFs (Tesseract, Google Vision API)
 * - Extract biomarker values and reference ranges
 * - Compare with historical lab data
 * - Generate personalized insights using AI
 * 
 * TODO (Backend Integration):
 * - Store extracted biomarker data in database
 * - Track trends over time
 * - Alert on significant changes
 */

interface PDFInterpreterProps {
  intervention: UseCaseIntervention
  className?: string
}

export function PDFInterpreter({ intervention, className }: PDFInterpreterProps) {
  const biomarkerValues = intervention.useCaseData?.biomarkerValues
  const clinicalSummary = intervention.useCaseData?.clinicalSummary

  return (
    <div className={cn("space-y-4", className)}>
      {/* Clinical Summary */}
      {clinicalSummary && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-blue-500" />
            <h4 className="text-sm font-semibold text-foreground">Clinical Analysis</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {clinicalSummary}
          </p>
        </div>
      )}

      {/* Biomarker Values */}
      {biomarkerValues && Object.keys(biomarkerValues).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Key Biomarkers:</h4>
          <div className="space-y-2">
            {Object.entries(biomarkerValues).map(([key, value]) => (
              <div
                key={key}
                className={cn(
                  "p-3 rounded-lg border",
                  value.status === 'low' || value.status === 'low-normal'
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-green-500/10 border-green-500/20"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {value.status === 'low' || value.status === 'low-normal' ? (
                    <TrendingDown size={14} className="text-amber-500" />
                  ) : (
                    <TrendingUp size={14} className="text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">
                    {value.value} {value.unit}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    value.status === 'low' || value.status === 'low-normal'
                      ? "bg-amber-500/20 text-amber-600"
                      : "bg-green-500/20 text-green-600"
                  )}>
                    {value.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Recommended Actions:</h4>
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

