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

// ============================================
// PROACTIVE HEALTH TYPES
// ============================================

/**
 * Biological Profile
 * User's biological data that drives proactive health interventions.
 * This data comes from onboarding and is used to personalize all health recommendations.
 * 
 * TODO (Database Schema):
 * - Store in profiles table: blood_group, body_type, skin_tone
 * - Store allergies in user_allergies table (many-to-many)
 * - Update when user edits profile
 * 
 * TODO (Real-time):
 * - Subscribe to profile changes for instant UI updates
 */
export interface BiologicalProfile {
  userId: string
  bloodGroup: string // e.g., "O-", "A+"
  bodyType: string // e.g., "mesomorph", "ectomorph"
  skinTone: string // e.g., "fair", "medium", "dark"
  allergies: string[] // e.g., ["Shellfish", "Peanuts"]
  age?: number
  weight?: number
  gender?: string
}

/**
 * Health Status
 * Current real-time health metrics displayed as rings on the dashboard.
 * 
 * TODO (Wearable Integration):
 * - Connect to Apple Health, Google Fit, or wearable APIs
 * - Real-time updates via WebSocket or polling
 * - Store historical data for trends
 * 
 * TODO (Database Schema):
 * - health_status table with user_id, timestamp, energy, stress, recovery
 * - Create indexes for fast queries
 */
export interface HealthStatus {
  userId: string
  energy: number // 0-100 percentage
  stress: number // 0-100 percentage
  recovery: number // 0-100 percentage
  lastUpdated: Date
  source?: 'wearable' | 'manual' | 'inferred'
}

/**
 * Proactive Intervention
 * Real-time health alerts and recommendations that appear based on context.
 * These are generated automatically based on biological data, location, calendar, etc.
 * 
 * TODO (AI Integration):
 * - Generate interventions using AI based on:
 *   - User's biological profile
 *   - Current location (GPS)
 *   - Calendar events
 *   - Health status rings
 *   - Recent lab results
 *   - Voice stress analysis
 *   - Weather data
 * 
 * TODO (Database Schema):
 * - proactive_interventions table with:
 *   - id, user_id, type, title, description
 *   - urgency_level, category
 *   - context (JSON: location, time, calendar_event)
 *   - biological_reason, action_items (JSON arrays)
 *   - is_dismissed, valid_until, created_at
 * 
 * TODO (Real-time):
 * - Subscribe to new interventions via Supabase Realtime
 * - Push notifications for critical interventions
 * - Auto-expire interventions after valid_until
 */
export interface ProactiveIntervention {
  id: string
  userId: string
  type: 'uv_advisor' | 'blood_group_fueling' | 'allergy_guardian' | 'recovery_adjuster' | 
        'pdf_interpreter' | 'voice_stress' | 'hydration_safety' | 'jetlag_biosync' | 
        'longevity_tracker' | 'sleep_strategy' | 'pre_meeting' | 'late_night' | 
        'environmental_shield' | 'supplement_verification' | 'cognitive_load'
  title: string
  description: string
  urgencyLevel: UrgencyLevel
  category: 'health' | 'nutrition' | 'environment' | 'recovery' | 'cognitive'
  context?: {
    location?: string // e.g., "Kigali, Rwanda"
    time?: string // e.g., "11:30 AM"
    calendarEvent?: string // e.g., "Board Meeting in 15 min"
    weather?: string // e.g., "UV Index: 8"
    restaurant?: string // e.g., "Seafood Restaurant"
  }
  biologicalReason: string // Why this matters for user's biology
  actionItems: string[] // What user should do
  dismissible: boolean
  validUntil?: Date
  createdAt: Date
  isDismissed?: boolean
}

/**
 * Use Case Intervention
 * Specific intervention for one of the 10 specialized use cases.
 * Extends ProactiveIntervention with use-case-specific data.
 * 
 * TODO (API Integration):
 * - UV Advisor: Weather API for UV index + location
 * - Blood Group Fueling: Nutrition database for blood type diets
 * - Allergy Guardian: Restaurant API or manual database
 * - Recovery Adjuster: HRV from wearable device
 * - PDF Interpreter: OCR + AI analysis
 * - Voice Stress: Voice analysis API (frequency, tone)
 * - Hydration Safety: Lab data + protein intake tracking
 * - Jet-Lag Bio-Sync: Flight API or calendar + timezone
 * - Longevity Tracker: Biomarker analysis over time
 * - Sleep-Strategy: Sleep tracking device data
 */
export interface UseCaseIntervention extends ProactiveIntervention {
  useCaseData?: {
    // UV Advisor
    uvIndex?: number
    vitaminDLimit?: boolean
    
    // Blood Group Fueling
    recommendedFood?: string
    avoidFood?: string
    
    // Allergy Guardian
    detectedAllergens?: string[]
    safeMenuItems?: string[]
    
    // Recovery Adjuster
    hrvValue?: number
    cortisolLevel?: 'high' | 'normal' | 'low'
    recoveryTime?: string
    
    // PDF Interpreter
    biomarkerValues?: Record<string, { value: number; unit: string; status: string }>
    clinicalSummary?: string
    
    // Voice Stress
    stressLevel?: number
    voiceFrequency?: number
    recommendedAction?: string
    
    // Hydration Safety
    creatinineLevel?: number
    proteinIntake?: number
    recommendedWater?: number
    
    // Jet-Lag Bio-Sync
    timezoneFrom?: string
    timezoneTo?: string
    waitTime?: string
    lightExposure?: string
    
    // Longevity Tracker
    biologicalAge?: number
    chronologicalAge?: number
    improvementFactors?: string[]
    
    // Sleep-Strategy
    deepSleepMinutes?: number
    cognitiveLoad?: 'high' | 'medium' | 'low'
    recommendedAvoidance?: string[]
  }
}

// ============================================
// MEAL PLANNING TYPES
// ============================================

/**
 * Meal Plan Day
 * Daily meal breakdown with breakfast, lunch, dinner, and snacks.
 * 
 * TODO (Backend Integration):
 * - Store in meal_plans table with date, user_id
 * - Link meals to nutrition database
 * - Track user adherence to meal plan
 * 
 * TODO (AI Integration):
 * - Generate meals based on:
 *   - Lab results (iron, B12, vitamin D, etc.)
 *   - Blood group diet recommendations
 *   - Allergies and restrictions
 *   - Health status rings (energy, stress, recovery)
 *   - User preferences and location
 */
export interface DrinkItem {
  id: string
  name: string
  timing: 'morning' | 'afternoon' | 'evening' | 'throughout-day' | 'post-workout' | 'with-meal'
  reason?: string // Why this drink is recommended
  amount: string // e.g., "250ml", "2L", "1 cup"
}

export interface MealPlanDay {
  date: Date
  breakfast: MealItem[]
  lunch: MealItem[]
  dinner: MealItem[]
  snacks: MealItem[]
  drinks?: DrinkItem[] // Recommended drinks for the day
  supplements: SupplementItem[]
  nutritionalTargets: {
    calories: number
    protein: number // grams
    carbs: number // grams
    fats: number // grams
    iron?: number // mg (if low iron detected)
    vitaminD?: number // IU (if low D detected)
    b12?: number // mcg (if low B12 detected)
  }
  notes?: string // AI-generated notes for the day
}

/**
 * Meal Item
 * Individual food item in a meal plan.
 */
export interface MealItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  nutritionalInfo: {
    calories: number
    protein: number // grams
    carbs: number // grams
    fats: number // grams
    fiber?: number // grams
    iron?: number // mg
    vitaminD?: number // IU
    b12?: number // mcg
  }
  bloodGroupCompatible: boolean
  allergySafe: boolean
  reason?: string // Why this is recommended (e.g., "High in iron for your low levels")
  alternatives?: string[] // Alternative options if unavailable
}

/**
 * Supplement Item
 * Supplement recommendation with timing.
 */
export interface SupplementItem {
  id: string
  name: string
  dosage: string // e.g., "1000mcg"
  timing: 'morning' | 'afternoon' | 'evening' | 'with-meal'
  reason?: string // Why this supplement is needed
}

/**
 * Meal Plan
 * Weekly or monthly meal plan structure.
 * 
 * TODO (Backend Integration):
 * - Store in meal_plans table
 * - Generate new plans weekly/monthly
 * - Update based on new lab results
 * - Track user feedback and preferences
 */
export interface MealPlan {
  id: string
  userId: string
  type: 'weekly' | 'monthly'
  startDate: Date
  endDate: Date
  days: MealPlanDay[]
  basedOnLabs: string[] // Lab document IDs used to generate plan
  basedOnInsights: string[] // Health insight IDs used
  createdAt: Date
  updatedAt: Date
}

// ============================================
// FOOD ANALYSIS TYPES
// ============================================

/**
 * Food Compatibility
 * Assessment of how compatible a food item is with user's health profile.
 */
export type FoodCompatibility = 'good' | 'caution' | 'not-recommended'

/**
 * Food Analysis
 * Results from analyzing a food/drink/supplement image.
 * 
 * TODO (AI Integration):
 * - Image recognition: Google Vision API, AWS Rekognition, or custom ML model
 * - Food identification and nutritional data extraction
 * - Cross-reference with:
 *   - User's allergies
 *   - Blood group diet recommendations
 *   - Current lab results (iron, B12, vitamin D, etc.)
 *   - Health status rings
 * - Generate compatibility assessment
 * - Suggest alternatives if not optimal
 * 
 * TODO (Backend Integration):
 * - Store analysis results in food_analyses table
 * - Track user's food choices over time
 * - Learn from user feedback
 * - Build personal food compatibility database
 */
export interface FoodAnalysis {
  id: string
  userId: string
  imageUrl: string // Uploaded image URL
  identifiedFood: {
    name: string
    category: 'food' | 'drink' | 'supplement'
    confidence: number // 0-100
  }
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fats?: number
    fiber?: number
    iron?: number
    vitaminD?: number
    b12?: number
  }
  compatibility: FoodCompatibility
  compatibilityDetails: {
    allergyCheck: {
      safe: boolean
      detectedAllergens?: string[]
      message?: string
    }
    bloodGroupCheck: {
      compatible: boolean
      message?: string
    }
    labResultsCheck: {
      beneficial: boolean
      relevantNutrients?: string[] // e.g., ["iron", "b12"]
      message?: string
    }
    overallReason: string // Detailed explanation
  }
  recommendations: {
    action: 'consume' | 'consume-with-caution' | 'avoid'
    reasoning: string
    alternatives?: string[] // Better alternatives if not optimal
    timing?: string // Best time to consume (e.g., "with breakfast for better iron absorption")
  }
  analyzedAt: Date
}

