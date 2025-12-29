/**
 * Mock Data for Dashboard
 * 
 * This file contains all mock data used during UI/UX development.
 * Each section has detailed comments for future API integration.
 * 
 * TODO (Backend Integration):
 * - Replace each mock function with actual Supabase queries
 * - Add real-time subscriptions where noted
 * - Implement caching strategy for frequently accessed data
 */

import type {
  UserProfile,
  UrgentAlert,
  HealthDocument,
  HealthInsight,
  HealthRecommendation,
  Task,
  Reminder,
  AudioContent,
  DailySummary,
  VoiceNote,
  WorkFile,
  AIDocument,
  EndOfDaySummary,
  BiologicalProfile,
  HealthStatus,
  ProactiveIntervention,
  UseCaseIntervention,
  MealPlan,
  FoodAnalysis
} from './types'

// ============================================
// USER PROFILE
// ============================================

/**
 * Get current user profile.
 * 
 * TODO (Supabase):
 * - Query: supabase.from('profiles').select('*').eq('id', userId).single()
 * - This data comes from onboarding, stored in profiles table
 * - Should also fetch from auth.users for email/avatar
 */
export function getMockUserProfile(): UserProfile {
  return {
    id: 'mock-user-123',
    preferredName: 'Chris', // From onboarding name step
    language: 'en', // From onboarding language step
    profession: 'Founder', // From onboarding profession step
    avatarUrl: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
}

// ============================================
// VOICE NOTES
// ============================================

/**
 * Get user's voice notes.
 * 
 * TODO (Supabase):
 * - Query: supabase.from('voice_recordings')
 *   .select('*, extracted_tasks:tasks(*), extracted_reminders:reminders(*)')
 *   .eq('user_id', userId)
 *   .order('created_at', { ascending: false })
 * - Subscribe for real-time updates when processing completes
 */
export function getMockVoiceNotes(): VoiceNote[] {
  return [
    {
      id: 'voice-1',
      userId: 'mock-user-123',
      durationSeconds: 145,
      audioUrl: '/mock/voice-1.webm',
      transcription: 'Just finished the call with TechVentures. They want to see the updated pitch deck by end of day. Also need to schedule a follow-up for next week.',
      status: 'completed',
      contextChainId: 'chain-1',
      createdAt: new Date(Date.now() - 1800000), // 30 min ago
      extractedTasks: [
        {
          id: 'task-v1',
          userId: 'mock-user-123',
          title: 'Send updated pitch deck',
          description: 'To TechVentures team',
          priority: 'urgent',
          status: 'pending',
          dueDate: new Date(),
          dueTime: '17:00',
          tags: ['investor', 'pitch'],
          createdAt: new Date()
        }
      ],
      extractedReminders: [],
      extractedHealthNotes: [],
      aiSummary: 'Discussed TechVentures call outcome. Created 1 urgent task for pitch deck delivery.'
    },
    {
      id: 'voice-2',
      userId: 'mock-user-123',
      durationSeconds: 78,
      status: 'processing',
      contextChainId: 'chain-1',
      previousNoteId: 'voice-1',
      createdAt: new Date(Date.now() - 300000), // 5 min ago
      extractedTasks: [],
      extractedReminders: [],
      extractedHealthNotes: []
    },
    {
      id: 'voice-3',
      userId: 'mock-user-123',
      durationSeconds: 92,
      audioUrl: '/mock/voice-3.webm',
      transcription: 'Feeling a bit tired today. Maybe related to the iron thing. Should eat more spinach. Also remember to call mom this evening.',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      extractedTasks: [],
      extractedReminders: [
        {
          id: 'reminder-v3',
          userId: 'mock-user-123',
          title: 'Call Mom',
          reminderTime: new Date(new Date().setHours(18, 0, 0, 0)),
          isRecurring: false,
          isCompleted: false,
          isSnoozed: false,
          createdAt: new Date()
        }
      ],
      extractedHealthNotes: ['Feeling tired - possibly iron-related'],
      aiSummary: 'Mentioned fatigue possibly related to iron levels. Created reminder to call mom.'
    }
  ]
}

// ============================================
// DAILY SUMMARY
// ============================================

/**
 * Get today's AI-generated summary.
 * 
 * TODO (AI Integration):
 * - Generate using OpenAI/Claude based on:
 *   - Completed tasks from yesterday
 *   - Health insights generated
 *   - Voice recordings analyzed
 *   - Calendar events (future)
 * - Store in daily_summaries table
 * - Regenerate on first app open each day
 */
export function getMockDailySummary(): DailySummary {
  return {
    id: 'summary-today',
    userId: 'mock-user-123',
    date: new Date(),
    proSummary: 'Saydo organized 3 meetings and drafted 2 follow-up emails from your voice notes.',
    healthSummary: 'Your iron levels suggest adding more leafy greens. I\'ve updated your meal suggestions.',
    tasksCompleted: 7,
    insightsGenerated: 3,
    moodTrend: 'improving',
    createdAt: new Date()
  }
}

// ============================================
// URGENT ALERTS
// ============================================

/**
 * Get active urgent alerts for the user.
 * 
 * TODO (Supabase):
 * - Query: supabase.from('urgent_alerts')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .eq('is_dismissed', false)
 *   .order('created_at', { ascending: false })
 * - Subscribe to real-time changes for instant updates
 * 
 * TODO (AI Integration):
 * - Generate alerts from:
 *   - Health analysis (critical biomarker values)
 *   - Overdue tasks
 *   - Missed reminders
 *   - Important patterns detected in voice notes
 */
export function getMockUrgentAlerts(): UrgentAlert[] {
  return [
    {
      id: 'alert-1',
      userId: 'mock-user-123',
      title: 'Low Iron Detected',
      description: 'Your latest blood test shows iron at 45 mcg/dL. Consider eating iron-rich foods today.',
      urgencyLevel: 'high',
      category: 'health',
      audioSummaryUrl: undefined, // TODO: Generate TTS
      sourceType: 'health',
      isRead: false,
      isDismissed: false,
      createdAt: new Date()
    },
    {
      id: 'alert-2',
      userId: 'mock-user-123',
      title: 'Investor Call in 30 minutes',
      description: 'Don\'t forget: Call with TechVentures at 2:00 PM. I\'ve prepared your talking points.',
      urgencyLevel: 'critical',
      category: 'work',
      isRead: false,
      isDismissed: false,
      createdAt: new Date()
    }
  ]
}

// ============================================
// HEALTH DATA
// ============================================

/**
 * Get uploaded health documents.
 * 
 * TODO (Supabase):
 * - Query: supabase.from('health_documents')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .order('uploaded_at', { ascending: false })
 * - Files stored in Supabase Storage bucket 'health-documents'
 */
export function getMockHealthDocuments(): HealthDocument[] {
  return [
    {
      id: 'doc-1',
      userId: 'mock-user-123',
      fileName: 'Blood_Test_Dec_2024.pdf',
      fileType: 'application/pdf',
      fileUrl: '/mock/blood-test.pdf',
      documentType: 'blood_test',
      status: 'analyzed',
      extractedData: {
        hemoglobin: { value: 14.2, unit: 'g/dL', status: 'normal' },
        iron: { value: 45, unit: 'mcg/dL', status: 'low' },
        vitaminD: { value: 28, unit: 'ng/mL', status: 'low' }
      },
      uploadedAt: new Date('2024-12-15'),
      analyzedAt: new Date('2024-12-15')
    },
    {
      id: 'doc-2',
      userId: 'mock-user-123',
      fileName: 'Cholesterol_Panel.pdf',
      fileType: 'application/pdf',
      fileUrl: '/mock/cholesterol.pdf',
      documentType: 'blood_test',
      status: 'analyzed',
      uploadedAt: new Date('2024-11-20'),
      analyzedAt: new Date('2024-11-20')
    }
  ]
}

/**
 * Get AI-generated health insights.
 * 
 * TODO (AI Integration):
 * - Generate from analyzed health documents
 * - Consider user's allergies and health interests from onboarding
 * - Personalize based on profession (e.g., high-stress jobs)
 * - Update when new documents are uploaded
 */
export function getMockHealthInsights(): HealthInsight[] {
  return [
    {
      id: 'insight-1',
      userId: 'mock-user-123',
      category: 'warning',
      title: 'Iron Deficiency',
      description: 'Your iron is at 45 mcg/dL, below optimal range. This may cause fatigue.',
      iconName: 'AlertTriangle',
      color: 'text-amber-500',
      priority: 1,
      sourceDocumentId: 'doc-1',
      createdAt: new Date()
    },
    {
      id: 'insight-2',
      userId: 'mock-user-123',
      category: 'supplement',
      title: 'Vitamin D Boost Needed',
      description: 'Consider 2000 IU daily with breakfast for better absorption.',
      iconName: 'Sun',
      color: 'text-yellow-500',
      priority: 2,
      createdAt: new Date()
    },
    {
      id: 'insight-3',
      userId: 'mock-user-123',
      category: 'lifestyle',
      title: 'Sleep Quality',
      description: 'Based on your patterns, try sleeping before 11 PM this week.',
      iconName: 'Moon',
      color: 'text-indigo-500',
      priority: 3,
      createdAt: new Date()
    }
  ]
}

/**
 * Get personalized health recommendations.
 * 
 * TODO (AI Integration):
 * - Generate based on health insights and biomarkers
 * - Consider allergies from user profile
 * - Rotate recommendations daily
 * - Factor in season and location for food availability
 */
export function getMockHealthRecommendations(): HealthRecommendation[] {
  return [
    {
      id: 'rec-1',
      userId: 'mock-user-123',
      type: 'food',
      title: 'Spinach Salad',
      description: 'Rich in iron and vitamin C for better absorption.',
      reason: 'Your iron levels are low. Pair with citrus for 3x absorption.',
      imageUrl: undefined,
      timing: 'lunch',
      frequency: 'daily',
      createdAt: new Date()
    },
    {
      id: 'rec-2',
      userId: 'mock-user-123',
      type: 'drink',
      title: 'Orange Juice',
      description: 'Natural vitamin C to boost iron absorption.',
      reason: 'Vitamin C enhances iron uptake. Avoid coffee within 1 hour of meals.',
      timing: 'morning',
      frequency: 'daily',
      createdAt: new Date()
    },
    {
      id: 'rec-3',
      userId: 'mock-user-123',
      type: 'exercise',
      title: 'Zone 2 Cardio',
      description: '30 minutes of light jogging or cycling.',
      reason: 'Improves iron utilization and boosts energy levels.',
      timing: 'morning',
      frequency: '3x per week',
      createdAt: new Date()
    }
  ]
}

// ============================================
// TASKS & REMINDERS
// ============================================

/**
 * Get user's tasks.
 * 
 * TODO (Supabase):
 * - Query: supabase.from('tasks')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .neq('status', 'completed')
 *   .order('priority', { ascending: true })
 * - Subscribe for real-time updates
 * 
 * TODO (AI Integration):
 * - Auto-extract tasks from voice transcriptions
 * - Smart priority detection
 * - Due date inference from context
 */
export function getMockTasks(): Task[] {
  return [
    {
      id: 'task-1',
      userId: 'mock-user-123',
      title: 'Send updated pitch deck',
      description: 'To TechVentures team',
      priority: 'urgent',
      status: 'pending',
      dueDate: new Date(),
      dueTime: '17:00',
      category: 'work',
      tags: ['investor', 'pitch'],
      createdAt: new Date()
    },
    {
      id: 'task-2',
      userId: 'mock-user-123',
      title: 'Schedule blood work',
      description: 'Follow-up iron levels check',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days
      category: 'health',
      tags: ['health', 'appointment'],
      createdAt: new Date()
    },
    {
      id: 'task-3',
      userId: 'mock-user-123',
      title: 'Review Q1 roadmap',
      priority: 'medium',
      status: 'in_progress',
      category: 'work',
      tags: ['planning'],
      createdAt: new Date()
    },
    {
      id: 'task-4',
      userId: 'mock-user-123',
      title: 'Buy groceries',
      description: 'Spinach, salmon, oranges',
      priority: 'low',
      status: 'pending',
      category: 'personal',
      tags: ['shopping'],
      createdAt: new Date()
    }
  ]
}

/**
 * Get user's reminders.
 * 
 * TODO (Supabase):
 * - Query with upcoming reminders
 * - Set up push notifications via Supabase Edge Functions
 */
export function getMockReminders(): Reminder[] {
  return [
    {
      id: 'reminder-1',
      userId: 'mock-user-123',
      title: 'Take Vitamin D',
      description: 'With breakfast',
      reminderTime: new Date(new Date().setHours(8, 0, 0, 0)),
      isRecurring: true,
      recurrencePattern: 'daily',
      isCompleted: false,
      isSnoozed: false,
      createdAt: new Date()
    },
    {
      id: 'reminder-2',
      userId: 'mock-user-123',
      title: 'Hydration check',
      reminderTime: new Date(new Date().setHours(14, 0, 0, 0)),
      isRecurring: true,
      recurrencePattern: 'daily',
      isCompleted: false,
      isSnoozed: false,
      createdAt: new Date()
    },
    {
      id: 'reminder-3',
      userId: 'mock-user-123',
      title: 'Call Mom',
      reminderTime: new Date(new Date().setHours(18, 0, 0, 0)),
      isRecurring: false,
      isCompleted: false,
      isSnoozed: false,
      createdAt: new Date()
    }
  ]
}

// ============================================
// CALM ZONE / AUDIO CONTENT
// ============================================

/**
 * Mock/placeholder audio URL prefix.
 * URLs starting with /mock/ are detected by the audio player as placeholder content
 * and handled gracefully (no error spam, user-friendly "not available" message).
 * 
 * To add real audio content:
 * 1. Upload audio files to Supabase Storage (bucket: 'calm-audio')
 * 2. Add entries to the 'audio_content' table with valid URLs
 * 3. The CalmAudioManager will fetch and stream from Supabase
 */
const MOCK_AUDIO_PREFIX = '/mock/'

/**
 * Get audio content for Calm Zone.
 * 
 * NOTE: These are placeholder entries for UI development.
 * Audio files do not exist - the player will show "not yet available" message.
 * 
 * TODO (Content):
 * - Integrate with audio content provider
 * - Store audio files in Supabase Storage
 * - Track user listening history
 * - Personalize recommendations based on time of day
 */
export function getMockAudioContent(): AudioContent[] {
  return [
    {
      id: 'audio-1',
      title: 'Morning Energy Boost',
      description: 'Start your day with positive affirmations and gentle energy.',
      category: 'motivational',
      durationSeconds: 600, // 10 min
      audioUrl: `${MOCK_AUDIO_PREFIX}morning-boost.mp3`,
      thumbnailUrl: undefined,
      narrator: 'Alex',
      tags: ['morning', 'energy', 'affirmations'],
      isFeatured: true,
      playCount: 1250,
      createdAt: new Date()
    },
    {
      id: 'audio-2',
      title: 'Deep Sleep Journey',
      description: 'Drift into restful sleep with this calming bedtime story.',
      category: 'sleep',
      durationSeconds: 1800, // 30 min
      audioUrl: `${MOCK_AUDIO_PREFIX}sleep-journey.mp3`,
      narrator: 'Sarah',
      tags: ['sleep', 'story', 'relaxation'],
      isFeatured: true,
      playCount: 3420,
      createdAt: new Date()
    },
    {
      id: 'audio-3',
      title: 'Focus Meditation',
      description: 'Clear your mind and enhance concentration.',
      category: 'meditation',
      durationSeconds: 900, // 15 min
      audioUrl: `${MOCK_AUDIO_PREFIX}focus-meditation.mp3`,
      narrator: 'Maya',
      tags: ['focus', 'concentration', 'work'],
      isFeatured: false,
      playCount: 890,
      createdAt: new Date()
    },
    {
      id: 'audio-4',
      title: 'Stress Relief',
      description: 'Release tension and find your calm center.',
      category: 'relaxation',
      durationSeconds: 720, // 12 min
      audioUrl: `${MOCK_AUDIO_PREFIX}stress-relief.mp3`,
      narrator: 'Alex',
      tags: ['stress', 'anxiety', 'calm'],
      isFeatured: false,
      playCount: 1560,
      createdAt: new Date()
    },
    {
      id: 'audio-5',
      title: 'Ocean Waves',
      description: 'Ambient sounds of gentle ocean waves.',
      category: 'relaxation',
      durationSeconds: 3600, // 1 hour
      audioUrl: `${MOCK_AUDIO_PREFIX}ocean-waves.mp3`,
      tags: ['ambient', 'nature', 'background'],
      isFeatured: false,
      playCount: 2100,
      createdAt: new Date()
    },
    {
      id: 'audio-6',
      title: 'Founder\'s Mindset',
      description: 'Motivational insights for entrepreneurs.',
      category: 'motivational',
      durationSeconds: 480, // 8 min
      audioUrl: `${MOCK_AUDIO_PREFIX}founders-mindset.mp3`,
      narrator: 'Chris',
      tags: ['business', 'motivation', 'success'],
      isFeatured: false,
      playCount: 675,
      createdAt: new Date()
    }
  ]
}

// ============================================
// PRO LIFE DATA
// ============================================

/**
 * Get user's work files.
 * 
 * TODO (Supabase):
 * - Query: supabase.from('work_files')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .order('uploaded_at', { ascending: false })
 */
export function getMockWorkFiles(): WorkFile[] {
  return [
    {
      id: 'file-1',
      userId: 'mock-user-123',
      fileName: 'Q1_Investor_Pitch.pdf',
      fileType: 'pdf',
      fileUrl: '/mock/q1-pitch.pdf',
      thumbnailUrl: undefined,
      fileSize: 2500000, // 2.5 MB
      status: 'ready',
      category: 'presentations',
      uploadedAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
    },
    {
      id: 'file-2',
      userId: 'mock-user-123',
      fileName: 'Product_Roadmap_2025.xlsx',
      fileType: 'spreadsheet',
      fileUrl: '/mock/roadmap.xlsx',
      fileSize: 450000,
      status: 'ready',
      category: 'planning',
      uploadedAt: new Date(Date.now() - 86400000 * 5)
    },
    {
      id: 'file-3',
      userId: 'mock-user-123',
      fileName: 'Meeting_Notes_TechVentures.docx',
      fileType: 'document',
      fileUrl: '/mock/meeting-notes.docx',
      fileSize: 125000,
      status: 'ready',
      category: 'notes',
      uploadedAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      id: 'file-4',
      userId: 'mock-user-123',
      fileName: 'Team_Photo_Offsite.jpg',
      fileType: 'image',
      fileUrl: '/mock/team-photo.jpg',
      thumbnailUrl: '/mock/team-photo-thumb.jpg',
      fileSize: 3200000,
      status: 'ready',
      category: 'media',
      uploadedAt: new Date(Date.now() - 86400000 * 7)
    }
  ]
}

/**
 * Get AI-generated documents.
 * 
 * TODO (AI Integration):
 * - Generate from voice transcriptions
 * - Auto-create reports from data
 * - Draft communications
 */
export function getMockAIDocuments(): AIDocument[] {
  return [
    {
      id: 'ai-doc-1',
      userId: 'mock-user-123',
      title: 'Weekly Progress Report',
      documentType: 'report',
      status: 'ready',
      contentUrl: '/mock/weekly-report.pdf',
      previewText: 'This week saw significant progress on the mobile app redesign. Key achievements include...',
      generatedAt: new Date(Date.now() - 86400000) // Yesterday
    },
    {
      id: 'ai-doc-2',
      userId: 'mock-user-123',
      title: 'TechVentures Follow-up Email',
      documentType: 'email_draft',
      status: 'ready',
      previewText: 'Dear Mike, Thank you for taking the time to meet with us yesterday. As discussed...',
      sourceVoiceNoteIds: ['voice-1'],
      generatedAt: new Date(Date.now() - 1800000) // 30 min ago
    },
    {
      id: 'ai-doc-3',
      userId: 'mock-user-123',
      title: 'Product Pitch Deck Summary',
      documentType: 'summary',
      status: 'generating',
      sourceFileIds: ['file-1'],
      generatedAt: new Date()
    },
    {
      id: 'ai-doc-4',
      userId: 'mock-user-123',
      title: 'Meeting Notes: Strategy Session',
      documentType: 'meeting_notes',
      status: 'ready',
      previewText: 'Key decisions from today\'s strategy session: 1. Prioritize mobile-first approach...',
      sourceVoiceNoteIds: ['voice-1', 'voice-2'],
      generatedAt: new Date(Date.now() - 7200000) // 2 hours ago
    }
  ]
}

/**
 * Get end-of-day summary.
 * 
 * TODO (AI Integration):
 * - Generate at user's preferred end-of-day time
 * - Analyze full day's activities
 * - Provide actionable insights
 */
export function getMockEndOfDaySummary(): EndOfDaySummary {
  return {
    id: 'eod-today',
    userId: 'mock-user-123',
    date: new Date(),
    keyAchievements: [
      'Completed investor call with TechVentures',
      'Finalized Q1 roadmap priorities',
      'Reviewed and approved 3 design proposals'
    ],
    pendingItems: [
      'Send follow-up email to TechVentures',
      'Review marketing budget proposal',
      'Schedule team offsite'
    ],
    tomorrowPriorities: [
      'Morning: Deep work on product strategy',
      'Afternoon: Team sync and standups',
      'Evening: Review weekly metrics'
    ],
    insights: [
      'Your productivity peaked between 9-11 AM today',
      'You had 23% fewer meetings than last week',
      'Consider delegating more admin tasks'
    ],
    overallProductivity: 'good',
    hoursWorked: 8.5,
    tasksCompleted: 7,
    voiceNotesRecorded: 3,
    createdAt: new Date()
  }
}

// ============================================
// PROACTIVE HEALTH DATA
// ============================================

/**
 * Get user's biological profile.
 * 
 * TODO (Supabase):
 * - Query: supabase.from('profiles')
 *   .select('blood_group, body_type, skin_tone, age, weight, gender')
 *   .eq('id', userId)
 *   .single()
 * - Query: supabase.from('user_allergies')
 *   .select('allergy')
 *   .eq('user_id', userId)
 * - This data comes from onboarding essentials step
 */
export function getMockBiologicalProfile(): BiologicalProfile {
  return {
    userId: 'mock-user-123',
    bloodGroup: 'O-',
    bodyType: 'mesomorph',
    skinTone: 'fair',
    allergies: ['Shellfish', 'Peanuts'],
    age: 35,
    weight: 75,
    gender: 'male'
  }
}

/**
 * Get current health status (Energy, Stress, Recovery rings).
 * 
 * TODO (Wearable Integration):
 * - Connect to Apple HealthKit API
 * - Connect to Google Fit API
 * - Connect to Oura Ring API
 * - Connect to Whoop API
 * - Poll every 5 minutes or use WebSocket for real-time
 * 
 * TODO (Supabase):
 * - Query: supabase.from('health_status')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .order('last_updated', { ascending: false })
 *   .limit(1)
 *   .single()
 * - Subscribe to real-time updates
 */
export function getMockHealthStatus(): HealthStatus {
  return {
    userId: 'mock-user-123',
    energy: 65, // 65% energy
    stress: 42, // 42% stress (lower is better)
    recovery: 58, // 58% recovery
    lastUpdated: new Date(),
    source: 'wearable'
  }
}

/**
 * Get active proactive interventions.
 * 
 * TODO (AI Integration):
 * - Generate interventions using AI/ML models based on:
 *   - Biological profile + current context
 *   - Location (GPS) + weather API
 *   - Calendar events
 *   - Health status rings
 *   - Recent lab results
 *   - Voice recordings (stress analysis)
 * 
 * TODO (Supabase):
 * - Query: supabase.from('proactive_interventions')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .eq('is_dismissed', false)
 *   .gt('valid_until', new Date().toISOString()) // Not expired
 *   .order('urgency_level', { ascending: true }) // Critical first
 *   .order('created_at', { ascending: false })
 * - Subscribe to real-time new interventions
 * - Auto-expire interventions after valid_until
 */
export function getMockProactiveInterventions(): ProactiveIntervention[] {
  return [
    {
      id: 'intervention-1',
      userId: 'mock-user-123',
      type: 'uv_advisor',
      title: 'UV Limit Reached',
      description: 'Based on your skin tone, you\'ve reached your Vitamin D limit for today. Move inside or put on SPF.',
      urgencyLevel: 'high',
      category: 'health',
      context: {
        location: 'Kigali, Rwanda',
        time: '2:30 PM',
        weather: 'UV Index: 8'
      },
      biologicalReason: 'Your labs showed a history of UV sensitivity. Your fair skin tone requires extra protection.',
      actionItems: [
        'Move inside or apply SPF 30+',
        'Continue working from shaded area',
        'Resume outdoor activities after 4 PM'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 3600000), // 1 hour
      createdAt: new Date(Date.now() - 300000), // 5 min ago
      isDismissed: false
    },
    {
      id: 'intervention-2',
      userId: 'mock-user-123',
      type: 'blood_group_fueling',
      title: 'Better Fuel for Focus',
      description: 'As a Type O-, your body handles protein better than high carbs for focus. That bagel will give you brain fog in 30 minutes.',
      urgencyLevel: 'medium',
      category: 'nutrition',
      context: {
        time: '11:45 AM',
        calendarEvent: 'Back-to-back meetings starting soon'
      },
      biologicalReason: 'Type O blood group has optimal protein metabolism. High carbs cause insulin spikes and mental fog.',
      actionItems: [
        'Choose turkey wrap instead of bagel',
        'Your O- chemistry will turn protein into immediate mental energy',
        'Avoid high-carb snacks before important meetings'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 1800000), // 30 min
      createdAt: new Date(Date.now() - 600000), // 10 min ago
      isDismissed: false
    },
    {
      id: 'intervention-3',
      userId: 'mock-user-123',
      type: 'allergy_guardian',
      title: 'Allergy Alert: Restaurant',
      description: 'You\'re at Seafood Palace. They use peanut oil in their base. I\'ve flagged the safe menu items for you.',
      urgencyLevel: 'critical',
      category: 'health',
      context: {
        location: 'Seafood Palace Restaurant',
        restaurant: 'Seafood Palace',
        time: '1:15 PM'
      },
      biologicalReason: 'You have a severe peanut allergy. Cross-contamination risk is high at this location.',
      actionItems: [
        'Mention your allergy to the waiter',
        'Order from the flagged safe menu items',
        'Avoid fried items (peanut oil used)'
      ],
      dismissible: false, // Critical - cannot dismiss
      validUntil: new Date(Date.now() + 7200000), // 2 hours
      createdAt: new Date(Date.now() - 900000), // 15 min ago
      isDismissed: false
    },
    {
      id: 'intervention-4',
      userId: 'mock-user-123',
      type: 'recovery_adjuster',
      title: 'Recovery Slower Than Usual',
      description: 'Your recovery is slower than usual for a Mesomorph. Your cortisol is high. Skip the late-night work session.',
      urgencyLevel: 'high',
      category: 'recovery',
      context: {
        time: '10:30 PM'
      },
      biologicalReason: 'Mesomorphs typically recover faster, but high cortisol indicates overtraining. Late work will worsen recovery.',
      actionItems: [
        'Skip the late-night work session',
        'I\'ve moved your "Prep" task to 7 AM tomorrow',
        'Protect your testosterone and sleep quality'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 3600000), // 1 hour
      createdAt: new Date(Date.now() - 1800000), // 30 min ago
      isDismissed: false
    },
    {
      id: 'intervention-5',
      userId: 'mock-user-123',
      type: 'supplement_verification',
      title: 'Missed Vitamin D for 72 Hours',
      description: 'You\'ve missed your D3 for 72 hours. Your energy levels will start to drop by Thursday if we don\'t fix this.',
      urgencyLevel: 'medium',
      category: 'health',
      context: {
        time: '8:15 AM'
      },
      biologicalReason: 'Your skin tone and lab history show you need daily D3. Missing doses will impact energy and mood.',
      actionItems: [
        'Take Vitamin D3 now with breakfast',
        'Set a daily reminder at 8 AM',
        'Track intake for next 7 days'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 86400000), // 24 hours
      createdAt: new Date(),
      isDismissed: false
    }
  ]
}

/**
 * Get use case specific interventions with detailed data.
 * 
 * TODO (API Integration):
 * - Each use case requires different APIs:
 *   - UV Advisor: OpenWeatherMap or similar for UV index
 *   - Blood Group: Nutrition database (e.g., Nutritionix)
 *   - Allergy Guardian: Restaurant database or manual curation
 *   - Recovery Adjuster: HRV from wearable (Oura, Whoop)
 *   - PDF Interpreter: OCR (Tesseract) + AI analysis
 *   - Voice Stress: Voice analysis API (frequency analysis)
 *   - Hydration Safety: Lab data + food logging
 *   - Jet-Lag: Flight API (Amadeus) or calendar timezone
 *   - Longevity: Biomarker tracking over time
 *   - Sleep-Strategy: Sleep tracking device data
 */
export function getMockUseCaseInterventions(): UseCaseIntervention[] {
  return [
    {
      id: 'usecase-1',
      userId: 'mock-user-123',
      type: 'uv_advisor',
      title: 'UV Limit Reached - Move Inside',
      description: 'Chris, based on your skin tone, you\'ve reached your Vitamin D limit for today. Move inside or put on SPF.',
      urgencyLevel: 'high',
      category: 'health',
      context: {
        location: 'Kigali, Rwanda',
        time: '2:30 PM',
        weather: 'UV Index: 8'
      },
      biologicalReason: 'Your labs showed a history of UV sensitivity; let\'s protect your skin while you finish that proposal.',
      actionItems: [
        'Move inside or apply SPF 30+',
        'Continue work from shaded area',
        'Resume outdoor activities after 4 PM'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      isDismissed: false,
      useCaseData: {
        uvIndex: 8,
        vitaminDLimit: true
      }
    },
    {
      id: 'usecase-2',
      userId: 'mock-user-123',
      type: 'pdf_interpreter',
      title: 'B12 at Lowest End of Normal',
      description: 'The doctor says you\'re "fine," but your B12 is at the lowest end of "normal." For a high-performer, this is "failing."',
      urgencyLevel: 'medium',
      category: 'health',
      context: {
        time: '9:00 AM'
      },
      biologicalReason: 'B12 is critical for cognitive function. Low-normal levels impact focus and energy in high-stress jobs.',
      actionItems: [
        'I\'ve added a B12 supplement to your morning routine',
        'Take 1000mcg daily for the next 30 days',
        'Re-test in 4 weeks to verify improvement'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 2592000000), // 30 days
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      isDismissed: false,
      useCaseData: {
        biomarkerValues: {
          b12: { value: 200, unit: 'pg/mL', status: 'low-normal' },
          iron: { value: 45, unit: 'mcg/dL', status: 'low' }
        },
        clinicalSummary: 'B12 at 200 pg/mL (normal range: 200-900). Iron at 45 mcg/dL (low). Both need attention for optimal performance.'
      }
    },
    {
      id: 'usecase-3',
      userId: 'mock-user-123',
      type: 'voice_stress',
      title: 'High Stress Detected in Voice',
      description: 'I\'ve drafted the email, but I noticed your voice frequency shows signs of high sympathetic nervous system arousal (stress).',
      urgencyLevel: 'medium',
      category: 'cognitive',
      context: {
        time: '3:45 PM'
      },
      biologicalReason: 'Stress impairs decision-making. Taking a moment to regulate will improve email quality.',
      actionItems: [
        'Do 2 minutes of "Box Breathing" now',
        'Wait before hitting send',
        'Review email after breathing exercise'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 1800000), // 30 min
      createdAt: new Date(Date.now() - 300000), // 5 min ago
      isDismissed: false,
      useCaseData: {
        stressLevel: 75,
        voiceFrequency: 180, // Hz - higher indicates stress
        recommendedAction: 'Box Breathing: 4s inhale, 4s hold, 4s exhale, 4s hold'
      }
    },
    {
      id: 'usecase-4',
      userId: 'mock-user-123',
      type: 'sleep_strategy',
      title: 'Low Deep Sleep - Avoid High-Stakes Decisions',
      description: 'Your Deep Sleep was only 40 minutes. Your "Risk Assessment" brain is offline today. Avoid any major Crypto trades or high-stakes financial decisions.',
      urgencyLevel: 'high',
      category: 'cognitive',
      context: {
        time: '8:00 AM'
      },
      biologicalReason: 'Deep sleep is critical for prefrontal cortex function. Without it, risk assessment and decision-making are impaired.',
      actionItems: [
        'Avoid major Crypto trades today',
        'I\'ve flagged your "Finance News" card as "Low Priority"',
        'Focus on routine tasks, defer complex decisions'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 86400000), // 24 hours
      createdAt: new Date(),
      isDismissed: false,
      useCaseData: {
        deepSleepMinutes: 40,
        cognitiveLoad: 'high',
        recommendedAvoidance: ['Crypto trades', 'High-stakes financial decisions', 'Complex negotiations']
      }
    },
    {
      id: 'usecase-5',
      userId: 'mock-user-123',
      type: 'longevity_tracker',
      title: 'Biological Age Improving',
      description: 'Great news. By fixing your Vitamin D and lowering your evening glucose, your "Bio-Age" score has dropped from 38 to 36.',
      urgencyLevel: 'low',
      category: 'health',
      context: {
        time: 'Monthly Review'
      },
      biologicalReason: 'Biological age reflects cellular health. Improvements show your interventions are working.',
      actionItems: [
        'Continue current supplement regimen',
        'Maintain evening glucose control',
        'Track progress monthly'
      ],
      dismissible: true,
      validUntil: new Date(Date.now() + 2592000000), // 30 days
      createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
      isDismissed: false,
      useCaseData: {
        biologicalAge: 36,
        chronologicalAge: 35,
        improvementFactors: ['Vitamin D optimization', 'Evening glucose control', 'Improved sleep quality']
      }
    }
  ]
}

// ============================================
// MEAL PLANNING DATA
// ============================================

/**
 * Get user's meal plan (weekly or monthly).
 * 
 * TODO (AI Integration):
 * - Generate meal plans using AI based on:
 *   - Uploaded lab results (iron, B12, vitamin D, etc.)
 *   - Health insights from document analysis
 *   - Biological profile (blood group, body type, allergies)
 *   - Health status rings (energy, stress, recovery)
 *   - User preferences and dietary restrictions
 *   - Location and seasonal availability
 * 
 * TODO (Backend Integration):
 * - Query: supabase.from('meal_plans')
 *   .select('*, days:meal_plan_days(*)')
 *   .eq('user_id', userId)
 *   .eq('type', 'weekly' | 'monthly')
 *   .order('start_date', { ascending: false })
 *   .limit(1)
 *   .single()
 * - Generate new plan when:
 *   - New lab results uploaded
 *   - Current plan expires
 *   - User requests regeneration
 */
export function getMockMealPlan(): MealPlan {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6) // End of week (Saturday)

  // Varied meal plans for each day of the week
  const weeklyMeals = [
    // Sunday
    {
      breakfast: [
        {
          id: 'breakfast-sun-1',
          name: 'Spinach & Egg Scramble',
          description: 'High in iron and protein',
          nutritionalInfo: {
            calories: 320,
            protein: 22,
            carbs: 8,
            fats: 22,
            fiber: 3,
            iron: 4.5,
            vitaminD: 0,
            b12: 1.2
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'High in iron (4.5mg) to address your low iron levels. Type O- metabolizes protein efficiently.',
          alternatives: ['Turkey and spinach omelet', 'Grilled chicken with leafy greens']
        }
      ],
      lunch: [
        {
          id: 'lunch-sun-1',
          name: 'Grilled Salmon Salad',
          description: 'Rich in omega-3 and B12',
          nutritionalInfo: {
            calories: 450,
            protein: 35,
            carbs: 15,
            fats: 28,
            fiber: 5,
            iron: 1.2,
            vitaminD: 600,
            b12: 4.5
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'High in B12 (4.5mcg) and Vitamin D (600 IU) to support your low-normal levels.',
          alternatives: ['Tuna salad', 'Chicken Caesar salad']
        }
      ],
      dinner: [
        {
          id: 'dinner-sun-1',
          name: 'Lean Beef with Broccoli',
          description: 'Iron-rich protein source',
          nutritionalInfo: {
            calories: 520,
            protein: 42,
            carbs: 20,
            fats: 26,
            fiber: 4,
            iron: 5.8,
            vitaminD: 0,
            b12: 2.8
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Excellent iron source (5.8mg) for Type O- blood group. High protein supports recovery.',
          alternatives: ['Grilled chicken with vegetables', 'Turkey meatballs']
        }
      ],
      snacks: [
        {
          id: 'snack-sun-1',
          name: 'Orange with Almonds',
          description: 'Vitamin C enhances iron absorption',
          nutritionalInfo: {
            calories: 180,
            protein: 6,
            carbs: 22,
            fats: 9,
            fiber: 5,
            iron: 0.8,
            vitaminD: 0,
            b12: 0
          },
          bloodGroupCompatible: true,
          allergySafe: false,
          reason: 'Vitamin C from orange enhances iron absorption from meals.',
          alternatives: ['Apple slices', 'Berries with Greek yogurt']
        }
      ],
      drinks: [
        { id: 'drink-sun-1', name: 'Orange Juice', timing: 'morning', reason: 'Vitamin C for iron absorption', amount: '250ml' },
        { id: 'drink-sun-2', name: 'Water with Lemon', timing: 'throughout-day', reason: 'Hydration and pH balance', amount: '2L' },
        { id: 'drink-sun-3', name: 'Green Tea', timing: 'afternoon', reason: 'Antioxidants, low caffeine', amount: '300ml' }
      ],
      notes: 'Focus on iron-rich foods today. Pair with vitamin C sources for better absorption.'
    },
    // Monday
    {
      breakfast: [
        {
          id: 'breakfast-mon-1',
          name: 'Turkey & Spinach Omelet',
          description: 'High protein, iron-rich',
          nutritionalInfo: {
            calories: 340,
            protein: 28,
            carbs: 6,
            fats: 24,
            fiber: 2,
            iron: 3.8,
            vitaminD: 0,
            b12: 1.5
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Turkey provides lean protein. Spinach adds iron. Perfect for Type O- metabolism.',
          alternatives: ['Chicken and kale scramble', 'Beef and egg bowl']
        }
      ],
      lunch: [
        {
          id: 'lunch-mon-1',
          name: 'Grilled Chicken Caesar Salad',
          description: 'High protein, low carb',
          nutritionalInfo: {
            calories: 420,
            protein: 38,
            carbs: 12,
            fats: 24,
            fiber: 3,
            iron: 2.1,
            vitaminD: 0,
            b12: 0.8
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'High protein supports Type O- metabolism. Low carbs prevent brain fog.',
          alternatives: ['Turkey wrap', 'Beef salad']
        }
      ],
      dinner: [
        {
          id: 'dinner-mon-1',
          name: 'Grilled Lamb Chops with Asparagus',
          description: 'Iron and B12 rich',
          nutritionalInfo: {
            calories: 580,
            protein: 45,
            carbs: 8,
            fats: 38,
            fiber: 3,
            iron: 4.2,
            vitaminD: 0,
            b12: 3.2
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Lamb is excellent for Type O-. High in iron and B12 for your needs.',
          alternatives: ['Beef steak with vegetables', 'Venison with greens']
        }
      ],
      snacks: [
        {
          id: 'snack-mon-1',
          name: 'Greek Yogurt with Berries',
          description: 'Protein and antioxidants',
          nutritionalInfo: {
            calories: 150,
            protein: 12,
            carbs: 18,
            fats: 4,
            fiber: 2,
            iron: 0.3,
            vitaminD: 0,
            b12: 0.5
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'High protein snack. Berries provide antioxidants.',
          alternatives: ['Cottage cheese with fruit', 'Protein shake']
        }
      ],
      drinks: [
        { id: 'drink-mon-1', name: 'Lemon Water', timing: 'morning', reason: 'Alkalizing, vitamin C', amount: '500ml' },
        { id: 'drink-mon-2', name: 'Water', timing: 'throughout-day', reason: 'Hydration', amount: '2.5L' },
        { id: 'drink-mon-3', name: 'Herbal Tea (Ginger)', timing: 'evening', reason: 'Digestive support', amount: '250ml' }
      ],
      notes: 'High protein day to support recovery and energy levels.'
    },
    // Tuesday
    {
      breakfast: [
        {
          id: 'breakfast-tue-1',
          name: 'Beef & Vegetable Scramble',
          description: 'Maximum iron and protein',
          nutritionalInfo: {
            calories: 380,
            protein: 32,
            carbs: 10,
            fats: 26,
            fiber: 3,
            iron: 5.2,
            vitaminD: 0,
            b12: 2.1
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Beef provides heme iron (most absorbable). Perfect for raising your iron levels.',
          alternatives: ['Venison hash', 'Bison and eggs']
        }
      ],
      lunch: [
        {
          id: 'lunch-tue-1',
          name: 'Tuna Salad with Mixed Greens',
          description: 'High B12 and omega-3',
          nutritionalInfo: {
            calories: 440,
            protein: 40,
            carbs: 14,
            fats: 22,
            fiber: 4,
            iron: 1.8,
            vitaminD: 200,
            b12: 5.2
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Tuna is rich in B12 (5.2mcg) - excellent for your low-normal levels.',
          alternatives: ['Salmon salad', 'Sardines on greens']
        }
      ],
      dinner: [
        {
          id: 'dinner-tue-1',
          name: 'Venison Steak with Kale',
          description: 'Lean protein, high iron',
          nutritionalInfo: {
            calories: 520,
            protein: 48,
            carbs: 12,
            fats: 28,
            fiber: 4,
            iron: 6.2,
            vitaminD: 0,
            b12: 3.8
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Venison is ideal for Type O-. Very high in iron (6.2mg) and B12.',
          alternatives: ['Beef steak', 'Bison with vegetables']
        }
      ],
      snacks: [
        {
          id: 'snack-tue-1',
          name: 'Apple with Turkey Slices',
          description: 'Protein + fiber',
          nutritionalInfo: {
            calories: 160,
            protein: 14,
            carbs: 20,
            fats: 3,
            fiber: 4,
            iron: 0.6,
            vitaminD: 0,
            b12: 0.4
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Balanced snack. Apple provides fiber and vitamin C.',
          alternatives: ['Pear with chicken', 'Berries with protein']
        }
      ],
      drinks: [
        { id: 'drink-tue-1', name: 'Orange Juice', timing: 'morning', reason: 'Vitamin C for iron', amount: '250ml' },
        { id: 'drink-tue-2', name: 'Water', timing: 'throughout-day', reason: 'Hydration', amount: '2L' },
        { id: 'drink-tue-3', name: 'Coconut Water', timing: 'post-workout', reason: 'Electrolytes', amount: '300ml' }
      ],
      notes: 'Iron-focused day. Pair all meals with vitamin C sources.'
    },
    // Wednesday
    {
      breakfast: [
        {
          id: 'breakfast-wed-1',
          name: 'Chicken & Kale Scramble',
          description: 'Protein and iron',
          nutritionalInfo: {
            calories: 350,
            protein: 30,
            carbs: 8,
            fats: 22,
            fiber: 3,
            iron: 3.2,
            vitaminD: 0,
            b12: 0.9
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Chicken provides lean protein. Kale adds iron and antioxidants.',
          alternatives: ['Turkey scramble', 'Beef and eggs']
        }
      ],
      lunch: [
        {
          id: 'lunch-wed-1',
          name: 'Beef & Quinoa Bowl',
          description: 'Complete protein, iron-rich',
          nutritionalInfo: {
            calories: 480,
            protein: 42,
            carbs: 32,
            fats: 18,
            fiber: 5,
            iron: 4.8,
            vitaminD: 0,
            b12: 2.5
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Beef provides heme iron. Quinoa adds plant-based protein.',
          alternatives: ['Beef and rice', 'Lamb bowl']
        }
      ],
      dinner: [
        {
          id: 'dinner-wed-1',
          name: 'Baked Cod with Spinach',
          description: 'High B12, low fat',
          nutritionalInfo: {
            calories: 380,
            protein: 38,
            carbs: 6,
            fats: 18,
            fiber: 3,
            iron: 2.1,
            vitaminD: 400,
            b12: 3.8
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Cod is rich in B12 (3.8mcg) and Vitamin D. Light dinner option.',
          alternatives: ['Salmon with greens', 'Tuna steak']
        }
      ],
      snacks: [
        {
          id: 'snack-wed-1',
          name: 'Mixed Nuts (No Peanuts)',
          description: 'Healthy fats, protein',
          nutritionalInfo: {
            calories: 200,
            protein: 8,
            carbs: 6,
            fats: 16,
            fiber: 3,
            iron: 1.2,
            vitaminD: 0,
            b12: 0
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Almonds and walnuts provide healthy fats. Avoid peanuts due to allergy.',
          alternatives: ['Almonds only', 'Pumpkin seeds']
        }
      ],
      drinks: [
        { id: 'drink-wed-1', name: 'Green Smoothie', timing: 'morning', reason: 'Antioxidants, vitamins', amount: '300ml' },
        { id: 'drink-wed-2', name: 'Water', timing: 'throughout-day', reason: 'Hydration', amount: '2L' },
        { id: 'drink-wed-3', name: 'Chamomile Tea', timing: 'evening', reason: 'Relaxation, sleep support', amount: '250ml' }
      ],
      notes: 'Balanced day with variety. Focus on B12 sources.'
    },
    // Thursday
    {
      breakfast: [
        {
          id: 'breakfast-thu-1',
          name: 'Bison Hash with Eggs',
          description: 'High iron, complete protein',
          nutritionalInfo: {
            calories: 400,
            protein: 35,
            carbs: 12,
            fats: 24,
            fiber: 2,
            iron: 5.8,
            vitaminD: 0,
            b12: 2.8
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Bison is excellent for Type O-. Very high in iron (5.8mg) and B12.',
          alternatives: ['Beef hash', 'Venison and eggs']
        }
      ],
      lunch: [
        {
          id: 'lunch-thu-1',
          name: 'Turkey Wrap with Vegetables',
          description: 'Lean protein, portable',
          nutritionalInfo: {
            calories: 420,
            protein: 36,
            carbs: 28,
            fats: 16,
            fiber: 4,
            iron: 2.8,
            vitaminD: 0,
            b12: 1.2
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Turkey provides lean protein. Good for on-the-go meals.',
          alternatives: ['Chicken wrap', 'Beef lettuce wraps']
        }
      ],
      dinner: [
        {
          id: 'dinner-thu-1',
          name: 'Grilled Beef Steak with Broccoli',
          description: 'Maximum iron and protein',
          nutritionalInfo: {
            calories: 560,
            protein: 48,
            carbs: 10,
            fats: 32,
            fiber: 4,
            iron: 6.5,
            vitaminD: 0,
            b12: 3.2
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Beef steak is the best iron source (6.5mg). Perfect for Type O- blood group.',
          alternatives: ['Lamb chops', 'Venison steak']
        }
      ],
      snacks: [
        {
          id: 'snack-thu-1',
          name: 'Hard-Boiled Eggs (2)',
          description: 'Quick protein',
          nutritionalInfo: {
            calories: 140,
            protein: 12,
            carbs: 1,
            fats: 10,
            fiber: 0,
            iron: 1.0,
            vitaminD: 80,
            b12: 0.6
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Quick, high-protein snack. Eggs provide B12 and some vitamin D.',
          alternatives: ['Protein shake', 'Greek yogurt']
        }
      ],
      drinks: [
        { id: 'drink-thu-1', name: 'Orange Juice', timing: 'morning', reason: 'Vitamin C', amount: '250ml' },
        { id: 'drink-thu-2', name: 'Water with Lemon', timing: 'throughout-day', reason: 'Hydration, pH', amount: '2.5L' },
        { id: 'drink-thu-3', name: 'Peppermint Tea', timing: 'afternoon', reason: 'Digestive aid', amount: '250ml' }
      ],
      notes: 'High iron day. Beef provides the most bioavailable iron.'
    },
    // Friday
    {
      breakfast: [
        {
          id: 'breakfast-fri-1',
          name: 'Salmon & Egg Scramble',
          description: 'B12 and omega-3',
          nutritionalInfo: {
            calories: 360,
            protein: 28,
            carbs: 4,
            fats: 26,
            fiber: 1,
            iron: 1.2,
            vitaminD: 800,
            b12: 4.2
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Salmon provides B12 (4.2mcg) and high Vitamin D (800 IU) for your needs.',
          alternatives: ['Tuna and eggs', 'Cod scramble']
        }
      ],
      lunch: [
        {
          id: 'lunch-fri-1',
          name: 'Chicken Caesar Salad',
          description: 'High protein, satisfying',
          nutritionalInfo: {
            calories: 430,
            protein: 40,
            carbs: 14,
            fats: 22,
            fiber: 3,
            iron: 2.0,
            vitaminD: 0,
            b12: 0.9
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'High protein supports Type O- metabolism. Low carbs prevent afternoon crash.',
          alternatives: ['Turkey salad', 'Beef salad']
        }
      ],
      dinner: [
        {
          id: 'dinner-fri-1',
          name: 'Lamb Chops with Asparagus',
          description: 'Iron and B12 rich',
          nutritionalInfo: {
            calories: 540,
            protein: 44,
            carbs: 8,
            fats: 36,
            fiber: 3,
            iron: 4.0,
            vitaminD: 0,
            b12: 3.0
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Lamb is ideal for Type O-. Rich in iron and B12.',
          alternatives: ['Beef with vegetables', 'Venison']
        }
      ],
      snacks: [
        {
          id: 'snack-fri-1',
          name: 'Berries with Greek Yogurt',
          description: 'Protein and antioxidants',
          nutritionalInfo: {
            calories: 170,
            protein: 14,
            carbs: 22,
            fats: 4,
            fiber: 4,
            iron: 0.5,
            vitaminD: 0,
            b12: 0.6
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'High protein snack. Berries provide antioxidants and vitamin C.',
          alternatives: ['Cottage cheese with fruit', 'Protein smoothie']
        }
      ],
      drinks: [
        { id: 'drink-fri-1', name: 'Green Tea', timing: 'morning', reason: 'Antioxidants, metabolism', amount: '300ml' },
        { id: 'drink-fri-2', name: 'Water', timing: 'throughout-day', reason: 'Hydration', amount: '2L' },
        { id: 'drink-fri-3', name: 'Herbal Tea', timing: 'evening', reason: 'Relaxation', amount: '250ml' }
      ],
      notes: 'B12 and Vitamin D focus. Fish provides both nutrients.'
    },
    // Saturday
    {
      breakfast: [
        {
          id: 'breakfast-sat-1',
          name: 'Beef & Vegetable Hash',
          description: 'High iron start',
          nutritionalInfo: {
            calories: 390,
            protein: 32,
            carbs: 18,
            fats: 22,
            fiber: 4,
            iron: 5.5,
            vitaminD: 0,
            b12: 2.4
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Beef hash provides maximum iron (5.5mg) to start the weekend strong.',
          alternatives: ['Venison hash', 'Bison and vegetables']
        }
      ],
      lunch: [
        {
          id: 'lunch-sat-1',
          name: 'Grilled Salmon with Quinoa',
          description: 'Complete nutrition',
          nutritionalInfo: {
            calories: 490,
            protein: 42,
            carbs: 30,
            fats: 20,
            fiber: 4,
            iron: 1.8,
            vitaminD: 700,
            b12: 4.8
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Salmon provides B12 (4.8mcg) and Vitamin D (700 IU). Quinoa adds complete protein.',
          alternatives: ['Tuna with rice', 'Cod with quinoa']
        }
      ],
      dinner: [
        {
          id: 'dinner-sat-1',
          name: 'Venison Steak with Kale',
          description: 'Lean, high iron',
          nutritionalInfo: {
            calories: 510,
            protein: 46,
            carbs: 10,
            fats: 28,
            fiber: 4,
            iron: 6.0,
            vitaminD: 0,
            b12: 3.6
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Venison is perfect for Type O-. Very high in iron (6.0mg) and B12.',
          alternatives: ['Beef steak', 'Lamb chops']
        }
      ],
      snacks: [
        {
          id: 'snack-sat-1',
          name: 'Apple with Almond Butter',
          description: 'Healthy fats, fiber',
          nutritionalInfo: {
            calories: 220,
            protein: 6,
            carbs: 24,
            fats: 14,
            fiber: 6,
            iron: 1.0,
            vitaminD: 0,
            b12: 0
          },
          bloodGroupCompatible: true,
          allergySafe: true,
          reason: 'Almond butter provides healthy fats. Apple adds fiber and vitamin C.',
          alternatives: ['Pear with almond butter', 'Banana with nuts']
        }
      ],
      drinks: [
        { id: 'drink-sat-1', name: 'Orange Juice', timing: 'morning', reason: 'Vitamin C', amount: '250ml' },
        { id: 'drink-sat-2', name: 'Water', timing: 'throughout-day', reason: 'Hydration', amount: '2L' },
        { id: 'drink-sat-3', name: 'Coconut Water', timing: 'afternoon', reason: 'Electrolytes', amount: '300ml' }
      ],
      notes: 'Weekend recovery focus. High protein and iron to support activity.'
    }
  ]

  // Generate 7 days with varied meals
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dayMeals = weeklyMeals[i]
    
    return {
      date,
      breakfast: dayMeals.breakfast,
      lunch: dayMeals.lunch,
      dinner: dayMeals.dinner,
      snacks: dayMeals.snacks,
      drinks: dayMeals.drinks,
      supplements: [
        {
          id: `supplement-${i}-1`,
          name: 'Vitamin D3',
          dosage: '2000 IU',
          timing: 'morning',
          reason: 'Your labs show low vitamin D. Take with breakfast for better absorption.'
        },
        {
          id: `supplement-${i}-2`,
          name: 'B12',
          dosage: '1000mcg',
          timing: 'morning',
          reason: 'B12 at low-normal levels. Supplementing will improve cognitive function.'
        },
        {
          id: `supplement-${i}-3`,
          name: 'Iron (with Vitamin C)',
          dosage: '18mg',
          timing: i % 2 === 0 ? 'morning' : 'afternoon',
          reason: 'To raise your iron from 45 mcg/dL. Take with vitamin C for better absorption.'
        },
        {
          id: `supplement-${i}-4`,
          name: 'Magnesium',
          dosage: '400mg',
          timing: 'evening',
          reason: 'Supports recovery and sleep quality. Take before bed.'
        }
      ],
      nutritionalTargets: {
        calories: 2200,
        protein: 150, // High protein for Type O-
        carbs: 180,
        fats: 90,
        iron: 18, // Target to raise from 45 mcg/dL
        vitaminD: 2000, // IU per day
        b12: 1000 // mcg per day
      },
      notes: dayMeals.notes
    }
  })

  return {
    id: 'meal-plan-1',
    userId: 'mock-user-123',
    type: 'weekly',
    startDate,
    endDate,
    days,
    basedOnLabs: ['doc-1'], // Blood test from Dec 2024
    basedOnInsights: ['insight-1', 'insight-2'], // Iron deficiency and Vitamin D insights
    createdAt: new Date(Date.now() - 86400000), // Yesterday
    updatedAt: new Date()
  }
}

// ============================================
// FOOD ANALYSIS DATA
// ============================================

/**
 * Analyze uploaded food/drink/supplement image.
 * 
 * TODO (AI Integration):
 * - Image recognition: Google Vision API, AWS Rekognition, or custom ML model
 * - Food identification and nutritional data extraction
 * - Cross-reference with:
 *   - User's allergies (from biological profile)
 *   - Blood group diet recommendations
 *   - Current lab results (iron, B12, vitamin D, etc.)
 *   - Health status rings
 * - Generate compatibility assessment
 * - Suggest alternatives if not optimal
 * 
 * TODO (Backend Integration):
 * - Upload image to Supabase Storage bucket 'food-scans'
 * - Call AI analysis Edge Function
 * - Store results in food_analyses table
 * - Return analysis results
 */
export function getMockFoodAnalysis(imageUrl: string, identifiedFood: string): FoodAnalysis {
  // Mock analysis - in real implementation, this would come from AI
  const isGood = identifiedFood.toLowerCase().includes('salmon') || 
                 identifiedFood.toLowerCase().includes('spinach') ||
                 identifiedFood.toLowerCase().includes('turkey')
  
  const hasAllergen = identifiedFood.toLowerCase().includes('peanut') ||
                      identifiedFood.toLowerCase().includes('shellfish')

  return {
    id: `food-analysis-${Date.now()}`,
    userId: 'mock-user-123',
    imageUrl,
    identifiedFood: {
      name: identifiedFood,
      category: identifiedFood.toLowerCase().includes('supplement') ? 'supplement' :
                identifiedFood.toLowerCase().includes('drink') ? 'drink' : 'food',
      confidence: 85
    },
    nutritionalInfo: isGood ? {
      calories: 350,
      protein: 28,
      carbs: 12,
      fats: 20,
      fiber: 3,
      iron: 3.5,
      vitaminD: 400,
      b12: 2.5
    } : {
      calories: 450,
      protein: 15,
      carbs: 65,
      fats: 18,
      fiber: 2
    },
    compatibility: hasAllergen ? 'not-recommended' : 
                   isGood ? 'good' : 'caution',
    compatibilityDetails: {
      allergyCheck: {
        safe: !hasAllergen,
        detectedAllergens: hasAllergen ? ['Peanuts'] : undefined,
        message: hasAllergen 
          ? 'Contains peanuts which you are allergic to. Avoid this item.'
          : 'No allergens detected. Safe for consumption.'
      },
      bloodGroupCheck: {
        compatible: true,
        message: 'Compatible with Type O- blood group. High protein content is optimal for your metabolism.'
      },
      labResultsCheck: {
        beneficial: isGood,
        relevantNutrients: isGood ? ['iron', 'b12', 'vitaminD'] : undefined,
        message: isGood
          ? 'Rich in iron, B12, and Vitamin D - all nutrients you need based on your recent labs.'
          : 'High in carbs which may cause brain fog for Type O-. Consider protein-rich alternatives.'
      },
      overallReason: hasAllergen
        ? 'This item contains peanuts which you are severely allergic to. Do not consume.'
        : isGood
        ? 'This is an excellent choice for you. It provides iron, B12, and Vitamin D that your labs show you need, and is compatible with your Type O- blood group.'
        : 'This is high in carbohydrates which can cause insulin spikes and mental fog for Type O- blood group. Consider a protein-rich alternative instead.'
    },
    recommendations: {
      action: hasAllergen ? 'avoid' : isGood ? 'consume' : 'consume-with-caution',
      reasoning: hasAllergen
        ? 'Contains allergens - do not consume'
        : isGood
        ? 'Excellent nutritional profile aligned with your health needs'
        : 'High carbs may impact focus. Better alternatives available.',
      alternatives: hasAllergen 
        ? ['Grilled chicken salad', 'Turkey wrap', 'Beef and vegetables']
        : isGood
        ? undefined
        : ['Grilled salmon', 'Lean beef with vegetables', 'Turkey and spinach'],
      timing: isGood ? 'Best consumed with breakfast or lunch for optimal nutrient absorption' : undefined
    },
    analyzedAt: new Date()
  }
}

