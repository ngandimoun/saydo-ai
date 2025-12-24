import { createClient } from "./supabase-server";

// Re-export client-safe utilities for backward compatibility
export { getImagePublicUrl } from "./storage-urls";

const BUCKET_NAME = "generated-images";

export interface UploadImageOptions {
  file: Buffer | Blob;
  fileName: string;
  contentType?: string;
  folder?: string;
}

export interface UploadedImage {
  url: string;
  path: string;
}

/**
 * Uploads an image buffer to Supabase Storage
 */
export async function uploadImageToSupabase(
  options: UploadImageOptions
): Promise<UploadedImage> {
  const { file, fileName, contentType, folder } = options;

  const supabase = await createClient();

  // Construct the file path
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = folder
    ? `${folder}/${timestamp}-${sanitizedFileName}`
    : `${timestamp}-${sanitizedFileName}`;

  // Convert Buffer to Blob if needed
  let blob: Blob;
  if (Buffer.isBuffer(file)) {
    blob = new Blob([file], { type: contentType || "image/png" });
  } else {
    blob = file;
  }

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, blob, {
      contentType: contentType || "image/png",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading to Supabase Storage:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath,
  };
}

/**
 * Uploads an image from a URL to Supabase Storage
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  fileName: string,
  folder?: string
): Promise<UploadedImage> {
  // Download the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Determine content type from response or file extension
  const contentType =
    response.headers.get("content-type") ||
    (fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
        ? "image/jpeg"
        : "image/png");

  return uploadImageToSupabase({
    file: buffer,
    fileName,
    contentType,
    folder,
  });
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImageFromSupabase(
  filePath: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error("Error deleting from Supabase Storage:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}



