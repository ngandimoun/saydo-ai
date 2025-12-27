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
  EndOfDaySummary
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
 * Get audio content for Calm Zone.
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
      audioUrl: '/mock/morning-boost.mp3',
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
      audioUrl: '/mock/sleep-journey.mp3',
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
      audioUrl: '/mock/focus-meditation.mp3',
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
      audioUrl: '/mock/stress-relief.mp3',
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
      audioUrl: '/mock/ocean-waves.mp3',
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
      audioUrl: '/mock/founders-mindset.mp3',
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

