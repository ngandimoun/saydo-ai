import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

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
 * Health context interface for unified health data access
 */
export interface HealthContext {
  // Recent uploads summary
  recentUploads: {
    count: number;
    lastUploadDate: string | null;
    types: string[];
  };
  
  // Recent food/supplement/drink intake
  recentIntake: Array<{
    id: string;
    type: string;
    name: string;
    healthScore: number | null;
    loggedAt: string;
    allergyMatch: string[];
  }>;
  
  // Latest biomarkers
  latestBiomarkers: Array<{
    name: string;
    value: number;
    unit: string;
    status: string;
    measuredAt: string | null;
  }>;
  
  // Abnormal biomarkers that need attention
  abnormalBiomarkers: Array<{
    name: string;
    value: number;
    unit: string;
    status: string;
    referenceRange: string;
  }>;
  
  // Active medications
  activeMedications: Array<{
    name: string;
    dosage: string | null;
    loggedAt: string;
  }>;
  
  // Recent health insights
  recentInsights: Array<{
    type: string;
    title: string;
    content: string;
    priority: string;
    createdAt: string;
  }>;
  
  // Health trends (if available)
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  
  // Allergy warnings from recent uploads
  recentAllergyWarnings: string[];
}

/**
 * Schema for health context output
 */
export const HealthContextSchema = z.object({
  recentUploads: z.object({
    count: z.number(),
    lastUploadDate: z.string().nullable(),
    types: z.array(z.string()),
  }),
  recentIntake: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    healthScore: z.number().nullable(),
    loggedAt: z.string(),
    allergyMatch: z.array(z.string()),
  })),
  latestBiomarkers: z.array(z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    status: z.string(),
    measuredAt: z.string().nullable(),
  })),
  abnormalBiomarkers: z.array(z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    status: z.string(),
    referenceRange: z.string(),
  })),
  activeMedications: z.array(z.object({
    name: z.string(),
    dosage: z.string().nullable(),
    loggedAt: z.string(),
  })),
  recentInsights: z.array(z.object({
    type: z.string(),
    title: z.string(),
    content: z.string(),
    priority: z.string(),
    createdAt: z.string(),
  })),
  trends: z.object({
    improving: z.array(z.string()),
    declining: z.array(z.string()),
    stable: z.array(z.string()),
  }),
  recentAllergyWarnings: z.array(z.string()),
});

/**
 * Get Health Context Tool
 * 
 * Retrieves unified health context for the user, including:
 * - Recent uploads and their analysis
 * - Latest biomarkers from lab results
 * - Active medications and supplements
 * - Recent health insights
 * - Health trends
 */
export const getHealthContextTool = createTool({
  id: "get-health-context",
  description: "Retrieves the user's unified health context including recent uploads, biomarkers, medications, and health insights. Use this when discussing health topics to provide personalized responses.",
  inputSchema: z.object({
    userId: z.string().describe("User ID"),
    includeIntake: z.boolean().default(true).describe("Include recent food/supplement/drink intake"),
    includeBiomarkers: z.boolean().default(true).describe("Include biomarkers from lab results"),
    includeMedications: z.boolean().default(true).describe("Include active medications"),
    includeInsights: z.boolean().default(true).describe("Include recent health insights"),
    daysBack: z.number().default(30).describe("Number of days to look back"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    context: HealthContextSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, includeIntake, includeBiomarkers, includeMedications, includeInsights, daysBack }) => {
    try {
      const supabase = getSupabaseClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      const cutoffIso = cutoffDate.toISOString();

      // Get recent health documents
      const { data: documents } = await supabase
        .from("health_documents")
        .select("id, document_type, uploaded_at, allergy_warnings")
        .eq("user_id", userId)
        .gte("uploaded_at", cutoffIso)
        .order("uploaded_at", { ascending: false })
        .limit(20);

      const recentUploads = {
        count: documents?.length || 0,
        lastUploadDate: documents?.[0]?.uploaded_at || null,
        types: [...new Set(documents?.map(d => d.document_type) || [])],
      };

      // Collect allergy warnings from recent documents
      const recentAllergyWarnings = [...new Set(
        documents?.flatMap(d => d.allergy_warnings || []) || []
      )];

      // Get recent intake
      let recentIntake: HealthContext["recentIntake"] = [];
      if (includeIntake) {
        const { data: intake } = await supabase
          .from("intake_log")
          .select("id, intake_type, name, health_score, logged_at, allergy_match")
          .eq("user_id", userId)
          .gte("logged_at", cutoffIso)
          .order("logged_at", { ascending: false })
          .limit(10);

        recentIntake = (intake || []).map(i => ({
          id: i.id,
          type: i.intake_type,
          name: i.name,
          healthScore: i.health_score,
          loggedAt: i.logged_at,
          allergyMatch: i.allergy_match || [],
        }));
      }

      // Get latest biomarkers
      let latestBiomarkers: HealthContext["latestBiomarkers"] = [];
      let abnormalBiomarkers: HealthContext["abnormalBiomarkers"] = [];
      if (includeBiomarkers) {
        // Get most recent value for each biomarker
        const { data: biomarkers } = await supabase
          .from("biomarkers")
          .select("name, value, unit, status, reference_min, reference_max, measured_at")
          .eq("user_id", userId)
          .order("measured_at", { ascending: false })
          .limit(50);

        // Deduplicate by name (keep most recent)
        const biomarkerMap = new Map<string, typeof biomarkers[0]>();
        for (const b of biomarkers || []) {
          if (!biomarkerMap.has(b.name)) {
            biomarkerMap.set(b.name, b);
          }
        }

        const uniqueBiomarkers = Array.from(biomarkerMap.values());
        
        latestBiomarkers = uniqueBiomarkers.slice(0, 10).map(b => ({
          name: b.name,
          value: b.value,
          unit: b.unit,
          status: b.status || "normal",
          measuredAt: b.measured_at,
        }));

        abnormalBiomarkers = uniqueBiomarkers
          .filter(b => b.status && b.status !== "normal")
          .map(b => ({
            name: b.name,
            value: b.value,
            unit: b.unit,
            status: b.status || "normal",
            referenceRange: b.reference_min && b.reference_max 
              ? `${b.reference_min} - ${b.reference_max} ${b.unit}`
              : "Not specified",
          }));
      }

      // Get active medications
      let activeMedications: HealthContext["activeMedications"] = [];
      if (includeMedications) {
        const { data: meds } = await supabase
          .from("intake_log")
          .select("name, active_ingredients, logged_at")
          .eq("user_id", userId)
          .eq("intake_type", "medication")
          .gte("logged_at", cutoffIso)
          .order("logged_at", { ascending: false })
          .limit(10);

        // Deduplicate by name
        const medMap = new Map<string, typeof meds[0]>();
        for (const m of meds || []) {
          if (!medMap.has(m.name)) {
            medMap.set(m.name, m);
          }
        }

        activeMedications = Array.from(medMap.values()).map(m => ({
          name: m.name,
          dosage: m.active_ingredients ? JSON.stringify(m.active_ingredients) : null,
          loggedAt: m.logged_at,
        }));
      }

      // Get recent insights
      let recentInsights: HealthContext["recentInsights"] = [];
      if (includeInsights) {
        const { data: insights } = await supabase
          .from("health_insights")
          .select("type, title, content, priority, created_at")
          .eq("user_id", userId)
          .gte("created_at", cutoffIso)
          .order("created_at", { ascending: false })
          .limit(5);

        recentInsights = (insights || []).map(i => ({
          type: i.type,
          title: i.title,
          content: i.content,
          priority: i.priority,
          createdAt: i.created_at,
        }));
      }

      // Get health trends
      const { data: trendData } = await supabase
        .from("health_trends")
        .select("metric_name, trend_direction")
        .eq("user_id", userId)
        .order("calculated_at", { ascending: false })
        .limit(20);

      const trends = {
        improving: [] as string[],
        declining: [] as string[],
        stable: [] as string[],
      };

      // Deduplicate trends by metric name
      const seenMetrics = new Set<string>();
      for (const t of trendData || []) {
        if (!seenMetrics.has(t.metric_name)) {
          seenMetrics.add(t.metric_name);
          if (t.trend_direction === "improving") {
            trends.improving.push(t.metric_name);
          } else if (t.trend_direction === "declining") {
            trends.declining.push(t.metric_name);
          } else {
            trends.stable.push(t.metric_name);
          }
        }
      }

      return {
        success: true,
        context: {
          recentUploads,
          recentIntake,
          latestBiomarkers,
          abnormalBiomarkers,
          activeMedications,
          recentInsights,
          trends,
          recentAllergyWarnings,
        },
      };
    } catch (error) {
      console.error("[getHealthContextTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get health context",
      };
    }
  },
});

/**
 * Get Recent Health Documents Tool
 * 
 * Retrieves recent health document uploads for reference
 */
export const getRecentHealthDocumentsTool = createTool({
  id: "get-recent-health-documents",
  description: "Retrieves the user's recent health document uploads including analysis results",
  inputSchema: z.object({
    userId: z.string().describe("User ID"),
    documentType: z.string().optional().describe("Filter by document type"),
    limit: z.number().default(5).describe("Maximum number of documents to return"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    documents: z.array(z.object({
      id: z.string(),
      fileName: z.string(),
      documentType: z.string(),
      status: z.string(),
      summary: z.string().nullable(),
      healthScore: z.number().nullable(),
      allergyWarnings: z.array(z.string()),
      uploadedAt: z.string(),
    })).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, documentType, limit }) => {
    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("health_documents")
        .select("id, file_name, document_type, status, analysis_summary, health_impact, allergy_warnings, uploaded_at")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false })
        .limit(limit);

      if (documentType) {
        query = query.eq("document_type", documentType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        documents: (data || []).map(d => ({
          id: d.id,
          fileName: d.file_name,
          documentType: d.document_type,
          status: d.status,
          summary: d.analysis_summary,
          healthScore: d.health_impact?.score || null,
          allergyWarnings: d.allergy_warnings || [],
          uploadedAt: d.uploaded_at,
        })),
      };
    } catch (error) {
      console.error("[getRecentHealthDocumentsTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get health documents",
      };
    }
  },
});

/**
 * Get Biomarker History Tool
 * 
 * Retrieves historical values for a specific biomarker
 */
export const getBiomarkerHistoryTool = createTool({
  id: "get-biomarker-history",
  description: "Retrieves historical values for a specific biomarker to show trends over time",
  inputSchema: z.object({
    userId: z.string().describe("User ID"),
    biomarkerName: z.string().describe("Name of the biomarker (e.g., 'Iron', 'Vitamin D')"),
    limit: z.number().default(10).describe("Maximum number of values to return"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    history: z.array(z.object({
      value: z.number(),
      unit: z.string(),
      status: z.string(),
      measuredAt: z.string().nullable(),
      referenceRange: z.string().nullable(),
    })).optional(),
    trend: z.string().optional(), // "improving", "declining", "stable"
    error: z.string().optional(),
  }),
  execute: async ({ userId, biomarkerName, limit }) => {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("biomarkers")
        .select("value, unit, status, measured_at, reference_min, reference_max")
        .eq("user_id", userId)
        .ilike("name", `%${biomarkerName}%`)
        .order("measured_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      const history = (data || []).map(b => ({
        value: b.value,
        unit: b.unit,
        status: b.status || "normal",
        measuredAt: b.measured_at,
        referenceRange: b.reference_min && b.reference_max
          ? `${b.reference_min} - ${b.reference_max} ${b.unit}`
          : null,
      }));

      // Calculate trend if we have at least 2 data points
      let trend: string | undefined;
      if (history.length >= 2) {
        const latest = history[0].value;
        const previous = history[1].value;
        const latestStatus = history[0].status;
        const previousStatus = history[1].status;

        // Determine trend based on movement toward/away from normal
        if (latestStatus === "normal" && previousStatus !== "normal") {
          trend = "improving";
        } else if (latestStatus !== "normal" && previousStatus === "normal") {
          trend = "declining";
        } else if (latestStatus === previousStatus) {
          // Same status, check value direction
          const diff = ((latest - previous) / previous) * 100;
          if (Math.abs(diff) < 5) {
            trend = "stable";
          } else if (latestStatus === "low" || latestStatus === "critical_low") {
            trend = latest > previous ? "improving" : "declining";
          } else if (latestStatus === "high" || latestStatus === "critical_high") {
            trend = latest < previous ? "improving" : "declining";
          }
        }
      }

      return {
        success: true,
        history,
        trend,
      };
    } catch (error) {
      console.error("[getBiomarkerHistoryTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get biomarker history",
      };
    }
  },
});

// Export all health context tools
export const healthContextTools = {
  getHealthContext: getHealthContextTool,
  getRecentHealthDocuments: getRecentHealthDocumentsTool,
  getBiomarkerHistory: getBiomarkerHistoryTool,
};

/**
 * Helper function to get health context directly
 */
export async function getHealthContext(userId: string, daysBack = 30): Promise<HealthContext | null> {
  const result = await getHealthContextTool.execute({
    userId,
    includeIntake: true,
    includeBiomarkers: true,
    includeMedications: true,
    includeInsights: true,
    daysBack,
  });

  return result.success ? result.context || null : null;
}



