"use client"

import { useState, useRef } from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Check, Circle, Clock, Tag, CheckCircle2, List, Bell, AlertCircle, Calendar, X } from "lucide-react"
import type { Task } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { getPriorityLabel, type Language } from "@/lib/dashboard/label-translations"
import { useProfile } from "@/hooks/queries"
import { formatSmartDateTime } from "@/lib/dashboard/time-utils"
import { isTaskOverdue, getDaysOverdue } from "@/lib/dashboard/task-sorting"
import { CompletionDialog } from "./completion-dialog"
import { RescheduleDialog } from "./reschedule-dialog"
import { createClient } from "@/lib/supabase"

/**
 * Task Card
 * 
 * Enhanced task item with:
 * - Checkbox for completion
 * - Priority indicator with color coding
 * - Type badge (task/todo/reminder)
 * - Due date/time with smart formatting
 * - AI-generated tags
 * - Source indicator if extracted from voice
 */

interface TaskCardProps {
  task: Task
  onToggle: () => void
  onReschedule?: (taskId: string, dueDate: string, dueTime?: string) => void
  onDismiss?: (taskId: string) => void
  delay?: number
}

// Priority colors
const priorityConfig: Record<string, { dot: string; bg: string; border: string; badge: string }> = {
  urgent: { 
    dot: 'bg-red-500', 
    bg: 'bg-red-500/10',
    border: 'border-l-4 border-red-500',
    badge: 'bg-red-500 text-white'
  },
  high: { 
    dot: 'bg-amber-500', 
    bg: 'bg-amber-500/10',
    border: 'border-l-4 border-amber-500',
    badge: 'bg-amber-500 text-white'
  },
  medium: { 
    dot: 'bg-blue-500', 
    bg: 'bg-blue-500/10',
    border: 'border-l-4 border-blue-500',
    badge: 'bg-blue-500 text-white'
  },
  low: { 
    dot: 'bg-gray-400', 
    bg: 'bg-transparent',
    border: 'border-l-2 border-gray-300',
    badge: 'bg-gray-400 text-white'
  }
}

// Type badge configuration (for tasks that might have type)
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

export function TaskCard({ task, onToggle, onReschedule, onDismiss, delay = 0 }: TaskCardProps) {
  const { data: userProfile } = useProfile()
  const userLanguage = (userProfile?.language || 'en') as Language
  
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  
  const isCompleted = task.status === 'completed'
  const priority = priorityConfig[task.priority] || priorityConfig.low
  const tags = task.tags || []
  const isOverdue = isTaskOverdue(task)
  const daysOverdue = getDaysOverdue(task)
  
  // Get translated priority label
  const priorityLabel = getPriorityLabel(task.priority, userLanguage)

  // Format due date with smart relative display
  const dueDateDisplay = formatSmartDateTime(
    task.dueDate,
    task.dueTime,
    userLanguage
  )

  const isUrgent = task.priority === 'urgent' && !isCompleted || dueDateDisplay?.urgent

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
    if (isCompleted) return
    setShowCompletionDialog(true)
  }

  const handleConfirmComplete = async () => {
    setIsCompleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (!error) {
        onToggle()
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    } finally {
      setIsCompleting(false)
      setShowCompletionDialog(false)
    }
  }

  const handleReschedule = async (dueDate: string, dueTime?: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ 
          due_date: dueDate,
          due_time: dueTime || null
        })
        .eq('id', task.id)

      if (!error && onReschedule) {
        onReschedule(task.id, dueDate, dueTime)
      }
    } catch (error) {
      console.error('Failed to reschedule task:', error)
    }
    setShowRescheduleDialog(false)
  }

  const handleDismiss = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', task.id)

      if (!error && onDismiss) {
        onDismiss(task.id)
      }
    } catch (error) {
      console.error('Failed to dismiss task:', error)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isCompleting ? 0.5 : 1, x: 0, scale }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ delay, duration: 0.2 }}
        whileTap={{ scale: 0.98 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className={cn(
          "saydo-card p-3 flex items-start gap-3 relative",
          priority.bg,
          priority.border,
          isCompleted && "opacity-60",
          isUrgent && !isCompleted && "animate-pulse",
          isOverdue && !isCompleted && "border-l-4 border-red-500 bg-red-500/5"
        )}
      >
      {/* Checkbox */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
          isCompleted 
            ? "bg-green-500 text-white" 
            : "border-2 border-border hover:border-primary"
        )}
      >
        {isCompleted && <Check size={14} strokeWidth={3} />}
      </motion.button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row with priority dot */}
        <div className="flex items-start gap-2">
          {/* Priority dot */}
          <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", priority.dot)} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-medium text-sm",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>
              
              {/* Overdue badge */}
              {isOverdue && !isCompleted && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500 text-white flex items-center gap-1">
                  <AlertCircle size={10} />
                  {daysOverdue !== null && daysOverdue > 0 
                    ? `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`
                    : 'Overdue'}
                </span>
              )}
            </div>
          </div>

          {/* Priority Badge (for urgent/high) */}
          {(task.priority === 'urgent' || task.priority === 'high') && !isCompleted && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0",
              priority.badge
            )}>
              {priorityLabel}
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 ml-4">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 ml-4 flex-wrap">
            {tags.slice(0, 3).map((tag, idx) => (
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
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 ml-4">
          {/* Due date - made more prominent */}
          {dueDateDisplay && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Clock size={12} className={cn(
                dueDateDisplay.color,
                "text-muted-foreground"
              )} />
              <span className={cn(dueDateDisplay.color)}>
                {dueDateDisplay.text}
              </span>
            </div>
          )}

          {/* Category */}
          {task.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
              {task.category}
            </span>
          )}

          {/* Voice indicator */}
          {task.sourceRecordingId && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>from voice</span>
            </div>
          )}
        </div>

        {/* Quick actions for overdue tasks */}
        {isOverdue && !isCompleted && (
          <div className="flex items-center gap-1.5 mt-2 ml-4">
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
      item={task}
      type="task"
    />

    <RescheduleDialog
      isOpen={showRescheduleDialog}
      onClose={() => setShowRescheduleDialog(false)}
      onConfirm={handleReschedule}
      item={task}
      type="task"
    />
    </>
  )
}
