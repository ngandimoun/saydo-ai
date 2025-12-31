"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Apple,
  Sparkles,
  Droplet,
  Heart,
  Activity,
  Pill,
  Wind,
  Bone,
  Brain,
  Filter,
  Zap,
  Shield,
  Flame,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BodySystemData, BodySystemFinding } from "@/hooks/queries/use-health-profile";

/**
 * Icon mapping for body systems and findings
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
  bone: Bone,
  brain: Brain,
  filter: Filter,
  zap: Zap,
  shield: Shield,
  flame: Flame,
  stethoscope: Stethoscope,
  info: Info,
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  "alert-circle": AlertCircle,
};

/**
 * Status colors and icons
 */
const STATUS_CONFIG = {
  good: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-500",
    icon: CheckCircle,
    label: "Good",
  },
  attention: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-500",
    icon: AlertTriangle,
    label: "Attention",
  },
  concern: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-500",
    icon: AlertCircle,
    label: "Needs Attention",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-500",
    icon: Info,
    label: "Info",
  },
};

/**
 * Trend icons and colors
 */
const TREND_CONFIG = {
  improved: {
    icon: TrendingUp,
    text: "text-emerald-500",
    label: "Improving",
  },
  stable: {
    icon: Minus,
    text: "text-muted-foreground",
    label: "Stable",
  },
  declined: {
    icon: TrendingDown,
    text: "text-red-500",
    label: "Declining",
  },
};

interface FindingItemProps {
  finding: BodySystemFinding;
  index: number;
}

function FindingItem({ finding, index }: FindingItemProps) {
  const [showFullTip, setShowFullTip] = useState(false);
  const statusConfig = STATUS_CONFIG[finding.status];
  const StatusIcon = statusConfig.icon;
  const FindingIcon = finding.iconName ? ICON_MAP[finding.iconName] || Info : Info;
  const trendConfig = finding.evolutionTrend ? TREND_CONFIG[finding.evolutionTrend] : null;
  const TrendIcon = trendConfig?.icon;
  
  // Check if tip is long (for mobile truncation)
  const tipIsLong = finding.actionTip && finding.actionTip.length > 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-3 rounded-xl border",
        statusConfig.bg,
        statusConfig.border
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={cn("p-1.5 rounded-lg", statusConfig.bg)}>
          <StatusIcon size={14} className={statusConfig.text} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-foreground">
              {finding.title}
            </h4>
            {finding.value && (
              <span className={cn("text-xs font-semibold", statusConfig.text)}>
                {finding.value}
                {finding.unit && ` ${finding.unit}`}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {finding.explanation}
          </p>

          {/* Evolution indicator */}
          {trendConfig && TrendIcon && finding.evolutionNote && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendIcon size={12} className={trendConfig.text} />
              <span className={cn("text-xs", trendConfig.text)}>
                {finding.evolutionNote}
              </span>
            </div>
          )}

          {/* Action tip - Enhanced for mobile with tap-to-expand */}
          {finding.actionTip && (
            <button
              onClick={() => setShowFullTip(!showFullTip)}
              className="mt-3 w-full text-left p-2.5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
            >
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-lg bg-primary/10 flex-shrink-0">
                  <Sparkles size={12} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                    Action Recommandée
                  </span>
                  <p className={cn(
                    "text-xs text-foreground mt-1 leading-relaxed",
                    !showFullTip && tipIsLong && "line-clamp-3"
                  )}>
                    {finding.actionTip}
                  </p>
                  {tipIsLong && (
                    <span className="text-[10px] text-primary mt-1 inline-flex items-center gap-0.5">
                      {showFullTip ? (
                        <>
                          <ChevronUp size={10} />
                          Voir moins
                        </>
                      ) : (
                        <>
                          <ChevronDown size={10} />
                          Voir plus
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface BodySystemCardProps {
  system: BodySystemData;
  defaultExpanded?: boolean;
  className?: string;
}

export function BodySystemCard({
  system,
  defaultExpanded = true,
  className,
}: BodySystemCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const SystemIcon = ICON_MAP[system.iconName] || Stethoscope;
  const statusConfig = STATUS_CONFIG[system.overallStatus];
  const trendConfig = system.overallTrend ? TREND_CONFIG[system.overallTrend] : null;
  const TrendIcon = trendConfig?.icon;

  // Format last updated
  const lastUpdated = new Date(system.lastUpdated);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  const lastUpdatedText = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays}d ago`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "saydo-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* System Icon with status ring */}
          <div className={cn(
            "relative w-10 h-10 rounded-full flex items-center justify-center",
            statusConfig.bg
          )}>
            <SystemIcon size={20} className={statusConfig.text} />
            {/* Status dot */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
              system.overallStatus === "good" ? "bg-emerald-500" :
              system.overallStatus === "attention" ? "bg-amber-500" :
              system.overallStatus === "concern" ? "bg-red-500" : "bg-blue-500"
            )} />
          </div>

          <div className="text-left">
            <h3 className="font-semibold text-foreground">
              {system.displayName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={10} />
                {lastUpdatedText}
              </span>
              {trendConfig && TrendIcon && (
                <span className={cn("text-xs flex items-center gap-1", trendConfig.text)}>
                  <TrendIcon size={10} />
                  {trendConfig.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Finding count badge */}
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            statusConfig.bg,
            statusConfig.text
          )}>
            {system.findingCount} {system.findingCount === 1 ? "finding" : "findings"}
          </span>

          {/* Expand/Collapse */}
          {isExpanded ? (
            <ChevronUp size={18} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={18} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Findings */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-2">
              {system.currentFindings.map((finding, index) => (
                <FindingItem
                  key={finding.id}
                  finding={finding}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Empty state when no body systems have data
 */
export function EmptyBodySystemState({ onUpload }: { onUpload?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="saydo-card p-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <Stethoscope size={28} className="text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">
        Start Building Your Health Profile
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        Upload your first health document (blood test, eye exam, etc.) and we'll start tracking your health insights.
      </p>
      {onUpload && (
        <button
          onClick={onUpload}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          Upload Health Document
        </button>
      )}
    </motion.div>
  );
}


