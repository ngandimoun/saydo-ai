import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getUserContext } from "./user-profile-tool";
import { getUserIdFromContext } from "./utils";

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
 * Get OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  return new OpenAI({ apiKey });
}

// ============================================
// GENERATE RECOMMENDATIONS TOOL
// ============================================

export const generateRecommendationsTool = createTool({
  id: "generate-recommendations",
  description: "Generate personalized health recommendations based on user's health data, lab results, and profile. Always address user by name and respond in their language. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
    analysisData: z.object({
      documentId: z.string().optional(),
      biomarkers: z.array(z.object({
        name: z.string(),
        value: z.number(),
        status: z.string(),
      })).optional(),
      insights: z.array(z.string()).optional(),
    }).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    recommendations: z.array(z.object({
      type: z.enum(["food", "drink", "exercise", "sleep", "supplement", "lifestyle"]),
      title: z.string(),
      description: z.string(),
      reason: z.string(),
      category: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      timing: z.string().optional(),
      frequency: z.string().optional(),
      specificExamples: z.array(z.string()).optional(),
      alternatives: z.array(z.string()).optional(),
      howToUse: z.string().optional(),
    })),
  }),
  execute: async ({ userId, analysisData }, context?) => {
    try {
      // Validate and get userId from context
      const actualUserId = getUserIdFromContext(userId, context);
      
      const userContext = await getUserContext(actualUserId);
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();

      // Get recent biomarkers if not provided
      let biomarkers = analysisData?.biomarkers || [];
      if (biomarkers.length === 0) {
        const { data: recentBiomarkers } = await supabase
          .from("biomarkers")
          .select("name, value, status")
          .eq("user_id", actualUserId)
          .order("created_at", { ascending: false })
          .limit(10);
        
        biomarkers = recentBiomarkers?.map(b => ({
          name: b.name,
          value: Number(b.value),
          status: b.status || "normal",
        })) || [];
      }

      const prompt = `You are a personalized health advisor helping ${userContext.preferredName}.
Respond in ${userContext.language}.

User Profile:
- Blood Group: ${userContext.bloodGroup || "Unknown"}
- Allergies: ${userContext.allergies.join(", ") || "None"}
- Health Interests: ${userContext.healthInterests.join(", ") || "None"}
- Age: ${userContext.age || "Unknown"}
- Gender: ${userContext.gender || "Unknown"}

Recent Biomarkers:
${biomarkers.map(b => `- ${b.name}: ${b.value} (${b.status})`).join("\n") || "None"}

## CRITICAL RULES:
1. **BE EXTREMELY SPECIFIC** - Never give vague advice. Always name specific products, brands, or alternatives.
2. **INCLUDE EXAMPLES** - Every recommendation MUST include 2-3 specific examples.
3. **PROVIDE ALTERNATIVES** - Always give 2-3 alternatives in case user can't find or doesn't like the main suggestion.
4. **NAME BRANDS** - When recommending supplements, include brand examples (Now Foods, Garden of Life, etc.).
5. **EXPLAIN HOW** - Include specific dosage, timing, and method of use.

Generate 5-7 personalized health recommendations. For each:
1. Address ${userContext.preferredName} by name in the description
2. Explain WHY it's recommended based on their biomarkers
3. Give SPECIFIC product names, foods, or activities
4. Include ALTERNATIVES

## EXAMPLE OF SPECIFIC RECOMMENDATIONS:

BAD: "Prenez un supplément de fibres"
GOOD: "Prenez un supplément de fibres: psyllium husk (Metamucil, Now Foods) 1 cuillère à soupe avant les repas. Alternatives: graines de chia dans votre smoothie, graines de lin moulues, flocons d'avoine."

BAD: "Buvez plus d'eau"
GOOD: "Buvez 8 verres d'eau par jour. Essayez: eau citronnée le matin, eau infusée concombre-menthe, thé vert (Lipton, Twinings), tisanes camomille."

BAD: "Mangez plus de légumes verts"
GOOD: "Ajoutez des légumes verts riches en folate: épinards frais (en salade ou smoothie), brocoli vapeur, chou kale. Alternatives si vous n'aimez pas les épinards: roquette, cresson, blettes."

Return JSON:
{
  "recommendations": [
    {
      "type": "food" | "drink" | "exercise" | "sleep" | "supplement" | "lifestyle",
      "title": "Short title",
      "description": "Detailed description with SPECIFIC examples, brands, and alternatives",
      "reason": "Why this is recommended based on biomarkers - be specific about which marker",
      "category": "nutrition" | "exercise" | "sleep" | "mental_health" | "hydration" | "general",
      "priority": "high" | "medium" | "low",
      "timing": "specific time (e.g., 'morning before breakfast', 'with meals')",
      "frequency": "how often (e.g., 'daily', '3x per week')",
      "specificExamples": ["Example 1 with brand", "Example 2", "Example 3"],
      "alternatives": ["Alternative 1", "Alternative 2"],
      "howToUse": "Specific instructions (e.g., '1 tablespoon mixed in water')"
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-nano-2025-08-07",
        messages: [
          { role: "system", content: "You are a personalized health advisor. Always respond in valid JSON format." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      const recommendations = response.recommendations || [];

      // Filter and validate recommendations before saving
      const validRecommendations = recommendations.filter((rec: any) => 
        rec && (rec.title || rec.name || rec.description)
      );

      // Save recommendations to database with enhanced fields
      if (validRecommendations.length > 0) {
        const { error } = await supabase
          .from("health_recommendations")
          .insert(
            validRecommendations.map((rec: any) => ({
              user_id: actualUserId,
              type: rec.type || "lifestyle",
              title: rec.title || rec.name || "Health Recommendation",
              description: rec.description || rec.title || "No description available",
              reason: rec.reason,
              category: rec.category || "general",
              priority: rec.priority || "medium",
              timing: rec.timing,
              frequency: rec.frequency,
              related_document_id: analysisData?.documentId,
              // New fields for specificity
              specific_examples: rec.specificExamples || [],
              alternatives: rec.alternatives || [],
              how_to_use: rec.howToUse,
            }))
          );

        if (error) {
          console.error("Failed to save recommendations:", error);
        }
      }

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return {
        success: false,
        recommendations: [],
      };
    }
  },
});

// ============================================
// GENERATE MEAL PLAN TOOL
// ============================================

export const generateMealPlanTool = createTool({
  id: "generate-meal-plan",
  description: "Generate personalized meal plan based on biomarkers, blood group, and allergies. Always address user by name. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
    type: z.enum(["weekly", "monthly"]).default("weekly"),
    biomarkerIds: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    mealPlanId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, type, biomarkerIds }, context?) => {
    try {
      // Validate and get userId from context
      const actualUserId = getUserIdFromContext(userId, context);
      
      const userContext = await getUserContext(actualUserId);
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();

      // Get biomarkers - only use .in() if biomarkerIds array has items
      let biomarkersQuery = supabase
        .from("biomarkers")
        .select("*")
        .eq("user_id", actualUserId);
      
      if (biomarkerIds && biomarkerIds.length > 0) {
        biomarkersQuery = biomarkersQuery.in("id", biomarkerIds);
      }
      
      const { data: biomarkers } = await biomarkersQuery
        .order("created_at", { ascending: false });

      const prompt = `Create a ${type} meal plan for ${userContext.preferredName}.
Respond in ${userContext.language}.

User Profile:
- Blood Group: ${userContext.bloodGroup || "Unknown"}
- Allergies: ${userContext.allergies.join(", ") || "None"}
- Age: ${userContext.age || "Unknown"}
- Weight: ${userContext.weight || "Unknown"} kg

Biomarkers:
${biomarkers?.map(b => `- ${b.name}: ${b.value} ${b.unit} (${b.status || "normal"})`).join("\n") || "None"}

## CRITICAL RULES:
1. **FULL NAMES** - Write complete meal names, never truncate. Example: "Yaourt grec nature avec fruits rouges et miel" not "Yaourt nature avec..."
2. **SPECIFIC INGREDIENTS** - Name specific products/brands. Example: "Yaourt grec (Fage, Chobani)" not just "yaourt"
3. **ALTERNATIVES** - Every meal MUST have 2-3 alternatives in case ingredient is unavailable
4. **SUBSTITUTIONS** - For each main ingredient, provide substitutes. Example: if using spinach, suggest "kale, swiss chard"
5. **WHY** - Explain why each meal is recommended based on biomarkers

Generate a ${type} meal plan with breakfast, lunch, dinner, snacks, and supplements.

For EACH meal, include:
- Full descriptive name (not truncated)
- 2-3 alternatives
- Key ingredient substitutions
- Why this meal helps with their health markers

Return JSON:
{
  "meal_plan": {
    "Monday": {
      "breakfast": "Yaourt grec (Fage, Chobani ou Skyr) avec fruits rouges frais et granola aux noix",
      "breakfast_alternatives": ["Smoothie bowl aux fruits", "Avoine overnight avec graines de chia"],
      "breakfast_substitutions": {"yaourt grec": "yaourt coco, yaourt amande", "fruits rouges": "banane, mangue"},
      "breakfast_why": "Riche en protéines pour stabiliser la glycémie",
      "lunch": "Salade de quinoa avec poulet grillé, avocat et légumes colorés",
      "lunch_alternatives": ["Bowl de riz brun avec saumon", "Wrap de dinde aux légumes"],
      "lunch_substitutions": {"quinoa": "riz brun, boulgour", "poulet": "tofu, saumon"},
      "lunch_why": "Protéines maigres et fibres pour maintenir l'énergie",
      "dinner": "...",
      "dinner_alternatives": [...],
      "snack": "...",
      "snack_alternatives": [...]
    },
    "Tuesday": {...}
  },
  "supplements": {
    "daily": ["Oméga-3 (Now Foods, Nordic Naturals) - 1000mg avec le repas", "Vitamine D3 (Garden of Life) - 2000 IU le matin"]
  },
  "hydration": "8 verres d'eau/jour. Suggestions: eau citronnée le matin, thé vert l'après-midi, tisane camomille le soir"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-nano-2025-08-07",
        messages: [
          { role: "system", content: "You are a nutritionist. Return valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const mealPlanData = JSON.parse(completion.choices[0].message.content || "{}");

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (type === "weekly" ? 7 : 30));

      // Save meal plan
      const { data: mealPlan, error } = await supabase
        .from("meal_plans")
        .insert({
          user_id: actualUserId,
          type,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          plan_data: mealPlanData,
          based_on_labs: biomarkerIds || [],
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        mealPlanId: mealPlan.id,
      };
    } catch (error) {
      console.error("Error generating meal plan:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// GET MEAL PLAN TOOL
// ============================================

export const getMealPlanTool = createTool({
  id: "get-meal-plan",
  description: "🚨 MANDATORY: You MUST call this tool for ANY question about meals, food, snacks, breakfast, lunch, dinner, or menu. Memory and cached data are NOT valid - you MUST call this tool every time. Returns the meal plan with a `todaysMeals` field containing today's specific meals (breakfast, lunch, dinner, snack) with alternatives and substitutions. **ALWAYS use the `todaysMeals` field when responding about today's meals** - it has the correct date calculation. The `mealPlan.planData` contains the full weekly plan for reference. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    mealPlan: z.object({
      id: z.string(),
      type: z.enum(["weekly", "monthly"]),
      startDate: z.string(),
      endDate: z.string(),
      planData: z.any(),
      basedOnLabs: z.array(z.string()),
    }).optional(),
    todaysMeals: z.object({
      dayName: z.string(),
      breakfast: z.string().optional(),
      breakfast_alternatives: z.array(z.string()).optional(),
      breakfast_substitutions: z.record(z.string()).optional(),
      breakfast_why: z.string().optional(),
      lunch: z.string().optional(),
      lunch_alternatives: z.array(z.string()).optional(),
      lunch_substitutions: z.record(z.string()).optional(),
      lunch_why: z.string().optional(),
      dinner: z.string().optional(),
      dinner_alternatives: z.array(z.string()).optional(),
      dinner_substitutions: z.record(z.string()).optional(),
      dinner_why: z.string().optional(),
      snack: z.string().optional(),
      snack_alternatives: z.array(z.string()).optional(),
      snack_substitutions: z.record(z.string()).optional(),
      snack_why: z.string().optional(),
    }).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId }, context?) => {
    try {
      console.log("[getMealPlanTool] Executing", {
        inputUserId: userId,
        hasContext: !!context,
      });

      // Validate and get userId from context
      const actualUserId = getUserIdFromContext(userId, context);
      
      console.log("[getMealPlanTool] Using userId", {
        userId: actualUserId,
      });

      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];

      // Get active meal plan
      const { data: mealPlan, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", actualUserId)
        .eq("is_active", true)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[getMealPlanTool] Database error", {
          userId: actualUserId,
          error: error.message,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      if (!mealPlan) {
        console.log("[getMealPlanTool] No meal plan found", {
          userId: actualUserId,
          today,
        });
        return {
          success: true,
          mealPlan: undefined,
          todaysMeals: undefined,
        };
      }

      // Extract planData first
      const planData = mealPlan.plan_data;
      
      // Calculate which day name corresponds to TODAY
      const startDate = new Date(mealPlan.start_date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Map day index to day name
      // JavaScript getDay(): Sunday=0, Monday=1, ..., Saturday=6
      // dayOrder array: Monday=0, Tuesday=1, ..., Sunday=6
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      // Get the day of week for start_date (0=Sunday, 1=Monday, etc.)
      const startDayOfWeek = startDate.getDay();
      // Convert to dayOrder index (Sunday=0 -> 6, Monday=1 -> 0, etc.)
      const startDayOrderIndex = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
      
      // Calculate today's dayOrder index
      const todayDayOrderIndex = (startDayOrderIndex + daysDiff) % 7;
      const todayDayName = dayOrder[todayDayOrderIndex];
      
      // DEBUG: Log date calculation details
      console.log("[getMealPlanTool] Date calculation", {
        userId: actualUserId,
        startDate: mealPlan.start_date,
        startDateObj: startDate.toISOString(),
        todayDateObj: todayDate.toISOString(),
        daysDiff,
        startDayOfWeek,
        startDayOrderIndex,
        todayDayOrderIndex,
        calculatedDayName: todayDayName,
        availableDaysInPlan: planData?.meal_plan ? Object.keys(planData.meal_plan) : [],
      });
      
      // Extract today's meals from planData
      const todaysMeals = planData?.meal_plan?.[todayDayName] || null;
      
      // DEBUG: Log today's meals details, especially snack
      console.log("[getMealPlanTool] Today's meals extracted", {
        userId: actualUserId,
        dayName: todayDayName,
        hasTodaysMeals: !!todaysMeals,
        snack: todaysMeals?.snack || "NOT FOUND",
        snackAlternatives: todaysMeals?.snack_alternatives || [],
        breakfast: todaysMeals?.breakfast || "NOT FOUND",
        lunch: todaysMeals?.lunch || "NOT FOUND",
        dinner: todaysMeals?.dinner || "NOT FOUND",
        fullTodaysMeals: todaysMeals,
      });

      const result = {
        success: true,
        mealPlan: {
          id: mealPlan.id,
          type: mealPlan.type as "weekly" | "monthly",
          startDate: mealPlan.start_date,
          endDate: mealPlan.end_date,
          planData: mealPlan.plan_data,
          basedOnLabs: mealPlan.based_on_labs || [],
        },
        todaysMeals: todaysMeals ? {
          dayName: todayDayName,
          ...todaysMeals,
        } : undefined,
      };

      console.log("[getMealPlanTool] Returning meal plan", {
        userId: actualUserId,
        mealPlanId: mealPlan.id,
        type: mealPlan.type,
        startDate: mealPlan.start_date,
        endDate: mealPlan.end_date,
        hasPlanData: !!mealPlan.plan_data,
        planDataKeys: mealPlan.plan_data ? Object.keys(mealPlan.plan_data as any) : [],
        todayDayName,
        hasTodaysMeals: !!todaysMeals,
        snackInResult: result.todaysMeals?.snack || "NOT IN RESULT",
        fullTodaysMealsInResult: result.todaysMeals,
      });

      return result;
    } catch (error) {
      console.error("[getMealPlanTool] Execution error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// GET HEALTH RECOMMENDATIONS TOOL
// ============================================

export const getHealthRecommendationsTool = createTool({
  id: "get-health-recommendations",
  description: "Get user's active health recommendations from Health Hub. Use this to check existing food, drink, and supplement recommendations before generating new ones. Returns today's active recommendations grouped by type. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
    type: z.enum(["food", "drink", "exercise", "sleep", "supplement", "lifestyle"]).optional().describe("Filter by recommendation type"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    recommendations: z.array(z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      description: z.string(),
      reason: z.string().nullable(),
      category: z.string(),
      priority: z.string(),
      timing: z.string().nullable(),
      frequency: z.string().nullable(),
      createdAt: z.string(),
    })),
    error: z.string().optional(),
  }),
  execute: async ({ userId, type }, context?) => {
    try {
      console.log("[getHealthRecommendationsTool] Executing", {
        inputUserId: userId,
        type,
        hasContext: !!context,
      });

      // Validate and get userId from context
      const actualUserId = getUserIdFromContext(userId, context);
      
      console.log("[getHealthRecommendationsTool] Using userId", {
        userId: actualUserId,
        filterType: type,
      });

      const supabase = getSupabaseClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Build query for active recommendations
      let query = supabase
        .from("health_recommendations")
        .select("*")
        .eq("user_id", actualUserId)
        .eq("is_completed", false)
        .or(`expires_at.is.null,expires_at.gte.${todayISO}`)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      // Filter by type if provided
      if (type) {
        query = query.eq("type", type);
      }

      const { data: recommendations, error } = await query;

      if (error) {
        console.error("[getHealthRecommendationsTool] Database error", {
          userId: actualUserId,
          error: error.message,
        });
        return {
          success: false,
          recommendations: [],
          error: error.message,
        };
      }

      const result = {
        success: true,
        recommendations: (recommendations || []).map((rec) => ({
          id: rec.id,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          reason: rec.reason,
          category: rec.category,
          priority: rec.priority,
          timing: rec.timing,
          frequency: rec.frequency,
          createdAt: rec.created_at,
        })),
      };

      console.log("[getHealthRecommendationsTool] Returning recommendations", {
        userId: actualUserId,
        count: recommendations?.length || 0,
        types: recommendations?.map(r => r.type) || [],
        filterType: type,
      });

      return result;
    } catch (error) {
      console.error("[getHealthRecommendationsTool] Execution error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        recommendations: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// CREATE INTERVENTION TOOL
// ============================================

export const createInterventionTool = createTool({
  id: "create-intervention",
  description: "Create a proactive health intervention based on context. Always personalize with user's name.",
  inputSchema: z.object({
    userId: z.string(),
    type: z.enum([
      "uv_advisor",
      "blood_group_fueling",
      "allergy_guardian",
      "recovery_adjuster",
      "sleep_strategy",
      "pre_meeting",
      "skincare_routine",
      "sunscreen_reminder",
    ]),
    context: z.record(z.any()).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    interventionId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, type, context }) => {
    try {
      const userContext = await getUserContext(userId);
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();

      const prompt = `Create a ${type} intervention for ${userContext.preferredName}.
Respond in ${userContext.language}.

Context: ${JSON.stringify(context || {})}

User Profile:
- Blood Group: ${userContext.bloodGroup || "Unknown"}
- Allergies: ${userContext.allergies.join(", ") || "None"}

Generate a personalized intervention with title, description, biological reason, and action items.
Address ${userContext.preferredName} by name.

Return JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-nano-2025-08-07",
        messages: [
          { role: "system", content: "You are a health advisor. Return valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const interventionData = JSON.parse(completion.choices[0].message.content || "{}");

      // Determine urgency and category based on type
      const urgencyMap: Record<string, "critical" | "high" | "medium" | "low"> = {
        allergy_guardian: "critical",
        uv_advisor: "high",
        sleep_strategy: "medium",
        pre_meeting: "medium",
        sunscreen_reminder: "high",
        skincare_routine: "low",
      };

      const categoryMap: Record<string, string> = {
        uv_advisor: "environment",
        allergy_guardian: "health",
        sleep_strategy: "health",
        skincare_routine: "skincare",
        sunscreen_reminder: "skincare",
      };

      const { data: intervention, error } = await supabase
        .from("proactive_interventions")
        .insert({
          user_id: userId,
          type,
          title: interventionData.title,
          description: interventionData.description,
          urgency_level: urgencyMap[type] || "medium",
          category: categoryMap[type] || "health",
          context_data: context || {},
          biological_reason: interventionData.biologicalReason,
          action_items: interventionData.actionItems || [],
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        interventionId: intervention.id,
      };
    } catch (error) {
      console.error("Error creating intervention:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// UPDATE HEALTH SCORE TOOL
// ============================================

export const updateHealthScoreTool = createTool({
  id: "update-health-score",
  description: "Calculate and update user's daily health score based on uploads, compliance, and biomarkers",
  inputSchema: z.object({
    userId: z.string(),
    date: z.string().optional(), // ISO date string, defaults to today
  }),
  outputSchema: z.object({
    success: z.boolean(),
    score: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, date }) => {
    try {
      const supabase = getSupabaseClient();
      const targetDate = date || new Date().toISOString().split("T")[0];

      // Get uploads today
      const { data: uploads } = await supabase
        .from("health_documents")
        .select("id")
        .eq("user_id", userId)
        .gte("uploaded_at", `${targetDate}T00:00:00`)
        .lt("uploaded_at", `${targetDate}T23:59:59`);

      // Get recommendations completed today
      const { data: completedRecs } = await supabase
        .from("health_recommendations")
        .select("id")
        .eq("user_id", userId)
        .eq("is_completed", true)
        .gte("completed_at", `${targetDate}T00:00:00`)
        .lt("completed_at", `${targetDate}T23:59:59`);

      // Get recent biomarkers status
      const { data: biomarkers } = await supabase
        .from("biomarkers")
        .select("status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Calculate score components
      const uploadScore = Math.min((uploads?.length || 0) * 10, 30); // Max 30 points
      const complianceScore = Math.min((completedRecs?.length || 0) * 15, 30); // Max 30 points
      const biomarkerScore = biomarkers?.filter(b => b.status === "normal").length || 0 * 4; // Max 40 points

      const totalScore = Math.min(uploadScore + complianceScore + biomarkerScore, 100);

      // Get previous score for trend
      const { data: previousScore } = await supabase
        .from("health_scores")
        .select("score")
        .eq("user_id", userId)
        .lt("date", targetDate)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      const trend = previousScore
        ? totalScore > previousScore.score
          ? "up"
          : totalScore < previousScore.score
          ? "down"
          : "stable"
        : "stable";

      // Upsert health score (handle duplicate key on user_id + date)
      const { error } = await supabase
        .from("health_scores")
        .upsert({
          user_id: userId,
          date: targetDate,
          score: totalScore,
          breakdown: {
            uploads: uploadScore,
            compliance: complianceScore,
            biomarkers: biomarkerScore,
          },
          previous_score: previousScore?.score,
          trend,
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        score: totalScore,
      };
    } catch (error) {
      console.error("Error updating health score:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// UPDATE STREAK TOOL
// ============================================

export const updateStreakTool = createTool({
  id: "update-streak",
  description: "Update user's streak for a specific activity type",
  inputSchema: z.object({
    userId: z.string(),
    streakType: z.enum([
      "daily_checkin",
      "document_upload",
      "routine_completion",
      "challenge_completion",
      "recommendation_followed",
      "skincare_routine",
    ]),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    currentStreak: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, streakType }) => {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];

      // Get existing streak
      const { data: existingStreak } = await supabase
        .from("health_streaks")
        .select("*")
        .eq("user_id", userId)
        .eq("streak_type", streakType)
        .single();

      if (existingStreak) {
        const lastActivityDate = existingStreak.last_activity_date
          ? new Date(existingStreak.last_activity_date).toISOString().split("T")[0]
          : null;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = existingStreak.current_streak;
        let streakStartDate = existingStreak.streak_start_date;

        if (lastActivityDate === today) {
          // Already logged today, no change
          return {
            success: true,
            currentStreak: newStreak,
          };
        } else if (lastActivityDate === yesterdayStr) {
          // Continuing streak
          newStreak += 1;
        } else if (!lastActivityDate || lastActivityDate < yesterdayStr) {
          // Streak broken, restart
          newStreak = 1;
          streakStartDate = today;
        }

        const longestStreak = Math.max(newStreak, existingStreak.longest_streak);

        const { error } = await supabase
          .from("health_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
            streak_start_date: streakStartDate,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStreak.id);

        if (error) throw error;

        return {
          success: true,
          currentStreak: newStreak,
        };
      } else {
        // Create new streak
        const { data: newStreak, error } = await supabase
          .from("health_streaks")
          .insert({
            user_id: userId,
            streak_type: streakType,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            streak_start_date: today,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          currentStreak: 1,
        };
      }
    } catch (error) {
      console.error("Error updating streak:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// CHECK ACHIEVEMENTS TOOL
// ============================================

export const checkAchievementsTool = createTool({
  id: "check-achievements",
  description: "Check and unlock achievements based on user's health activities",
  inputSchema: z.object({
    userId: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    unlocked: z.array(z.string()).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId }) => {
    try {
      const supabase = getSupabaseClient();
      const unlocked: string[] = [];

      // Check various achievement conditions
      const checks = [
        {
          key: "first_upload",
          check: async () => {
            const { count } = await supabase
              .from("health_documents")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId);
            return (count || 0) >= 1;
          },
          title: "First Upload",
          description: "Uploaded your first health document",
        },
        {
          key: "week_streak",
          check: async () => {
            const { data } = await supabase
              .from("health_streaks")
              .select("current_streak")
              .eq("user_id", userId)
              .eq("streak_type", "daily_checkin")
              .single();
            return (data?.current_streak || 0) >= 7;
          },
          title: "Week Warrior",
          description: "7-day streak",
        },
        {
          key: "perfect_score",
          check: async () => {
            const { data } = await supabase
              .from("health_scores")
              .select("score")
              .eq("user_id", userId)
              .order("date", { ascending: false })
              .limit(1)
              .single();
            return data?.score === 100;
          },
          title: "Perfect Score",
          description: "Achieved 100 health score",
        },
      ];

      for (const achievement of checks) {
        const { data: existing } = await supabase
          .from("health_achievements")
          .select("is_unlocked")
          .eq("user_id", userId)
          .eq("achievement_key", achievement.key)
          .single();

        if (existing?.is_unlocked) continue;

        const isUnlocked = await achievement.check();
        if (isUnlocked) {
          await supabase
            .from("health_achievements")
            .upsert({
              user_id: userId,
              achievement_key: achievement.key,
              title: achievement.title,
              description: achievement.description,
              is_unlocked: true,
              unlocked_at: new Date().toISOString(),
              progress: 100,
            });

          unlocked.push(achievement.key);
        }
      }

      return {
        success: true,
        unlocked,
      };
    } catch (error) {
      console.error("Error checking achievements:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// GENERATE DAILY CHALLENGES TOOL
// ============================================

export const generateDailyChallengesTool = createTool({
  id: "generate-daily-challenges",
  description: "Generate personalized daily health challenges for the user",
  inputSchema: z.object({
    userId: z.string(),
    date: z.string().optional(), // ISO date string
  }),
  outputSchema: z.object({
    success: z.boolean(),
    challenges: z.array(z.string()).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, date }) => {
    try {
      const userContext = await getUserContext(userId);
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();
      const targetDate = date || new Date().toISOString().split("T")[0];

      const prompt = `Generate 3 personalized daily health challenges for ${userContext.preferredName}.
Respond in ${userContext.language}.

User Profile:
- Health Interests: ${userContext.healthInterests.join(", ") || "General health"}
- Allergies: ${userContext.allergies.join(", ") || "None"}

Make challenges:
1. Specific and actionable
2. Aligned with their health interests
3. Safe considering their allergies
4. Address ${userContext.preferredName} by name

Return JSON array with challenges.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-nano-2025-08-07",
        messages: [
          { role: "system", content: "You are a health coach. Return valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const response = JSON.parse(completion.choices[0].message.content || "{}");
      const challenges = response.challenges || [];

      // Save challenges
      if (challenges.length > 0) {
        const { error } = await supabase
          .from("daily_challenges")
          .insert(
            challenges.map((challenge: any, index: number) => ({
              user_id: userId,
              challenge_date: targetDate,
              title: challenge.title || `Challenge ${index + 1}`,
              description: challenge.description || challenge,
              category: challenge.category || "general",
              target_value: challenge.targetValue,
              unit: challenge.unit,
              points_reward: challenge.points || 10,
            }))
          );

        if (error) {
          console.error("Failed to save challenges:", error);
        }
      }

      return {
        success: true,
        challenges: challenges.map((c: any) => c.title || c),
      };
    } catch (error) {
      console.error("Error generating challenges:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

