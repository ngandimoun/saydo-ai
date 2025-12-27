"use client"

import { motion } from "framer-motion"
import { Upload, File, FileText, Image, Sheet, Presentation, ChevronRight, Loader2 } from "lucide-react"
import type { WorkFile } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/**
 * File Vault Component
 * 
 * Upload and display work-related files.
 * Shows recent uploads with thumbnails/icons.
 * 
 * TODO (Backend Integration):
 * - Implement file upload to Supabase Storage
 * - Generate thumbnails for images/PDFs
 * - Add file preview modal
 * - Implement file deletion
 */

interface FileVaultProps {
  files: WorkFile[]
}

export function FileVault({ files }: FileVaultProps) {
  const handleUploadClick = () => {
    // TODO: Implement actual file upload
    toast.info("Upload functionality coming soon!", {
      description: "You'll be able to upload PDFs, images, and documents."
    })
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
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-blue-500 text-white font-medium text-sm",
            "hover:bg-blue-600 transition-colors touch-manipulation"
          )}
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      {/* Recent files grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.fileType)
            const colorClass = getFileColor(file.fileType)

            return (
              <motion.button
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 rounded-2xl text-left",
                  "bg-card border border-border/50",
                  "hover:border-border transition-colors"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    colorClass.split(' ')[1]
                  )}>
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    ) : (
                      <FileIcon size={20} className={colorClass.split(' ')[0]} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.fileSize)} • {formatRelativeTime(file.uploadedAt)}
                    </p>
                  </div>
                </div>
              </motion.button>
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
    </section>
  )
}

