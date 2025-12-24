/**
 * Storage utilities for scripts (outside Next.js request context)
 * Uses direct Supabase client without cookies
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const BUCKET_NAME = "generated-images"

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // For scripts, we MUST use service role key to bypass RLS policies
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable.\n" +
      "For image generation scripts, you need the service role key to bypass RLS policies.\n" +
      "Get it from: Supabase Dashboard > Settings > API > service_role key (secret)\n" +
      "Add it to .env.local as: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

export async function uploadImageFromUrlScript(
  imageUrl: string,
  fileName: string,
  folder?: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseClient()

  // Download the image
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Determine the file path
  const filePath = folder ? `${folder}/${fileName}` : fileName

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: true, // Overwrite if exists
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath,
  }
}

