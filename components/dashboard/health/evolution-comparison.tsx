"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BodySystemFinding } from "@/hooks/queries/use-health-profile";

interface EvolutionComparisonProps {
  systemName: string;
  displayName: string;
  findings: BodySystemFinding[];
  className?: string;
}

/**
 * Evolution Comparison Component
 * 
 * Shows before/after comparison for findings that have evolved
 * (i.e., have previous values to compare against)
 */
export function EvolutionComparison({
  systemName,
  displayName,
  findings,
  className,
}: EvolutionComparisonProps) {
  // Filter findings that have evolution data
  const evolvedFindings = findings.filter((f) => f.evolutionTrend && f.evolutionNote);

  if (evolvedFindings.length === 0) {
    return null;
  }

  // Calculate overall trend
  const trends = evolvedFindings.map((f) => f.evolutionTrend);
  const improvedCount = trends.filter((t) => t === "improved").length;
  const declinedCount = trends.filter((t) => t === "declined").length;
  
  let overallTrend: "improved" | "stable" | "declined" = "stable";
  if (improvedCount > declinedCount) overallTrend = "improved";
  else if (declinedCount > improvedCount) overallTrend = "declined";

  const TrendIcon = overallTrend === "improved" ? TrendingUp : 
                    overallTrend === "declined" ? TrendingDown : Minus;
  const trendColor = overallTrend === "improved" ? "text-emerald-500" :
                     overallTrend === "declined" ? "text-red-500" : "text-muted-foreground";
  const trendBg = overallTrend === "improved" ? "bg-emerald-500/10" :
                  overallTrend === "declined" ? "bg-red-500/10" : "bg-muted/50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "saydo-card p-4 border-l-4",
        overallTrend === "improved" ? "border-l-emerald-500" :
        overallTrend === "declined" ? "border-l-red-500" : "border-l-muted-foreground",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", trendBg)}>
            <TrendIcon size={16} className={trendColor} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {displayName} Evolution
            </h3>
            <p className="text-xs text-muted-foreground">
              Comparing with previous results
            </p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          trendBg,
          trendColor
        )}>
          {overallTrend === "improved" ? "Improving" :
           overallTrend === "declined" ? "Declining" : "Stable"}
        </span>
      </div>

      {/* Evolution Items */}
      <div className="space-y-3">
        {evolvedFindings.map((finding, index) => {
          const itemTrend = finding.evolutionTrend || "stable";
          const ItemTrendIcon = itemTrend === "improved" ? TrendingUp :
                                itemTrend === "declined" ? TrendingDown : Minus;
          const itemColor = itemTrend === "improved" ? "text-emerald-500" :
                           itemTrend === "declined" ? "text-red-500" : "text-muted-foreground";
          const itemBg = itemTrend === "improved" ? "bg-emerald-500/10" :
                        itemTrend === "declined" ? "bg-red-500/10" : "bg-muted/50";

          return (
            <motion.div
              key={finding.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              {/* Trend Icon */}
              <div className={cn("p-1 rounded", itemBg)}>
                <ItemTrendIcon size={12} className={itemColor} />
              </div>

              {/* Finding info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {finding.title}
                </p>
                <p className={cn("text-xs", itemColor)}>
                  {finding.evolutionNote}
                </p>
              </div>

              {/* Current value */}
              {finding.value && (
                <span className={cn(
                  "text-sm font-semibold",
                  itemColor
                )}>
                  {finding.value}
                  {finding.unit && <span className="text-xs ml-0.5">{finding.unit}</span>}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <p className="text-xs text-muted-foreground">
            {overallTrend === "improved" 
              ? "Great progress! Keep up the good work with your current routine."
              : overallTrend === "declined"
              ? "Some values need attention. Check the recommendations above."
              : "Your values are stable. Continue monitoring for changes."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Compact evolution badge for use in other components
 */
export function EvolutionBadge({
  trend,
  note,
  className,
}: {
  trend: "improved" | "stable" | "declined";
  note?: string;
  className?: string;
}) {
  const TrendIcon = trend === "improved" ? TrendingUp :
                    trend === "declined" ? TrendingDown : Minus;
  const color = trend === "improved" ? "text-emerald-500" :
                trend === "declined" ? "text-red-500" : "text-muted-foreground";
  const bg = trend === "improved" ? "bg-emerald-500/10" :
             trend === "declined" ? "bg-red-500/10" : "bg-muted/50";

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
      bg,
      className
    )}>
      <TrendIcon size={12} className={color} />
      <span className={cn("text-xs font-medium", color)}>
        {trend === "improved" ? "Improved" :
         trend === "declined" ? "Declined" : "Stable"}
      </span>
      {note && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          · {note}
        </span>
      )}
    </div>
  );
}



