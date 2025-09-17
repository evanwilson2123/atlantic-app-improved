'use client'
import React, { useEffect, useState } from 'react'
import { VALDTest } from '@/lib/forcedecks-api'
import { useParams, useRouter } from 'next/navigation'

export default function TestsList() {
    const router = useRouter();
  const params = useParams() as { athleteId?: string; profileId?: string }
  const athleteId = params?.athleteId
  const profileId = params?.profileId

  const [tests, setTests] = useState<VALDTest[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function formatDate(value?: string) {
    if (!value) return '-'
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    return d.toLocaleString()
  }

  function truncateMiddle(input = '', keep = 5) {
    if (input.length <= keep * 2 + 3) return input
    return `${input.slice(0, keep)}...${input.slice(-keep)}`
  }

  useEffect(() => {
    const fetchTests = async () => {
      try {
        if (!profileId) return
        const res = await fetch(`/api/vald?profileId=${profileId}`)
        if (!res.ok) throw new Error('Failed to fetch tests')
        const data = await res.json()
        const normalized = Array.isArray(data.tests)
          ? data.tests
          : (Array.isArray(data.tests?.tests) ? data.tests.tests : [])
        setTests(normalized)
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
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold">VALD Tests</h1>
        <span className="text-sm text-gray-600 dark:text-gray-300">{tests.length} total</span>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {tests.length > 0 && tests.map((t) => (
              <button
                key={t.testId}
                onClick={() => router.push(`/admin/athlete/${athleteId}/vald/${profileId}/test/${t.testId}`)}
                className="text-left rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{t.testType}</div>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{truncateMiddle(t.testId)}</code>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div><span className="text-gray-500">Modified:</span> {formatDate(t.modifiedDateUtc)}</div>
                  <div><span className="text-gray-500">Recorded:</span> {formatDate(t.recordedDateUtc)}</div>
                  <div><span className="text-gray-500">Weight:</span> {t.weight ?? '-'}</div>
                  <div><span className="text-gray-500">Recording:</span> {truncateMiddle(t.recordingId)}</div>
                </div>
                {expandedId === t.testId && (
                  <div className="mt-3 border-t border-gray-200 dark:border-gray-800 pt-3 text-xs text-gray-700 dark:text-gray-300 space-y-2">
                    {t.parameter && (
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">Primary metric</div>
                        <div>resultId: {t.parameter.resultId} value: {t.parameter.value}</div>
                      </div>
                    )}
                    {Array.isArray(t.extendedParameters) && t.extendedParameters.length > 0 && (
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">Extended</div>
                        <ul className="list-disc list-inside">
                          {t.extendedParameters.slice(0, 5).map((p, idx) => (
                            <li key={idx}>resultId: {p.resultId} value: {p.value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
            {tests.length === 0 && <div>No tests found.</div>}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Test Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Modified</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recorded</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Weight</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recording Id</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {Array.isArray(tests) && tests.map((t) => (
                  <tr
                    key={t.testId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => router.push(`/admin/athlete/${athleteId}/vald/${profileId}/test/${t.testId}`)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{t.testType}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDate(t.modifiedDateUtc)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDate(t.recordedDateUtc)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{t.weight ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{truncateMiddle(t.recordingId)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}


