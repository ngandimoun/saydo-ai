import {
  generateImage,
  generateImageBuffer,
  type GenerateImageOptions,
  type ImageUseCase,
} from "./replicate";
import {
  uploadImageFromUrl,
  uploadImageToSupabase,
  type UploadedImage,
} from "./storage";

export interface GenerateAndStoreImageOptions extends GenerateImageOptions {
  folder?: string;
  fileName?: string;
}

export interface StoredImage extends UploadedImage {
  useCase?: ImageUseCase;
  originalPrompt: string;
}

/**
 * Generates an image using Replicate and stores it in Supabase Storage
 * This is the main function to use for generating images for the frontend
 */
export async function generateAndStoreImage(
  options: GenerateAndStoreImageOptions
): Promise<StoredImage> {
  const { folder, fileName, prompt, useCase, outputFormat, ...generateOptions } =
    options;

  try {
    // Step 1: Generate image with Replicate
    const generatedImage = await generateImage({
      prompt,
      useCase,
      outputFormat,
      ...generateOptions,
    });

    // Step 2: Determine file name
    const timestamp = Date.now();
    const useCasePrefix = useCase ? `${useCase}-` : "";
    const defaultFileName = `${useCasePrefix}${timestamp}.${outputFormat || "png"}`;
    const finalFileName = fileName || defaultFileName;

    // Step 3: Upload to Supabase Storage
    const uploadedImage = await uploadImageFromUrl(
      generatedImage.url,
      finalFileName,
      folder
    );

    return {
      ...uploadedImage,
      useCase,
      originalPrompt: prompt,
    };
  } catch (error) {
    console.error("Error in generateAndStoreImage:", error);
    throw error;
  }
}

/**
 * Generates an image buffer and stores it directly in Supabase Storage
 * Useful when you need the buffer for additional processing
 */
export async function generateAndStoreImageBuffer(
  options: GenerateAndStoreImageOptions
): Promise<StoredImage> {
  const { folder, fileName, prompt, useCase, outputFormat, ...generateOptions } =
    options;

  try {
    // Step 1: Generate image and get buffer
    const { buffer, format, url } = await generateImageBuffer({
      prompt,
      useCase,
      outputFormat,
      ...generateOptions,
    });

    // Step 2: Determine file name
    const timestamp = Date.now();
    const useCasePrefix = useCase ? `${useCase}-` : "";
    const defaultFileName = `${useCasePrefix}${timestamp}.${format}`;
    const finalFileName = fileName || defaultFileName;

    // Step 3: Upload buffer to Supabase Storage
    const contentType =
      format === "png" ? "image/png" : format === "jpg" ? "image/jpeg" : "image/png";

    const uploadedImage = await uploadImageToSupabase({
      file: buffer,
      fileName: finalFileName,
      contentType,
      folder,
    });

    return {
      ...uploadedImage,
      useCase,
      originalPrompt: prompt,
    };
  } catch (error) {
    console.error("Error in generateAndStoreImageBuffer:", error);
    throw error;
  }
}

/**
 * Helper function for generating background images
 */
export async function generateBackgroundImage(
  prompt: string,
  aspectRatio: "16:9" | "21:9" = "16:9"
): Promise<StoredImage> {
  return generateAndStoreImage({
    prompt,
    useCase: "background",
    aspectRatio,
    outputFormat: "png",
    folder: "backgrounds",
  });
}

/**
 * Helper function for generating profile images
 */
export async function generateProfileImage(
  prompt: string
): Promise<StoredImage> {
  return generateAndStoreImage({
    prompt,
    useCase: "profile",
    aspectRatio: "1:1",
    outputFormat: "png",
    folder: "profiles",
  });
}

/**
 * Helper function for generating card UI graphics
 */
export async function generateCardImage(
  prompt: string,
  aspectRatio: "4:3" | "16:9" | "1:1" = "4:3"
): Promise<StoredImage> {
  return generateAndStoreImage({
    prompt,
    useCase: "card",
    aspectRatio,
    outputFormat: "png",
    folder: "cards",
  });
}

/**
 * Helper function for generating hero images
 */
export async function generateHeroImage(
  prompt: string,
  aspectRatio: "16:9" | "21:9" = "16:9"
): Promise<StoredImage> {
  return generateAndStoreImage({
    prompt,
    useCase: "hero",
    aspectRatio,
    outputFormat: "png",
    resolution: "4K",
    folder: "heroes",
  });
}








