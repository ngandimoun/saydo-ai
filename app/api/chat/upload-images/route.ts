import { createClient } from "@/lib/supabase-server";
import { uploadChatImages } from "@/lib/chat-images";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat/upload-images
 * 
 * Uploads one or multiple images for chat messages.
 * Returns an array of public URLs.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Filter out empty files
    const validFiles = files.filter((file) => file.size > 0);

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid images provided" },
        { status: 400 }
      );
    }

    // Upload images
    const uploadedImages = await uploadChatImages(validFiles, user.id);

    return NextResponse.json(
      {
        imageUrls: uploadedImages.map((img) => img.url),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[chat/upload-images] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload images",
      },
      { status: 500 }
    );
  }
}

