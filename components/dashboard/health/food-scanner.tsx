"use client"

import { useState, useRef } from "react"
import { Camera, Image, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Food Scanner Component
 * 
 * Quick access button for uploading food/drink/supplement images.
 * Can be used as:
 * - Floating action button (FAB)
 * - Header button
 * - Inline button
 * 
 * Features:
 * - Image upload from camera or gallery
 * - Instant AI analysis
 * - Shows compatibility feedback
 * 
 * TODO (Backend Integration):
 * - Upload image to Supabase Storage bucket 'food-scans'
 * - Call AI analysis Edge Function
 * - Store results in food_analyses table
 * - Return analysis results to parent component
 * 
 * TODO (AI Integration):
 * - Image recognition: Google Vision API, AWS Rekognition, or custom ML model
 * - Food identification and nutritional data extraction
 * - Cross-reference with user's health profile
 */

interface FoodScannerProps {
  onAnalysisComplete?: (analysis: any) => void
  variant?: 'fab' | 'button' | 'inline'
  className?: string
}

export function FoodScanner({ 
  onAnalysisComplete, 
  variant = 'fab',
  className 
}: FoodScannerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setIsUploading(true)

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)

      /**
       * TODO (Backend):
       * 
       * // Upload to Supabase Storage
       * const { data: uploadData, error: uploadError } = await supabase.storage
       *   .from('food-scans')
       *   .upload(`${userId}/${Date.now()}-${file.name}`, file)
       * 
       * if (uploadError) throw uploadError
       * 
       * // Get public URL
       * const { data: urlData } = supabase.storage
       *   .from('food-scans')
       *   .getPublicUrl(uploadData.path)
       * 
       * // Call AI analysis Edge Function
       * const { data: analysis, error: analysisError } = await supabase.functions.invoke(
       *   'analyze-food-image',
       *   {
       *     body: {
       *       imageUrl: urlData.publicUrl,
       *       userId: userId
       *     }
       *   }
       * )
       * 
       * if (analysisError) throw analysisError
       * 
       * // Store analysis in database
       * await supabase.from('food_analyses').insert({
       *   user_id: userId,
       *   image_url: urlData.publicUrl,
       *   analysis_result: analysis
       * })
       * 
       * // Return analysis to parent
       * if (onAnalysisComplete) {
       *   onAnalysisComplete(analysis)
       * }
       */

      // Mock analysis for now
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      
      const mockAnalysis = {
        id: `food-analysis-${Date.now()}`,
        imageUrl: previewUrl,
        identifiedFood: {
          name: 'Grilled Salmon',
          category: 'food',
          confidence: 85
        },
        compatibility: 'good' as const,
        compatibilityDetails: {
          overallReason: 'Excellent choice! High in B12 and Vitamin D.'
        }
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(mockAnalysis)
      }

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl)
    } catch (error) {
      console.error('Error analyzing food image:', error)
      alert('Failed to analyze image. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // FAB variant (floating action button)
  if (variant === 'fab') {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleClick}
          disabled={isUploading}
          className={cn(
            "fixed bottom-20 right-4 z-50",
            "w-14 h-14 rounded-full",
            "bg-primary text-primary-foreground",
            "shadow-lg hover:shadow-xl",
            "flex items-center justify-center",
            "transition-all hover:scale-110",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          aria-label="Scan food"
        >
          {isUploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Camera size={24} />
          )}
        </button>
      </>
    )
  }

  // Button variant
  if (variant === 'button') {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          onClick={handleClick}
          disabled={isUploading}
          size="sm"
          className={cn("gap-2", className)}
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Camera size={16} />
              Scan Food
            </>
          )}
        </Button>
      </>
    )
  }

  // Inline variant
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={isUploading}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-muted hover:bg-muted/80",
          "text-sm font-medium",
          "transition-colors",
          "disabled:opacity-50",
          className
        )}
      >
        {isUploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Image size={16} />
            Scan Food/Drink
          </>
        )}
      </button>
    </>
  )
}

