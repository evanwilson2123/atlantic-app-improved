'use client'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'

export default function Page() {
  const params = useParams() as { athleteId: string; profileId: string; testId: string }
  const { athleteId, profileId, testId } = params

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown | null>(null)

  // Replace this function body with your custom fetch logic.
  // You have access to athleteId, profileId, testId above if needed.
  async function userFetch(): Promise<unknown> {
    const res = await fetch(`/api/vald/test/${testId}`)
    if (!res.ok) throw new Error('Request failed')
    return await res.json()
  }

  async function runFetch() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await userFetch()
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-1/2 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-400/20 to-indigo-400/20 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 blur-3xl" />
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Run custom fetch</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            athleteId: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{athleteId}</code>,
            profileId: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{profileId}</code>,
            testId: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{testId}</code>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={runFetch}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Run fetch'}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {result !== null && (
          <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Response</div>
            <pre className="text-xs whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {(() => {
                try {
                  if (typeof result === 'string') return result
                  return JSON.stringify(result as unknown, null, 2)
                } catch {
                  return String(result)
                }
              })()}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}