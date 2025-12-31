"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Upload,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Stethoscope,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthProfile, useHealthSystemsSummary } from "@/hooks/queries/use-health-profile";
import { BodySystemCard } from "./body-system-card";
import { CorrelationInsights } from "./correlation-insights";
import { EvolutionComparison } from "./evolution-comparison";

/**
 * Status summary counts
 */
interface StatusSummary {
  good: number;
  attention: number;
  concern: number;
  total: number;
}

/**
 * Calculate status summary from systems
 */
function calculateStatusSummary(
  bodySystems: Record<string, { overallStatus: string; findingCount: number }>
): StatusSummary {
  const summary: StatusSummary = { good: 0, attention: 0, concern: 0, total: 0 };

  for (const system of Object.values(bodySystems)) {
    switch (system.overallStatus) {
      case "good":
        summary.good++;
        break;
      case "attention":
        summary.attention++;
        break;
      case "concern":
        summary.concern++;
        break;
    }
    summary.total += system.findingCount;
  }

  return summary;
}

/**
 * Empty state component
 */
function EmptyHealthState({ onUpload }: { onUpload?: () => void }) {
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
        Upload your first health document (blood test, eye exam, etc.) and we'll analyze and track your health insights.
      </p>
      {onUpload && (
        <button
          onClick={onUpload}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          <Upload size={16} />
          Upload Health Document
        </button>
      )}
    </motion.div>
  );
}

/**
 * Health Overview Stats
 */
function HealthOverviewStats({
  statusSummary,
  systemCount,
  correlationCount,
}: {
  statusSummary: StatusSummary;
  systemCount: number;
  correlationCount: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Systems tracked */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-xl bg-primary/10 text-center"
      >
        <Activity size={18} className="mx-auto text-primary mb-1" />
        <p className="text-lg font-bold text-primary">{systemCount}</p>
        <p className="text-[10px] text-muted-foreground">Systems</p>
      </motion.div>

      {/* Healthy findings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-3 rounded-xl bg-emerald-500/10 text-center"
      >
        <CheckCircle size={18} className="mx-auto text-emerald-500 mb-1" />
        <p className="text-lg font-bold text-emerald-500">{statusSummary.good}</p>
        <p className="text-[10px] text-muted-foreground">Healthy</p>
      </motion.div>

      {/* Attention needed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-3 rounded-xl bg-amber-500/10 text-center"
      >
        <AlertTriangle size={18} className="mx-auto text-amber-500 mb-1" />
        <p className="text-lg font-bold text-amber-500">{statusSummary.attention}</p>
        <p className="text-[10px] text-muted-foreground">Attention</p>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-3 rounded-xl bg-purple-500/10 text-center"
      >
        <Sparkles size={18} className="mx-auto text-purple-500 mb-1" />
        <p className="text-lg font-bold text-purple-500">{correlationCount}</p>
        <p className="text-[10px] text-muted-foreground">Insights</p>
      </motion.div>
    </div>
  );
}

interface CumulativeHealthDashboardProps {
  onUpload?: () => void;
  className?: string;
}

/**
 * Cumulative Health Dashboard
 * 
 * The main dashboard showing all accumulated health data:
 * - Body systems with their findings
 * - Cross-system correlations
 * - Evolution tracking
 */
export function CumulativeHealthDashboard({
  onUpload,
  className,
}: CumulativeHealthDashboardProps) {
  let profile: ReturnType<typeof useHealthProfile>["data"] = null;
  let isLoading = false;
  let error: Error | null = null;
  let systems: ReturnType<typeof useHealthSystemsSummary>["systems"] = [];
  let systemCount = 0;
  let totalFindings = 0;
  let hasData = false;

  try {
    const profileQuery = useHealthProfile();
    profile = profileQuery.data;
    isLoading = profileQuery.isLoading;
    error = profileQuery.error as Error | null;

    const summaryQuery = useHealthSystemsSummary();
    systems = summaryQuery.systems;
    systemCount = summaryQuery.systemCount;
    totalFindings = summaryQuery.totalFindings;
    hasData = summaryQuery.hasData;
  } catch (hookError) {
    console.error("[CumulativeHealthDashboard] Hook error:", hookError);
    error = hookError as Error;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="saydo-card p-8 flex flex-col items-center justify-center">
          <Loader2 size={24} className="animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading your health profile...</p>
        </div>
      </div>
    );
  }

  // Error state - show empty state instead of breaking UI
  if (error) {
    console.error("[CumulativeHealthDashboard] Error loading profile:", error);
    return (
      <div className={cn("space-y-4", className)}>
        <EmptyHealthState onUpload={onUpload} />
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className={cn("space-y-4", className)}>
        <EmptyHealthState onUpload={onUpload} />
      </div>
    );
  }

  const statusSummary = calculateStatusSummary(profile?.bodySystems || {});
  const correlations = profile?.correlations || [];

  // Find systems with evolution for display
  const systemsWithEvolution = systems.filter((s) => s.hasEvolution);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-6", className)}
    >
      {/* Overview Stats */}
      <HealthOverviewStats
        statusSummary={statusSummary}
        systemCount={systemCount}
        correlationCount={correlations.length}
      />

      {/* Cross-System Correlations */}
      {correlations.length > 0 && (
        <CorrelationInsights
          correlations={correlations}
          maxVisible={2}
        />
      )}

      {/* Evolution Comparisons (if any) */}
      {systemsWithEvolution.length > 0 && (
        <div className="space-y-3">
          {systemsWithEvolution.slice(0, 2).map((system) => (
            <EvolutionComparison
              key={system.systemName}
              systemName={system.systemName}
              displayName={system.displayName}
              findings={system.currentFindings}
            />
          ))}
        </div>
      )}

      {/* Body Systems */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Your Body Systems</h2>
          <span className="text-xs text-muted-foreground">
            {totalFindings} findings across {systemCount} systems
          </span>
        </div>

        <div className="space-y-3">
          {systems.map((system, index) => (
            <BodySystemCard
              key={system.systemName}
              system={system}
              defaultExpanded={index < 2} // Expand first 2 by default
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
