import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import OpenAI from "openai";

/**
 * Health Document Types
 * The classifier identifies what type of health-related content was uploaded
 */
export const HealthDocumentType = z.enum([
  "food_photo",        // Meal, ingredients, plate of food
  "supplement",        // Supplement bottle, pills, nutrition facts
  "drink",             // Beverage, bottle, can, liquid
  "lab_pdf",           // PDF lab results with biomarker tables
  "lab_handwritten",   // Handwritten or printed lab results (image)
  "medication",        // Prescription, pill bottle, drug packaging
  "clinical_report",   // Doctor's notes, clinical reports
  "skincare_product",  // Skincare product, cosmetic, cream, serum, sunscreen
  "other",             // Other health-related documents
]);

export type HealthDocumentType = z.infer<typeof HealthDocumentType>;

/**
 * Body System Types
 * Categorizes findings by body system for cumulative tracking
 */
export const BodySystemType = z.enum([
  "eyes",           // Vision, eye health, ophthalmology
  "digestive",      // GI, stomach, intestines, gastroenterology
  "skin",           // Dermatology, skin conditions
  "blood",          // Hematology, CBC, blood disorders
  "cardiovascular", // Heart, blood pressure, lipids
  "hormones",       // Endocrine, thyroid, reproductive hormones
  "nutrition",      // Vitamins, minerals, nutritional status
  "respiratory",    // Lungs, breathing, pulmonology
  "musculoskeletal",// Bones, joints, muscles, orthopedics
  "neurological",   // Brain, nerves, neurology
  "renal",          // Kidneys, urinary system
  "hepatic",        // Liver function
  "immune",         // Immune system, allergies
  "metabolic",      // Metabolism, diabetes, glucose
  "general",        // General health, multi-system, or unclear
]);

export type BodySystemType = z.infer<typeof BodySystemType>;

/**
 * Mapping from document types to likely body systems
 */
export const documentTypeToBodySystem: Record<HealthDocumentType, BodySystemType> = {
  food_photo: "nutrition",
  supplement: "nutrition",
  drink: "nutrition",
  lab_pdf: "general", // Will be refined during analysis
  lab_handwritten: "general",
  medication: "general",
  clinical_report: "general",
  skincare_product: "skin",
  other: "general",
};

/**
 * Classification result schema
 */
export const ClassificationResultSchema = z.object({
  documentType: HealthDocumentType,
  bodySystem: BodySystemType,
  confidence: z.number().min(0).max(1),
  detectedElements: z.array(z.string()),
  reasoning: z.string(),
  suggestedAnalysis: z.array(z.string()),
  // Additional context for body system
  bodySystemContext: z.string().optional(), // e.g., "Eye exam results showing vision test"
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

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
  // If already a data URL, return as-is
  if (fileUrl.startsWith("data:")) {
    return fileUrl;
  }

  // Fetch the file and convert to base64
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Smart Classifier Tool
 * 
 * Uses GPT-4o Vision to classify uploaded health documents.
 * Detects the type of document and what elements are present.
 */
export const classifyHealthDocumentTool = createTool({
  id: "classify-health-document",
  description: "Classifies an uploaded health document using AI vision to determine its type (food photo, supplement, lab results, etc.)",
  inputSchema: z.object({
    fileUrl: z.string().describe("URL of the uploaded file"),
    fileName: z.string().describe("Original file name"),
    mimeType: z.string().describe("MIME type of the file"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    classification: ClassificationResultSchema.optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileUrl, fileName, mimeType }) => {
    try {
      const openai = getOpenAIClient();

      // For PDFs, we need different handling
      const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
      
      if (isPdf) {
        // For PDFs, classify based on filename patterns
        const lowerName = fileName.toLowerCase();
        const isLabResult = 
          lowerName.includes("lab") ||
          lowerName.includes("blood") ||
          lowerName.includes("test") ||
          lowerName.includes("result") ||
          lowerName.includes("analyse") ||
          lowerName.includes("bilan");

        // Detect body system from filename
        let bodySystem: BodySystemType = "general";
        let bodySystemContext = "";

        if (lowerName.includes("eye") || lowerName.includes("vision") || lowerName.includes("ophth")) {
          bodySystem = "eyes";
          bodySystemContext = "Eye/vision related document";
        } else if (lowerName.includes("blood") || lowerName.includes("cbc") || lowerName.includes("hemato")) {
          bodySystem = "blood";
          bodySystemContext = "Blood/hematology test";
        } else if (lowerName.includes("liver") || lowerName.includes("hepat") || lowerName.includes("ast") || lowerName.includes("alt")) {
          bodySystem = "hepatic";
          bodySystemContext = "Liver function test";
        } else if (lowerName.includes("kidney") || lowerName.includes("renal") || lowerName.includes("creatinin")) {
          bodySystem = "renal";
          bodySystemContext = "Kidney/renal function test";
        } else if (lowerName.includes("thyroid") || lowerName.includes("hormone") || lowerName.includes("tsh")) {
          bodySystem = "hormones";
          bodySystemContext = "Hormone/endocrine test";
        } else if (lowerName.includes("lipid") || lowerName.includes("cholesterol") || lowerName.includes("cardio") || lowerName.includes("heart")) {
          bodySystem = "cardiovascular";
          bodySystemContext = "Cardiovascular/lipid panel";
        } else if (lowerName.includes("vitamin") || lowerName.includes("mineral") || lowerName.includes("nutrient")) {
          bodySystem = "nutrition";
          bodySystemContext = "Nutritional assessment";
        } else if (lowerName.includes("skin") || lowerName.includes("derma")) {
          bodySystem = "skin";
          bodySystemContext = "Dermatology report";
        } else if (lowerName.includes("stool") || lowerName.includes("gastro") || lowerName.includes("digest") || lowerName.includes("stomach") || lowerName.includes("colon") || lowerName.includes("gi")) {
          bodySystem = "digestive";
          bodySystemContext = "Digestive/GI test";
        } else if (lowerName.includes("glucose") || lowerName.includes("diabetes") || lowerName.includes("hba1c") || lowerName.includes("metabol")) {
          bodySystem = "metabolic";
          bodySystemContext = "Metabolic/glucose test";
        }

        return {
          success: true,
          classification: {
            documentType: isLabResult ? "lab_pdf" : "clinical_report",
            bodySystem,
            confidence: 0.85,
            detectedElements: ["PDF document", "Medical/health document"],
            reasoning: `PDF file detected. Based on filename "${fileName}", classified as ${isLabResult ? "lab results" : "clinical report"}.`,
            suggestedAnalysis: [
              "Extract text using PDF parsing",
              "Identify biomarker values and reference ranges",
              "Compare with normal ranges",
              "Generate health insights",
            ],
            bodySystemContext,
          },
        };
      }

      // For images, use GPT-4o Vision
      const isImage = mimeType.startsWith("image/");
      if (!isImage) {
        return {
          success: true,
          classification: {
            documentType: "other",
            bodySystem: "general",
            confidence: 0.5,
            detectedElements: ["Unknown file type"],
            reasoning: `File type ${mimeType} is not a recognized image or PDF format.`,
            suggestedAnalysis: ["Manual review required"],
            bodySystemContext: "Unknown file type - general classification",
          },
        };
      }

      // Get image as data URL for GPT-4o
      const imageDataUrl = await getImageDataUrl(fileUrl, mimeType);

      const classificationPrompt = `You are a health document classifier. Analyze this image and classify it into one of the following categories:

**Document Types:**
1. **food_photo** - A meal, plate of food, ingredients, recipe, or any food item
2. **supplement** - Supplement bottle, pills, capsules, nutrition facts label, vitamin packaging
3. **drink** - Beverage, bottle, can, juice, smoothie, energy drink, or any drinkable liquid
4. **lab_pdf** - Lab results document (even if it's an image of a printed lab report)
5. **lab_handwritten** - Handwritten lab results, notes from a doctor, or scanned medical notes
6. **medication** - Prescription medication, pill bottle, drug packaging, pharmacy label
7. **clinical_report** - Doctor's notes, clinical reports, medical imaging results
8. **skincare_product** - Skincare product, cosmetic cream, serum, sunscreen, moisturizer, cleanser, toner, face mask, or any beauty/skin product with ingredients list
9. **other** - Any other health-related document that doesn't fit above categories

**Body Systems (which part of the body does this relate to):**
- **eyes** - Vision tests, eye exams, ophthalmology reports
- **digestive** - GI tests, stool analysis, endoscopy, stomach/intestine related
- **skin** - Dermatology, skin conditions, skincare products
- **blood** - Blood tests, CBC, hematology
- **cardiovascular** - Heart, blood pressure, lipid panels, ECG
- **hormones** - Thyroid, testosterone, estrogen, cortisol tests
- **nutrition** - Vitamin levels, mineral tests, nutritional assessments, food, supplements
- **respiratory** - Lung function, breathing tests
- **musculoskeletal** - Bone density, joint tests, X-rays of bones
- **neurological** - Brain, nerve tests, MRI of head
- **renal** - Kidney function, urinalysis
- **hepatic** - Liver function tests
- **immune** - Allergy tests, immune markers
- **metabolic** - Glucose, diabetes, HbA1c tests
- **general** - Multi-system or unclear which body system

Respond with a JSON object containing:
{
  "documentType": "one of the document types above",
  "bodySystem": "one of the body systems above",
  "confidence": 0.0 to 1.0,
  "detectedElements": ["list", "of", "detected", "elements"],
  "reasoning": "Brief explanation of why you classified it this way",
  "suggestedAnalysis": ["list", "of", "suggested", "analysis", "steps"],
  "bodySystemContext": "Brief context about why this body system was chosen"
}

Be specific about what you see in the image. For food, identify the dish. For supplements, identify the brand or type. For lab results, note the format and what body system they test. For skincare products, identify the product type and brand if visible.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: classificationPrompt },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "low" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from classification model");
      }

      const parsed = JSON.parse(content) as ClassificationResult;

      // Validate the document type
      const validDocTypes = [
        "food_photo", "supplement", "drink", "lab_pdf", 
        "lab_handwritten", "medication", "clinical_report", "skincare_product", "other"
      ];
      
      if (!validDocTypes.includes(parsed.documentType)) {
        parsed.documentType = "other";
      }

      // Validate body system
      const validBodySystems = [
        "eyes", "digestive", "skin", "blood", "cardiovascular",
        "hormones", "nutrition", "respiratory", "musculoskeletal",
        "neurological", "renal", "hepatic", "immune", "metabolic", "general"
      ];

      let bodySystem = parsed.bodySystem;
      if (!bodySystem || !validBodySystems.includes(bodySystem)) {
        // Default body system based on document type
        bodySystem = documentTypeToBodySystem[parsed.documentType as HealthDocumentType] || "general";
      }

      return {
        success: true,
        classification: {
          documentType: parsed.documentType as HealthDocumentType,
          bodySystem: bodySystem as BodySystemType,
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
          detectedElements: parsed.detectedElements || [],
          reasoning: parsed.reasoning || "Classification completed",
          suggestedAnalysis: parsed.suggestedAnalysis || [],
          bodySystemContext: parsed.bodySystemContext || `Classified as ${bodySystem} body system`,
        },
      };
    } catch (error) {
      console.error("[classifyHealthDocumentTool] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to classify document",
      };
    }
  },
});

/**
 * Helper function to classify a health document
 * Can be called directly without going through the tool
 */
export async function classifyHealthDocument(
  fileUrl: string,
  fileName: string,
  mimeType: string
): Promise<ClassificationResult> {
  const result = await classifyHealthDocumentTool.execute({
    fileUrl,
    fileName,
    mimeType,
  });

  if (!result.success || !result.classification) {
    throw new Error(result.error || "Classification failed");
  }

  return result.classification;
}


