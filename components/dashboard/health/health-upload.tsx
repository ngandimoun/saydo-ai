"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, Image, File, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Health Upload Modal
 * 
 * Allows uploading clinical documents:
 * - PDFs (blood tests, reports)
 * - Images (photos of results)
 * - CSV files (data exports)
 * 
 * TODO (Backend Integration):
 * - Upload to Supabase Storage bucket 'health-documents'
 * - Create record in health_documents table
 * - Trigger AI processing Edge Function
 * - Show real-time processing status
 * 
 * TODO (AI Integration):
 * - OCR for PDF/image text extraction
 * - Parse biomarker values
 * - Compare with reference ranges
 * - Generate insights
 */

interface HealthUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[]) => void
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface SelectedFile {
  file: File
  preview?: string
  state: UploadState
}

const acceptedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'text/csv',
  'application/vnd.ms-excel'
]

export function HealthUploadModal({ isOpen, onClose, onUpload }: HealthUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const newFiles: SelectedFile[] = Array.from(files)
      .filter(f => acceptedTypes.includes(f.type) || f.name.endsWith('.csv'))
      .map(file => ({
        file,
        preview: file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : undefined,
        state: 'idle' as UploadState
      }))

    setSelectedFiles(prev => [...prev, ...newFiles])
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

    /**
     * TODO (Backend):
     * 
     * for (const sf of selectedFiles) {
     *   // Update state to uploading
     *   setSelectedFiles(prev => prev.map(f => 
     *     f === sf ? { ...f, state: 'uploading' } : f
     *   ))
     * 
     *   // Upload to Supabase Storage
     *   const { data, error } = await supabase.storage
     *     .from('health-documents')
     *     .upload(`${userId}/${Date.now()}-${sf.file.name}`, sf.file)
     * 
     *   // Create database record
     *   await supabase.from('health_documents').insert({
     *     user_id: userId,
     *     file_name: sf.file.name,
     *     file_type: sf.file.type,
     *     file_url: data.path,
     *     document_type: detectDocumentType(sf.file),
     *     status: 'pending'
     *   })
     * 
     *   // Trigger AI processing
     *   await supabase.functions.invoke('process-health-document', {
     *     body: { documentId: newDoc.id }
     *   })
     * }
     */

    // Simulate upload
    for (let i = 0; i < selectedFiles.length; i++) {
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, state: 'uploading' } : f
      ))

      await new Promise(resolve => setTimeout(resolve, 800))

      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, state: 'processing' } : f
      ))

      await new Promise(resolve => setTimeout(resolve, 600))

      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, state: 'success' } : f
      ))
    }

    // Wait a moment to show success states
    await new Promise(resolve => setTimeout(resolve, 500))

    onUpload(selectedFiles.map(f => f.file))
    setSelectedFiles([])
    setIsUploading(false)
  }

  // Get icon for file type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type === 'application/pdf') return FileText
    return File
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
                  Upload Clinical Results
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
                    id="file-upload"
                    multiple
                    accept={acceptedTypes.join(',')}
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
                        PDF, Images, or CSV files
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
                              {(sf.file.size / 1024).toFixed(1)} KB
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
                      disabled={isUploading}
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




