/**
 * Dashboard Types
 * 
 * All TypeScript interfaces for the dashboard.
 * These types are designed to match future Supabase table schemas.
 * 
 * TODO (Database Schema):
 * - Create corresponding tables in Supabase
 * - Add RLS policies for user data isolation
 * - Set up real-time subscriptions for live updates
 */

// ============================================
// USER & PROFILE TYPES
// ============================================

export interface UserProfile {
  id: string
  preferredName: string
  language: string
  profession: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// VOICE RECORDING TYPES
// ============================================

/**
 * Voice Recording
 * Each recording can be up to 6 minutes.
 * Recordings are contextually linked - no recording is independent.
 * 
 * TODO (AI Integration):
 * - Add transcription field after Whisper API processing
 * - Add extracted_tasks, extracted_reminders arrays
 * - Add sentiment analysis results
 * - Link related recordings via context_chain_id
 */
export interface VoiceRecording {
  id: string
  userId: string
  durationSeconds: number
  maxDuration: 360 // 6 minutes in seconds
  audioUrl?: string // Supabase Storage URL
  transcription?: string
  contextChainId?: string // Links related recordings
  createdAt: Date
  status: 'recording' | 'processing' | 'completed' | 'failed'
}

// ============================================
// URGENT ALERTS TYPES
// ============================================

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low'
export type AlertCategory = 'health' | 'work' | 'personal' | 'reminder'

/**
 * Urgent Alert
 * Displayed prominently after the greeting section.
 * Can have audio playback for accessibility.
 * 
 * TODO (AI Integration):
 * - Generate audio summary using TTS API
 * - Auto-detect urgency from voice transcription
 * - Link to source (task, health insight, reminder)
 */
export interface UrgentAlert {
  id: string
  userId: string
  title: string
  description: string
  urgencyLevel: UrgencyLevel
  category: AlertCategory
  audioSummaryUrl?: string // TTS generated audio
  sourceType?: 'task' | 'health' | 'reminder' | 'ai_insight'
  sourceId?: string
  isRead: boolean
  isDismissed: boolean
  createdAt: Date
  expiresAt?: Date
}

// ============================================
// HEALTH TYPES
// ============================================

export type HealthDocumentType = 'blood_test' | 'urine_test' | 'imaging' | 'prescription' | 'report' | 'other'
export type HealthDocumentStatus = 'pending' | 'processing' | 'analyzed' | 'failed'

/**
 * Health Document
 * Uploaded clinical results (PDF, CSV, images).
 * 
 * TODO (AI Integration):
 * - OCR processing for PDFs and images
 * - Extract biomarkers and values
 * - Compare with historical data
 * - Generate personalized recommendations
 */
export interface HealthDocument {
  id: string
  userId: string
  fileName: string
  fileType: string
  fileUrl: string // Supabase Storage URL
  documentType: HealthDocumentType
  status: HealthDocumentStatus
  extractedData?: Record<string, unknown> // Parsed biomarkers
  uploadedAt: Date
  analyzedAt?: Date
}

/**
 * Health Insight
 * AI-generated insights based on uploaded documents.
 * 
 * TODO (AI Integration):
 * - Generate from biomarker analysis
 * - Cross-reference with user's health history
 * - Personalize based on user profile (allergies, conditions)
 */
export interface HealthInsight {
  id: string
  userId: string
  category: 'nutrition' | 'exercise' | 'supplement' | 'lifestyle' | 'warning'
  title: string
  description: string
  iconName: string // Lucide icon name
  color: string // Tailwind color class
  priority: number // For ordering
  sourceDocumentId?: string
  createdAt: Date
  validUntil?: Date
}

/**
 * Health Recommendation
 * Specific actionable recommendations (what to eat, drink, exercise).
 */
export interface HealthRecommendation {
  id: string
  userId: string
  type: 'food' | 'drink' | 'exercise' | 'sleep' | 'supplement'
  title: string
  description: string
  reason: string // Why this is recommended based on labs
  imageUrl?: string
  timing?: string // "morning", "before workout", etc.
  frequency?: string // "daily", "3x per week"
  createdAt: Date
}

// ============================================
// TASK & REMINDER TYPES
// ============================================

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Task
 * User's to-do items, can be created manually or extracted from voice.
 * 
 * TODO (AI Integration):
 * - Auto-extract tasks from voice transcription
 * - Smart scheduling based on user patterns
 * - Priority detection from context
 */
export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: Date
  dueTime?: string
  category?: string
  tags: string[]
  sourceRecordingId?: string // If extracted from voice
  createdAt: Date
  completedAt?: Date
}

/**
 * Reminder
 * Time-based reminders with notification support.
 */
export interface Reminder {
  id: string
  userId: string
  title: string
  description?: string
  reminderTime: Date
  isRecurring: boolean
  recurrencePattern?: string // "daily", "weekly:mon,wed,fri"
  isCompleted: boolean
  isSnoozed: boolean
  snoozeUntil?: Date
  createdAt: Date
}

// ============================================
// CALM ZONE TYPES
// ============================================

export type AudioCategory = 'sleep' | 'meditation' | 'relaxation' | 'motivational' | 'music'

/**
 * Audio Content
 * Stories, meditations, music for the Calm Zone.
 * 
 * TODO (Content Integration):
 * - Integrate with audio content provider or create own library
 * - Add user progress tracking
 * - Personalize recommendations based on mood/time
 */
export interface AudioContent {
  id: string
  title: string
  description: string
  category: AudioCategory
  durationSeconds: number
  audioUrl: string
  thumbnailUrl?: string
  narrator?: string
  tags: string[]
  isFeatured: boolean
  playCount: number
  createdAt: Date
}

/**
 * User Audio Progress
 * Tracks listening history and progress.
 */
export interface AudioProgress {
  id: string
  userId: string
  audioId: string
  progressSeconds: number
  isCompleted: boolean
  lastPlayedAt: Date
}

// ============================================
// VOICE NOTE TYPES (for UI display)
// ============================================

export type VoiceNoteStatus = 'recording' | 'uploading' | 'processing' | 'completed' | 'failed'

/**
 * Voice Note
 * Extended version of VoiceRecording for UI display.
 * Shows what was extracted from the voice note.
 */
export interface VoiceNote {
  id: string
  userId: string
  durationSeconds: number
  audioUrl?: string
  transcription?: string
  status: VoiceNoteStatus
  contextChainId?: string // Links related voice notes
  previousNoteId?: string // For showing connections
  createdAt: Date
  
  // What the AI extracted from this voice note
  extractedTasks: Task[]
  extractedReminders: Reminder[]
  extractedHealthNotes: string[]
  aiSummary?: string // Brief summary of what was said
}

// ============================================
// AI SUMMARY TYPES
// ============================================

/**
 * Daily AI Summary
 * AI-generated summary of what Saydo did for the user.
 * Shown in the greeting section.
 * 
 * TODO (AI Integration):
 * - Generate daily at midnight or on first open
 * - Summarize completed tasks, health insights, patterns
 * - Include proactive suggestions for the day
 */
export interface DailySummary {
  id: string
  userId: string
  date: Date
  proSummary: string // Work/professional summary
  healthSummary: string // Health-related summary
  tasksCompleted: number
  insightsGenerated: number
  moodTrend?: 'improving' | 'stable' | 'declining'
  createdAt: Date
}

// ============================================
// PRO LIFE TYPES
// ============================================

export type WorkFileType = 'pdf' | 'image' | 'document' | 'spreadsheet' | 'presentation' | 'other'
export type WorkFileStatus = 'uploading' | 'processing' | 'ready' | 'failed'

/**
 * Work File
 * Files uploaded by user related to their professional activities.
 * 
 * TODO (Backend Integration):
 * - Store in Supabase Storage bucket 'work-files'
 * - Generate thumbnails for images and PDFs
 * - OCR processing for document content extraction
 */
export interface WorkFile {
  id: string
  userId: string
  fileName: string
  fileType: WorkFileType
  fileUrl: string
  thumbnailUrl?: string
  fileSize: number // in bytes
  status: WorkFileStatus
  category?: string // e.g., 'contracts', 'reports', 'presentations'
  uploadedAt: Date
}

export type AIDocumentType = 'pitch_deck' | 'proposal' | 'report' | 'email_draft' | 'meeting_notes' | 'summary' | 'contract' | 'other'
export type AIDocumentStatus = 'generating' | 'ready' | 'failed'

/**
 * AI Generated Document
 * Documents created by AI based on voice notes, files, or requests.
 * 
 * TODO (AI Integration):
 * - Generate documents from voice transcriptions
 * - Create reports from uploaded data
 * - Draft emails and proposals
 */
export interface AIDocument {
  id: string
  userId: string
  title: string
  documentType: AIDocumentType
  status: AIDocumentStatus
  contentUrl?: string // URL to generated document
  previewText?: string // First few lines for preview
  sourceVoiceNoteIds?: string[] // Voice notes that triggered this
  sourceFileIds?: string[] // Files used as reference
  generatedAt: Date
}

/**
 * End of Day Summary
 * Comprehensive summary of the user's day.
 * 
 * TODO (AI Integration):
 * - Generate at user's preferred time (evening/night)
 * - Summarize achievements, pending items, insights
 * - Provide tomorrow's priorities
 */
export interface EndOfDaySummary {
  id: string
  userId: string
  date: Date
  keyAchievements: string[]
  pendingItems: string[]
  tomorrowPriorities: string[]
  insights: string[]
  overallProductivity: 'excellent' | 'good' | 'fair' | 'needs_improvement'
  hoursWorked?: number
  tasksCompleted: number
  voiceNotesRecorded: number
  createdAt: Date
}

