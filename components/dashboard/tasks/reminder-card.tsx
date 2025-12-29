"use client"

import { useState } from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Clock, Check, Bell, RotateCcw, CheckCircle2, List, Tag as TagIcon, AlertCircle, Calendar, X } from "lucide-react"
import type { Reminder } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { getPriorityLabel, getTypeLabel, type Language } from "@/lib/dashboard/label-translations"
import { useProfile } from "@/hooks/queries"
import { formatSmartDateTime } from "@/lib/dashboard/time-utils"
import { isReminderOverdue, getReminderDaysOverdue } from "@/lib/dashboard/task-sorting"
import { CompletionDialog } from "./completion-dialog"
import { RescheduleDialog } from "./reschedule-dialog"
import { createClient } from "@/lib/supabase"

/**
 * Reminder Card
 * 
 * Enhanced time-based reminder with:
 * - Smart time display (relative and absolute)
 * - Priority badges with color coding
 * - Type badges (task/todo/reminder)
 * - AI-generated tags
 * - Complete and snooze actions
 * - Recurring indicator
 */

interface ReminderCardProps {
  reminder: Reminder
  onComplete: () => void
  onSnooze: () => void
  onReschedule?: (reminderId: string, reminderTime: string) => void
  onDismiss?: (reminderId: string) => void
  delay?: number
}

// Priority color configuration
const priorityConfig: Record<string, { badge: string; border: string; bg: string; dot: string }> = {
  urgent: {
    badge: 'bg-red-500 text-white',
    border: 'border-l-4 border-red-500',
    bg: 'bg-red-500/10',
    dot: 'bg-red-500'
  },
  high: {
    badge: 'bg-amber-500 text-white',
    border: 'border-l-4 border-amber-500',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500'
  },
  medium: {
    badge: 'bg-blue-500 text-white',
    border: 'border-l-4 border-blue-500',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500'
  },
  low: {
    badge: 'bg-gray-400 text-white',
    border: 'border-l-2 border-gray-300',
    bg: 'bg-transparent',
    dot: 'bg-gray-400'
  }
}

// Type badge configuration
const typeConfig: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  task: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border border-blue-500/30',
    icon: CheckCircle2
  },
  todo: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border border-purple-500/30',
    icon: List
  },
  reminder: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border border-orange-500/30',
    icon: Bell
  }
}

// Tag color mapping - supports multiple languages
const getTagColor = (tag: string): string => {
  const lowerTag = tag.toLowerCase()
  
  // Health-related tags (multiple languages)
  const healthKeywords = [
    'health', 'salud', 'santé', 'gesundheit', 'saúde', 'salute', 'здоровье', '건강', 'स्वास्थ्य',
    'hospital', 'hôpital', 'krankenhaus', 'hospital', 'ospedale', 'больница', '병원', 'अस्पताल',
    'appointment', 'cita', 'rendez-vous', 'termin', 'consulta', 'appuntamento', 'встреча', '예약', 'नियुक्ति',
    'doctor', 'médico', 'médecin', 'arzt', 'doutor', 'dottore', 'врач', '의사', 'डॉक्टर',
    'medicina', 'medicament', 'medikament', 'medicamento', 'medicina', 'лекарство', '약', 'दवा'
  ]
  
  // Work-related tags (multiple languages)
  const workKeywords = [
    'work', 'trabajo', 'travail', 'arbeit', 'trabalho', 'lavoro', 'работа', '일', 'काम',
    'meeting', 'reunión', 'réunion', 'besprechung', 'reunião', 'riunione', 'встреча', '회의', 'बैठक',
    'office', 'oficina', 'bureau', 'büro', 'escritório', 'ufficio', 'офис', '사무실', 'कार्यालय',
    'patient', 'paciente', 'patient', 'patient', 'paciente', 'paziente', 'пациент', '환자', 'रोगी'
  ]
  
  // Personal tags (multiple languages)
  const personalKeywords = [
    'personal', 'personal', 'personnel', 'persönlich', 'pessoal', 'personale', 'личный', '개인', 'व्यक्तिगत',
    'shopping', 'compras', 'achats', 'einkaufen', 'compras', 'shopping', 'покупки', '쇼핑', 'खरीदारी'
  ]
  
  // Urgent tags (multiple languages)
  const urgentKeywords = [
    'urgent', 'urgente', 'urgent', 'dringend', 'urgente', 'urgente', 'срочно', '긴급', 'जरूरी',
    'emergency', 'emergencia', 'urgence', 'notfall', 'emergência', 'emergenza', 'чрезвычайная ситуация', '응급', 'आपातकाल'
  ]
  
  // Medication tags (multiple languages)
  const medicationKeywords = [
    'medication', 'medicina', 'médicament', 'medikament', 'medicamento', 'medicina', 'лекарство', '약물', 'दवा',
    'pills', 'pastillas', 'pilules', 'pillen', 'pílulas', 'pillole', 'таблетки', '알약', 'गोलियां'
  ]
  
  if (healthKeywords.some(keyword => lowerTag.includes(keyword))) {
    return 'bg-rose-500/20 text-rose-400'
  }
  if (workKeywords.some(keyword => lowerTag.includes(keyword))) {
    return 'bg-teal-500/20 text-teal-400'
  }
  if (personalKeywords.some(keyword => lowerTag.includes(keyword))) {
    return 'bg-indigo-500/20 text-indigo-400'
  }
  if (urgentKeywords.some(keyword => lowerTag.includes(keyword))) {
    return 'bg-red-500/20 text-red-400'
  }
  if (medicationKeywords.some(keyword => lowerTag.includes(keyword))) {
    return 'bg-purple-500/20 text-purple-400'
  }
  return 'bg-gray-500/20 text-gray-400'
}

export function ReminderCard({ reminder, onComplete, onSnooze, onReschedule, onDismiss, delay = 0 }: ReminderCardProps) {
  const { data: userProfile } = useProfile()
  const userLanguage = (userProfile?.language || 'en') as Language
  
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  
  const priority = reminder.priority || 'medium'
  const type = reminder.type || 'reminder'
  const tags = reminder.tags || []
  const isOverdue = isReminderOverdue(reminder)
  const daysOverdue = getReminderDaysOverdue(reminder)
  
  const priorityStyle = priorityConfig[priority] || priorityConfig.medium
  const typeStyle = typeConfig[type] || typeConfig.reminder
  const TypeIcon = typeStyle.icon
  
  // Get translated labels
  const priorityLabel = getPriorityLabel(priority as 'urgent' | 'high' | 'medium' | 'low', userLanguage)
  const typeLabel = getTypeLabel(type as 'task' | 'todo' | 'reminder', userLanguage)

  // Format time with smart relative display
  const timeDisplay = formatSmartDateTime(reminder.reminderTime, undefined, userLanguage)
  const isDueSoon = timeDisplay?.urgent || (priority === 'urgent')

  // Swipe gesture handling
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0])
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95])

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      // Swipe right - complete
      handleComplete()
    } else if (info.offset.x < -threshold) {
      // Swipe left - show reschedule
      setShowRescheduleDialog(true)
    }
    x.set(0)
  }

  const handleComplete = () => {
    if (reminder.isCompleted) return
    setShowCompletionDialog(true)
  }

  const handleConfirmComplete = async () => {
    setIsCompleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: true })
        .eq('id', reminder.id)

      if (!error) {
        onComplete()
      }
    } catch (error) {
      console.error('Failed to complete reminder:', error)
    } finally {
      setIsCompleting(false)
      setShowCompletionDialog(false)
    }
  }

  const handleReschedule = async (date: string, time?: string) => {
    try {
      // Construct ISO datetime string from separate date and time
      const dateTime = new Date(`${date}T${time || '09:00'}`)
      // Validate the date before sending
      if (isNaN(dateTime.getTime())) {
        console.error('Invalid date/time combination:', { date, time })
        return
      }
      const reminderTime = dateTime.toISOString()
      
      const supabase = createClient()
      const { error } = await supabase
        .from('reminders')
        .update({ 
          reminder_time: reminderTime,
          is_snoozed: false,
          snooze_until: null
        })
        .eq('id', reminder.id)

      if (!error && onReschedule) {
        onReschedule(reminder.id, reminderTime)
      }
    } catch (error) {
      console.error('Failed to reschedule reminder:', error)
    }
    setShowRescheduleDialog(false)
  }

  const handleDismiss = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: true })
        .eq('id', reminder.id)

      if (!error && onDismiss) {
        onDismiss(reminder.id)
      }
    } catch (error) {
      console.error('Failed to dismiss reminder:', error)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isCompleting ? 0.5 : 1, x: 0, scale }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ delay, duration: 0.2 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className={cn(
          "saydo-card p-3 flex flex-col gap-2",
          priorityStyle.bg,
          priorityStyle.border,
          isDueSoon && !reminder.isCompleted && "animate-pulse",
          isOverdue && !reminder.isCompleted && "border-l-4 border-red-500 bg-red-500/5"
        )}
      >
      {/* Header with Type and Priority */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Type Badge */}
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            typeStyle.bg,
            typeStyle.text,
            typeStyle.border
          )}>
            <TypeIcon size={10} />
            <span>{typeLabel}</span>
          </div>
        </div>
        
        {/* Priority Badge */}
        <div className={cn(
          "px-2 py-0.5 rounded-full text-xs font-semibold",
          priorityStyle.badge
        )}>
          {priorityLabel}
        </div>
      </div>

      {/* Content Row */}
      <div className="flex items-start gap-3">
        {/* Priority Dot */}
        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", priorityStyle.dot)} />
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-foreground text-sm">
              {reminder.title}
            </h4>
            
            {/* Overdue badge */}
            {isOverdue && !reminder.isCompleted && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500 text-white flex items-center gap-1">
                <AlertCircle size={10} />
                {daysOverdue !== null && daysOverdue > 0 
                  ? `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`
                  : 'Overdue'}
              </span>
            )}
          </div>
          {reminder.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {reminder.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {tags.slice(0, 4).map((tag, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    getTagColor(tag)
                  )}
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Meta Row */}
          <div className="flex items-center gap-3 mt-2">
            {/* Time Display */}
            {timeDisplay && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", timeDisplay.color)}>
                <Clock size={10} />
                <span>{timeDisplay.text}</span>
              </div>
            )}

            {/* Recurring Indicator */}
            {reminder.isRecurring && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RotateCcw size={10} />
                <span>{reminder.recurrencePattern || 'Recurring'}</span>
              </div>
            )}

            {/* Voice Indicator */}
            {reminder.sourceRecordingId && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>from voice</span>
              </div>
            )}
          </div>

          {/* Quick actions for overdue reminders */}
          {isOverdue && !reminder.isCompleted && (
            <div className="flex items-center gap-1.5 mt-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleComplete}
                className="px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 text-xs font-medium flex items-center gap-1"
              >
                <Check size={12} />
                Done
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowRescheduleDialog(true)}
                className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs font-medium flex items-center gap-1"
              >
                <Calendar size={12} />
                Reschedule
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDismiss}
                className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-medium flex items-center gap-1"
              >
                <X size={12} />
                Dismiss
              </motion.button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSnooze}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
            aria-label="Snooze"
          >
            <Bell size={14} className="text-muted-foreground" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleComplete}
            className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600"
            aria-label="Mark as done"
          >
            <Check size={14} className="text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>

    {/* Dialogs */}
    <CompletionDialog
      isOpen={showCompletionDialog}
      onClose={() => setShowCompletionDialog(false)}
      onConfirm={handleConfirmComplete}
      onReschedule={() => {
        setShowCompletionDialog(false)
        setShowRescheduleDialog(true)
      }}
      item={reminder}
      type="reminder"
    />

    <RescheduleDialog
      isOpen={showRescheduleDialog}
      onClose={() => setShowRescheduleDialog(false)}
      onConfirm={handleReschedule}
      item={reminder}
      type="reminder"
    />
    </>
  )
}
