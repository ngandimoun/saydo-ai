/**
 * Pattern Analysis API Endpoint
 * 
 * Analyzes all user tasks/reminders to update pattern frequencies and clean up old patterns.
 * Can be called periodically (e.g., via cron job) or on-demand.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  analyzeTaskPatterns,
  analyzeReminderPatterns,
  analyzeTimingPatterns,
  analyzeCategoryPatterns,
  analyzePriorityPatterns,
  analyzeTagPatterns,
  analyzeCompletionPatterns,
  analyzeRecurringPatterns,
  calculatePatternConfidence,
} from "@/lib/mastra/pattern-learning";
import { savePattern, getUserPatterns } from "@/lib/mastra/pattern-storage";
import type { Task, Reminder } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    // Verify user can only analyze their own patterns
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch all tasks and reminders
    const [tasksResult, remindersResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (tasksResult.error) {
      console.error("[analyze] Tasks fetch error", tasksResult.error);
      return NextResponse.json(
        { success: false, error: tasksResult.error.message },
        { status: 500 }
      );
    }

    if (remindersResult.error) {
      console.error("[analyze] Reminders fetch error", remindersResult.error);
      return NextResponse.json(
        { success: false, error: remindersResult.error.message },
        { status: 500 }
      );
    }

    const tasks = (tasksResult.data || []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      dueDate: t.due_date ? new Date(t.due_date) : undefined,
      dueTime: t.due_time,
      category: t.category,
      tags: t.tags || [],
      sourceRecordingId: t.source_recording_id,
      createdAt: new Date(t.created_at),
      completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
    })) as Task[];

    const reminders = (remindersResult.data || []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      description: r.description,
      reminderTime: new Date(r.reminder_time),
      isRecurring: r.is_recurring,
      recurrencePattern: r.recurrence_pattern,
      isCompleted: r.is_completed,
      isSnoozed: r.is_snoozed,
      snoozeUntil: r.snooze_until ? new Date(r.snooze_until) : undefined,
      tags: r.tags || [],
      priority: r.priority,
      type: r.type,
      sourceRecordingId: r.source_recording_id,
      createdAt: new Date(r.created_at),
    })) as Reminder[];

    // Analyze patterns
    const patternsLearned: string[] = [];

    // Timing patterns
    const allItems = [
      ...tasks.map((t) => ({
        createdAt: t.createdAt,
        dueDate: t.dueDate,
        dueTime: t.dueTime,
        completedAt: t.completedAt,
      })),
      ...reminders.map((r) => ({
        createdAt: r.createdAt,
        dueDate: r.reminderTime,
        dueTime: undefined,
        completedAt: r.isCompleted ? r.reminderTime : undefined,
      })),
    ];
    const timingPattern = analyzeTimingPatterns(allItems);
    await savePattern(userId, "timing", timingPattern);
    patternsLearned.push("timing");

    // Category patterns
    const categoryItems = [
      ...tasks.map((t) => ({
        category: t.category,
        tags: t.tags,
        priority: t.priority,
      })),
    ];
    if (categoryItems.length > 0) {
      const categoryPattern = analyzeCategoryPatterns(categoryItems);
      await savePattern(userId, "category", categoryPattern);
      patternsLearned.push("category");
    }

    // Priority patterns
    const priorityItems = [
      ...tasks.map((t) => ({
        priority: t.priority,
        category: t.category,
      })),
      ...reminders.map((r) => ({
        priority: r.priority || "medium",
        category: undefined,
      })),
    ];
    if (priorityItems.length > 0) {
      const priorityPattern = analyzePriorityPatterns(priorityItems);
      await savePattern(userId, "priority", priorityPattern);
      patternsLearned.push("priority");
    }

    // Tag patterns
    const tagItems = [
      ...tasks.map((t) => ({
        tags: t.tags,
        category: t.category,
        priority: t.priority,
      })),
      ...reminders.map((r) => ({
        tags: r.tags || [],
        category: undefined,
        priority: r.priority || "medium",
      })),
    ];
    if (tagItems.length > 0) {
      const tagPattern = analyzeTagPatterns(tagItems);
      await savePattern(userId, "tags", tagPattern);
      patternsLearned.push("tags");
    }

    // Completion patterns
    const completionItems = [
      ...tasks.map((t) => ({
        category: t.category,
        priority: t.priority,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        dueDate: t.dueDate,
      })),
    ];
    if (completionItems.length > 0) {
      const completionPattern = analyzeCompletionPatterns(completionItems);
      await savePattern(userId, "completion", completionPattern);
      patternsLearned.push("completion");
    }

    // Recurring patterns
    const recurringItems = reminders
      .filter((r) => r.isRecurring)
      .map((r) => ({
        title: r.title,
        isRecurring: r.isRecurring,
        recurrencePattern: r.recurrencePattern,
        reminderTime: r.reminderTime,
      }));
    if (recurringItems.length > 0) {
      const recurringPattern = analyzeRecurringPatterns(recurringItems);
      await savePattern(userId, "recurring", recurringPattern);
      patternsLearned.push("recurring");
    }

    // Update confidence scores for all patterns
    const allPatterns = await getUserPatterns(userId);
    for (const pattern of allPatterns) {
      const confidence = calculatePatternConfidence(
        pattern.pattern_data,
        pattern.frequency
      );
      if (confidence !== pattern.confidence_score) {
        await supabase
          .from("user_patterns")
          .update({ confidence_score: confidence })
          .eq("id", pattern.id);
      }
    }

    // Clean up old/low-confidence patterns (optional - keep for now)
    // Could add logic here to delete patterns with confidence < threshold and not seen in X days

    return NextResponse.json({
      success: true,
      patternsLearned,
      tasksAnalyzed: tasks.length,
      remindersAnalyzed: reminders.length,
      totalPatterns: allPatterns.length,
    });
  } catch (err) {
    console.error("[analyze] Exception", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to analyze patterns",
      },
      { status: 500 }
    );
  }
}



