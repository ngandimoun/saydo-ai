/**
 * Intervention Generation Service
 * 
 * Generates context-aware proactive health interventions based on:
 * - Time of day
 * - User location (UV, weather)
 * - Calendar events
 * - Health data (biomarkers, status)
 * - Skincare routine timing
 */

import { createClient } from "@supabase/supabase-js";
import { getUserContext, getUserTimezone } from "@/src/mastra/tools/user-profile-tool";
import { createInterventionTool } from "@/src/mastra/tools/health-engagement-tools";

/**
 * Get Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Generate time-based interventions
 */
export async function generateTimeBasedInterventions(userId: string) {
  const supabase = getSupabaseClient();
  const userContext = await getUserContext(userId);
  const timezone = await getUserTimezone(userId);
  
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const hour = now.getHours();
  const interventions: string[] = [];

  // Morning interventions (6-9 AM)
  if (hour >= 6 && hour < 9) {
    // Skincare routine reminder
    const { data: skincareProfile } = await supabase
      .from("skincare_profiles")
      .select("skin_type")
      .eq("user_id", userId)
      .single();

    if (skincareProfile) {
      const result = await createInterventionTool.execute({
        userId,
        type: "skincare_routine",
        context: {
          time: "morning",
          routineType: "am",
        },
      });
      if (result.success) {
        interventions.push(result.interventionId || "");
      }
    }

    // Morning hydration reminder
    const hydrationResult = await createInterventionTool.execute({
      userId,
      type: "hydration_safety",
      context: {
        time: "morning",
        message: "Start your day with hydration",
      },
    });
    if (hydrationResult.success) {
      interventions.push(hydrationResult.interventionId || "");
    }
  }

  // Meal time interventions (11-13, 17-19)
  if ((hour >= 11 && hour < 13) || (hour >= 17 && hour < 19)) {
    const mealResult = await createInterventionTool.execute({
      userId,
      type: "blood_group_fueling",
      context: {
        time: hour >= 11 && hour < 13 ? "lunch" : "dinner",
        mealTime: hour >= 11 && hour < 13 ? "lunch" : "dinner",
      },
    });
    if (mealResult.success) {
      interventions.push(mealResult.interventionId || "");
    }
  }

  // Evening interventions (19-22)
  if (hour >= 19 && hour < 22) {
    // Skincare PM routine
    const { data: skincareProfile } = await supabase
      .from("skincare_profiles")
      .select("skin_type")
      .eq("user_id", userId)
      .single();

    if (skincareProfile) {
      const result = await createInterventionTool.execute({
        userId,
        type: "skincare_routine",
        context: {
          time: "evening",
          routineType: "pm",
        },
      });
      if (result.success) {
        interventions.push(result.interventionId || "");
      }
    }

    // Sleep strategy
    const sleepResult = await createInterventionTool.execute({
      userId,
      type: "sleep_strategy",
      context: {
        time: "evening",
        bedtime: "soon",
      },
    });
    if (sleepResult.success) {
      interventions.push(sleepResult.interventionId || "");
    }
  }

  return interventions;
}

/**
 * Generate location-based interventions
 */
export async function generateLocationBasedInterventions(userId: string) {
  const supabase = getSupabaseClient();
  const interventions: string[] = [];

  // Get latest location
  const { data: location } = await supabase
    .from("user_locations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!location) {
    return interventions;
  }

  // Get environment data
  const { data: envData } = await supabase
    .from("environment_data")
    .select("*")
    .eq("user_id", userId)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  // UV Advisor intervention
  if (envData?.uv_index && envData.uv_index >= 3) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("skin_tone")
      .eq("id", userId)
      .single();

    const uvResult = await createInterventionTool.execute({
      userId,
      type: "uv_advisor",
      context: {
        location: `${location.city || ""}, ${location.country || ""}`,
        uvIndex: envData.uv_index,
        skinTone: profile?.skin_tone,
      },
    });
    if (uvResult.success) {
      interventions.push(uvResult.interventionId || "");
    }
  }

  // Environmental shield for poor air quality
  if (envData?.air_quality_index && envData.air_quality_index > 100) {
    const envResult = await createInterventionTool.execute({
      userId,
      type: "environmental_shield",
      context: {
        location: `${location.city || ""}, ${location.country || ""}`,
        airQuality: envData.air_quality_index,
        airQualityCategory: envData.air_quality_category,
      },
    });
    if (envResult.success) {
      interventions.push(envResult.interventionId || "");
    }
  }

  return interventions;
}

/**
 * Generate calendar-based interventions
 */
export async function generateCalendarBasedInterventions(userId: string) {
  // This would integrate with calendar API
  // For now, return empty array
  // TODO: Integrate with calendar service
  return [];
}

/**
 * Generate health data-based interventions
 */
export async function generateHealthDataInterventions(userId: string) {
  const supabase = getSupabaseClient();
  const interventions: string[] = [];

  // Check for abnormal biomarkers
  const { data: abnormalBiomarkers } = await supabase
    .from("biomarkers")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["critical_low", "critical_high", "low", "high"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (abnormalBiomarkers && abnormalBiomarkers.length > 0) {
    const recoveryResult = await createInterventionTool.execute({
      userId,
      type: "recovery_adjuster",
      context: {
        biomarkers: abnormalBiomarkers.map(b => ({
          name: b.name,
          value: b.value,
          status: b.status,
        })),
        source: "biomarkers",
      },
    });
    if (recoveryResult.success) {
      interventions.push(recoveryResult.interventionId || "");
    }
  }

  return interventions;
}

/**
 * Generate all interventions for a user
 */
export async function generateAllInterventions(userId: string) {
  try {
    const [
      timeBased,
      locationBased,
      calendarBased,
      healthDataBased,
    ] = await Promise.all([
      generateTimeBasedInterventions(userId),
      generateLocationBasedInterventions(userId),
      generateCalendarBasedInterventions(userId),
      generateHealthDataInterventions(userId),
    ]);

    return {
      success: true,
      interventions: [
        ...timeBased,
        ...locationBased,
        ...calendarBased,
        ...healthDataBased,
      ],
    };
  } catch (error) {
    console.error("Error generating interventions:", error);
    return {
      success: false,
      interventions: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}



