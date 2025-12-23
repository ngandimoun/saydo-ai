import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type ImageUseCase = "background" | "profile" | "card" | "hero";
export type AspectRatio = "1:1" | "4:3" | "16:9" | "21:9" | "9:16";
export type OutputFormat = "png" | "jpg";

export interface GenerateImageOptions {
  prompt: string;
  useCase?: ImageUseCase;
  aspectRatio?: AspectRatio;
  outputFormat?: OutputFormat;
  resolution?: "2K" | "4K";
  safetyFilterLevel?: "block_low_and_above" | "block_medium_and_above" | "block_only_high";
}

export interface GeneratedImage {
  url: string;
  format: OutputFormat;
}

/**
 * Enhances a prompt with UI design-specific keywords and quality terms
 */
function enhancePromptForUI(
  basePrompt: string,
  useCase?: ImageUseCase
): string {
  const qualityTerms = "high resolution, sharp, detailed, professional quality";
  const styleTerms = "modern, clean, professional UI design, minimalist";

  let contextTerms = "";
  switch (useCase) {
    case "background":
      contextTerms = "subtle background, non-distracting, elegant";
      break;
    case "profile":
      contextTerms = "portrait style, centered composition, professional";
      break;
    case "card":
      contextTerms = "card design element, compact composition, visually appealing";
      break;
    case "hero":
      contextTerms = "hero image, impactful, wide format, engaging";
      break;
  }

  return `${basePrompt}, ${styleTerms}, ${qualityTerms}${contextTerms ? `, ${contextTerms}` : ""}`;
}

/**
 * Generates a high-quality image using nano-banana-pro model
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  const {
    prompt,
    useCase,
    aspectRatio = "16:9",
    outputFormat = "png",
    resolution = "2K",
    safetyFilterLevel = "block_only_high",
  } = options;

  // Enhance prompt for UI design
  const enhancedPrompt = enhancePromptForUI(prompt, useCase);

  const input = {
    prompt: enhancedPrompt,
    aspect_ratio: aspectRatio,
    output_format: outputFormat,
    resolution: resolution,
    safety_filter_level: safetyFilterLevel,
  };

  try {
    const output = await replicate.run("google/nano-banana-pro", { input });

    // Replicate returns different formats depending on the output
    // For nano-banana-pro, it typically returns a FileOutput object or URL string
    let imageUrl: string;

    if (typeof output === "string") {
      // Direct URL string
      imageUrl = output;
    } else if (output && typeof output === "object") {
      // FileOutput object with url() method
      if ("url" in output && typeof (output as any).url === "function") {
        imageUrl = (output as any).url();
      } else if ("url" in output && typeof (output as any).url === "string") {
        imageUrl = (output as any).url;
      } else if (Array.isArray(output) && output.length > 0) {
        // Sometimes returns an array with the URL
        imageUrl = String(output[0]);
      } else {
        imageUrl = String(output);
      }
    } else {
      imageUrl = String(output);
    }

    if (!imageUrl) {
      throw new Error("Failed to get image URL from Replicate output");
    }

    return {
      url: imageUrl,
      format: outputFormat,
    };
  } catch (error) {
    console.error("Error generating image with Replicate:", error);
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generates an image and returns the file buffer
 */
export async function generateImageBuffer(
  options: GenerateImageOptions
): Promise<{ buffer: Buffer; format: OutputFormat; url: string }> {
  const result = await generateImage(options);

  // Download the image from the URL
  const response = await fetch(result.url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    format: result.format,
    url: result.url,
  };
}

