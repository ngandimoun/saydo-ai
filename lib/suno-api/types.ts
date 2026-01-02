/**
 * Suno API TypeScript Types
 * 
 * Complete type definitions for all Suno API endpoints
 */

// ============================================
// Model Versions
// ============================================

export type SunoModel = 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5';

export type VocalGender = 'm' | 'f';

// ============================================
// Task Status Types
// ============================================

export type TaskStatus =
  | 'PENDING'
  | 'TEXT_SUCCESS'
  | 'FIRST_SUCCESS'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_AUDIO_FAILED'
  | 'CALLBACK_EXCEPTION'
  | 'SENSITIVE_WORD_ERROR';

export type WAVTaskStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'CREATE_TASK_FAILED'
  | 'GENERATE_WAV_FAILED'
  | 'CALLBACK_EXCEPTION';

export type CoverTaskStatus = 0 | 1 | 2 | 3; // 0: Pending, 1: Success, 2: Generating, 3: Failed

export type CallbackType = 'text' | 'first' | 'complete' | 'error';

export type OperationType = 'generate' | 'extend' | 'upload_cover' | 'upload_extend';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

export interface TaskResponse {
  taskId: string;
}

// ============================================
// Music Generation Request Types
// ============================================

export interface GenerateMusicOptions {
  prompt?: string;
  style?: string;
  title?: string;
  customMode: boolean;
  instrumental: boolean;
  personaId?: string;
  model: SunoModel;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number; // 0.00-1.00
  weirdnessConstraint?: number; // 0.00-1.00
  audioWeight?: number; // 0.00-1.00
  callBackUrl: string;
}

export interface ExtendMusicOptions {
  defaultParamFlag: boolean;
  audioId: string;
  prompt?: string;
  style?: string;
  title?: string;
  continueAt?: number; // seconds
  personaId?: string;
  model: SunoModel;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  callBackUrl: string;
}

export interface UploadAndCoverAudioOptions {
  uploadUrl: string;
  prompt?: string;
  style?: string;
  title?: string;
  customMode: boolean;
  instrumental: boolean;
  personaId?: string;
  model: SunoModel;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  callBackUrl: string;
}

export interface AddVocalsOptions {
  uploadUrl: string;
  prompt: string;
  title: string; // max 100 characters
  style: string;
  negativeTags: string;
  callBackUrl: string;
  vocalGender?: VocalGender;
  styleWeight?: number; // 0.00-1.00
  weirdnessConstraint?: number; // 0.00-1.00
  audioWeight?: number; // 0.00-1.00
  model?: 'V4_5PLUS' | 'V5'; // default: V4_5PLUS
}

export interface AddInstrumentalOptions {
  uploadUrl: string;
  title: string; // max 100 characters
  tags: string;
  negativeTags: string;
  callBackUrl: string;
  vocalGender?: VocalGender;
  styleWeight?: number; // 0.00-1.00
  weirdnessConstraint?: number; // 0.00-1.00
  audioWeight?: number; // 0.00-1.00
  model?: 'V4_5PLUS' | 'V5'; // default: V4_5PLUS
}

// ============================================
// Music Processing Request Types
// ============================================

export interface GetTimestampedLyricsOptions {
  taskId: string;
  audioId: string;
}

export interface ConvertToWAVOptions {
  taskId: string;
  audioId: string;
  callBackUrl: string;
}

// ============================================
// Cover & Persona Request Types
// ============================================

export interface GenerateCoverOptions {
  taskId: string;
  callBackUrl: string;
}

export interface GeneratePersonaOptions {
  taskId: string;
  audioId: string;
  name: string;
  description: string;
}

// ============================================
// File Upload Request Types
// ============================================

export interface Base64UploadOptions {
  base64Data: string; // Base64 string or data URL
  uploadPath: string;
  fileName?: string;
}

export interface FileStreamUploadOptions {
  file: File | Blob | Buffer;
  uploadPath: string;
  fileName?: string;
}

export interface FileUrlUploadOptions {
  fileUrl: string; // HTTP/HTTPS URL
  uploadPath: string;
  fileName?: string;
}

// ============================================
// Music Generation Response Types
// ============================================

export interface SunoAudioData {
  id: string; // audioId
  audio_url: string;
  source_audio_url: string;
  stream_audio_url: string;
  source_stream_audio_url: string;
  image_url: string;
  source_image_url: string;
  prompt: string;
  model_name: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number; // seconds
}

export interface MusicGenerationResponse {
  callbackType: CallbackType;
  task_id: string;
  data: SunoAudioData[];
}

export interface MusicGenerationDetails {
  taskId: string;
  parentMusicId?: string;
  param: string; // JSON string of parameters
  response: {
    taskId: string;
    sunoData: SunoAudioData[];
  };
  status: TaskStatus;
  type: 'chirp-v3-5' | 'chirp-v4';
  operationType: OperationType;
  errorCode?: number;
  errorMessage?: string;
}

// ============================================
// Timestamped Lyrics Response Types
// ============================================

export interface AlignedWord {
  word: string;
  success: boolean;
  startS: number; // start time in seconds
  endS: number; // end time in seconds
  palign: number;
}

export interface TimestampedLyricsResponse {
  alignedWords: AlignedWord[];
  waveformData: number[];
  hootCer: number; // alignment accuracy score
  isStreamed: boolean;
}

// ============================================
// WAV Conversion Response Types
// ============================================

export interface WAVConversionCallback {
  task_id: string;
  audioWavUrl: string;
}

export interface WAVConversionDetails {
  taskId: string;
  musicId: string;
  callbackUrl: string;
  completeTime?: string;
  response?: {
    audioWavUrl: string;
  };
  successFlag: WAVTaskStatus;
  createTime: string;
  errorCode?: number;
  errorMessage?: string;
}

// ============================================
// Cover Generation Response Types
// ============================================

export interface CoverGenerationCallback {
  taskId: string;
  images: string[]; // Array of cover image URLs
}

export interface CoverGenerationDetails {
  taskId: string;
  parentTaskId: string;
  callbackUrl: string;
  completeTime?: string;
  response?: {
    images: string[];
  };
  successFlag: CoverTaskStatus;
  createTime: string;
  errorCode?: number;
  errorMessage?: string;
}

// ============================================
// Persona Generation Response Types
// ============================================

export interface PersonaGenerationResponse {
  personaId: string;
  name: string;
  description: string;
}

// ============================================
// File Upload Response Types
// ============================================

export interface FileUploadResult {
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedAt: string; // ISO date string
}

// ============================================
// Account Management Response Types
// ============================================

export interface CreditsResponse {
  credits: number;
}

// ============================================
// Utility Types
// ============================================

export interface WaitForCompletionOptions {
  taskId: string;
  maxWaitTime?: number; // milliseconds, default: 600000 (10 minutes)
  pollInterval?: number; // milliseconds, default: 30000 (30 seconds)
}

export interface DownloadAndStoreOptions {
  taskId: string;
  audioData: SunoAudioData[];
  convertToWAV?: boolean; // Convert to WAV for high quality
  downloadCovers?: boolean; // Download cover images
}

export interface StoredMusicFile {
  taskId: string;
  audioId: string;
  filePath: string; // Path in Supabase Storage
  signedUrl: string; // Auto-refresh signed URL
  coverImagePath?: string;
  coverImageUrl?: string;
  wavFilePath?: string;
  wavFileUrl?: string;
  metadata: {
    title: string;
    tags: string;
    duration: number;
    prompt: string;
    modelName: string;
    createTime: string;
  };
}

