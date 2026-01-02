/**
 * Suno API Client
 * 
 * Complete client for Suno API integration
 * Handles all music generation, processing, and file management endpoints
 */

import type {
  ApiResponse,
  TaskResponse,
  GenerateMusicOptions,
  ExtendMusicOptions,
  UploadAndCoverAudioOptions,
  AddVocalsOptions,
  AddInstrumentalOptions,
  GetTimestampedLyricsOptions,
  ConvertToWAVOptions,
  GenerateCoverOptions,
  GeneratePersonaOptions,
  Base64UploadOptions,
  FileStreamUploadOptions,
  FileUrlUploadOptions,
  MusicGenerationDetails,
  TimestampedLyricsResponse,
  WAVConversionDetails,
  CoverGenerationDetails,
  PersonaGenerationResponse,
  FileUploadResult,
  CreditsResponse,
  WaitForCompletionOptions,
  TaskStatus,
  WAVTaskStatus,
  CoverTaskStatus,
} from './suno-api/types';

const API_BASE_URL = 'https://api.sunoapi.org';
const FILE_UPLOAD_BASE_URL = 'https://sunoapiorg.redpandaai.co';

/**
 * Get API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    throw new Error('SUNO_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const apiKey = getApiKey();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Suno API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Make file upload request
 */
async function fileUploadRequest<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const apiKey = getApiKey();
  const url = `${FILE_UPLOAD_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Suno API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// ============================================
// Music Generation Methods
// ============================================

/**
 * Generate music from prompt
 * Returns 2 songs per generation
 */
export async function generateMusic(
  options: GenerateMusicOptions
): Promise<TaskResponse> {
  const response = await apiRequest<TaskResponse>('/api/v1/generate', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200) {
    throw new Error(`Music generation failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Extend existing music track
 */
export async function extendMusic(
  options: ExtendMusicOptions
): Promise<TaskResponse> {
  const response = await apiRequest<TaskResponse>('/api/v1/generate/extend', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200) {
    throw new Error(`Music extension failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Upload and cover audio with new style
 */
export async function uploadAndCoverAudio(
  options: UploadAndCoverAudioOptions
): Promise<TaskResponse> {
  const response = await apiRequest<TaskResponse>('/api/v1/generate/upload-cover', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200) {
    throw new Error(`Upload and cover failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Add vocals to instrumental track
 */
export async function addVocals(
  options: AddVocalsOptions
): Promise<TaskResponse> {
  const response = await apiRequest<TaskResponse>('/api/v1/generate/add-vocals', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200) {
    throw new Error(`Add vocals failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Add instrumental to vocal track
 */
export async function addInstrumental(
  options: AddInstrumentalOptions
): Promise<TaskResponse> {
  const response = await apiRequest<TaskResponse>('/api/v1/generate/add-instrumental', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200) {
    throw new Error(`Add instrumental failed: ${response.msg}`);
  }

  return response.data!;
}

// ============================================
// Music Processing Methods
// ============================================

/**
 * Get music generation task details
 */
export async function getMusicGenerationDetails(
  taskId: string
): Promise<MusicGenerationDetails> {
  const response = await apiRequest<MusicGenerationDetails>(
    `/api/v1/generate/record-info?taskId=${taskId}`,
    {
      method: 'GET',
    }
  );

  if (response.code !== 200) {
    throw new Error(`Get music details failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Get timestamped lyrics for synchronized display
 */
export async function getTimestampedLyrics(
  options: GetTimestampedLyricsOptions
): Promise<TimestampedLyricsResponse> {
  const response = await apiRequest<TimestampedLyricsResponse>(
    '/api/v1/generate/get-timestamped-lyrics',
    {
      method: 'POST',
      body: JSON.stringify(options),
    }
  );

  if (response.code !== 200) {
    throw new Error(`Get timestamped lyrics failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Convert music to high-quality WAV format
 * IMPORTANT: Use this for Saydo playback
 */
export async function convertToWAV(
  options: ConvertToWAVOptions
): Promise<TaskResponse> {
  const response = await apiRequest<TaskResponse>('/api/v1/wav/generate', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200) {
    throw new Error(`WAV conversion failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Get WAV conversion details
 */
export async function getWAVConversionDetails(
  taskId: string
): Promise<WAVConversionDetails> {
  const response = await apiRequest<WAVConversionDetails>(
    `/api/v1/wav/record-info?taskId=${taskId}`,
    {
      method: 'GET',
    }
  );

  if (response.code !== 200) {
    throw new Error(`Get WAV details failed: ${response.msg}`);
  }

  return response.data!;
}

// ============================================
// Cover & Persona Methods
// ============================================

/**
 * Generate music cover images
 */
export async function generateCover(
  options: GenerateCoverOptions
): Promise<TaskResponse> {
  const response = await apiRequest<TaskResponse>('/api/v1/suno/cover/generate', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200) {
    throw new Error(`Cover generation failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Get cover generation details
 */
export async function getCoverDetails(
  taskId: string
): Promise<CoverGenerationDetails> {
  const response = await apiRequest<CoverGenerationDetails>(
    `/api/v1/suno/cover/record-info?taskId=${taskId}`,
    {
      method: 'GET',
    }
  );

  if (response.code !== 200) {
    throw new Error(`Get cover details failed: ${response.msg}`);
  }

  return response.data!;
}

/**
 * Generate music persona
 */
export async function generatePersona(
  options: GeneratePersonaOptions
): Promise<PersonaGenerationResponse> {
  const response = await apiRequest<PersonaGenerationResponse>(
    '/api/v1/generate/generate-persona',
    {
      method: 'POST',
      body: JSON.stringify(options),
    }
  );

  if (response.code !== 200) {
    throw new Error(`Persona generation failed: ${response.msg}`);
  }

  return response.data!;
}

// ============================================
// File Upload Methods
// ============================================

/**
 * Upload file via Base64
 */
export async function uploadFileBase64(
  options: Base64UploadOptions
): Promise<FileUploadResult> {
  const response = await apiRequest<FileUploadResult>('/api/file-base64-upload', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200 || !response.data) {
    throw new Error(`Base64 upload failed: ${response.msg}`);
  }

  return response.data;
}

/**
 * Upload file via stream (multipart/form-data)
 */
export async function uploadFileStream(
  options: FileStreamUploadOptions
): Promise<FileUploadResult> {
  const formData = new FormData();
  
  // Convert Buffer to Blob if needed
  let fileBlob: Blob;
  if (Buffer.isBuffer(options.file)) {
    fileBlob = new Blob([options.file]);
  } else if (options.file instanceof File) {
    fileBlob = options.file;
  } else {
    fileBlob = options.file;
  }

  formData.append('file', fileBlob);
  formData.append('uploadPath', options.uploadPath);
  if (options.fileName) {
    formData.append('fileName', options.fileName);
  }

  const response = await fileUploadRequest<FileUploadResult>(
    '/api/file-stream-upload',
    formData
  );

  if (response.code !== 200 || !response.data) {
    throw new Error(`File stream upload failed: ${response.msg}`);
  }

  return response.data;
}

/**
 * Upload file from URL
 */
export async function uploadFileFromUrl(
  options: FileUrlUploadOptions
): Promise<FileUploadResult> {
  const response = await apiRequest<FileUploadResult>('/api/file-url-upload', {
    method: 'POST',
    body: JSON.stringify(options),
  });

  if (response.code !== 200 || !response.data) {
    throw new Error(`URL upload failed: ${response.msg}`);
  }

  return response.data;
}

// ============================================
// Account Management
// ============================================

/**
 * Get remaining credits
 */
export async function getRemainingCredits(): Promise<number> {
  const response = await apiRequest<CreditsResponse>('/api/v1/get-credits', {
    method: 'GET',
  });

  if (response.code !== 200) {
    throw new Error(`Get credits failed: ${response.msg}`);
  }

  return response.data?.credits || 0;
}

// ============================================
// Utility Methods
// ============================================

/**
 * Wait for task completion by polling
 */
export async function waitForCompletion(
  taskId: string,
  options: WaitForCompletionOptions = {}
): Promise<MusicGenerationDetails> {
  const {
    maxWaitTime = 600000, // 10 minutes
    pollInterval = 30000, // 30 seconds
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const details = await getMusicGenerationDetails(taskId);

    if (details.status === 'SUCCESS') {
      return details;
    }

    if (
      details.status === 'CREATE_TASK_FAILED' ||
      details.status === 'GENERATE_AUDIO_FAILED' ||
      details.status === 'SENSITIVE_WORD_ERROR'
    ) {
      throw new Error(
        `Task failed: ${details.status} - ${details.errorMessage || 'Unknown error'}`
      );
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Task timeout: ${taskId} did not complete within ${maxWaitTime}ms`);
}

/**
 * Wait for WAV conversion completion
 */
export async function waitForWAVCompletion(
  taskId: string,
  maxWaitTime: number = 600000,
  pollInterval: number = 30000
): Promise<WAVConversionDetails> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const details = await getWAVConversionDetails(taskId);

    if (details.successFlag === 'SUCCESS') {
      return details;
    }

    if (
      details.successFlag === 'CREATE_TASK_FAILED' ||
      details.successFlag === 'GENERATE_WAV_FAILED'
    ) {
      throw new Error(
        `WAV conversion failed: ${details.successFlag} - ${details.errorMessage || 'Unknown error'}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`WAV conversion timeout: ${taskId} did not complete within ${maxWaitTime}ms`);
}

/**
 * Wait for cover generation completion
 */
export async function waitForCoverCompletion(
  taskId: string,
  maxWaitTime: number = 600000,
  pollInterval: number = 30000
): Promise<CoverGenerationDetails> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const details = await getCoverDetails(taskId);

    if (details.successFlag === 1) {
      return details;
    }

    if (details.successFlag === 3) {
      throw new Error(
        `Cover generation failed: ${details.errorMessage || 'Unknown error'}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Cover generation timeout: ${taskId} did not complete within ${maxWaitTime}ms`);
}

