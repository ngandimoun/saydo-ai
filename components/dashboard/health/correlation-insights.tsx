"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Lightbulb,
  ChevronRight,
  X,
  Eye,
  Apple,
  Sparkles,
  Droplet,
  Heart,
  Activity,
  Pill,
  Wind,
  Shield,
  Flame,
  Zap,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthCorrelation } from "@/hooks/queries/use-health-profile";
import { createClient } from "@/lib/supabase";

/**
 * Icon mapping
 */
const ICON_MAP: Record<string, LucideIcon> = {
  eye: Eye,
  apple: Apple,
  sparkles: Sparkles,
  droplet: Droplet,
  heart: Heart,
  activity: Activity,
  pill: Pill,
  wind: Wind,
  shield: Shield,
  flame: Flame,
  zap: Zap,
  brain: Brain,
  link: Link2,
  "battery-low": Zap,
  sun: Sparkles,
};

/**
 * Priority colors
 */
const PRIORITY_CONFIG = {
  high: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-500",
    badge: "bg-red-500/20 text-red-500",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-500",
    badge: "bg-amber-500/20 text-amber-500",
  },
  low: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-500",
    badge: "bg-blue-500/20 text-blue-500",
  },
};

interface CorrelationCardProps {
  correlation: HealthCorrelation;
  onDismiss?: (id: string) => void;
  index: number;
}

function CorrelationCard({ correlation, onDismiss, index }: CorrelationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const config = PRIORITY_CONFIG[correlation.priority];
  const CorrelationIcon = correlation.iconName 
    ? ICON_MAP[correlation.iconName] || Link2 
    : Link2;

  const handleDismiss = async () => {
    if (!onDismiss) return;
    
    setIsDismissing(true);
    try {
      const supabase = createClient();
      await supabase
        .from("health_correlations")
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq("id", correlation.id);
      
      onDismiss(correlation.id);
    } catch (error) {
      console.error("Failed to dismiss correlation:", error);
    }
    setIsDismissing(false);
  };

  // Get related system names
  const allSystems = [correlation.primarySystem, ...correlation.relatedSystems];
  const systemNames = allSystems.map((s) => {
    const names: Record<string, string> = {
      eyes: "Eyes",
      digestive: "Digestive",
      skin: "Skin",
      blood: "Blood",
      cardiovascular: "Heart",
      hormones: "Hormones",
      nutrition: "Nutrition",
      respiratory: "Respiratory",
      musculoskeletal: "Bones",
      neurological: "Brain",
      renal: "Kidneys",
      hepatic: "Liver",
      immune: "Immune",
      metabolic: "Metabolism",
      general: "General",
    };
    return names[s] || s;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative p-4 rounded-xl border",
        config.bg,
        config.border
      )}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className={cn(
            "absolute top-2 right-2 p-1 rounded-full",
            "hover:bg-background/50 transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <X size={14} />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 pr-6">
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <CorrelationIcon size={18} className={config.text} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-foreground">
              {correlation.title}
            </h4>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
              config.badge
            )}>
              {correlation.priority}
            </span>
          </div>

          {/* Related systems */}
          <div className="flex flex-wrap gap-1 mb-2">
            {systemNames.map((name, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-background/50 text-[10px] text-muted-foreground"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Explanation */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isExpanded ? correlation.explanation : correlation.explanation.slice(0, 120)}
            {!isExpanded && correlation.explanation.length > 120 && "..."}
          </p>

          {/* Expand/collapse for long explanations */}
          {correlation.explanation.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary mt-1 hover:underline"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>

      {/* Action tip */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="mt-3 pt-3 border-t border-border/50"
      >
        <div className="flex items-start gap-2">
          <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">
            {correlation.actionTip}
          </p>
        </div>
      </motion.div>

      {/* Confidence indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-background/50">
          <div
            className={cn("h-full rounded-full", config.text.replace("text-", "bg-"))}
            style={{ width: `${correlation.confidence * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {Math.round(correlation.confidence * 100)}% confidence
        </span>
      </div>
    </motion.div>
  );
}

interface CorrelationInsightsProps {
  correlations: HealthCorrelation[];
  onDismiss?: (id: string) => void;
  className?: string;
  maxVisible?: number;
}

/**
 * Correlation Insights Component
 * 
 * Displays cross-system health correlations with explanations
 * and action tips.
 */
export function CorrelationInsights({
  correlations,
  onDismiss,
  className,
  maxVisible = 3,
}: CorrelationInsightsProps) {
  const [showAll, setShowAll] = useState(false);

  if (correlations.length === 0) {
    return null;
  }

  const visibleCorrelations = showAll 
    ? correlations 
    : correlations.slice(0, maxVisible);
  const hiddenCount = correlations.length - maxVisible;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Link2 size={14} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Cross-System Insights
            </h3>
            <p className="text-xs text-muted-foreground">
              Connections between your health findings
            </p>
          </div>
        </div>
        <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
          {correlations.length} {correlations.length === 1 ? "insight" : "insights"}
        </span>
      </div>

      {/* Correlation cards */}
      <AnimatePresence>
        {visibleCorrelations.map((correlation, index) => (
          <CorrelationCard
            key={correlation.id}
            correlation={correlation}
            onDismiss={onDismiss}
            index={index}
          />
        ))}
      </AnimatePresence>

      {/* Show more/less button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={cn(
            "w-full p-3 rounded-xl border border-dashed border-border",
            "text-sm text-muted-foreground",
            "hover:bg-muted/30 hover:text-foreground transition-colors",
            "flex items-center justify-center gap-2"
          )}
        >
          {showAll ? (
            <>Show less</>
          ) : (
            <>
              Show {hiddenCount} more {hiddenCount === 1 ? "insight" : "insights"}
              <ChevronRight size={14} />
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}

/**
 * Empty state when no correlations
 */
export function NoCorrelationsState() {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center">
      <Link2 size={24} className="mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">
        No cross-system connections detected yet.
        <br />
        <span className="text-xs">
          Upload more health documents to discover insights.
        </span>
      </p>
    </div>
  );
}



