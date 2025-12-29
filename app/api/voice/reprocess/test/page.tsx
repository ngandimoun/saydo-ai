"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function ReprocessTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReprocess = async (recordingId?: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/voice/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordingId ? { recordingId } : { limit: 5 }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reprocess')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Voice Recording Reprocess Test</h1>
      
      <div className="space-y-4 mb-6">
        <Button
          onClick={() => handleReprocess()}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Reprocess Recent 5 Recordings'}
        </Button>

        <div className="text-sm text-gray-500">
          This will reprocess the 5 most recent voice recordings with transcriptions.
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
          <h3 className="text-red-500 font-semibold mb-2">Error</h3>
          <pre className="text-sm text-red-400 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {result && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
          <h3 className="text-green-500 font-semibold mb-4">Results</h3>
          
          <div className="space-y-2 mb-4">
            <div><strong>Processed:</strong> {result.processed}</div>
            <div><strong>Successful:</strong> {result.successful}</div>
            <div><strong>Total Tasks Saved:</strong> {result.totalTasksSaved}</div>
            <div><strong>Total Reminders Saved:</strong> {result.totalRemindersSaved}</div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium mb-2">Detailed Results</summary>
            <pre className="text-xs bg-black/50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

