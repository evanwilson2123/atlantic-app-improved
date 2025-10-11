"use client";

import React, { useEffect, useState } from 'react'
import { Athlete } from '@/types/types'
import { useRouter } from 'next/navigation';

const AdminDashboard = () => {
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter();

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
        <div className="rounded-2xl border border-gray-800 bg-black p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Athletes
              </h2>
              <p className="mt-1 text-sm sm:text-base text-gray-300">
                Manage and view athlete profiles synced from VALD
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-gray-700 bg-white/10 px-3 py-1 text-xs sm:text-sm font-medium text-white">{athletes.length} total</span>
            </div>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="rounded-lg border border-gray-800 bg-black p-6 text-center text-gray-300">
            Loading athletes...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && athletes.length === 0 && (
          <div className="rounded-lg border border-gray-800 bg-black p-6 text-center">
            <p className="text-white font-medium">No athletes yet</p>
            <p className="text-sm text-gray-300">Create a new athlete to get started.</p>
          </div>
        )}

        {/* Mobile cards */}
        {!loading && !error && athletes.length > 0 && (
          <div className="grid gap-4 md:hidden">
            {athletes.map((a) => (
              <div
                key={a.id ?? a.profileId ?? a.externalId}
                className="rounded-xl border border-slate-900 bg-slate-950 p-4 shadow-sm"
                onClick={() => router.push(`/admin/athlete/${a.id}/profile`)}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 text-white grid place-items-center text-sm font-semibold ring-1 ring-white/20">
                    {initials(a.firstName, a.lastName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-white truncate">
                      {(a.firstName || '') + ' ' + (a.lastName || '')}
                    </div>
                    <div className="text-xs text-gray-300 truncate">{a.email}</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-sky-700 bg-sky-500/10 text-sky-300">
                    {a.playLevel ?? 'Level -'}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                    a.activeStatus
                      ? 'border-emerald-700 bg-emerald-500/10 text-emerald-300'
                      : 'border-gray-700 bg-white/5 text-gray-300'
                  }`}>
                    {a.activeStatus ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Meta grid */}
                <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] text-gray-300">
                  <div className="rounded-lg bg-white/5 p-2 border border-gray-800">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">DOB</div>
                    <div className="mt-0.5 font-medium text-white">{formatDate(a.dob)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 border border-gray-800">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Synced</div>
                    <div className="mt-0.5 font-medium text-white">{formatDate(a.syncedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!loading && !error && athletes.length > 0 && (
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">DOB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Synced</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Active</th>
                </tr>
              </thead>
              <tbody className="bg-slate divide-y divide-gray-800">
                {athletes.map((a) => (
                  <tr 
                  key={a.id ?? a.profileId ?? a.externalId} 
                  className="hover:bg-gray-900/40 cursor-pointer" 
                  onClick={() =>router.push(`/admin/athlete/${a.id}/profile`)}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {(a.firstName || '') + ' ' + (a.lastName || '')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{a.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-sky-700 bg-sky-500/10 text-sky-300">
                        {a.playLevel ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDate(a.dob)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDate(a.syncedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{a.activeStatus ? 'Yes' : 'No'}</td>
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