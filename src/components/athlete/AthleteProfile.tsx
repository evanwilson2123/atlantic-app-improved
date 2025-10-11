"use client";
import { Athlete } from '@/types/types';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import AthleteNavbar from './AthleteNavbar';

const AthleteProfile = () => {
    // mount hooks
    const { athleteId } = useParams();
    const router = useRouter();

    // set states
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [athlete, setAthlete] = useState<Athlete | null>(null);

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

    // fetch the athlete
    useEffect(() => {
        const fetchAthlete = async () => {
            try {
                /**
                 * THIS IS A FILLER FOR THE TIME BEING
                 */
                const response = await fetch(`/api/athletes/profile/${athleteId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch athlete");
                }
                const data = await response.json();
                console.log(JSON.stringify(data, null, 2));
                setAthlete(data.athlete);
            } catch (error) {
                setError(error instanceof Error ? error.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        }
        fetchAthlete();
    }, [athleteId]);
  return (
    <div className="space-y-5">
        <AthleteNavbar athleteId={athleteId as string} profileId={athlete?.profileId ?? ''} />
        {/* Header */}
        <div className="rounded-2xl border border-gray-800 bg-black p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center text-base sm:text-lg font-semibold shadow">
                        {initials(athlete?.firstName, athlete?.lastName)}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
                            {(athlete?.firstName || '') + ' ' + (athlete?.lastName || '') || 'Athlete'}
                        </h2>
                        <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">{athlete?.email || '—'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Back
                    </button>
                </div>
            </div>
            {/* Badges row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-sky-700 bg-sky-500/10 text-sky-300">
                    {athlete?.playLevel ?? 'Level -'}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                    athlete?.activeStatus
                        ? 'border-emerald-700 bg-emerald-500/10 text-emerald-300'
                        : 'border-gray-700 bg-white/5 text-gray-300'
                }`}>
                    {athlete?.activeStatus ? 'Active' : 'Inactive'}
                </span>
                {athlete?.id && (
                    <span className="inline-flex items-center rounded-full border border-gray-700 bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
                        ID: {athlete.id}
                    </span>
                )}
            </div>
        </div>

        {/* States */}
        {loading && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-600 dark:text-gray-300">
                Loading profile...
            </div>
        )}
        {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
                {error}
            </div>
        )}
        {!loading && !error && !athlete && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
                <p className="text-gray-800 dark:text-gray-100 font-medium">Athlete not found</p>
            </div>
        )}

        {/* Details */}
        {!loading && !error && athlete && (
            <div className="rounded-xl border border-gray-800 bg-black p-5 sm:p-6 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">DOB</div>
                        <div className="mt-0.5 text-sm font-medium text-white">{formatDate(athlete.dob)}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Sex</div>
                        <div className="mt-0.5 text-sm font-medium text-white">{athlete.sex || '—'}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Synced</div>
                        <div className="mt-0.5 text-sm font-medium text-white">{formatDate(athlete.syncedAt)}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">External ID</div>
                        <div className="mt-0.5 text-sm font-medium text-white break-all">{athlete.externalId || '—'}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Profile ID</div>
                        <div className="mt-0.5 text-sm font-medium text-white break-all">{athlete.profileId || '—'}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Sync ID</div>
                        <div className="mt-0.5 text-sm font-medium text-white break-all">{athlete.syncId || '—'}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Created</div>
                        <div className="mt-0.5 text-sm font-medium text-white">{formatDate(athlete.createdAt)}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 border border-gray-800">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Updated</div>
                        <div className="mt-0.5 text-sm font-medium text-white">{formatDate(athlete.updatedAt)}</div>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default AthleteProfile