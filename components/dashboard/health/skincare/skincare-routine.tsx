"use client"

import { motion } from "framer-motion"
import { Sun, Moon, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useSkincareRoutines, useLogRoutine, useGenerateRoutine } from "@/hooks/queries/use-skincare"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

/**
 * Skincare Routine Component
 * 
 * Displays AM/PM skincare routines with:
 * - Product ordering (cleanser → toner → serum → moisturizer → sunscreen)
 * - Routine completion tracking
 * - Product timing recommendations
 * - Routine streaks
 */

interface SkincareRoutineProps {
  className?: string
}

export function SkincareRoutine({ className }: SkincareRoutineProps) {
  const { data: routines, isLoading } = useSkincareRoutines()
  const logRoutine = useLogRoutine()
  const generateRoutine = useGenerateRoutine()

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-4", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const amRoutine = routines?.find(r => r.routine_type === 'am')
  const pmRoutine = routines?.find(r => r.routine_type === 'pm')

  const handleComplete = async (routineId: string, routineType: 'am' | 'pm') => {
    try {
      await logRoutine.mutateAsync({
        routineId,
        routineType,
        completedProducts: [], // Would be filled from UI
        notes: "Completed",
      })
      toast.success(`${routineType.toUpperCase()} routine completed! 🎉`)
    } catch (error) {
      toast.error("Failed to log routine")
    }
  }

  const RoutineCard = ({ routine, type }: { routine: any; type: 'am' | 'pm' }) => {
    const routineData = routine?.routine_data as any
    const products = routineData?.products || []
    const isCompleted = false // Would check from logs

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {type === 'am' ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500" />
          )}
          <h4 className="font-semibold">{type.toUpperCase()} Routine</h4>
        </div>

        {products.length > 0 ? (
          <div className="space-y-2">
            {products.map((product: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, ...springs.gentle }}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name || `Step ${index + 1}`}</p>
                  {product.type && (
                    <p className="text-xs text-muted-foreground">{product.type}</p>
                  )}
                </div>
                {product.waitTime && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{product.waitTime}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No {type.toUpperCase()} routine set up yet
          </p>
        )}

        {products.length > 0 && (
          <Button
            onClick={() => handleComplete(routine.id, type)}
            disabled={isCompleted}
            className="w-full rounded-full"
            variant={isCompleted ? "outline" : "default"}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Completed
              </>
            ) : (
              "Mark as Complete"
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card p-4", className)}
    >
      <h3 className="text-lg font-semibold mb-4">Skincare Routines</h3>

      <div className="space-y-6">
        {amRoutine && <RoutineCard routine={amRoutine} type="am" />}
        {pmRoutine && <RoutineCard routine={pmRoutine} type="pm" />}

        {!amRoutine && !pmRoutine && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Create your personalized skincare routine
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => {
                  generateRoutine.mutate(
                    { routineType: 'am' },
                    {
                      onSuccess: () => toast.success("AM routine generated!"),
                      onError: (error) => toast.error(error.message),
                    }
                  )
                }}
                disabled={generateRoutine.isPending}
                className="rounded-full"
              >
                {generateRoutine.isPending ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Sun size={16} className="mr-2" />
                )}
                Generate AM
              </Button>
              <Button 
                onClick={() => {
                  generateRoutine.mutate(
                    { routineType: 'pm' },
                    {
                      onSuccess: () => toast.success("PM routine generated!"),
                      onError: (error) => toast.error(error.message),
                    }
                  )
                }}
                disabled={generateRoutine.isPending}
                variant="outline"
                className="rounded-full"
              >
                {generateRoutine.isPending ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Moon size={16} className="mr-2" />
                )}
                Generate PM
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

