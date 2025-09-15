'use client'
import { VALDTest } from '@/lib/forcedecks-api';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

export default function Page() {
    const params = useParams() as { athleteId: string; profileId: string }
    const athleteId = params?.athleteId
    const profileId = params?.profileId
    const [tests, setTests] = useState<VALDTest[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTests = async () => {
            try {
                if (!profileId) return
                const res = await fetch(`/api/vald?profileId=${profileId}`)
                if (!res.ok) throw new Error('Failed to fetch tests')
                const data = await res.json()
                setTests(data.tests ?? [])
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
        fetchTests()
    }, [athleteId, profileId])

    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">VALD Tests</h1>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <div className="grid gap-3">
            {tests.map((t) => (
              <div key={t.testId} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="font-medium">{t.testType}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Recorded: {new Date(t.recordedDateUtc).toLocaleString()}</div>
              </div>
            ))}
            {tests.length === 0 && <div>No tests found.</div>}
          </div>
        )}
      </div>
    )
}