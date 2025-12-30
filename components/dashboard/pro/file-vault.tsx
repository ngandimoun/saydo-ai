"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, File, FileText, Image, Sheet, Presentation, ChevronRight, Loader2, Trash2, Download, X } from "lucide-react"
import type { WorkFile } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { WorkFileUploadModal } from "./work-file-upload"
import { useInvalidateProData } from "@/hooks/queries/use-pro-data"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * File Vault Component
 * 
 * Upload and display work-related files.
 * Shows recent uploads with thumbnails/icons.
 * 
 * TODO (Backend Integration):
 * - Generate thumbnails for images/PDFs
 * - Add file preview modal
 * - Implement file deletion
 */

interface FileVaultProps {
  files: WorkFile[]
}

export function FileVault({ files }: FileVaultProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<WorkFile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewFile, setPreviewFile] = useState<WorkFile | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const invalidateProData = useInvalidateProData()

  const handleUploadClick = () => {
    setIsUploadModalOpen(true)
  }

  const handleUploadComplete = () => {
    invalidateProData()
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText
      case 'image': return Image
      case 'spreadsheet': return Sheet
      case 'presentation': return Presentation
      default: return File
    }
  }

  const getFileColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-500 bg-red-500/20'
      case 'image': return 'text-purple-500 bg-purple-500/20'
      case 'spreadsheet': return 'text-green-500 bg-green-500/20'
      case 'presentation': return 'text-orange-500 bg-orange-500/20'
      default: return 'text-blue-500 bg-blue-500/20'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  // Extract storage path from Supabase public URL
  const extractStoragePath = (fileUrl: string): string | null => {
    try {
      // Supabase public URL format: https://[project].supabase.co/storage/v1/object/public/work-files/[path]
      const url = new URL(fileUrl)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/work-files\/(.+)$/)
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1])
      }
      return null
    } catch {
      return null
    }
  }

  // Handle file deletion
  const handleDeleteFile = async () => {
    if (!fileToDelete) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Extract storage path from file URL
      const storagePath = extractStoragePath(fileToDelete.fileUrl)
      
      // Delete from storage (if path can be extracted)
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('work-files')
          .remove([storagePath])

        // Log storage error but continue with database deletion
        if (storageError) {
          console.error('Failed to delete from storage:', storageError)
          // Continue anyway - database deletion is more important
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('work_files')
        .delete()
        .eq('id', fileToDelete.id)

      if (dbError) {
        throw new Error(dbError.message)
      }

      toast.success('File deleted successfully')
      invalidateProData()
      setFileToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="space-y-4">
      {/* Section header with upload button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <File size={16} className="text-blue-500" />
          <h2 className="font-semibold text-foreground">File Vault</h2>
        </div>
        <button
          onClick={handleUploadClick}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 sm:py-2 rounded-full",
            "bg-blue-500 text-white font-medium text-sm",
            "hover:bg-blue-600 active:bg-blue-700 transition-colors",
            "touch-manipulation min-h-[44px] sm:min-h-0",
            "active:scale-[0.98]"
          )}
        >
          <Upload size={18} className="sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Upload</span>
        </button>
      </div>

      {/* Recent files grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.fileType)
            const colorClass = getFileColor(file.fileType)

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => file.status === 'ready' && setPreviewFile(file)}
                className={cn(
                  "p-4 rounded-2xl relative group cursor-pointer touch-manipulation",
                  "bg-card border border-border/50",
                  "hover:border-border active:bg-muted/30 transition-colors",
                  "min-h-[80px] flex items-center",
                  file.status === 'ready' && "hover:bg-muted/30 active:scale-[0.98]"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    colorClass.split(' ')[1]
                  )}>
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    ) : (
                      <FileIcon size={20} className={colorClass.split(' ')[0]} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium truncate">
                      {file.customName || file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.fileSize)} • {formatRelativeTime(file.uploadedAt)}
                    </p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {file.description}
                      </p>
                    )}
                  </div>
                  {file.status === 'ready' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setFileToDelete(file)
                      }}
                      className={cn(
                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                        "p-2 sm:p-1.5 rounded-lg active:bg-destructive/20",
                        "bg-destructive/5 sm:bg-transparent",
                        "text-destructive touch-manipulation",
                        "min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0",
                        "flex items-center justify-center"
                      )}
                      aria-label="Delete file"
                    >
                      <Trash2 size={18} className="sm:w-[14px] sm:h-[14px]" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-card border border-dashed border-border text-center">
          <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No files uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload documents, images, and more
          </p>
        </div>
      )}

      {/* View all link */}
      {files.length > 4 && (
        <button className="text-xs text-primary flex items-center gap-1 hover:underline mx-auto">
          View all files
          <ChevronRight size={14} />
        </button>
      )}

      {/* Upload Modal */}
      <WorkFileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* File Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => {
        if (!open) {
          setPreviewFile(null)
          setImageLoadError(false)
        }
      }}>
        <DialogContent className="w-full h-full sm:h-auto sm:max-w-4xl max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 m-0 sm:m-4 rounded-none sm:rounded-lg">
          {previewFile && (
            <>
              <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-border safe-area-top pr-12 sm:pr-14">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <DialogTitle className="text-base sm:text-lg font-semibold truncate">
                      {previewFile.customName || previewFile.fileName}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {formatFileSize(previewFile.fileSize)} • {formatRelativeTime(previewFile.uploadedAt)}
                    </DialogDescription>
                    {previewFile.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                        {previewFile.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = previewFile.fileUrl
                        link.download = previewFile.fileName
                        link.target = '_blank'
                        link.click()
                      }}
                      className="rounded-full min-w-[44px] min-h-[44px] touch-manipulation"
                      aria-label="Download file"
                    >
                      <Download size={18} className="sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="flex-1 overflow-auto p-4 sm:p-6 safe-area-bottom">
                {previewFile.fileType === 'image' ? (
                  <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                    {imageLoadError ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Image size={32} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Failed to load image</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = previewFile.fileUrl
                            link.download = previewFile.fileName
                            link.target = '_blank'
                            link.click()
                          }}
                          className="min-h-[44px] touch-manipulation"
                        >
                          <Download size={16} className="mr-2" />
                          Download instead
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={previewFile.fileUrl}
                        alt={previewFile.customName || previewFile.fileName}
                        className="max-w-full max-h-[calc(100vh-200px)] sm:max-h-[70vh] object-contain rounded-lg"
                        onError={() => setImageLoadError(true)}
                        onLoad={() => setImageLoadError(false)}
                        loading="lazy"
                      />
                    )}
                  </div>
                ) : previewFile.fileType === 'pdf' ? (
                  <div className="w-full h-[calc(100vh-200px)] sm:h-[70vh]">
                    <iframe
                      src={previewFile.fileUrl}
                      className="w-full h-full rounded-lg border border-border"
                      title={previewFile.customName || previewFile.fileName}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] p-6 sm:p-8 text-center">
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center mb-6",
                      getFileColor(previewFile.fileType).split(' ')[1]
                    )}>
                      {(() => {
                        const Icon = getFileIcon(previewFile.fileType)
                        return <Icon size={32} className={getFileColor(previewFile.fileType).split(' ')[0]} />
                      })()}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 px-4">
                      {previewFile.customName || previewFile.fileName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 px-4">
                      This file type cannot be previewed in the browser
                    </p>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = previewFile.fileUrl
                        link.download = previewFile.fileName
                        link.target = '_blank'
                        link.click()
                      }}
                      className="gap-2 min-h-[44px] touch-manipulation"
                    >
                      <Download size={16} />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete File?</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {fileToDelete && (
            <div className="py-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium truncate">
                  {fileToDelete.customName || fileToDelete.fileName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(fileToDelete.fileSize)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setFileToDelete(null)}
              disabled={isDeleting}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFile}
              disabled={isDeleting}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}




