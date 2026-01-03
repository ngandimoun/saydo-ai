import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import type { HealthDocumentType } from "./health-classifier-tool";

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
 * Get user's health profile for personalized analysis
 */
async function getUserHealthProfile(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("allergies, blood_group, body_type, age, gender, weight")
    .eq("id", userId)
    .single();

  return {
    allergies: profile?.allergies || [],
    bloodGroup: profile?.blood_group,
    bodyType: profile?.body_type,
    age: profile?.age,
    gender: profile?.gender,
    weight: profile?.weight,
  };
}

// ============================================
// FOOD ANALYSIS TOOL
// ============================================

export const FoodAnalysisResultSchema = z.object({
  detected: z.string().describe("What food was detected"),
  ingredients: z.array(z.string()).describe("Detected ingredients"),
  calories: z.number().optional().describe("Estimated calories"),
  nutrients: z.object({
    protein: z.string().optional(),
    carbs: z.string().optional(),
    fat: z.string().optional(),
    fiber: z.string().optional(),
    sugar: z.string().optional(),
    sodium: z.string().optional(),
  }).optional(),
  healthScore: z.number().min(0).max(100).describe("Health score 0-100"),
  benefits: z.array(z.string()).describe("Health benefits"),
  concerns: z.array(z.string()).describe("Health concerns"),
  allergyWarnings: z.array(z.string()).describe("Matched allergens from user profile"),
  bloodTypeCompatibility: z.object({
    compatible: z.boolean(),
    notes: z.string(),
  }).optional(),
  recommendations: z.array(z.string()).describe("Personalized recommendations"),
});

export type FoodAnalysisResult = z.infer<typeof FoodAnalysisResultSchema>;

export const analyzeFoodTool = createTool({
  id: "analyze-food",
  description: "Analyzes a food photo to extract nutritional information, check for allergens, and provide personalized health insights",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL of the food image"),
    mimeType: z.string().describe("MIME type of the image"),
    userId: z.string().describe("User ID for personalized analysis"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysis: FoodAnalysisResultSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileUrl, mimeType, userId }) => {
    try {
      const openai = getOpenAIClient();
      const userProfile = await getUserHealthProfile(userId);
      const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);

      const allergiesText = userProfile.allergies.length > 0
        ? `User allergies: ${userProfile.allergies.join(", ")}`
        : "No known allergies";

      const bloodTypeText = userProfile.bloodGroup
        ? `User blood type: ${userProfile.bloodGroup}`
        : "";

      const prompt = `Analyze this food image and provide a detailed nutritional assessment.

User Profile:
- ${allergiesText}
${bloodTypeText ? `- ${bloodTypeText}` : ""}

Provide a JSON response with:
{
  "detected": "Description of the food/meal",
  "ingredients": ["list", "of", "ingredients"],
  "calories": estimated_number,
  "nutrients": {
    "protein": "Xg",
    "carbs": "Xg",
    "fat": "Xg",
    "fiber": "Xg",
    "sugar": "Xg",
    "sodium": "Xmg"
  },
  "healthScore": 0-100,
  "benefits": ["health", "benefits"],
  "concerns": ["health", "concerns"],
  "allergyWarnings": ["any ingredients matching user allergies"],
  "bloodTypeCompatibility": {
    "compatible": true/false,
    "notes": "explanation based on blood type diet"
  },
  "recommendations": ["personalized", "recommendations"]
}

CRITICAL: Check all ingredients against user allergies: ${userProfile.allergies.join(", ") || "none"}.
If ANY allergen is detected, it MUST be in allergyWarnings and healthScore should be reduced.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from analysis model");
      }

      const analysis = JSON.parse(content) as FoodAnalysisResult;

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      console.error("[analyzeFoodTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze food",
      };
    }
  },
});

// ============================================
// SUPPLEMENT ANALYSIS TOOL
// ============================================

export const SupplementAnalysisResultSchema = z.object({
  name: z.string().describe("Supplement name"),
  brand: z.string().optional().describe("Brand name"),
  type: z.string().describe("Type of supplement"),
  activeIngredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    dailyValue: z.string().optional(),
  })).describe("Active ingredients with amounts"),
  otherIngredients: z.array(z.string()).optional(),
  suggestedUse: z.string().optional(),
  healthScore: z.number().min(0).max(100),
  benefits: z.array(z.string()),
  concerns: z.array(z.string()),
  allergyWarnings: z.array(z.string()),
  drugInteractions: z.array(z.string()).optional(),
  recommendations: z.array(z.string()),
});

export type SupplementAnalysisResult = z.infer<typeof SupplementAnalysisResultSchema>;

export const analyzeSupplementTool = createTool({
  id: "analyze-supplement",
  description: "Analyzes a supplement image to extract ingredients, dosage, and provide personalized health insights",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL of the supplement image"),
    mimeType: z.string().describe("MIME type of the image"),
    userId: z.string().describe("User ID for personalized analysis"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysis: SupplementAnalysisResultSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileUrl, mimeType, userId }) => {
    try {
      const openai = getOpenAIClient();
      const userProfile = await getUserHealthProfile(userId);
      const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);

      const prompt = `Analyze this supplement image and extract all information from the label.

User allergies: ${userProfile.allergies.join(", ") || "none"}

Provide a JSON response with:
{
  "name": "Supplement name",
  "brand": "Brand name if visible",
  "type": "Type (vitamin, mineral, herbal, protein, etc.)",
  "activeIngredients": [
    {"name": "Vitamin D3", "amount": "1000 IU", "dailyValue": "250%"}
  ],
  "otherIngredients": ["list of other ingredients"],
  "suggestedUse": "Dosage instructions if visible",
  "healthScore": 0-100,
  "benefits": ["health benefits"],
  "concerns": ["potential concerns"],
  "allergyWarnings": ["matched allergens"],
  "drugInteractions": ["known drug interactions"],
  "recommendations": ["personalized recommendations"]
}

Read the Supplement Facts label carefully. Check ingredients against user allergies.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from analysis model");
      }

      const analysis = JSON.parse(content) as SupplementAnalysisResult;

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      console.error("[analyzeSupplementTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze supplement",
      };
    }
  },
});

// ============================================
// DRINK ANALYSIS TOOL
// ============================================

export const DrinkAnalysisResultSchema = z.object({
  name: z.string().describe("Drink name"),
  brand: z.string().optional(),
  type: z.string().describe("Type (water, juice, soda, energy drink, etc.)"),
  volume: z.string().optional(),
  calories: z.number().optional(),
  nutrients: z.object({
    sugar: z.string().optional(),
    caffeine: z.string().optional(),
    sodium: z.string().optional(),
    protein: z.string().optional(),
  }).optional(),
  ingredients: z.array(z.string()).optional(),
  hydrationImpact: z.enum(["excellent", "good", "moderate", "poor"]),
  healthScore: z.number().min(0).max(100),
  benefits: z.array(z.string()),
  concerns: z.array(z.string()),
  allergyWarnings: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type DrinkAnalysisResult = z.infer<typeof DrinkAnalysisResultSchema>;

export const analyzeDrinkTool = createTool({
  id: "analyze-drink",
  description: "Analyzes a drink/beverage image to extract nutritional information and hydration impact",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL of the drink image"),
    mimeType: z.string().describe("MIME type of the image"),
    userId: z.string().describe("User ID for personalized analysis"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysis: DrinkAnalysisResultSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileUrl, mimeType, userId }) => {
    try {
      const openai = getOpenAIClient();
      const userProfile = await getUserHealthProfile(userId);
      const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);

      const prompt = `Analyze this drink/beverage image.

User allergies: ${userProfile.allergies.join(", ") || "none"}

Provide a JSON response with:
{
  "name": "Drink name",
  "brand": "Brand if visible",
  "type": "water/juice/soda/energy_drink/tea/coffee/alcohol/smoothie/other",
  "volume": "Volume if visible",
  "calories": number,
  "nutrients": {
    "sugar": "Xg",
    "caffeine": "Xmg",
    "sodium": "Xmg",
    "protein": "Xg"
  },
  "ingredients": ["list if visible"],
  "hydrationImpact": "excellent/good/moderate/poor",
  "healthScore": 0-100,
  "benefits": ["benefits"],
  "concerns": ["concerns"],
  "allergyWarnings": ["matched allergens"],
  "recommendations": ["recommendations"]
}

Consider hydration impact, sugar content, and caffeine levels.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from analysis model");
      }

      const analysis = JSON.parse(content) as DrinkAnalysisResult;

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      console.error("[analyzeDrinkTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze drink",
      };
    }
  },
});

// ============================================
// LAB RESULTS ANALYSIS TOOL
// ============================================

export const BiomarkerSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  referenceMin: z.number().nullish(),
  referenceMax: z.number().nullish(),
  referenceText: z.string().optional(),
  status: z.enum(["critical_low", "low", "normal", "high", "critical_high"]),
  category: z.string().optional(),
});

export const LabAnalysisResultSchema = z.object({
  labName: z.string().nullish(),
  testDate: z.string().nullish(),
  patientName: z.string().nullish(),
  biomarkers: z.array(BiomarkerSchema),
  summary: z.string(),
  abnormalCount: z.number(),
  criticalFindings: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type LabAnalysisResult = z.infer<typeof LabAnalysisResultSchema>;
export type Biomarker = z.infer<typeof BiomarkerSchema>;

export const analyzeLabResultsTool = createTool({
  id: "analyze-lab-results",
  description: "Analyzes lab results (PDF or image) to extract biomarker values and flag abnormal results",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL of the lab results"),
    mimeType: z.string().describe("MIME type of the file"),
    userId: z.string().describe("User ID"),
    extractedText: z.string().optional().describe("Pre-extracted text from PDF"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysis: LabAnalysisResultSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileUrl, mimeType, userId, extractedText }) => {
    try {
      console.log("[analyzeLabResultsTool] Starting analysis", { fileUrl, mimeType, userId, hasExtractedText: !!extractedText });
      
      const openai = getOpenAIClient();
      console.log("[analyzeLabResultsTool] OpenAI client initialized");

      let content: OpenAI.Chat.Completions.ChatCompletionContentPart[];
      
      if (extractedText) {
        console.log("[analyzeLabResultsTool] Using pre-extracted text");
        // Use pre-extracted text
        content = [
          { type: "text", text: `Analyze these lab results:\n\n${extractedText}` },
        ];
      } else if (mimeType.startsWith("image/")) {
        console.log("[analyzeLabResultsTool] Processing image, fetching image data URL");
        try {
          // Use vision for images
          const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);
          console.log("[analyzeLabResultsTool] Image data URL fetched successfully", { 
            dataUrlLength: imageDataUrl.length,
            isDataUrl: imageDataUrl.startsWith("data:")
          });
          content = [
            { type: "text", text: "Analyze this lab results image. Extract all biomarker values." },
            { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
          ];
        } catch (fetchError) {
          console.error("[analyzeLabResultsTool] Failed to fetch image data URL", {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            fileUrl,
            mimeType
          });
          throw new Error(`Failed to fetch image: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }
      } else {
        const errorMsg = "Unsupported file type for lab analysis. Provide image or extracted text.";
        console.error("[analyzeLabResultsTool] Unsupported file type", { mimeType });
        throw new Error(errorMsg);
      }

      const prompt = `Extract all biomarker values from these lab results.

For each biomarker found, determine if it's within normal range.

Provide a JSON response with:
{
  "labName": "Lab name if visible",
  "testDate": "Test date if visible (ISO format)",
  "patientName": "Patient name if visible",
  "biomarkers": [
    {
      "name": "Biomarker name",
      "value": numeric_value,
      "unit": "unit",
      "referenceMin": min_normal_value,
      "referenceMax": max_normal_value,
      "referenceText": "original reference text",
      "status": "critical_low/low/normal/high/critical_high",
      "category": "blood/urine/hormone/vitamin/mineral/lipid/liver/kidney/thyroid"
    }
  ],
  "summary": "Brief summary of overall results",
  "abnormalCount": number_of_abnormal_values,
  "criticalFindings": ["any critical findings"],
  "recommendations": ["health recommendations based on results"]
}

Status guidelines:
- critical_low: More than 30% below reference min
- low: Below reference min
- normal: Within reference range
- high: Above reference max
- critical_high: More than 30% above reference max`;

      console.log("[analyzeLabResultsTool] Calling OpenAI API");
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }, ...content],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });
      console.log("[analyzeLabResultsTool] OpenAI API call completed", {
        hasResponse: !!response,
        hasChoices: !!response.choices,
        choicesLength: response.choices?.length
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        console.error("[analyzeLabResultsTool] No response content from OpenAI");
        throw new Error("No response from analysis model");
      }
      console.log("[analyzeLabResultsTool] Response content received", { 
        contentLength: responseContent.length,
        contentPreview: responseContent.substring(0, 200)
      });

      console.log("[analyzeLabResultsTool] Parsing JSON response");
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("[analyzeLabResultsTool] JSON parse error", {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          contentPreview: responseContent.substring(0, 500)
        });
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      console.log("[analyzeLabResultsTool] Validating parsed JSON against schema");
      const validationResult = LabAnalysisResultSchema.safeParse(parsedJson);
      if (!validationResult.success) {
        const issues = validationResult.error.issues || [];
        console.error("[analyzeLabResultsTool] Schema validation failed", {
          issues: issues,
          issueCount: issues.length,
          parsedJson: JSON.stringify(parsedJson, null, 2).substring(0, 1000)
        });
        throw new Error(`Schema validation failed: ${issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }

      const analysis = validationResult.data;
      console.log("[analyzeLabResultsTool] Analysis completed successfully", {
        biomarkersCount: analysis.biomarkers.length,
        abnormalCount: analysis.abnormalCount
      });

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("[analyzeLabResultsTool] Error caught", {
        error: errorMessage,
        stack: errorStack,
        fileUrl,
        mimeType,
        userId
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

// ============================================
// MEDICATION ANALYSIS TOOL
// ============================================

export const MedicationAnalysisResultSchema = z.object({
  name: z.string(),
  genericName: z.string().optional(),
  brand: z.string().optional(),
  dosage: z.string().optional(),
  form: z.string().optional(), // tablet, capsule, liquid, etc.
  purpose: z.string().optional(),
  activeIngredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
  })).optional(),
  sideEffects: z.array(z.string()).optional(),
  warnings: z.array(z.string()),
  drugInteractions: z.array(z.string()),
  allergyWarnings: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type MedicationAnalysisResult = z.infer<typeof MedicationAnalysisResultSchema>;

export const analyzeMedicationTool = createTool({
  id: "analyze-medication",
  description: "Analyzes medication/prescription image to extract drug information and check for interactions",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL of the medication image"),
    mimeType: z.string().describe("MIME type of the image"),
    userId: z.string().describe("User ID for personalized analysis"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysis: MedicationAnalysisResultSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileUrl, mimeType, userId }) => {
    try {
      const openai = getOpenAIClient();
      const userProfile = await getUserHealthProfile(userId);
      const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);

      // Get user's current supplements for interaction check
      const supabase = getSupabaseClient();
      const { data: supplements } = await supabase
        .from("intake_log")
        .select("name, active_ingredients")
        .eq("user_id", userId)
        .eq("intake_type", "supplement")
        .order("logged_at", { ascending: false })
        .limit(10);

      const supplementList = supplements?.map(s => s.name).join(", ") || "none";

      const prompt = `Analyze this medication image.

User allergies: ${userProfile.allergies.join(", ") || "none"}
Current supplements: ${supplementList}

Provide a JSON response with:
{
  "name": "Medication name",
  "genericName": "Generic name",
  "brand": "Brand name",
  "dosage": "Dosage (e.g., 500mg)",
  "form": "tablet/capsule/liquid/etc",
  "purpose": "What it's used for",
  "activeIngredients": [{"name": "ingredient", "amount": "amount"}],
  "sideEffects": ["common side effects"],
  "warnings": ["important warnings"],
  "drugInteractions": ["potential interactions with supplements/other drugs"],
  "allergyWarnings": ["matched allergens"],
  "recommendations": ["usage recommendations"]
}

Check for interactions with the user's supplements. Flag any allergens.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from analysis model");
      }

      const analysis = JSON.parse(content) as MedicationAnalysisResult;

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      console.error("[analyzeMedicationTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze medication",
      };
    }
  },
});

// ============================================
// GENERAL HEALTH DOCUMENT ANALYSIS TOOL
// ============================================

export const GeneralHealthAnalysisResultSchema = z.object({
  documentType: z.string(),
  title: z.string().optional(),
  date: z.string().optional(),
  summary: z.string(),
  keyFindings: z.array(z.string()),
  recommendations: z.array(z.string()),
  followUpActions: z.array(z.string()).optional(),
});

export type GeneralHealthAnalysisResult = z.infer<typeof GeneralHealthAnalysisResultSchema>;

export const analyzeGeneralHealthDocTool = createTool({
  id: "analyze-general-health-doc",
  description: "Analyzes general health documents (clinical reports, doctor's notes, etc.)",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL of the document"),
    mimeType: z.string().describe("MIME type"),
    userId: z.string().describe("User ID"),
    extractedText: z.string().optional().describe("Pre-extracted text"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysis: GeneralHealthAnalysisResultSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileUrl, mimeType, userId, extractedText }) => {
    try {
      const openai = getOpenAIClient();

      let content: OpenAI.Chat.Completions.ChatCompletionContentPart[];
      
      if (extractedText) {
        content = [
          { type: "text", text: `Analyze this health document:\n\n${extractedText}` },
        ];
      } else if (mimeType.startsWith("image/")) {
        const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);
        content = [
          { type: "text", text: "Analyze this health document image." },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
        ];
      } else {
        throw new Error("Unsupported file type. Provide image or extracted text.");
      }

      const prompt = `Analyze this health document and extract key information.

Provide a JSON response with:
{
  "documentType": "Type of document",
  "title": "Document title if visible",
  "date": "Date if visible (ISO format)",
  "summary": "Summary of the document",
  "keyFindings": ["key findings or information"],
  "recommendations": ["health recommendations"],
  "followUpActions": ["suggested follow-up actions"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }, ...content],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("No response from analysis model");
      }

      const analysis = JSON.parse(responseContent) as GeneralHealthAnalysisResult;

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      console.error("[analyzeGeneralHealthDocTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze document",
      };
    }
  },
});

// ============================================
// STORE ANALYSIS RESULTS TOOL
// ============================================

export const storeHealthAnalysisTool = createTool({
  id: "store-health-analysis",
  description: "Stores health document analysis results in the database",
  inputSchema: z.object({
    documentId: z.string().describe("Health document ID"),
    userId: z.string().describe("User ID"),
    documentType: z.string().describe("Type of document"),
    bodySystem: z.string().optional().describe("Body system for the document"),
    analysisResult: z.any().describe("Analysis result to store"),
    allergyWarnings: z.array(z.string()).optional(),
    interactionWarnings: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    intakeLogId: z.string().optional(),
    biomarkersCreated: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ documentId, userId, documentType, bodySystem, analysisResult, allergyWarnings, interactionWarnings }) => {
    try {
      const supabase = getSupabaseClient();

      // Update the health document with analysis results, including classification
      const { error: updateError } = await supabase
        .from("health_documents")
        .update({
          status: "analyzed",
          document_type: documentType, // Persist the classified document type
          body_system: bodySystem || null, // Persist the classified body system
          extracted_data: analysisResult,
          analysis_summary: analysisResult.summary || analysisResult.detected || "Analysis complete",
          allergy_warnings: allergyWarnings || analysisResult.allergyWarnings || [],
          interaction_warnings: interactionWarnings || analysisResult.drugInteractions || [],
          health_impact: {
            score: analysisResult.healthScore,
            benefits: analysisResult.benefits || [],
            concerns: analysisResult.concerns || [],
          },
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (updateError) {
        throw new Error(`Failed to update document: ${updateError.message}`);
      }

      let intakeLogId: string | undefined;
      let biomarkersCreated = 0;

      // For food, supplement, drink, medication - create intake log entry
      if (["food_photo", "supplement", "drink", "medication"].includes(documentType)) {
        const intakeType = documentType === "food_photo" ? "food" : 
                          documentType === "medication" ? "medication" : documentType;

        const { data: intakeData, error: intakeError } = await supabase
          .from("intake_log")
          .insert({
            user_id: userId,
            document_id: documentId,
            intake_type: intakeType,
            name: analysisResult.detected || analysisResult.name || "Unknown",
            calories: analysisResult.calories,
            nutrients: analysisResult.nutrients,
            ingredients: analysisResult.ingredients,
            active_ingredients: analysisResult.activeIngredients,
            health_score: analysisResult.healthScore,
            allergy_match: allergyWarnings || analysisResult.allergyWarnings || [],
            benefits: analysisResult.benefits || [],
            concerns: analysisResult.concerns || [],
            blood_type_compatible: analysisResult.bloodTypeCompatibility?.compatible,
            blood_type_notes: analysisResult.bloodTypeCompatibility?.notes,
          })
          .select("id")
          .single();

        if (intakeData) {
          intakeLogId = intakeData.id;
        }
      }

      // For lab results - create biomarker entries
      if (["lab_pdf", "lab_handwritten"].includes(documentType) && analysisResult.biomarkers) {
        for (const biomarker of analysisResult.biomarkers) {
          const { error: biomarkerError } = await supabase
            .from("biomarkers")
            .insert({
              user_id: userId,
              document_id: documentId,
              name: biomarker.name,
              value: biomarker.value,
              unit: biomarker.unit,
              reference_min: biomarker.referenceMin,
              reference_max: biomarker.referenceMax,
              reference_text: biomarker.referenceText,
              status: biomarker.status,
              category: biomarker.category,
              measured_at: analysisResult.testDate || new Date().toISOString(),
              lab_name: analysisResult.labName,
            });

          if (!biomarkerError) {
            biomarkersCreated++;
          }
        }
      }

      return {
        success: true,
        intakeLogId,
        biomarkersCreated,
      };
    } catch (error) {
      console.error("[storeHealthAnalysisTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to store analysis",
      };
    }
  },
});

// Export all tools
export const healthAnalysisTools = {
  analyzeFood: analyzeFoodTool,
  analyzeSupplement: analyzeSupplementTool,
  analyzeDrink: analyzeDrinkTool,
  analyzeLabResults: analyzeLabResultsTool,
  analyzeMedication: analyzeMedicationTool,
  analyzeGeneralHealthDoc: analyzeGeneralHealthDocTool,
  storeHealthAnalysis: storeHealthAnalysisTool,
};


