import { createClient } from "./supabase-server";

const BUCKET_NAME = "chat-images";

export interface UploadedChatImage {
  url: string;
  path: string;
}

/**
 * Validates an image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is 10MB.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads chat images to Supabase Storage
 */
export async function uploadChatImages(
  files: File[],
  userId: string
): Promise<UploadedChatImage[]> {
  const supabase = await createClient();

  // Validate all files first
  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  // Create service role client for signed URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role key for image uploads");
  }

  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const serviceClient = createSupabaseClient(supabaseUrl, supabaseServiceKey);

  const uploadedImages: UploadedChatImage[] = [];

  // Upload each image
  for (const file of files) {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload to Supabase Storage using user's authenticated client
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading chat image:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get signed URL for private bucket using service role (expires in 1 year)
    const { data: signedUrlData, error: signedUrlError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 31536000); // 1 year expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Error creating signed URL:", signedUrlError);
      // Fallback to public URL (will work if bucket becomes public)
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      uploadedImages.push({
        url: publicUrl,
        path: filePath,
      });
    } else {
      uploadedImages.push({
        url: signedUrlData.signedUrl,
        path: filePath,
      });
    }
  }

  return uploadedImages;
}

/**
 * Converts image URLs to base64 data URLs for OpenAI Vision API
 * Uses service role client to fetch from private Supabase storage buckets
 */
export async function convertToDataUrls(
  imageUrls: string[],
  mimeTypes?: string[]
): Promise<string[]> {
  const dataUrls: string[] = [];
  const { createClient } = await import("./supabase-server");

  // Create service role client for accessing private storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration for image conversion");
  }

  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const serviceClient = createSupabaseClient(supabaseUrl, supabaseServiceKey);

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    
    // If already a data URL, use as-is
    if (url.startsWith("data:")) {
      dataUrls.push(url);
      continue;
    }

    // Determine MIME type
    let mimeType = mimeTypes?.[i];
    if (!mimeType) {
      // Infer from URL extension
      if (url.includes(".jpg") || url.includes(".jpeg")) {
        mimeType = "image/jpeg";
      } else if (url.includes(".png")) {
        mimeType = "image/png";
      } else if (url.includes(".webp")) {
        mimeType = "image/webp";
      } else if (url.includes(".gif")) {
        mimeType = "image/gif";
      } else {
        mimeType = "image/jpeg"; // Default
      }
    }

    try {
      // Try direct fetch first (works for signed URLs and public URLs)
      let response = await fetch(url);
      
      // If fetch fails and it's a Supabase public URL for our bucket, try service client
      if (!response.ok && url.includes("supabase.co/storage/v1/object/public/") && url.includes(BUCKET_NAME)) {
        // Extract file path from public URL
        const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        if (match) {
          const filePath = decodeURIComponent(match[1]);
          
          // Use service client to download from private bucket
          const { data, error } = await serviceClient.storage
            .from(BUCKET_NAME)
            .download(filePath);

          if (error) {
            throw new Error(`Failed to download image from storage: ${error.message}`);
          }

          const buffer = await data.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          dataUrls.push(`data:${mimeType};base64,${base64}`);
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText} (${response.status})`);
      }

      const buffer = await response.arrayBuffer();

      const base64 = Buffer.from(buffer).toString("base64");
      dataUrls.push(`data:${mimeType};base64,${base64}`);
    } catch (error) {
      console.error(`Error converting image URL to data URL: ${url}`, error);
      throw new Error(
        `Failed to convert image to data URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return dataUrls;
}

