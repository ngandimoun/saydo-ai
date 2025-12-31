/**
 * Health Correlation Engine
 * 
 * Detects meaningful correlations between different body systems
 * based on accumulated health findings. This helps users understand
 * how different aspects of their health are interconnected.
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
 * Translate text using gpt-4o-mini
 */
async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (targetLanguage === "en") return text;
  
  const languageName = LANGUAGE_NAMES[targetLanguage] || "English";
  const openai = getOpenAIClient();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are a translator. Translate the following text to ${languageName}. Keep it natural and easy to understand. Only output the translation, nothing else.` 
        },
        { role: "user", content: text },
      ],
      max_tokens: 500,
    });
    
    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.warn("[translateText] Translation failed, using original:", error);
    return text;
  }
}

/**
 * Known health correlations based on medical research
 * These are patterns that the engine looks for
 */
export interface CorrelationPattern {
  id: string;
  name: string;
  description: string;
  systems: string[]; // Body systems involved
  triggerConditions: TriggerCondition[];
  explanation: string; // Plain language explanation
  actionTip: string;
  confidence: number; // Base confidence 0-1
  priority: "high" | "medium" | "low";
  iconName: string;
}

interface TriggerCondition {
  system: string;
  findingKey?: string; // Specific finding key to look for
  findingKeyPattern?: string; // Regex pattern to match finding keys
  status?: string[]; // Which statuses trigger this (e.g., ["attention", "concern"])
  valueComparison?: {
    operator: "lt" | "gt" | "eq" | "between";
    value: number;
    value2?: number; // For "between"
  };
}

/**
 * Medical knowledge base of cross-system correlations
 */
export const CORRELATION_PATTERNS: CorrelationPattern[] = [
  // B12 and Nervous System
  {
    id: "b12_neurological",
    name: "B12 & Nervous System",
    description: "Low B12 affecting neurological health",
    systems: ["nutrition", "neurological", "eyes"],
    triggerConditions: [
      { system: "nutrition", findingKeyPattern: "vitamin_b12|b12", status: ["attention", "concern"] },
    ],
    explanation: "Low Vitamin B12 can affect your nerves, causing fatigue, numbness, and even vision problems. B12 is essential for nerve health and brain function.",
    actionTip: "Consider B12-rich foods like eggs, fish, and meat. If you have digestive issues, sublingual B12 supplements may absorb better.",
    confidence: 0.85,
    priority: "high",
    iconName: "zap",
  },
  // Vitamin D Multi-System
  {
    id: "vitamin_d_multisystem",
    name: "Vitamin D Impact",
    description: "Low Vitamin D affecting multiple systems",
    systems: ["nutrition", "musculoskeletal", "immune", "metabolic"],
    triggerConditions: [
      { system: "nutrition", findingKeyPattern: "vitamin_d|vit_d", status: ["attention", "concern"] },
    ],
    explanation: "Vitamin D deficiency can affect your bones, immune system, mood, and energy levels. It's one of the most common nutritional deficiencies.",
    actionTip: "Get 15-20 minutes of sunlight daily, eat fatty fish and fortified foods, and consider a D3+K2 supplement.",
    confidence: 0.9,
    priority: "high",
    iconName: "sun",
  },
  // Gut-Skin Axis
  {
    id: "gut_skin_axis",
    name: "Gut-Skin Connection",
    description: "Digestive issues affecting skin health",
    systems: ["digestive", "skin"],
    triggerConditions: [
      { system: "digestive", status: ["attention", "concern"] },
      { system: "skin", status: ["attention", "concern"] },
    ],
    explanation: "Your gut and skin are closely connected. Digestive inflammation, food sensitivities, or imbalanced gut bacteria can show up as skin problems like acne, eczema, or rosacea.",
    actionTip: "Consider an elimination diet to find food triggers. Probiotics and fermented foods may help both gut and skin health.",
    confidence: 0.8,
    priority: "medium",
    iconName: "link",
  },
  // Thyroid Multi-System
  {
    id: "thyroid_multisystem",
    name: "Thyroid Impact",
    description: "Thyroid affecting energy, weight, and skin",
    systems: ["hormones", "metabolic", "skin", "cardiovascular"],
    triggerConditions: [
      { system: "hormones", findingKeyPattern: "tsh|thyroid|t3|t4", status: ["attention", "concern"] },
    ],
    explanation: "Your thyroid controls metabolism. When it's off, you may experience fatigue, weight changes, dry skin, hair loss, or heart rate changes.",
    actionTip: "Work with your doctor on thyroid management. Selenium and iodine support thyroid function naturally.",
    confidence: 0.9,
    priority: "high",
    iconName: "activity",
  },
  // Iron and Energy
  {
    id: "iron_fatigue",
    name: "Iron & Energy",
    description: "Low iron causing fatigue and weakness",
    systems: ["nutrition", "blood", "cardiovascular"],
    triggerConditions: [
      { system: "nutrition", findingKeyPattern: "iron|ferritin", status: ["attention", "concern"] },
      { system: "blood", findingKeyPattern: "hemoglobin|hgb", status: ["attention", "concern"] },
    ],
    explanation: "Iron is essential for carrying oxygen in your blood. Low iron can cause fatigue, weakness, pale skin, and shortness of breath.",
    actionTip: "Eat iron-rich foods with vitamin C to improve absorption. Red meat, spinach, and legumes are good sources.",
    confidence: 0.85,
    priority: "high",
    iconName: "battery-low",
  },
  // Blood Sugar and Inflammation
  {
    id: "glucose_inflammation",
    name: "Blood Sugar & Inflammation",
    description: "High glucose linked to inflammation markers",
    systems: ["metabolic", "cardiovascular", "immune"],
    triggerConditions: [
      { system: "metabolic", findingKeyPattern: "glucose|hba1c|sugar", status: ["attention", "concern"] },
    ],
    explanation: "High blood sugar promotes inflammation throughout your body, which can affect your heart, joints, and overall health.",
    actionTip: "Reduce refined carbs and sugars. Regular exercise helps your body use glucose more efficiently.",
    confidence: 0.85,
    priority: "high",
    iconName: "flame",
  },
  // Liver and Cholesterol
  {
    id: "liver_lipids",
    name: "Liver & Cholesterol",
    description: "Liver function affecting lipid levels",
    systems: ["hepatic", "cardiovascular"],
    triggerConditions: [
      { system: "hepatic", status: ["attention", "concern"] },
      { system: "cardiovascular", findingKeyPattern: "cholesterol|ldl|triglyceride", status: ["attention", "concern"] },
    ],
    explanation: "Your liver produces cholesterol and processes fats. Liver issues can lead to abnormal cholesterol and triglyceride levels.",
    actionTip: "Limit alcohol, avoid processed foods, and include liver-supporting foods like leafy greens and beets.",
    confidence: 0.8,
    priority: "medium",
    iconName: "heart",
  },
  // Kidney and Blood Pressure
  {
    id: "kidney_cardiovascular",
    name: "Kidney & Heart",
    description: "Kidney function affecting cardiovascular health",
    systems: ["renal", "cardiovascular"],
    triggerConditions: [
      { system: "renal", status: ["attention", "concern"] },
    ],
    explanation: "Your kidneys help regulate blood pressure and fluid balance. Kidney problems can contribute to high blood pressure and cardiovascular issues.",
    actionTip: "Stay hydrated, limit sodium, and monitor blood pressure regularly. Protect your kidneys to protect your heart.",
    confidence: 0.85,
    priority: "high",
    iconName: "droplet",
  },
  // Eye and Nutrition
  {
    id: "eye_nutrition",
    name: "Vision & Nutrition",
    description: "Nutritional factors affecting eye health",
    systems: ["eyes", "nutrition"],
    triggerConditions: [
      { system: "eyes", status: ["attention", "concern"] },
      { system: "nutrition", findingKeyPattern: "vitamin_a|omega_3|lutein|zeaxanthin", status: ["attention", "concern"] },
    ],
    explanation: "Your eyes need specific nutrients like Vitamin A, omega-3s, lutein, and zeaxanthin to stay healthy. Deficiencies can contribute to dry eyes and vision problems.",
    actionTip: "Eat colorful vegetables (especially leafy greens and orange veggies), fatty fish, and consider an eye-health supplement.",
    confidence: 0.8,
    priority: "medium",
    iconName: "eye",
  },
  // Hormone and Skin
  {
    id: "hormone_skin",
    name: "Hormones & Skin",
    description: "Hormonal imbalances affecting skin",
    systems: ["hormones", "skin"],
    triggerConditions: [
      { system: "hormones", status: ["attention", "concern"] },
      { system: "skin", status: ["attention", "concern"] },
    ],
    explanation: "Hormones like estrogen, testosterone, and cortisol directly affect your skin. Imbalances can cause acne, dryness, or aging.",
    actionTip: "Balance hormones through stress management, regular exercise, and proper sleep. Consider hormone-balancing foods and supplements.",
    confidence: 0.75,
    priority: "medium",
    iconName: "sparkles",
  },
];

/**
 * Detected correlation with context
 */
export interface DetectedCorrelation {
  patternId: string;
  pattern: CorrelationPattern;
  matchedFindings: Array<{
    findingId: string;
    system: string;
    title: string;
    status: string;
  }>;
  confidence: number;
  detectedAt: Date;
}

/**
 * Analyze user's findings and detect correlations
 */
export async function detectCorrelations(userId: string): Promise<DetectedCorrelation[]> {
  const supabase = createClient();

  // Fetch all current findings for the user
  const { data: findings, error } = await supabase
    .from("body_system_findings")
    .select("*")
    .eq("user_id", userId)
    .eq("is_current", true);

  if (error || !findings || findings.length === 0) {
    return [];
  }

  // Group findings by body system
  const findingsBySystem: Record<string, typeof findings> = {};
  for (const finding of findings) {
    const system = finding.body_system;
    if (!findingsBySystem[system]) {
      findingsBySystem[system] = [];
    }
    findingsBySystem[system].push(finding);
  }

  const detectedCorrelations: DetectedCorrelation[] = [];

  // Check each pattern
  for (const pattern of CORRELATION_PATTERNS) {
    const matchedFindings: DetectedCorrelation["matchedFindings"] = [];
    let conditionsMet = 0;

    // Check each trigger condition
    for (const condition of pattern.triggerConditions) {
      const systemFindings = findingsBySystem[condition.system];
      if (!systemFindings) continue;

      for (const finding of systemFindings) {
        let matches = false;

        // Check finding key pattern
        if (condition.findingKeyPattern) {
          const regex = new RegExp(condition.findingKeyPattern, "i");
          if (regex.test(finding.finding_key)) {
            matches = true;
          }
        } else if (condition.findingKey) {
          if (finding.finding_key === condition.findingKey) {
            matches = true;
          }
        } else {
          // No specific key required, just check status
          matches = true;
        }

        // Check status
        if (matches && condition.status) {
          if (!condition.status.includes(finding.status)) {
            matches = false;
          }
        }

        // Check value comparison
        if (matches && condition.valueComparison && finding.value_numeric !== null) {
          const value = Number(finding.value_numeric);
          const { operator, value: compareValue, value2 } = condition.valueComparison;
          
          switch (operator) {
            case "lt": matches = value < compareValue; break;
            case "gt": matches = value > compareValue; break;
            case "eq": matches = value === compareValue; break;
            case "between": matches = value >= compareValue && value <= (value2 || compareValue); break;
          }
        }

        if (matches) {
          matchedFindings.push({
            findingId: finding.id,
            system: finding.body_system,
            title: finding.title,
            status: finding.status,
          });
          conditionsMet++;
          break; // One match per condition is enough
        }
      }
    }

    // Require at least 1 condition met, or multiple for multi-system patterns
    const minConditions = pattern.systems.length > 2 ? 1 : 1;
    if (conditionsMet >= minConditions && matchedFindings.length > 0) {
      // Calculate confidence based on matches
      const matchRatio = conditionsMet / pattern.triggerConditions.length;
      const adjustedConfidence = pattern.confidence * (0.7 + 0.3 * matchRatio);

      detectedCorrelations.push({
        patternId: pattern.id,
        pattern,
        matchedFindings,
        confidence: adjustedConfidence,
        detectedAt: new Date(),
      });
    }
  }

  // Sort by confidence
  detectedCorrelations.sort((a, b) => b.confidence - a.confidence);

  return detectedCorrelations;
}

/**
 * Store detected correlations in the database
 */
export async function storeCorrelations(
  userId: string,
  correlations: DetectedCorrelation[],
  userLanguage: string = "en"
): Promise<number> {
  const supabase = createClient();
  let storedCount = 0;

  for (const correlation of correlations) {
    const findingIds = correlation.matchedFindings.map((f) => f.findingId);

    // Translate explanation and action tip if needed
    let explanation = correlation.pattern.explanation;
    let actionTip = correlation.pattern.actionTip;
    
    if (userLanguage !== "en") {
      try {
        // Translate both in parallel
        [explanation, actionTip] = await Promise.all([
          translateText(explanation, userLanguage),
          translateText(actionTip, userLanguage),
        ]);
      } catch (error) {
        console.warn("[storeCorrelations] Translation failed, using English:", error);
      }
    }

    // Upsert correlation (update if exists, insert if not)
    const { error } = await supabase
      .from("health_correlations")
      .upsert(
        {
          user_id: userId,
          correlation_key: correlation.patternId,
          primary_system: correlation.pattern.systems[0],
          related_systems: correlation.pattern.systems.slice(1),
          title: correlation.pattern.name,
          explanation,
          confidence: correlation.confidence,
          action_tip: actionTip,
          priority: correlation.pattern.priority,
          finding_ids: findingIds,
          icon_name: correlation.pattern.iconName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,correlation_key",
        }
      );

    if (!error) {
      storedCount++;
    } else {
      console.error("[storeCorrelations] Error:", error);
    }
  }

  return storedCount;
}

/**
 * Analyze and update correlations for a user
 * Call this after new findings are stored
 * @param userId - User ID
 * @param userLanguage - User's preferred language code (default: "en")
 */
export async function analyzeAndStoreCorrelations(
  userId: string, 
  userLanguage: string = "en"
): Promise<{
  detected: number;
  stored: number;
}> {
  const correlations = await detectCorrelations(userId);
  const stored = await storeCorrelations(userId, correlations, userLanguage);

  return {
    detected: correlations.length,
    stored,
  };
}

/**
 * Get active correlations for a user
 */
export async function getActiveCorrelations(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("health_correlations")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("is_dismissed", false)
    .order("confidence", { ascending: false });

  if (error) {
    console.error("[getActiveCorrelations] Error:", error);
    return [];
  }

  return data || [];
}

