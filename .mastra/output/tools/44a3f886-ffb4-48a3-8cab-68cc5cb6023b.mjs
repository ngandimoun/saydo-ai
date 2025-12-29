import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}
const transcribeAudioTool = createTool({
  id: "transcribe-audio",
  description: "Transcribes audio using OpenAI Whisper. Accepts audio file URL or base64 data. Returns transcribed text with detected language.",
  inputSchema: z.object({
    audioUrl: z.string().optional().describe("URL of the audio file to transcribe"),
    audioBase64: z.string().optional().describe("Base64-encoded audio data"),
    mimeType: z.enum([
      "audio/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
      "audio/flac"
    ]).default("audio/webm").describe("MIME type of the audio file"),
    language: z.string().optional().describe(
      "Expected language code (ISO 639-1) to improve accuracy. If not provided, Whisper will auto-detect."
    ),
    prompt: z.string().optional().describe(
      "Optional prompt to guide the transcription (e.g., specific terminology)"
    )
  }),
  outputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ audioUrl, audioBase64, mimeType, language, prompt }) => {
    try {
      const openai = getOpenAIClient();
      let audioBuffer;
      let filename;
      if (audioUrl) {
        const response = await fetch(audioUrl);
        if (!response.ok) {
          return {
            success: false,
            error: `Failed to fetch audio: ${response.statusText}`
          };
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        filename = `audio.${getExtensionFromMimeType(mimeType)}`;
      } else if (audioBase64) {
        audioBuffer = Buffer.from(audioBase64, "base64");
        filename = `audio.${getExtensionFromMimeType(mimeType)}`;
      } else {
        return {
          success: false,
          error: "Either audioUrl or audioBase64 must be provided"
        };
      }
      const audioFile = new File([audioBuffer], filename, { type: mimeType });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: language || void 0,
        prompt: prompt || void 0,
        response_format: "verbose_json"
      });
      return {
        success: true,
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to transcribe audio"
      };
    }
  }
});
function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    "audio/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac"
  };
  return mimeToExt[mimeType] || "webm";
}
const transcribeFromStorageTool = createTool({
  id: "transcribe-from-storage",
  description: "Transcribes audio from Supabase Storage. Generates a signed URL and transcribes the audio.",
  inputSchema: z.object({
    bucketName: z.string().default("voice-recordings").describe("Supabase Storage bucket name"),
    filePath: z.string().describe("Path to the file in the bucket"),
    language: z.string().optional().describe("Expected language code (ISO 639-1)")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ bucketName, filePath, language }) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceKey) {
        return {
          success: false,
          error: "Missing Supabase environment variables"
        };
      }
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 300);
      if (signedUrlError || !signedUrlData?.signedUrl) {
        return {
          success: false,
          error: signedUrlError?.message || "Failed to generate signed URL"
        };
      }
      const extension = filePath.split(".").pop()?.toLowerCase() || "webm";
      const extToMime = {
        webm: "audio/webm",
        mp3: "audio/mpeg",
        m4a: "audio/mp4",
        wav: "audio/wav",
        ogg: "audio/ogg",
        flac: "audio/flac"
      };
      const mimeType = extToMime[extension] || "audio/webm";
      const result = await transcribeAudioTool.execute?.({
        audioUrl: signedUrlData.signedUrl,
        mimeType,
        language
      });
      return result || { success: false, error: "Transcription failed" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to transcribe from storage"
      };
    }
  }
});
const transcriptionTools = {
  transcribeAudio: transcribeAudioTool,
  transcribeFromStorage: transcribeFromStorageTool
};

export { transcribeAudioTool, transcribeFromStorageTool, transcriptionTools };
