/**
 * Health Profile Query Hook
 * 
 * Fetches the complete cumulative health profile for a user,
 * including all body system findings and correlations.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

/**
 * Finding type from database
 */
export interface BodySystemFinding {
  id: string;
  findingKey: string;
  title: string;
  value?: string;
  unit?: string;
  status: "good" | "attention" | "concern" | "info";
  explanation: string;
  actionTip?: string;
  iconName?: string;
  evolutionTrend?: "improved" | "stable" | "declined";
  evolutionNote?: string;
  createdAt: string;
  measuredAt?: string;
}

/**
 * Body system data structure
 */
export interface BodySystemData {
  systemName: string;
  displayName: string;
  iconName: string;
  lastUpdated: string;
  currentFindings: BodySystemFinding[];
  findingCount: number;
  hasEvolution: boolean;
  overallStatus: "good" | "attention" | "concern" | "info";
  overallTrend?: "improved" | "stable" | "declined";
}

/**
 * Health correlation from database
 */
export interface HealthCorrelation {
  id: string;
  correlationKey: string;
  primarySystem: string;
  relatedSystems: string[];
  title: string;
  explanation: string;
  confidence: number;
  actionTip: string;
  priority: "high" | "medium" | "low";
  iconName?: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Complete health profile
 */
export interface HealthProfile {
  userId: string;
  bodySystems: Record<string, BodySystemData>;
  systemCount: number;
  totalFindings: number;
  correlations: HealthCorrelation[];
  lastUpdated?: string;
}

/**
 * Body system display names and icons
 */
const BODY_SYSTEM_META: Record<string, { displayName: string; iconName: string }> = {
  eyes: { displayName: "Eyes & Vision", iconName: "eye" },
  digestive: { displayName: "Digestive Health", iconName: "apple" },
  skin: { displayName: "Skin Health", iconName: "sparkles" },
  blood: { displayName: "Blood & Hematology", iconName: "droplet" },
  cardiovascular: { displayName: "Heart & Cardiovascular", iconName: "heart" },
  hormones: { displayName: "Hormones & Endocrine", iconName: "activity" },
  nutrition: { displayName: "Nutrition & Vitamins", iconName: "pill" },
  respiratory: { displayName: "Respiratory", iconName: "wind" },
  musculoskeletal: { displayName: "Bones & Muscles", iconName: "bone" },
  neurological: { displayName: "Brain & Nerves", iconName: "brain" },
  renal: { displayName: "Kidney & Urinary", iconName: "filter" },
  hepatic: { displayName: "Liver Function", iconName: "zap" },
  immune: { displayName: "Immune System", iconName: "shield" },
  metabolic: { displayName: "Metabolism", iconName: "flame" },
  general: { displayName: "General Health", iconName: "stethoscope" },
};

/**
 * Fetch health profile from Supabase
 */
async function fetchHealthProfile(): Promise<HealthProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch all current findings
  const { data: findings, error: findingsError } = await supabase
    .from("body_system_findings")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_current", true)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (findingsError) {
    console.error("[fetchHealthProfile] Error fetching findings:", findingsError);
  }

  // Fetch active correlations
  const { data: correlations, error: correlationsError } = await supabase
    .from("health_correlations")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("is_dismissed", false)
    .order("confidence", { ascending: false });

  if (correlationsError) {
    console.error("[fetchHealthProfile] Error fetching correlations:", correlationsError);
  }

  // Group findings by body system
  const bodySystems: Record<string, BodySystemData> = {};
  let lastUpdated: string | undefined;

  for (const finding of findings || []) {
    const system = finding.body_system;
    const meta = BODY_SYSTEM_META[system] || { displayName: system, iconName: "circle" };

    if (!bodySystems[system]) {
      bodySystems[system] = {
        systemName: system,
        displayName: meta.displayName,
        iconName: meta.iconName,
        lastUpdated: finding.created_at,
        currentFindings: [],
        findingCount: 0,
        hasEvolution: false,
        overallStatus: "good",
      };
    }

    const bodySystem = bodySystems[system];

    bodySystem.currentFindings.push({
      id: finding.id,
      findingKey: finding.finding_key,
      title: finding.title,
      value: finding.value,
      unit: finding.unit,
      status: finding.status,
      explanation: finding.explanation,
      actionTip: finding.action_tip,
      iconName: finding.icon_name,
      evolutionTrend: finding.evolution_trend,
      evolutionNote: finding.evolution_note,
      createdAt: finding.created_at,
      measuredAt: finding.measured_at,
    });

    bodySystem.findingCount++;

    // Update overall status (concern > attention > info > good)
    if (finding.status === "concern") {
      bodySystem.overallStatus = "concern";
    } else if (finding.status === "attention" && bodySystem.overallStatus !== "concern") {
      bodySystem.overallStatus = "attention";
    } else if (finding.status === "info" && bodySystem.overallStatus === "good") {
      bodySystem.overallStatus = "info";
    }

    // Check for evolution
    if (finding.evolution_trend) {
      bodySystem.hasEvolution = true;
      // Set overall trend based on most recent evolution
      if (!bodySystem.overallTrend) {
        bodySystem.overallTrend = finding.evolution_trend;
      }
    }

    // Update last updated
    if (finding.created_at > bodySystem.lastUpdated) {
      bodySystem.lastUpdated = finding.created_at;
    }

    // Track global last updated
    if (!lastUpdated || finding.created_at > lastUpdated) {
      lastUpdated = finding.created_at;
    }
  }

  // Transform correlations
  const transformedCorrelations: HealthCorrelation[] = (correlations || []).map((c) => ({
    id: c.id,
    correlationKey: c.correlation_key,
    primarySystem: c.primary_system,
    relatedSystems: c.related_systems || [],
    title: c.title,
    explanation: c.explanation,
    confidence: c.confidence,
    actionTip: c.action_tip,
    priority: c.priority,
    iconName: c.icon_name,
    isActive: c.is_active,
    createdAt: c.created_at,
  }));

  return {
    userId: user.id,
    bodySystems,
    systemCount: Object.keys(bodySystems).length,
    totalFindings: findings?.length || 0,
    correlations: transformedCorrelations,
    lastUpdated,
  };
}

/**
 * Hook to get the user's cumulative health profile
 */
export function useHealthProfile() {
  return useQuery({
    queryKey: ["health", "profile"],
    queryFn: fetchHealthProfile,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to invalidate health profile (call after upload)
 */
export function useInvalidateHealthProfile() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["health", "profile"] });
  };
}

/**
 * Get findings for a specific body system
 */
export function useBodySystemFindings(bodySystem: string) {
  const { data: profile, ...rest } = useHealthProfile();

  const systemData = profile?.bodySystems[bodySystem];

  return {
    ...rest,
    data: systemData,
    findings: systemData?.currentFindings || [],
  };
}

/**
 * Get active correlations
 */
export function useHealthCorrelations() {
  const { data: profile, ...rest } = useHealthProfile();

  return {
    ...rest,
    data: profile?.correlations || [],
    count: profile?.correlations?.length || 0,
  };
}

/**
 * Get summary of all body systems
 */
export function useHealthSystemsSummary() {
  const { data: profile, ...rest } = useHealthProfile();

  const systems = profile ? Object.values(profile.bodySystems) : [];
  
  // Sort by status priority (concern > attention > info > good) then by last updated
  const sortedSystems = [...systems].sort((a, b) => {
    const statusOrder = { concern: 0, attention: 1, info: 2, good: 3 };
    const statusDiff = statusOrder[a.overallStatus] - statusOrder[b.overallStatus];
    if (statusDiff !== 0) return statusDiff;
    
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });

  return {
    ...rest,
    systems: sortedSystems,
    systemCount: profile?.systemCount || 0,
    totalFindings: profile?.totalFindings || 0,
    hasData: systems.length > 0,
  };
}


