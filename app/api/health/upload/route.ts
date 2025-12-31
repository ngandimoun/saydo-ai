import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { processHealthUpload } from "@/src/mastra/workflows/smart-upload-workflow";

export const maxDuration = 60; // Allow up to 60 seconds for processing

/**
 * POST /api/health/upload
 * 
 * Upload a health-related file (food photo, supplement, lab results, etc.)
 * and process it with the smart upload workflow.
 * 
 * Request: FormData with 'file' field
 * Response: Analysis results
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type - reject videos
    const mimeType = file.type;
    if (mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Video files are not supported. Please upload images, PDFs, or documents." },
        { status: 400 }
      );
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${user.id}/${timestamp}-${sanitizedName}`;

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("health-documents")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[health/upload] Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Create service role client for signed URLs (health-documents bucket is private)
    const serviceSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate signed URL (valid for 5 minutes - enough for processing)
    const { data: signedUrlData, error: signedUrlError } = await serviceSupabase.storage
      .from("health-documents")
      .createSignedUrl(uploadData.path, 300);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("[health/upload] Failed to create signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate file access URL" },
        { status: 500 }
      );
    }

    const fileUrl = signedUrlData.signedUrl;

    console.log("[health/upload] File uploaded successfully", {
      userId: user.id,
      fileName: file.name,
      mimeType,
      fileSize: file.size,
      storagePath: uploadData.path,
    });

    // Process with smart upload workflow
    console.log("[health/upload] Starting workflow", {
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      fileUrl: fileUrl.substring(0, 100) + "...", // Log partial URL for security
    });

    const workflowStartTime = Date.now();
    const result = await processHealthUpload({
      userId: user.id,
      fileUrl,
      fileName: file.name,
      mimeType,
      fileSize: file.size,
    });
    const workflowDuration = Date.now() - workflowStartTime;

    // Log full workflow result structure for debugging
    const steps = result.steps || {};
    console.log("[health/upload] Workflow result structure:", {
      hasSteps: !!steps,
      stepsKeys: steps ? Object.keys(steps) : [],
      stepsCount: steps ? Object.keys(steps).length : 0,
      duration: `${workflowDuration}ms`,
      fullResult: JSON.stringify(result, null, 2), // Full structure for debugging
    });

    // Log each step result with details
    if (steps) {
      Object.entries(steps).forEach(([stepId, stepResult]: [string, any]) => {
        console.log(`[health/upload] Step ${stepId}:`, {
          status: stepResult.status,
          hasOutput: !!stepResult.output,
          outputSuccess: stepResult.output?.success,
          outputError: stepResult.output?.error,
          outputKeys: stepResult.output ? Object.keys(stepResult.output) : [],
        });
      });
    }

    // Check if workflow succeeded
    if (!steps || Object.keys(steps).length === 0) {
      console.error("[health/upload] Workflow returned no steps", {
        resultType: typeof result,
        resultKeys: Object.keys(result || {}),
        fullResult: JSON.stringify(result, null, 2),
      });
      return NextResponse.json(
        { error: "Processing failed - no steps returned" },
        { status: 500 }
      );
    }

    // Get the last executed step (exclude 'input' which is not a real step)
    const stepIds = Object.keys(steps).filter(id => id !== 'input');
    if (stepIds.length === 0) {
      console.error("[health/upload] No executable steps found");
      return NextResponse.json(
        { error: "Processing failed - no executable steps" },
        { status: 500 }
      );
    }

    // Get the final step result (last step that executed)
    const lastStepId = stepIds[stepIds.length - 1];
    const finalResult = steps[lastStepId];

    if (!finalResult || !finalResult.status) {
      console.error("[health/upload] Invalid workflow result structure", {
        hasFinalResult: !!finalResult,
        finalResultStatus: finalResult?.status,
        finalResultKeys: finalResult ? Object.keys(finalResult) : [],
        allStepResults: stepResults.map((sr, idx) => ({
          index: idx,
          status: sr.status,
          hasOutput: !!sr.output,
        })),
      });
      return NextResponse.json(
        { error: "Processing failed - invalid result structure" },
        { status: 500 }
      );
    }

    // Check for success in the output
    const output = finalResult.output;
    
    if (output?.success === false) {
      console.error("[health/upload] Workflow failed:", {
        error: output.error,
        outputKeys: Object.keys(output || {}),
        fullOutput: JSON.stringify(output, null, 2),
      });
      return NextResponse.json(
        { error: output.error || "Processing failed" },
        { status: 500 }
      );
    }

    console.log("[health/upload] Processing complete", {
      userId: user.id,
      documentId: output?.documentId,
      documentType: output?.documentType,
      hasAllergyWarnings: (output?.allergyWarnings?.length || 0) > 0,
    });

    // Return success response with analysis results
    return NextResponse.json({
      success: true,
      documentId: output?.documentId,
      documentType: output?.documentType,
      classification: output?.classification,
      analysis: output?.analysis,
      healthImpact: output?.healthImpact,
      allergyWarnings: output?.allergyWarnings || [],
      interactionWarnings: output?.interactionWarnings || [],
      recommendations: output?.recommendations || [],
      summary: output?.summary,
    });
  } catch (error) {
    console.error("[health/upload] Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      errorString: String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/upload
 * 
 * Get recent health document uploads for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const documentType = searchParams.get("type");

    // Build query
    let query = supabase
      .from("health_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })
      .limit(limit);

    if (documentType) {
      query = query.eq("document_type", documentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[health/upload] Query error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const documents = (data || []).map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      mimeType: doc.mime_type,
      documentType: doc.document_type,
      status: doc.status,
      classification: {
        confidence: doc.classification_confidence,
        detectedElements: doc.detected_elements,
      },
      analysis: doc.extracted_data,
      summary: doc.analysis_summary,
      healthImpact: doc.health_impact,
      allergyWarnings: doc.allergy_warnings || [],
      interactionWarnings: doc.interaction_warnings || [],
      uploadedAt: doc.uploaded_at,
      analyzedAt: doc.analyzed_at,
    }));

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("[health/upload] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}


