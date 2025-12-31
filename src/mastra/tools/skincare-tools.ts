import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getUserContext } from "./user-profile-tool";

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

/**
 * Convert file to base64 data URL for GPT-4o Vision
 */
async function getImageDataUrl(fileUrl: string, mimeType: string): Promise<string> {
  if (fileUrl.startsWith("data:")) {
    return fileUrl;
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Get user's skincare profile
 */
async function getSkincareProfile(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data: profile } = await supabase
    .from("skincare_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return profile;
}

// ============================================
// ANALYZE SKINCARE PRODUCT TOOL
// ============================================

export const analyzeSkincareProductTool = createTool({
  id: "analyze-skincare-product",
  description: "Analyze a skincare product image/label to extract ingredients and assess compatibility with user's skin profile. Always address user by name.",
  inputSchema: z.object({
    userId: z.string(),
    fileUrl: z.string().describe("URL of the product image"),
    mimeType: z.string().describe("MIME type of the image"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    productId: z.string().optional(),
    analysis: z.object({
      name: z.string(),
      brand: z.string().optional(),
      ingredients: z.array(z.string()),
      ingredientAnalysis: z.record(z.object({
        rating: z.enum(["good", "caution", "avoid"]),
        reason: z.string(),
      })),
      compatibilityScore: z.number().min(0).max(100),
      compatibilityNotes: z.string(),
    }).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, fileUrl, mimeType }) => {
    try {
      const userContext = await getUserContext(userId);
      const skincareProfile = await getSkincareProfile(userId);
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();
      const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);

      if (!skincareProfile) {
        return {
          success: false,
          error: "Skincare profile not found. Please complete skincare onboarding first.",
        };
      }

      const prompt = `Analyze this skincare product image for ${userContext.preferredName}.
Respond in ${userContext.language}.

User's Skin Profile:
- Skin Type: ${skincareProfile.skin_type || "Unknown"}
- Skin Conditions: ${(skincareProfile.skin_conditions || []).join(", ") || "None"}
- Skin Goals: ${(skincareProfile.skin_goals || []).join(", ") || "None"}
- Allergies: ${userContext.allergies.join(", ") || "None"}

Extract:
1. Product name and brand
2. Full ingredient list
3. For each ingredient, rate as "good", "caution", or "avoid" based on user's skin profile
4. Overall compatibility score (0-100)
5. Detailed compatibility notes

Address ${userContext.preferredName} by name in your analysis.

Return JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(completion.choices[0].message.content || "{}");

      // Save product analysis
      const { data: product, error } = await supabase
        .from("skincare_products")
        .insert({
          user_id: userId,
          name: analysis.name,
          brand: analysis.brand,
          ingredients: analysis.ingredients || [],
          ingredient_analysis: analysis.ingredientAnalysis || {},
          compatibility_score: analysis.compatibilityScore,
          compatibility_notes: analysis.compatibilityNotes,
          product_image_url: fileUrl,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        productId: product.id,
        analysis: {
          name: analysis.name,
          brand: analysis.brand,
          ingredients: analysis.ingredients || [],
          ingredientAnalysis: analysis.ingredientAnalysis || {},
          compatibilityScore: analysis.compatibilityScore,
          compatibilityNotes: analysis.compatibilityNotes,
        },
      };
    } catch (error) {
      console.error("Error analyzing skincare product:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// ANALYZE SKIN TOOL
// ============================================

export const analyzeSkinTool = createTool({
  id: "analyze-skin",
  description: "Analyze a skin photo to detect conditions, assess skin health, and provide recommendations. Always address user by name.",
  inputSchema: z.object({
    userId: z.string(),
    fileUrl: z.string().describe("URL of the skin photo"),
    mimeType: z.string().describe("MIME type of the image"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysisId: z.string().optional(),
    analysis: z.object({
      acneSeverity: z.number().min(0).max(10).optional(),
      drynessLevel: z.number().min(0).max(10).optional(),
      oilinessLevel: z.number().min(0).max(10).optional(),
      rednessLevel: z.number().min(0).max(10).optional(),
      hyperpigmentationLevel: z.number().min(0).max(10).optional(),
      fineLinesLevel: z.number().min(0).max(10).optional(),
      overallScore: z.number().min(0).max(100),
      recommendations: z.array(z.string()),
      detectedConditions: z.record(z.any()),
    }).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, fileUrl, mimeType }) => {
    try {
      const userContext = await getUserContext(userId);
      const skincareProfile = await getSkincareProfile(userId);
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();
      const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);

      const prompt = `Analyze this skin photo for ${userContext.preferredName}.
Respond in ${userContext.language}.

User's Skin Profile:
- Skin Type: ${skincareProfile?.skin_type || "Unknown"}
- Skin Conditions: ${(skincareProfile?.skin_conditions || []).join(", ") || "None"}

Assess:
1. Acne severity (0-10)
2. Dryness level (0-10)
3. Oiliness level (0-10)
4. Redness/inflammation (0-10)
5. Hyperpigmentation/dark spots (0-10)
6. Fine lines/wrinkles (0-10)
7. Overall skin health score (0-100)
8. Detected conditions with details
9. Personalized recommendations

Address ${userContext.preferredName} by name.

Return JSON.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const analysisData = JSON.parse(completion.choices[0].message.content || "{}");

      // Save skin analysis
      const { data: analysis, error } = await supabase
        .from("skin_analyses")
        .insert({
          user_id: userId,
          image_url: fileUrl,
          analysis_data: analysisData,
          detected_conditions: analysisData.detectedConditions || {},
          acne_severity: analysisData.acneSeverity,
          dryness_level: analysisData.drynessLevel,
          oiliness_level: analysisData.oilinessLevel,
          redness_level: analysisData.rednessLevel,
          hyperpigmentation_level: analysisData.hyperpigmentationLevel,
          fine_lines_level: analysisData.fineLinesLevel,
          overall_score: analysisData.overallScore,
          recommendations: analysisData.recommendations || [],
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        analysisId: analysis.id,
        analysis: {
          acneSeverity: analysisData.acneSeverity,
          drynessLevel: analysisData.drynessLevel,
          oilinessLevel: analysisData.oilinessLevel,
          rednessLevel: analysisData.rednessLevel,
          hyperpigmentationLevel: analysisData.hyperpigmentationLevel,
          fineLinesLevel: analysisData.fineLinesLevel,
          overallScore: analysisData.overallScore,
          recommendations: analysisData.recommendations || [],
          detectedConditions: analysisData.detectedConditions || {},
        },
      };
    } catch (error) {
      console.error("Error analyzing skin:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// GENERATE SKINCARE ROUTINE TOOL
// ============================================

export const generateSkincareRoutineTool = createTool({
  id: "generate-skincare-routine",
  description: "Generate personalized AM/PM skincare routine based on user's skin profile. Always address user by name.",
  inputSchema: z.object({
    userId: z.string(),
    routineType: z.enum(["am", "pm"]),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    routineId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, routineType }) => {
    try {
      const userContext = await getUserContext(userId);
      const skincareProfile = await getSkincareProfile(userId);
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();

      if (!skincareProfile) {
        return {
          success: false,
          error: "Skincare profile not found. Please complete skincare onboarding first.",
        };
      }

      // Get existing products in routine
      const { data: existingProducts } = await supabase
        .from("skincare_products")
        .select("*")
        .eq("user_id", userId)
        .eq("is_in_routine", true);

      const prompt = `Create a personalized ${routineType.toUpperCase()} skincare routine for ${userContext.preferredName}.
Respond in ${userContext.language}.

User's Skin Profile:
- Skin Type: ${skincareProfile.skin_type}
- Skin Conditions: ${(skincareProfile.skin_conditions || []).join(", ") || "None"}
- Skin Goals: ${(skincareProfile.skin_goals || []).join(", ") || "None"}
- Allergies: ${userContext.allergies.join(", ") || "None"}

Existing Products:
${existingProducts?.map(p => `- ${p.name} (${p.product_type})`).join("\n") || "None"}

Create a ${routineType} routine with:
1. Product order (cleanser → toner → serum → moisturizer → sunscreen for AM)
2. Product recommendations (use existing if compatible, suggest new if needed)
3. Timing/wait times between products
4. Personalized notes for ${userContext.preferredName}

Address ${userContext.preferredName} by name.

Return JSON with routine structure.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a skincare expert. Return valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const routineData = JSON.parse(completion.choices[0].message.content || "{}");

      // Deactivate existing routine of same type
      await supabase
        .from("skincare_routines")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("routine_type", routineType);

      // Save new routine
      const { data: routine, error } = await supabase
        .from("skincare_routines")
        .insert({
          user_id: userId,
          routine_type: routineType,
          name: routineData.name || `${routineType.toUpperCase()} Routine`,
          routine_data: routineData,
          product_ids: routineData.productIds || [],
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        routineId: routine.id,
      };
    } catch (error) {
      console.error("Error generating skincare routine:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// CHECK INGREDIENT COMPATIBILITY TOOL
// ============================================

export const checkIngredientCompatibilityTool = createTool({
  id: "check-ingredient-compatibility",
  description: "Check if skincare ingredients are compatible with each other and user's skin",
  inputSchema: z.object({
    userId: z.string(),
    ingredients: z.array(z.string()),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    compatible: z.boolean(),
    warnings: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  execute: async ({ userId, ingredients }) => {
    try {
      const userContext = await getUserContext(userId);
      const skincareProfile = await getSkincareProfile(userId);
      const openai = getOpenAIClient();

      const prompt = `Check ingredient compatibility for ${userContext.preferredName}.
Respond in ${userContext.language}.

Ingredients: ${ingredients.join(", ")}

User's Skin:
- Type: ${skincareProfile?.skin_type || "Unknown"}
- Conditions: ${(skincareProfile?.skin_conditions || []).join(", ") || "None"}
- Allergies: ${userContext.allergies.join(", ") || "None"}

Check:
1. Are these ingredients compatible with each other?
2. Any interactions or conflicts?
3. Compatibility with user's skin type/conditions
4. Any allergen matches

Return JSON with compatibility status, warnings, and recommendations.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a skincare chemist. Return valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      return {
        success: true,
        compatible: result.compatible !== false,
        warnings: result.warnings || [],
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error("Error checking ingredient compatibility:", error);
      return {
        success: false,
        compatible: false,
        warnings: ["Error checking compatibility"],
        recommendations: [],
      };
    }
  },
});

// ============================================
// GET SKINCARE RECOMMENDATIONS TOOL
// ============================================

export const getSkincareRecommendationsTool = createTool({
  id: "get-skincare-recommendations",
  description: "Get personalized skincare product recommendations based on user's skin profile",
  inputSchema: z.object({
    userId: z.string(),
    productType: z.enum([
      "cleanser",
      "toner",
      "serum",
      "moisturizer",
      "sunscreen",
      "treatment",
      "mask",
      "exfoliant",
    ]).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    recommendations: z.array(z.object({
      productName: z.string(),
      productType: z.string(),
      reason: z.string(),
      keyIngredients: z.array(z.string()),
    })),
  }),
  execute: async ({ userId, productType }) => {
    try {
      const userContext = await getUserContext(userId);
      const skincareProfile = await getSkincareProfile(userId);
      const openai = getOpenAIClient();

      if (!skincareProfile) {
        return {
          success: false,
          recommendations: [],
        };
      }

      const prompt = `Recommend skincare products for ${userContext.preferredName}.
Respond in ${userContext.language}.

User's Skin:
- Type: ${skincareProfile.skin_type}
- Conditions: ${(skincareProfile.skin_conditions || []).join(", ") || "None"}
- Goals: ${(skincareProfile.skin_goals || []).join(", ") || "None"}
- Allergies: ${userContext.allergies.join(", ") || "None"}

${productType ? `Product Type: ${productType}` : "Recommend products across all categories"}

Provide 3-5 product recommendations with:
- Product name
- Product type
- Why it's good for their skin
- Key beneficial ingredients

Address ${userContext.preferredName} by name.

Return JSON array.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a skincare expert. Return valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      return {
        success: true,
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error("Error getting skincare recommendations:", error);
      return {
        success: false,
        recommendations: [],
      };
    }
  },
});

// ============================================
// UPDATE SKINCARE PROFILE TOOL
// ============================================

export const updateSkincareProfileTool = createTool({
  id: "update-skincare-profile",
  description: "Update user's skincare profile and sync to memory",
  inputSchema: z.object({
    userId: z.string(),
    skinType: z.enum(["oily", "dry", "combination", "sensitive", "normal"]).optional(),
    skinConditions: z.array(z.string()).optional(),
    skinGoals: z.array(z.string()).optional(),
    skinConcerns: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, skinType, skinConditions, skinGoals, skinConcerns }) => {
    try {
      const supabase = getSupabaseClient();

      const updateData: any = {};
      if (skinType) updateData.skin_type = skinType;
      if (skinConditions) updateData.skin_conditions = skinConditions;
      if (skinGoals) updateData.skin_goals = skinGoals;
      if (skinConcerns) updateData.skin_concerns = skinConcerns;

      const { error } = await supabase
        .from("skincare_profiles")
        .upsert({
          user_id: userId,
          ...updateData,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      // Update memory with new skincare context
      try {
        const { initializeOrUpdateUserMemory } = await import("../memory/onboarding-memory");
        await initializeOrUpdateUserMemory(userId);
      } catch (memoryError) {
        console.warn("Failed to update memory:", memoryError);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error updating skincare profile:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// ============================================
// LOG SKINCARE ROUTINE TOOL
// ============================================

export const logSkincareRoutineTool = createTool({
  id: "log-skincare-routine",
  description: "Log skincare routine completion and update streaks",
  inputSchema: z.object({
    userId: z.string(),
    routineId: z.string(),
    routineType: z.enum(["am", "pm"]),
    completedProducts: z.array(z.string()).optional(),
    skippedProducts: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    logId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, routineId, routineType, completedProducts, skippedProducts, notes }) => {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split("T")[0];

      // Calculate completion percentage
      const { data: routine } = await supabase
        .from("skincare_routines")
        .select("product_ids")
        .eq("id", routineId)
        .single();

      const totalProducts = routine?.product_ids?.length || 0;
      const completedCount = completedProducts?.length || 0;
      const completionPercentage = totalProducts > 0
        ? Math.round((completedCount / totalProducts) * 100)
        : 0;

      // Log routine completion
      const { data: log, error: logError } = await supabase
        .from("skincare_logs")
        .insert({
          user_id: userId,
          routine_id: routineId,
          routine_type: routineType,
          completed_products: completedProducts || [],
          skipped_products: skippedProducts || [],
          is_completed: completionPercentage >= 80,
          completion_percentage: completionPercentage,
          notes,
          log_date: today,
          completed_at: completionPercentage >= 80 ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (logError) {
        throw logError;
      }

      // Update streak if completed
      if (completionPercentage >= 80) {
        const { updateStreakTool } = await import("./health-engagement-tools");
        await updateStreakTool.execute({ userId, streakType: "skincare_routine" });
      }

      return {
        success: true,
        logId: log.id,
      };
    } catch (error) {
      console.error("Error logging skincare routine:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});


