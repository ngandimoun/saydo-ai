/**
 * Holistic Plans Generator
 * 
 * Generates personalized health plans (meal, supplement, hydration, lifestyle)
 * based on ALL accumulated health findings across body systems.
 * Respects user's preferred language.
 */

import { createClient } from "@/lib/supabase";
import OpenAI from "openai";

/**
 * Language code to language name mapping
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  ko: "Korean",
  hi: "Hindi",
  tr: "Turkish",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  th: "Thai",
  vi: "Vietnamese",
};

/**
 * Plan types
 */
export type PlanType = "meal" | "supplement" | "hydration" | "lifestyle" | "exercise" | "sleep";

/**
 * Plan recommendation
 */
export interface PlanRecommendation {
  item: string;
  reason: string;
  timing?: string;
  priority: "high" | "medium" | "low";
  relatedSystems?: string[];
}

/**
 * Holistic plan
 */
export interface HolisticPlan {
  planType: PlanType;
  title: string;
  description?: string;
  recommendations: PlanRecommendation[];
  basedOnSystems: string[];
  generatedAt: Date;
}

/**
 * Get OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate holistic plans based on all user's health findings
 * @param userId - User ID
 * @param userLanguage - User's preferred language code (default: "en")
 */
export async function generateHolisticPlans(
  userId: string, 
  userLanguage: string = "en"
): Promise<HolisticPlan[]> {
  const supabase = createClient();

  // Fetch all current findings
  const { data: findings, error: findingsError } = await supabase
    .from("body_system_findings")
    .select("*")
    .eq("user_id", userId)
    .eq("is_current", true);

  if (findingsError || !findings || findings.length === 0) {
    return [];
  }

  // Fetch correlations
  const { data: correlations } = await supabase
    .from("health_correlations")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  // Group findings by system for context
  const findingsBySystem: Record<string, typeof findings> = {};
  for (const finding of findings) {
    const system = finding.body_system;
    if (!findingsBySystem[system]) {
      findingsBySystem[system] = [];
    }
    findingsBySystem[system].push(finding);
  }

  // Create summary for AI
  const findingsSummary = Object.entries(findingsBySystem)
    .map(([system, systemFindings]) => {
      const items = systemFindings.map((f) => 
        `- ${f.title}: ${f.value || "N/A"} (${f.status}) - ${f.explanation}`
      ).join("\n");
      return `## ${system.toUpperCase()}\n${items}`;
    })
    .join("\n\n");

  const correlationsSummary = correlations?.map((c) =>
    `- ${c.title}: ${c.explanation}`
  ).join("\n") || "No correlations detected";

  const openai = getOpenAIClient();
  const languageName = LANGUAGE_NAMES[userLanguage] || "English";

  const prompt = `You are a holistic health advisor. Based on the user's health findings and correlations, generate personalized recommendations for each plan type.

## IMPORTANT: LANGUAGE
ALWAYS respond in ${languageName}. All titles, descriptions, item names, and reasons MUST be in ${languageName}.

## USER'S HEALTH FINDINGS:
${findingsSummary}

## CROSS-SYSTEM CORRELATIONS:
${correlationsSummary}

Generate recommendations for each of these plan types:
1. **Meal Plan** - What foods to eat and avoid based on their findings
2. **Supplement Plan** - Which supplements would help based on deficiencies or concerns
3. **Hydration Plan** - Water intake and beverage recommendations
4. **Lifestyle Plan** - Daily habits, stress management, routines

For each plan, provide 3-5 specific, actionable recommendations.

Respond with JSON:
{
  "plans": [
    {
      "planType": "meal|supplement|hydration|lifestyle",
      "title": "Plan title in ${languageName}",
      "description": "Brief description in ${languageName}",
      "recommendations": [
        {
          "item": "Specific recommendation in ${languageName}",
          "reason": "Why this helps in ${languageName}",
          "timing": "When to do this in ${languageName}",
          "priority": "high|medium|low",
          "relatedSystems": ["system1", "system2"]
        }
      ],
      "basedOnSystems": ["system1", "system2"]
    }
  ]
}

Make recommendations specific to their actual findings. Don't give generic advice.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use smaller model for cost efficiency
      messages: [
        { role: "system", content: `You are a holistic health advisor creating personalized plans based on clinical findings. ALWAYS respond in ${languageName}.` },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content) as { plans: HolisticPlan[] };
    
    // Add generated timestamp
    const plans = (parsed.plans || []).map((plan) => ({
      ...plan,
      generatedAt: new Date(),
    }));

    return plans;
  } catch (error) {
    console.error("[generateHolisticPlans] Error:", error);
    return [];
  }
}

/**
 * Store holistic plans in the database
 */
export async function storeHolisticPlans(
  userId: string,
  plans: HolisticPlan[]
): Promise<number> {
  const supabase = createClient();
  let storedCount = 0;

  for (const plan of plans) {
    // Deactivate existing plan of same type
    await supabase
      .from("holistic_health_plans")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("plan_type", plan.planType)
      .eq("is_active", true);

    // Insert new plan
    const { error } = await supabase
      .from("holistic_health_plans")
      .insert({
        user_id: userId,
        plan_type: plan.planType,
        title: plan.title,
        description: plan.description,
        recommendations: plan.recommendations,
        based_on_systems: plan.basedOnSystems,
        is_active: true,
        generated_at: plan.generatedAt.toISOString(),
      });

    if (!error) {
      storedCount++;
    } else {
      console.error("[storeHolisticPlans] Error:", error);
    }
  }

  return storedCount;
}

/**
 * Generate and store holistic plans
 * @param userId - User ID
 * @param userLanguage - User's preferred language code (default: "en")
 */
export async function generateAndStoreHolisticPlans(
  userId: string, 
  userLanguage: string = "en"
): Promise<{
  generated: number;
  stored: number;
}> {
  const plans = await generateHolisticPlans(userId, userLanguage);
  const stored = await storeHolisticPlans(userId, plans);

  return {
    generated: plans.length,
    stored,
  };
}

/**
 * Get active plans for a user
 */
export async function getActiveHolisticPlans(userId: string): Promise<HolisticPlan[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("holistic_health_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("generated_at", { ascending: false });

  if (error) {
    console.error("[getActiveHolisticPlans] Error:", error);
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

