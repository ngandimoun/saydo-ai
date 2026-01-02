"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Utensils,
  Pill,
  Droplet,
  Sparkles,
  Dumbbell,
  Moon,
  ChevronRight,
  Check,
  Loader2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { HolisticPlan, PlanRecommendation, PlanType } from "@/lib/health/holistic-plans-generator";

/**
 * Plan type configuration
 */
const PLAN_CONFIG: Record<PlanType, {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
}> = {
  meal: {
    icon: Utensils,
    label: "Meal Plan",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  supplement: {
    icon: Pill,
    label: "Supplements",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  hydration: {
    icon: Droplet,
    label: "Hydration",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  lifestyle: {
    icon: Sparkles,
    label: "Lifestyle",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  exercise: {
    icon: Dumbbell,
    label: "Exercise",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  sleep: {
    icon: Moon,
    label: "Sleep",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
};

/**
 * Priority badge colors
 */
const PRIORITY_COLORS = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-amber-500/10 text-amber-500",
  low: "bg-blue-500/10 text-blue-500",
};

interface PlanTabProps {
  plan: HolisticPlan;
  isActive: boolean;
  onClick: () => void;
}

function PlanTab({ plan, isActive, onClick }: PlanTabProps) {
  const config = PLAN_CONFIG[plan.planType];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
        isActive
          ? cn(config.bg, config.color, "ring-1 ring-current/30")
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon size={18} />
      <span className="text-[10px] font-medium">{config.label}</span>
    </button>
  );
}

interface RecommendationItemProps {
  recommendation: PlanRecommendation;
  index: number;
}

function RecommendationItem({ recommendation, index }: RecommendationItemProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-3 rounded-xl border transition-all",
        isCompleted
          ? "bg-emerald-500/5 border-emerald-500/30"
          : "bg-muted/30 border-border/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <button
          onClick={() => setIsCompleted(!isCompleted)}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-muted-foreground/50 hover:border-foreground"
          )}
        >
          {isCompleted && <Check size={12} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-medium text-sm",
              isCompleted ? "text-muted-foreground line-through" : "text-foreground"
            )}>
              {recommendation.item}
            </h4>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
              PRIORITY_COLORS[recommendation.priority]
            )}>
              {recommendation.priority}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {recommendation.reason}
          </p>

          {recommendation.timing && (
            <p className="text-xs text-primary mt-1">
              ⏰ {recommendation.timing}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface PlanContentProps {
  plan: HolisticPlan;
}

function PlanContent({ plan }: PlanContentProps) {
  const config = PLAN_CONFIG[plan.planType];

  return (
    <div className="space-y-4">
      {/* Plan header */}
      <div>
        <h3 className="font-semibold text-foreground mb-1">{plan.title}</h3>
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}
      </div>

      {/* Based on systems */}
      {plan.basedOnSystems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Based on:</span>
          {plan.basedOnSystems.map((system) => (
            <span
              key={system}
              className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground"
            >
              {system}
            </span>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-2">
        {plan.recommendations.map((rec, index) => (
          <RecommendationItem
            key={index}
            recommendation={rec}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Fetch active holistic plans
 */
async function fetchHolisticPlans(): Promise<HolisticPlan[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("holistic_health_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("generated_at", { ascending: false });

  if (error) {
    console.error("[fetchHolisticPlans] Error:", error);
    return [];
  }

  return (data || []).map((p) => ({
    planType: p.plan_type as PlanType,
    title: p.title,
    description: p.description,
    recommendations: p.recommendations as PlanRecommendation[],
    basedOnSystems: p.based_on_systems || [],
    generatedAt: new Date(p.generated_at),
  }));
}

interface HolisticPlansProps {
  className?: string;
}

/**
 * Holistic Plans Component
 * 
 * Displays personalized health plans with tabs for different categories
 */
export function HolisticPlans({ className }: HolisticPlansProps) {
  const [activePlanType, setActivePlanType] = useState<PlanType | null>(null);

  const { data: plans = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["health", "holistic-plans"],
    queryFn: fetchHolisticPlans,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set initial active plan
  if (!activePlanType && plans.length > 0) {
    setActivePlanType(plans[0].planType);
  }

  const activePlan = plans.find((p) => p.planType === activePlanType);

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-6", className)}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading your plans...</span>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className={cn("saydo-card p-6 text-center", className)}>
        <Sparkles size={32} className="mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold text-foreground mb-1">
          Personalized Plans Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload health documents to generate personalized meal, supplement, and lifestyle plans.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card overflow-hidden", className)}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Personalized Plans</h3>
          <p className="text-xs text-muted-foreground">
            Based on all your health findings
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className={cn(
            "p-2 rounded-lg hover:bg-muted transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Plan tabs */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {plans.map((plan) => (
            <PlanTab
              key={plan.planType}
              plan={plan}
              isActive={plan.planType === activePlanType}
              onClick={() => setActivePlanType(plan.planType)}
            />
          ))}
        </div>
      </div>

      {/* Plan content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activePlan && (
            <motion.div
              key={activePlan.planType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PlanContent plan={activePlan} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}



