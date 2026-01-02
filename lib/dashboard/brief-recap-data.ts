import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Brief Recap Data
 * Minimal data for extremely short recap text
 */
export interface BriefRecapData {
  health: {
    foodRecommendations: Array<{
      title: string;
      type: string;
      description?: string;
    }>;
  };
  tasks: {
    latest: {
      title: string;
      status: string;
      isToday: boolean;
    } | null;
  };
  reminders: {
    next: {
      title: string;
      reminderTime: Date;
      isToday: boolean;
    } | null;
  };
  proLife: {
    tasksCompletedToday: number;
    voiceNotesToday: number;
  };
}

/**
 * Fetch brief recap data for today
 * Returns minimal data needed for extremely short recap
 */
export async function fetchBriefRecapData(
  userId: string,
  supabase: SupabaseClient
): Promise<BriefRecapData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch all data in parallel
  const [
    foodRecommendationsResult,
    tasksResult,
    remindersResult,
    tasksCompletedResult,
    voiceNotesResult,
  ] = await Promise.all([
    // Today's food recommendations (top 2)
    supabase
      .from('health_recommendations')
      .select('title, type, description')
      .eq('user_id', userId)
      .eq('type', 'food')
      .eq('is_completed', false)
      .or(`expires_at.is.null,expires_at.gte.${today.toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(2),
    
    // Latest task (pending or completed today)
    supabase
      .from('tasks')
      .select('title, status, completed_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
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
  ]);

  // Process food recommendations
  const foodRecommendations = (foodRecommendationsResult.data || []).map(rec => ({
    title: rec.title,
    type: rec.type,
    description: rec.description || undefined,
  }));

  // Process latest task
  let latestTask = null;
  if (tasksResult.data) {
    const task = tasksResult.data;
    const taskDate = task.completed_at 
      ? new Date(task.completed_at)
      : new Date(task.created_at);
    const isToday = taskDate >= today && taskDate < tomorrow;
    
    latestTask = {
      title: task.title,
      status: task.status,
      isToday,
    };
  }

  // Process next reminder
  let nextReminder = null;
  if (remindersResult.data) {
    const reminder = remindersResult.data;
    const reminderTime = new Date(reminder.reminder_time);
    const isToday = reminderTime >= today && reminderTime < tomorrow;
    
    nextReminder = {
      title: reminder.title,
      reminderTime,
      isToday,
    };
  }

  return {
    health: {
      foodRecommendations,
    },
    tasks: {
      latest: latestTask,
    },
    reminders: {
      next: nextReminder,
    },
    proLife: {
      tasksCompletedToday: tasksCompletedResult.count || 0,
      voiceNotesToday: voiceNotesResult.count || 0,
    },
  };
}

