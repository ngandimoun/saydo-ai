import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { BodySystemType } from "./health-classifier-tool";

/**
 * Language code to language name mapping
 * Used to tell the LLM which language to respond in
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
 * Finding status types
 */
export const FindingStatus = z.enum(["good", "attention", "concern", "info"]);
export type FindingStatus = z.infer<typeof FindingStatus>;

/**
 * Evolution trend types
 */
export const EvolutionTrend = z.enum(["improved", "stable", "declined"]);
export type EvolutionTrend = z.infer<typeof EvolutionTrend>;

/**
 * Individual finding schema
 */
export const FindingSchema = z.object({
  findingKey: z.string(), // Unique key for tracking evolution
  title: z.string(),
  value: z.string().nullish(), // Allow null from LLM responses
  valueNumeric: z.number().nullish(), // Allow null from LLM responses
  unit: z.string().nullish(), // Allow null from LLM responses
  status: FindingStatus,
  severity: z.number().min(1).max(5).nullish(), // Allow null from LLM responses
  referenceMin: z.number().nullish(), // Allow null from LLM responses
  referenceMax: z.number().nullish(), // Allow null from LLM responses
  referenceText: z.string().nullish(), // Allow null from LLM responses
  explanation: z.string(),
  actionTip: z.string().nullish(), // Allow null from LLM responses
  iconName: z.string().nullish(), // Allow null from LLM responses
  priority: z.number().nullish(), // Allow null from LLM responses
});

export type Finding = z.infer<typeof FindingSchema>;

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
 * Extract Findings Tool
 * 
 * Extracts structured findings from analysis results and generates
 * plain-language explanations for users in their preferred language.
 */
export const extractFindingsTool = createTool({
  id: "extract-findings",
  description: "Extracts structured findings from health analysis results and generates user-friendly explanations in user's language",
  inputSchema: z.object({
    userId: z.string(),
    documentId: z.string(),
    bodySystem: z.string(),
    analysisData: z.any(), // Raw analysis data from type-specific analyzer
    documentType: z.string(),
    userLanguage: z.string().optional().default("en"), // User's preferred language code
  }),
  outputSchema: z.object({
    success: z.boolean(),
    findings: z.array(FindingSchema).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, documentId, bodySystem, analysisData, documentType, userLanguage }) => {
    try {
      const openai = getOpenAIClient();

      // Get the language name for the prompt
      const languageName = LANGUAGE_NAMES[userLanguage || "en"] || "English";

      // Log what we're receiving for debugging
      console.log("[extractFindingsTool] Starting extraction", {
        userId,
        documentId,
        bodySystem,
        documentType,
        userLanguage,
        hasAnalysisData: !!analysisData,
        analysisDataType: typeof analysisData,
        analysisDataKeys: analysisData ? Object.keys(analysisData) : [],
      });

      // Check if we have valid analysis data
      if (!analysisData || (typeof analysisData === 'object' && Object.keys(analysisData).length === 0)) {
        console.warn("[extractFindingsTool] Empty or invalid analysis data");
        return {
          success: false,
          error: "No analysis data to extract findings from",
        };
      }

      // Build prompt based on the analysis data - in user's language
      const extractionPrompt = `You are a health analyst helping users understand their health results.
Given the following analysis data, extract individual findings and explain them in plain language.

## CRITICAL RULES:
1. **LANGUAGE**: ALWAYS respond in ${languageName}. All titles, explanations, and action tips MUST be in ${languageName}.
2. **BE SPECIFIC**: Never give vague advice. Always include specific examples, foods, vitamins, or actions.
3. **NO "CONSULT PROFESSIONAL"**: Instead of saying "consult a doctor", give actionable dietary/lifestyle advice the user can do TODAY.
4. **INCLUDE EXAMPLES**: Every tip must include 2-3 specific examples with names.

**Analysis Data:**
${JSON.stringify(analysisData, null, 2)}

**Document Type:** ${documentType}
**Body System:** ${bodySystem}

For each finding, provide:
1. **findingKey**: A unique snake_case identifier (e.g., "vitamin_d_level", "cholesterol_total")
2. **title**: User-friendly title (e.g., "Vitamin D Level", "Total Cholesterol")
3. **value**: The actual value (e.g., "32", "2.15")
4. **valueNumeric**: Numeric value if applicable (for trend tracking)
5. **unit**: Unit of measurement if applicable
6. **status**: One of:
   - "good" - Value is healthy/normal
   - "attention" - Slightly off, worth monitoring
   - "concern" - Needs attention, consider action
   - "info" - Neutral information
7. **severity**: 1-5 scale (1=mild, 5=severe) - only for attention/concern status
8. **referenceMin/referenceMax**: Reference ranges if known
9. **explanation**: Clear, friendly explanation in 1-2 sentences. Avoid medical jargon.
10. **actionTip**: SPECIFIC actionable advice with EXAMPLES. Follow these patterns:
    - For vitamins: "Increase [vitamin name] with [food1], [food2], or [food3]. Consider supplements like [brand example] if needed."
    - For high cholesterol: "Reduce saturated fats: replace butter with olive oil, choose salmon/mackerel over red meat, add oats and almonds daily."
    - For blood sugar: "Limit refined carbs. Swap white bread for whole grain, choose brown rice, add cinnamon to meals (helps regulate glucose)."
    - For hydration: "Drink 8 glasses/day. Try: lemon water in morning, cucumber-mint infused water, herbal teas like chamomile or green tea."
    - For immunity: "Boost with Vitamin C (oranges, kiwi, bell peppers), Vitamin D (15 min sunlight, salmon), Zinc (pumpkin seeds, chickpeas)."
    - For fiber: "Add fiber: psyllium husk (1 tbsp in water), chia seeds in smoothies, oatmeal for breakfast, legumes (lentils, black beans)."
    - NEVER say just "eat healthy" or "exercise more" - always give specific foods/activities
11. **iconName**: Lucide icon name (e.g., "heart", "droplet", "pill", "apple")
12. **priority**: 1-100 (lower = more important, shows first)

## EXAMPLE OF GOOD vs BAD actionTip:
BAD: "Maintenez une alimentation riche en vitamines pour votre système immunitaire."
GOOD: "Renforcez votre immunité avec: Vitamine C (oranges, kiwis, poivrons), Vitamine D (saumon, 15min de soleil), Zinc (graines de courge, pois chiches)."

BAD: "Consultez un professionnel de santé."
GOOD: "Réduisez les graisses saturées: remplacez le beurre par l'huile d'olive, choisissez le saumon au lieu de la viande rouge, ajoutez des noix (amandes, noix) quotidiennement."

Respond with JSON array:
{
  "findings": [
    {
      "findingKey": "...",
      "title": "...",
      "value": "...",
      "valueNumeric": null,
      "unit": "...",
      "status": "good|attention|concern|info",
      "severity": null,
      "referenceMin": null,
      "referenceMax": null,
      "referenceText": "...",
      "explanation": "...",
      "actionTip": "...",
      "iconName": "...",
      "priority": 50
    }
  ]
}

Extract ALL relevant findings. Be comprehensive and ALWAYS give specific, actionable advice with real examples.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-nano-2025-08-07", // Use smaller model for cost efficiency
        messages: [
          { role: "system", content: `You are a health analyst extracting findings from medical data and explaining them clearly to non-medical users. ALWAYS respond in ${languageName}.` },
          { role: "user", content: extractionPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("[extractFindingsTool] No response content from model");
        throw new Error("No response from extraction model");
      }

      console.log("[extractFindingsTool] Raw model response:", content.substring(0, 500));

      let parsed: { findings: Finding[] };
      try {
        parsed = JSON.parse(content) as { findings: Finding[] };
      } catch (parseError) {
        console.error("[extractFindingsTool] Failed to parse JSON:", parseError);
        console.error("[extractFindingsTool] Content was:", content);
        throw new Error("Failed to parse extraction response as JSON");
      }

      const findings = parsed.findings || [];
      console.log("[extractFindingsTool] Parsed findings count:", findings.length);

      if (findings.length === 0) {
        console.warn("[extractFindingsTool] Model returned empty findings array");
        return {
          success: false,
          error: "No findings extracted from analysis data",
        };
      }

      // Validate findings
      const validatedFindings = findings.map((f, index) => {
        try {
          const validated = {
            findingKey: f.findingKey || `finding_${Date.now()}_${index}`,
            title: f.title || "Finding",
            value: f.value,
            valueNumeric: typeof f.valueNumeric === "number" ? f.valueNumeric : undefined,
            unit: f.unit,
            status: (["good", "attention", "concern", "info"].includes(f.status) ? f.status : "info") as FindingStatus,
            severity: f.severity,
            referenceMin: f.referenceMin,
            referenceMax: f.referenceMax,
            referenceText: f.referenceText,
            explanation: f.explanation || "No explanation available",
            actionTip: f.actionTip,
            iconName: f.iconName || "info",
            priority: f.priority || 50,
          };
          return validated;
        } catch (validationError) {
          console.error(`[extractFindingsTool] Error validating finding ${index}:`, validationError);
          // Return a safe default finding
          return {
            findingKey: `finding_${Date.now()}_${index}`,
            title: f.title || "Finding",
            value: f.value || "N/A",
            valueNumeric: undefined,
            unit: f.unit,
            status: "info" as FindingStatus,
            severity: undefined,
            referenceMin: undefined,
            referenceMax: undefined,
            referenceText: undefined,
            explanation: f.explanation || "No explanation available",
            actionTip: f.actionTip,
            iconName: "info",
            priority: 50,
          };
        }
      });

      console.log("[extractFindingsTool] Validated findings count:", validatedFindings.length);
      if (validatedFindings.length > 0) {
        console.log("[extractFindingsTool] First finding sample:", JSON.stringify(validatedFindings[0], null, 2));
      }

      // Ensure we return a properly structured response
      const toolResult = {
        success: true,
        findings: validatedFindings,
      };

      console.log("[extractFindingsTool] Returning response:", {
        success: toolResult.success,
        findingsCount: toolResult.findings?.length || 0,
      });

      return toolResult;
    } catch (error) {
      console.error("[extractFindingsTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract findings",
      };
    }
  },
});

/**
 * Store Findings Tool
 * 
 * Stores findings in the body_system_findings table.
 * Handles evolution tracking - supersedes old findings with same key.
 */
export const storeFindingsTool = createTool({
  id: "store-findings",
  description: "Stores findings in the database with evolution tracking",
  inputSchema: z.object({
    userId: z.string(),
    documentId: z.string(),
    bodySystem: z.string(),
    findings: z.array(FindingSchema),
    measuredAt: z.string().optional(), // ISO date string
  }),
  outputSchema: z.object({
    success: z.boolean(),
    storedCount: z.number().optional(),
    evolutionDetected: z.boolean().optional(),
    evolutionFindings: z.array(z.object({
      findingKey: z.string(),
      previousValue: z.string().optional(),
      currentValue: z.string().optional(),
      trend: z.string(),
    })).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, documentId, bodySystem, findings, measuredAt }) => {
    try {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();
      const evolutionFindings: Array<{
        findingKey: string;
        previousValue?: string;
        currentValue?: string;
        trend: string;
      }> = [];

      let storedCount = 0;
      let evolutionDetected = false;

      for (const finding of findings) {
        // Check for existing current finding with same key
        const { data: existingFindings, error: fetchError } = await supabase
          .from("body_system_findings")
          .select("*")
          .eq("user_id", userId)
          .eq("body_system", bodySystem)
          .eq("finding_key", finding.findingKey)
          .eq("is_current", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error("[storeFindingsTool] Error fetching existing:", fetchError);
        }

        const existingFinding = existingFindings?.[0];
        let previousFindingId: string | undefined;
        let evolutionTrend: EvolutionTrend | undefined;
        let evolutionNote: string | undefined;

        // If there's an existing finding, mark it as superseded
        if (existingFinding) {
          evolutionDetected = true;
          previousFindingId = existingFinding.id;

          // Calculate evolution trend
          if (finding.valueNumeric !== undefined && existingFinding.value_numeric !== null) {
            const oldVal = Number(existingFinding.value_numeric);
            const newVal = finding.valueNumeric;
            const diff = newVal - oldVal;
            const percentChange = oldVal !== 0 ? (diff / oldVal) * 100 : 0;

            // Determine if improvement is higher or lower based on status
            // For most metrics (vitamins, etc.), higher is better if status improves
            // For stress/bad metrics, lower is better
            if (Math.abs(percentChange) < 5) {
              evolutionTrend = "stable";
              evolutionNote = `Stable at ${finding.value}${finding.unit ? ' ' + finding.unit : ''}`;
            } else if (finding.status === "good" && existingFinding.status !== "good") {
              evolutionTrend = "improved";
              evolutionNote = `Improved from ${existingFinding.value} to ${finding.value}${finding.unit ? ' ' + finding.unit : ''}`;
            } else if (finding.status !== "good" && existingFinding.status === "good") {
              evolutionTrend = "declined";
              evolutionNote = `Changed from ${existingFinding.value} to ${finding.value}${finding.unit ? ' ' + finding.unit : ''}`;
            } else if (diff > 0) {
              // For most health markers, higher is generally better
              evolutionTrend = "improved";
              evolutionNote = `Increased from ${existingFinding.value} to ${finding.value}${finding.unit ? ' ' + finding.unit : ''}`;
            } else {
              evolutionTrend = "declined";
              evolutionNote = `Decreased from ${existingFinding.value} to ${finding.value}${finding.unit ? ' ' + finding.unit : ''}`;
            }
          } else {
            // Non-numeric comparison
            if (finding.status === "good" && existingFinding.status !== "good") {
              evolutionTrend = "improved";
            } else if (finding.status !== "good" && existingFinding.status === "good") {
              evolutionTrend = "declined";
            } else {
              evolutionTrend = "stable";
            }
            evolutionNote = `Changed from "${existingFinding.value}" to "${finding.value}"`;
          }

          evolutionFindings.push({
            findingKey: finding.findingKey,
            previousValue: existingFinding.value,
            currentValue: finding.value,
            trend: evolutionTrend,
          });

          // Mark old finding as superseded (will update after inserting new one)
          await supabase
            .from("body_system_findings")
            .update({ is_current: false })
            .eq("id", existingFinding.id);
        }

        // Insert new finding
        const { data: insertedFinding, error: insertError } = await supabase
          .from("body_system_findings")
          .insert({
            user_id: userId,
            document_id: documentId,
            body_system: bodySystem,
            finding_key: finding.findingKey,
            title: finding.title,
            value: finding.value,
            value_numeric: finding.valueNumeric,
            unit: finding.unit,
            status: finding.status,
            severity: finding.severity,
            reference_min: finding.referenceMin,
            reference_max: finding.referenceMax,
            reference_text: finding.referenceText,
            explanation: finding.explanation,
            action_tip: finding.actionTip,
            icon_name: finding.iconName,
            priority: finding.priority,
            is_current: true,
            previous_finding_id: previousFindingId,
            evolution_trend: evolutionTrend,
            evolution_note: evolutionNote,
            measured_at: measuredAt || now,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("[storeFindingsTool] Insert error:", insertError);
          continue;
        }

        // Update old finding to point to new one
        if (previousFindingId && insertedFinding) {
          await supabase
            .from("body_system_findings")
            .update({ superseded_by: insertedFinding.id })
            .eq("id", previousFindingId);
        }

        storedCount++;
      }

      console.log("[storeFindingsTool] Stored findings", {
        userId,
        bodySystem,
        storedCount,
        evolutionDetected,
      });

      return {
        success: true,
        storedCount,
        evolutionDetected,
        evolutionFindings: evolutionFindings.length > 0 ? evolutionFindings : undefined,
      };
    } catch (error) {
      console.error("[storeFindingsTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to store findings",
      };
    }
  },
});

/**
 * Get User Health Profile Tool
 * 
 * Fetches the complete health profile for a user, grouped by body system.
 */
export const getUserHealthProfileTool = createTool({
  id: "get-user-health-profile",
  description: "Fetches the complete cumulative health profile for a user",
  inputSchema: z.object({
    userId: z.string(),
    includeHistory: z.boolean().default(false), // Include superseded findings
  }),
  outputSchema: z.object({
    success: z.boolean(),
    profile: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, includeHistory }) => {
    try {
      const supabase = getSupabaseClient();

      // Fetch all current findings grouped by body system
      const query = supabase
        .from("body_system_findings")
        .select("*")
        .eq("user_id", userId)
        .order("body_system")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

      if (!includeHistory) {
        query.eq("is_current", true);
      }

      const { data: findings, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch findings: ${error.message}`);
      }

      // Group by body system
      const bodySystems: Record<string, {
        systemName: string;
        lastUpdated: string;
        currentFindings: any[];
        hasEvolution: boolean;
        overallStatus: string;
      }> = {};

      for (const finding of findings || []) {
        const system = finding.body_system;
        
        if (!bodySystems[system]) {
          bodySystems[system] = {
            systemName: system,
            lastUpdated: finding.created_at,
            currentFindings: [],
            hasEvolution: false,
            overallStatus: "good",
          };
        }

        if (finding.is_current) {
          bodySystems[system].currentFindings.push({
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
          });

          // Update overall status (concern > attention > good)
          if (finding.status === "concern") {
            bodySystems[system].overallStatus = "concern";
          } else if (finding.status === "attention" && bodySystems[system].overallStatus !== "concern") {
            bodySystems[system].overallStatus = "attention";
          }

          // Check for evolution
          if (finding.evolution_trend) {
            bodySystems[system].hasEvolution = true;
          }
        }

        // Update last updated date
        if (finding.created_at > bodySystems[system].lastUpdated) {
          bodySystems[system].lastUpdated = finding.created_at;
        }
      }

      // Fetch correlations
      const { data: correlations } = await supabase
        .from("health_correlations")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .eq("is_dismissed", false)
        .order("confidence", { ascending: false });

      return {
        success: true,
        profile: {
          userId,
          bodySystems,
          systemCount: Object.keys(bodySystems).length,
          totalFindings: findings?.filter(f => f.is_current).length || 0,
          correlations: correlations || [],
        },
      };
    } catch (error) {
      console.error("[getUserHealthProfileTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch health profile",
      };
    }
  },
});

