"use client";

import React, { useEffect, useState } from 'react'
import { Athlete } from '@/types/types'

const AdminDashboard = () => {
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    function formatDate(value?: string | Date) {
      if (!value) return '-'
      const d = new Date(value)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString()
    }

    function initials(nameA?: string, nameB?: string) {
      const a = (nameA?.[0] ?? '').toUpperCase()
      const b = (nameB?.[0] ?? '').toUpperCase()
      return (a + b) || 'A'
    }

    useEffect(() => {
      const controller = new AbortController()
      const fetchAthletes = async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await fetch('/api/athletes', { signal: controller.signal })
          if (!res.ok) {
            throw new Error('Failed to fetch athletes')
          }
          const data = await res.json()
          setAthletes(data.athletes ?? [])
        } catch (err: unknown) {
          console.error('Error loading athletes:', err)
          if (err instanceof Error && err.name !== 'AbortError') setError(err.message || 'Error loading athletes')
        } finally {
          setLoading(false)
        }
      }
      fetchAthletes()
    }, [])

    return (
      <div className="space-y-5">
        {/* Page header - mobile + desktop */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Athletes
              </h2>
              <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Manage and view athlete profiles synced from VALD
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-200">
                {athletes.length} total
              </span>
            </div>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-600 dark:text-gray-300">
            Loading athletes...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && athletes.length === 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-gray-800 dark:text-gray-100 font-medium">No athletes yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Create a new athlete to get started.</p>
          </div>
        )}

        {/* Mobile cards */}
        {!loading && !error && athletes.length > 0 && (
          <div className="grid gap-4 md:hidden">
            {athletes.map((a) => (
              <div
                key={a.id ?? a.profileId ?? a.externalId}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center text-sm font-semibold shadow">
                    {initials(a.firstName, a.lastName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {(a.firstName || '') + ' ' + (a.lastName || '')}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{a.email}</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-2.5 py-1 text-xs font-medium border border-blue-100 dark:border-blue-800">
                    {a.playLevel ?? 'Level -'}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                    a.activeStatus
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 border-green-100 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}>
                    {a.activeStatus ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Meta grid */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] text-gray-700 dark:text-gray-300">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-2 border border-gray-100 dark:border-gray-800">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">DOB</div>
                    <div className="mt-0.5 font-medium">{formatDate(a.dob)}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-2 border border-gray-100 dark:border-gray-800">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Synced</div>
                    <div className="mt-0.5 font-medium">{formatDate(a.syncedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!loading && !error && athletes.length > 0 && (
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">DOB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Synced</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Active</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
                {athletes.map((a) => (
                  <tr key={a.id ?? a.profileId ?? a.externalId} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {(a.firstName || '') + ' ' + (a.lastName || '')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{a.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{a.playLevel ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDate(a.dob)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDate(a.syncedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{a.activeStatus ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
}

export default AdminDashboard