"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, Image, File, Check, Loader2, AlertTriangle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/**
 * Health Upload Modal
 * 
 * Unified upload for all health-related items:
 * - Food photos (meals, ingredients, labels)
 * - Drink images (beverages, labels, ingredients)
 * - Supplement photos (bottles, labels, ingredients)
 * - Medication images (prescriptions, pill bottles)
 * - Clinical documents (PDFs, blood tests, reports)
 * - Lab results (printed or handwritten)
 * 
 * The system automatically:
 * 1. Classifies the document type
 * 2. Routes to appropriate analysis
 * 3. Extracts relevant health data
 * 4. Checks for allergens and interactions
 * 5. Generates personalized insights
 */

interface HealthUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete?: (result: UploadResult) => void
}

type UploadState = 'idle' | 'uploading' | 'classifying' | 'analyzing' | 'success' | 'error'

interface SelectedFile {
  file: File
  preview?: string
  state: UploadState
  result?: UploadResult
  error?: string
}

interface UploadResult {
  documentId: string
  documentType: string
  classification?: {
    confidence: number
    detectedElements: string[]
    reasoning: string
  }
  analysis?: Record<string, unknown>
  healthImpact?: {
    score?: number
    benefits: string[]
    concerns: string[]
  }
  allergyWarnings: string[]
  interactionWarnings: string[]
  recommendations: string[]
  summary?: string
}

export function HealthUploadModal({ isOpen, onClose, onUploadComplete }: HealthUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentResult, setCurrentResult] = useState<UploadResult | null>(null)

  // Handle file selection - accept all file types except video
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const filesArray = Array.from(files)
    const rejectedVideos: string[] = []
    
    const newFiles: SelectedFile[] = filesArray
      .filter(file => {
        // Explicitly reject video files
        if (file.type.startsWith('video/')) {
          rejectedVideos.push(file.name)
          return false
        }
        return true
      })
      .map(file => ({
        file,
        preview: file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : undefined,
        state: 'idle' as UploadState
      }))

    // Show error message for rejected video files
    if (rejectedVideos.length > 0) {
      toast.error(
        `Video files are not supported${rejectedVideos.length === 1 ? `: ${rejectedVideos[0]}` : ` (${rejectedVideos.length} files)`}`
      )
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
  }, [])

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const updated = [...prev]
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!)
      }
      updated.splice(index, 1)
      return updated
    })
  }

  // Upload a single file
  const uploadFile = async (file: File, index: number): Promise<UploadResult | null> => {
    try {
      // Update state to uploading
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === index ? { ...f, state: 'uploading' } : f
      ))

      const formData = new FormData()
      formData.append('file', file)

      // Update to classifying
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === index ? { ...f, state: 'classifying' } : f
      ))

      const response = await fetch('/api/health/upload', {
        method: 'POST',
        body: formData,
      })

      // Update to analyzing
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === index ? { ...f, state: 'analyzing' } : f
      ))

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Update to success with result
      const result: UploadResult = {
        documentId: data.documentId,
        documentType: data.documentType,
        classification: data.classification,
        analysis: data.analysis,
        healthImpact: data.healthImpact,
        allergyWarnings: data.allergyWarnings || [],
        interactionWarnings: data.interactionWarnings || [],
        recommendations: data.recommendations || [],
        summary: data.summary,
      }

      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === index ? { ...f, state: 'success', result } : f
      ))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === index ? { ...f, state: 'error', error: errorMessage } : f
      ))

      return null
    }
  }

  // Handle upload of all files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    let lastResult: UploadResult | null = null

    for (let i = 0; i < selectedFiles.length; i++) {
      const result = await uploadFile(selectedFiles[i].file, i)
      if (result) {
        lastResult = result
        
        // Show allergy warnings immediately
        if (result.allergyWarnings.length > 0) {
          toast.warning(`⚠️ Allergy Alert: ${result.allergyWarnings.join(', ')}`, {
            duration: 5000,
          })
        }
      }
    }

    // Show summary toast
    const successCount = selectedFiles.filter(f => f.state === 'success').length
    const errorCount = selectedFiles.filter(f => f.state === 'error').length

    if (successCount > 0 && errorCount === 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} analyzed successfully!`)
    } else if (errorCount > 0) {
      toast.error(`${errorCount} file${errorCount > 1 ? 's' : ''} failed to process`)
    }

    // Set current result for display
    if (lastResult) {
      setCurrentResult(lastResult)
      onUploadComplete?.(lastResult)
    }

    setIsUploading(false)
  }

  // Get icon for file type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type === 'application/pdf') return FileText
    return File
  }

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      food_photo: '🍽️ Food',
      supplement: '💊 Supplement',
      drink: '🥤 Drink',
      lab_pdf: '🔬 Lab Results',
      lab_handwritten: '📝 Lab Notes',
      medication: '💉 Medication',
      clinical_report: '📋 Clinical Report',
      other: '📄 Document',
    }
    return labels[type] || '📄 Document'
  }

  // Handle close
  const handleClose = () => {
    if (isUploading) return
    // Clean up previews
    selectedFiles.forEach(sf => {
      if (sf.preview) URL.revokeObjectURL(sf.preview)
    })
    setSelectedFiles([])
    setCurrentResult(null)
    onClose()
  }

  // Reset to upload more
  const handleUploadMore = () => {
    selectedFiles.forEach(sf => {
      if (sf.preview) URL.revokeObjectURL(sf.preview)
    })
    setSelectedFiles([])
    setCurrentResult(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-4 z-50 max-w-lg mx-auto max-h-[80vh] overflow-y-auto"
          >
            <div className="bg-card rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
                <h3 className="font-semibold text-foreground">
                  {currentResult ? 'Analysis Complete' : 'Smart Health Upload'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="rounded-full"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Show results if available */}
                {currentResult ? (
                  <div className="space-y-4">
                    {/* Document type badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {getDocumentTypeLabel(currentResult.documentType)}
                      </span>
                      {currentResult.classification && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(currentResult.classification.confidence * 100)}% confident
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    {currentResult.summary && (
                      <div className="p-4 rounded-2xl bg-muted/50">
                        <p className="text-sm font-medium text-foreground">
                          {currentResult.summary}
                        </p>
                      </div>
                    )}

                    {/* Health Score */}
                    {currentResult.healthImpact?.score !== undefined && (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                          currentResult.healthImpact.score >= 70 
                            ? "bg-green-500/20 text-green-500"
                            : currentResult.healthImpact.score >= 40
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-red-500/20 text-red-500"
                        )}>
                          {currentResult.healthImpact.score}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Health Score</p>
                          <p className="text-xs text-muted-foreground">
                            Based on your profile
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Allergy Warnings */}
                    {currentResult.allergyWarnings.length > 0 && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={18} className="text-red-500" />
                          <span className="font-medium text-red-500">Allergy Alert</span>
                        </div>
                        <ul className="text-sm text-red-400 space-y-1">
                          {currentResult.allergyWarnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Benefits */}
                    {currentResult.healthImpact?.benefits && currentResult.healthImpact.benefits.length > 0 && (
                      <div className="p-4 rounded-2xl bg-green-500/10">
                        <p className="font-medium text-green-500 mb-2">Benefits</p>
                        <ul className="text-sm text-green-400 space-y-1">
                          {currentResult.healthImpact.benefits.slice(0, 3).map((benefit, i) => (
                            <li key={i}>✓ {benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns */}
                    {currentResult.healthImpact?.concerns && currentResult.healthImpact.concerns.length > 0 && (
                      <div className="p-4 rounded-2xl bg-yellow-500/10">
                        <p className="font-medium text-yellow-500 mb-2">Concerns</p>
                        <ul className="text-sm text-yellow-400 space-y-1">
                          {currentResult.healthImpact.concerns.slice(0, 3).map((concern, i) => (
                            <li key={i}>⚠ {concern}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {currentResult.recommendations.length > 0 && (
                      <div className="p-4 rounded-2xl bg-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className="text-primary" />
                          <span className="font-medium text-primary">Recommendations</span>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {currentResult.recommendations.slice(0, 3).map((rec, i) => (
                            <li key={i}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleUploadMore}
                        className="flex-1 rounded-full"
                      >
                        Upload More
                      </Button>
                      <Button
                        onClick={handleClose}
                        className="flex-1 rounded-full"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        handleFiles(e.dataTransfer.files)
                      }}
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-8 text-center transition-colors",
                        isDragging 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                      />
                      
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center">
                          <Upload size={24} className="text-rose-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Drop files here or tap to browse
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Food, drinks, supplements, medications, or lab results
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            AI will analyze if it's good for your health
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                        {selectedFiles.map((sf, index) => {
                          const Icon = getFileIcon(sf.file)
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl",
                                sf.state === 'error' 
                                  ? "bg-red-500/10" 
                                  : sf.state === 'success'
                                  ? "bg-green-500/10"
                                  : "bg-muted/50"
                              )}
                            >
                              {/* Preview or Icon */}
                              {sf.preview ? (
                                <img 
                                  src={sf.preview} 
                                  alt="" 
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                  <Icon size={18} className="text-rose-500" />
                                </div>
                              )}

                              {/* File info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {sf.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {sf.state === 'error' ? (
                                    <span className="text-red-400">{sf.error}</span>
                                  ) : sf.state === 'success' && sf.result ? (
                                    <span className="text-green-400">
                                      {getDocumentTypeLabel(sf.result.documentType)}
                                    </span>
                                  ) : sf.state === 'classifying' ? (
                                    "Classifying..."
                                  ) : sf.state === 'analyzing' ? (
                                    "Analyzing..."
                                  ) : sf.state === 'uploading' ? (
                                    "Uploading..."
                                  ) : (
                                    `${(sf.file.size / 1024).toFixed(1)} KB`
                                  )}
                                </p>
                              </div>

                              {/* Status */}
                              {sf.state === 'idle' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFile(index)}
                                  className="h-8 w-8 rounded-full"
                                >
                                  <X size={14} />
                                </Button>
                              )}
                              {(sf.state === 'uploading' || sf.state === 'classifying' || sf.state === 'analyzing') && (
                                <Loader2 size={18} className="text-primary animate-spin" />
                              )}
                              {sf.state === 'success' && (
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                              {sf.state === 'error' && (
                                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                  <X size={14} className="text-white" />
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    )}

                    {/* Upload Button */}
                    {selectedFiles.length > 0 && !selectedFiles.every(f => f.state === 'success' || f.state === 'error') && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                      >
                        <Button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="w-full rounded-full gap-2"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              Analyze {selectedFiles.filter(f => f.state === 'idle').length} file{selectedFiles.filter(f => f.state === 'idle').length > 1 ? 's' : ''}
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}

                    {/* Show results button if all files processed */}
                    {selectedFiles.length > 0 && selectedFiles.every(f => f.state === 'success' || f.state === 'error') && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex gap-2"
                      >
                        <Button
                          variant="outline"
                          onClick={handleUploadMore}
                          className="flex-1 rounded-full"
                        >
                          Upload More
                        </Button>
                        <Button
                          onClick={() => {
                            const successFile = selectedFiles.find(f => f.state === 'success' && f.result)
                            if (successFile?.result) {
                              setCurrentResult(successFile.result)
                            }
                          }}
                          className="flex-1 rounded-full"
                          disabled={!selectedFiles.some(f => f.state === 'success')}
                        >
                          View Results
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

