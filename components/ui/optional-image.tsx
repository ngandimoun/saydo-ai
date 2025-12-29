"use client"

import Image from "next/image"
import { useState } from "react"

interface OptionalImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  placeholder?: React.ReactNode
}

/**
 * An Image component that gracefully handles missing or failed images
 * Shows a placeholder when src is empty or image fails to load
 */
export function OptionalImage({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
  placeholder,
}: OptionalImageProps) {
  const [error, setError] = useState(false)

  // If no src or error loading, show placeholder
  if (!src || error) {
    return (
      placeholder || (
        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
          <div className="text-neutral-600 text-sm text-center p-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-neutral-800 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span>Image coming soon</span>
          </div>
        </div>
      )
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  )
}





