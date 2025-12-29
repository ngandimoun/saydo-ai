"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, Image, File, Check, Loader2, Sheet, Presentation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import type { WorkFileType } from "@/lib/dashboard/types"

/**
 * Work File Upload Modal
 * 
 * Allows uploading work-related files:
 * - PDFs
 * - Images (excluding video)
 * - Documents (Word, etc.)
 * - Spreadsheets (Excel, etc.)
 * - Presentations (PowerPoint, etc.)
 * 
 * Excludes video files as per requirements.
 */

interface WorkFileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface SelectedFile {
  file: File
  preview?: string
  state: UploadState
  error?: string
}

// Accepted file types (excluding video)
const acceptedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]

// Helper to detect file type from MIME type and extension
function detectFileType(file: File): WorkFileType {
  const mimeType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf'
  }
  
  if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(fileName)) {
    return 'image'
  }
  
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.csv')
  ) {
    return 'spreadsheet'
  }
  
  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    fileName.endsWith('.ppt') ||
    fileName.endsWith('.pptx')
  ) {
    return 'presentation'
  }
  
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.txt')
  ) {
    return 'document'
  }
  
  return 'other'
}

export function WorkFileUploadModal({ isOpen, onClose, onUploadComplete }: WorkFileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const newFiles: SelectedFile[] = Array.from(files)
      .filter(file => {
        // Explicitly reject video files
        if (file.type.startsWith('video/')) {
          toast.error(`Video files are not supported: ${file.name}`)
          return false
        }
        
        // Check if file type is accepted
        const isAccepted = acceptedTypes.includes(file.type) || 
          acceptedTypes.some(type => file.name.toLowerCase().endsWith(type.split('/')[1] || ''))
        
        if (!isAccepted) {
          // Check by extension for files without proper MIME type
          const ext = file.name.split('.').pop()?.toLowerCase()
          const acceptedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 
            'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']
          
          if (!ext || !acceptedExtensions.includes(ext)) {
            toast.error(`File type not supported: ${file.name}`)
            return false
          }
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

    if (newFiles.length === 0) {
      return
    }

    setSelectedFiles(prev => [...prev, ...newFiles])
    
    if (newFiles.length < Array.from(files).length) {
      toast.info(`Added ${newFiles.length} file(s). Some files were filtered out.`)
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

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      toast.error("You must be logged in to upload files")
      setIsUploading(false)
      return
    }

    let successCount = 0
    let errorCount = 0

    // Upload each file
    for (let i = 0; i < selectedFiles.length; i++) {
      const sf = selectedFiles[i]
      
      try {
        // Update state to uploading
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, state: 'uploading' } : f
        ))

        // Detect file type
        const fileType = detectFileType(sf.file)
        
        // Sanitize filename
        const sanitizedFileName = sf.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const timestamp = Date.now()
        const filePath = `${user.id}/${timestamp}-${sanitizedFileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('work-files')
          .upload(filePath, sf.file, {
            contentType: sf.file.type,
            upsert: false,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('work-files')
          .getPublicUrl(filePath)

        // Update state to processing
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, state: 'processing' } : f
        ))

        // Create database record
        const { data: dbData, error: dbError } = await supabase
          .from('work_files')
          .insert({
            user_id: user.id,
            file_name: sf.file.name,
            file_type: fileType,
            file_url: publicUrl,
            file_size: sf.file.size,
            status: 'ready',
            uploaded_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (dbError) {
          throw new Error(dbError.message)
        }

        // Update state to success
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, state: 'success' } : f
        ))

        successCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Update state to error
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, state: 'error', error: errorMessage } : f
        ))

        errorCount++
        toast.error(`Failed to upload ${sf.file.name}: ${errorMessage}`)
      }
    }

    // Wait a moment to show success states
    await new Promise(resolve => setTimeout(resolve, 500))

    // Show summary
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`)
      onUploadComplete()
    }

    if (errorCount > 0 && successCount === 0) {
      // All failed
      setIsUploading(false)
      return
    }

    // Close modal if at least one succeeded
    if (successCount > 0) {
      // Clean up previews
      selectedFiles.forEach(sf => {
        if (sf.preview) URL.revokeObjectURL(sf.preview)
      })
      setSelectedFiles([])
      setIsUploading(false)
      onClose()
    } else {
      setIsUploading(false)
    }
  }

  // Get icon for file type
  const getFileIcon = (file: File) => {
    const fileType = detectFileType(file)
    switch (fileType) {
      case 'pdf': return FileText
      case 'image': return Image
      case 'spreadsheet': return Sheet
      case 'presentation': return Presentation
      default: return File
    }
  }

  // Handle close
  const handleClose = () => {
    if (isUploading) return
    // Clean up previews
    selectedFiles.forEach(sf => {
      if (sf.preview) URL.revokeObjectURL(sf.preview)
    })
    setSelectedFiles([])
    onClose()
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
            className="fixed inset-x-4 bottom-4 z-50 max-w-lg mx-auto"
          >
            <div className="bg-card rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">
                  Upload Work Files
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
                    id="work-file-upload"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  
                  <label
                    htmlFor="work-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Upload size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Drop files here or tap to browse
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        PDF, Images, Documents, Spreadsheets, Presentations
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Video files are not supported
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
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                        >
                          {/* Preview or Icon */}
                          {sf.preview ? (
                            <img 
                              src={sf.preview} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Icon size={18} className="text-blue-500" />
                            </div>
                          )}

                          {/* File info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {sf.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(sf.file.size / 1024).toFixed(1)} KB
                            </p>
                            {sf.error && (
                              <p className="text-xs text-red-500 mt-1">
                                {sf.error}
                              </p>
                            )}
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
                          {sf.state === 'uploading' && (
                            <Loader2 size={18} className="text-primary animate-spin" />
                          )}
                          {sf.state === 'processing' && (
                            <span className="text-xs text-primary">Processing...</span>
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
                {selectedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || selectedFiles.some(f => f.state === 'uploading' || f.state === 'processing')}
                      className="w-full rounded-full gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

