/**
 * Client-safe storage URL utilities
 * This file can be imported from client components without pulling in server-only dependencies
 */

const BUCKET_NAME = "generated-images";

/**
 * Gets the public URL for an image in Supabase Storage
 * This is client-safe as it only uses NEXT_PUBLIC_* environment variables
 */
export function getImagePublicUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  // Supabase Storage public URL format
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
}








