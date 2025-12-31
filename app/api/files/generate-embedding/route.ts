/**
 * API Route: Generate Embedding for File
 * 
 * Generates an embedding for a file's searchable text (fileName + customName + description)
 * and stores it in the work_files table for semantic search.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, searchableText } = body;

    if (!fileId || !searchableText) {
      return NextResponse.json(
        { success: false, error: "fileId and searchableText are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const openai = getOpenAIClient();

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchableText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Update work_files table with embedding and searchable_text
    const { error: updateError } = await supabase
      .from("work_files")
      .update({
        embedding,
        searchable_text: searchableText,
      })
      .eq("id", fileId);

    if (updateError) {
      console.error("[generate-embedding] Update error:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Embedding generated and stored successfully",
    });
  } catch (err) {
    console.error("[generate-embedding] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate embedding",
      },
      { status: 500 }
    );
  }
}



