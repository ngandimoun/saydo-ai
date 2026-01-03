"use client"

import { useState, KeyboardEvent, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Image as ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
}

interface ImagePreview {
  file: File
  preview: string
}

export function ChatInput({ onSend, isLoading = false, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [images, setImages] = useState<ImagePreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Focus input when component mounts or becomes enabled
  useEffect(() => {
    if (!disabled && !isLoading) {
      inputRef.current?.focus()
    }
  }, [disabled, isLoading])

  // Validate image file
  const validateImage = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
      return false
    }

    if (file.size > maxSize) {
      alert("File too large. Maximum size is 10MB.")
      return false
    }

    return true
  }

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const newImages: ImagePreview[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (validateImage(file)) {
        const preview = URL.createObjectURL(file)
        newImages.push({ file, preview })
      }
    }

    setImages((prev) => [...prev, ...newImages])
  }, [])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview))
    }
  }, [images])

  const handleSend = async () => {
    if ((!message.trim() && images.length === 0) || isLoading || disabled || isUploading) return

    const text = message.trim()
    setMessage("")

    // Upload images if any
    let imageUrls: string[] = []
    if (images.length > 0) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        images.forEach((img) => {
          formData.append("images", img.file)
        })

        const response = await fetch("/api/chat/upload-images", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to upload images")
        }

        const data = await response.json()
        imageUrls = data.imageUrls || []

        // Cleanup preview URLs
        images.forEach((img) => URL.revokeObjectURL(img.preview))
        setImages([])
      } catch (error) {
        console.error("Error uploading images:", error)
        alert(error instanceof Error ? error.message : "Failed to upload images")
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    await onSend(text, imageUrls.length > 0 ? imageUrls : undefined)

    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = message.trim() || images.length > 0

  return (
    <div className="border-t bg-background">
      {/* Image previews */}
      {images.length > 0 && (
        <div className="p-4 border-b">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <div key={index} className="relative shrink-0">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => removeImage(index)}
                  disabled={isLoading || disabled || isUploading}
                >
                  <X size={12} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="p-4"
      >
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isLoading || disabled || isUploading}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || disabled || isUploading}
            className="shrink-0"
            aria-label="Upload images"
          >
            <ImageIcon size={18} />
          </Button>
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (or drag images here)"
            disabled={isLoading || disabled || isUploading}
            className="flex-1"
            aria-label="Chat message input"
          />
          <Button
            onClick={handleSend}
            disabled={!canSend || isLoading || disabled || isUploading}
            size="icon"
            className="shrink-0"
            aria-label="Send message"
          >
            {isLoading || isUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
          {images.length > 0 && ` • ${images.length} image${images.length > 1 ? "s" : ""} ready`}
        </p>
      </div>
    </div>
  )
}

