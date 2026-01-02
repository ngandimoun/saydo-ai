import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Motivational Message Data
 * Contextual data for generating personalized motivational messages
 */
export interface MotivationalMessageData {
  nextTask: {
    title: string;
    status: string;
    isToday: boolean;
  } | null;
  nextReminder: {
    title: string;
    reminderTime: Date;
    isToday: boolean;
  } | null;
  recentActivity: {
    tasksCompletedToday: number;
    voiceNotesToday: number;
    healthInsightsToday: number;
  };
  latestHealthRecommendation: {
    title: string;
    type: string;
    description?: string;
  } | null;
}

/**
 * Fetch motivational message data
 * Returns contextual data about what's happening right now in the user's Saydo life
 */
export async function fetchMotivationalMessageData(
  userId: string,
  supabase: SupabaseClient
): Promise<MotivationalMessageData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch all data in parallel
  const [
    nextTaskResult,
    nextReminderResult,
    tasksCompletedResult,
    voiceNotesResult,
    healthInsightsResult,
    healthRecommendationResult,
  ] = await Promise.all([
    // Next upcoming task (pending, not completed)
    supabase
      .from('tasks')
      .select('title, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single(),
    
    // Next reminder (upcoming or today)
    supabase
      .from('reminders')
      .select('title, reminder_time')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .eq('is_snoozed', false)
      .gte('reminder_time', today.toISOString())
      .order('reminder_time', { ascending: true })
      .limit(1)
      .single(),
    
    // Tasks completed today
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString()),
    
    // Voice notes today
    supabase
      .from('voice_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    
    // Health insights today
    supabase
      .from('health_insights')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('generated_at', today.toISOString())
      .lt('generated_at', tomorrow.toISOString()),
    
    // Latest health recommendation (active, not completed)
    supabase
      .from('health_recommendations')
      .select('title, type, description')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .or(`expires_at.is.null,expires_at.gte.${today.toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Process next task
  let nextTask = null;
  if (nextTaskResult.data) {
    const task = nextTaskResult.data;
    const taskDate = new Date(task.created_at);
    const isToday = taskDate >= today && taskDate < tomorrow;
    
    nextTask = {
      title: task.title,
      status: task.status,
      isToday,
    };
  }

  // Process next reminder
  let nextReminder = null;
  if (nextReminderResult.data) {
    const reminder = nextReminderResult.data;
    const reminderTime = new Date(reminder.reminder_time);
    const isToday = reminderTime >= today && reminderTime < tomorrow;
    
    nextReminder = {
      title: reminder.title,
      reminderTime,
      isToday,
    };
  }

  // Process latest health recommendation
  let latestHealthRecommendation = null;
  if (healthRecommendationResult.data) {
    latestHealthRecommendation = {
      title: healthRecommendationResult.data.title,
      type: healthRecommendationResult.data.type,
      description: healthRecommendationResult.data.description || undefined,
    };
  }

  return {
    nextTask,
    nextReminder,
    recentActivity: {
      tasksCompletedToday: tasksCompletedResult.count || 0,
      voiceNotesToday: voiceNotesResult.count || 0,
      healthInsightsToday: healthInsightsResult.count || 0,
    },
    latestHealthRecommendation,
  };
}

