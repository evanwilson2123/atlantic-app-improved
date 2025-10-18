"use client";
import { Athlete, LatestTechsResponse } from '@/types/types';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

// import AthleteNavbar from './AthleteNavbar';
import CompositeScoreLineChart from '@/components/vald/visuals/CompositeScoreLineChart';
const AthleteProfile = () => {
    // mount hooks
    const { athleteId } = useParams();
    const router = useRouter();

    // set states
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // data states
    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [latestTechs, setLatestTechs] = useState<LatestTechsResponse | null>(null);

    function formatDateLabel(value?: string | Date) {
        if (!value) return '—'
        const d = new Date(value)
        if (isNaN(d.getTime())) return '—'
        return d.toLocaleDateString()
    }

    function formatCompositeScore(value?: number) {
        if (value === null || value === undefined) return '—'
        const n = Number(value)
        if (Number.isNaN(n)) return '—'
        return n.toFixed(1)
    }

    function clampToRange(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max)
    }

    function getCompositePercent(raw?: number) {
        // Assume score in [0,100]; clamp and convert to [0,1]
        if (raw === null || raw === undefined) return 0
        const clamped = clampToRange(Number(raw), 0, 100)
        if (Number.isNaN(clamped)) return 0
        return clamped / 100
    }

    function getCompositeColor(percent: number) {
        // Map 0 -> red (0deg), 1 -> green (120deg)
        const hue = 120 * clampToRange(percent, 0, 1)
        return `hsl(${hue} 80% 50%)`
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
                // promise.all to fetch athlete and latest techs
                const [athleteResponse, latestTechsResponse] = await Promise.all([
                    fetch(`/api/athletes/profile/${athleteId}`),
                    fetch(`/api/athletes/techs/${athleteId}/latest`),
                ]);
                if (!athleteResponse.ok || !latestTechsResponse.ok) {
                    throw new Error("Failed to fetch athlete or latest techs");
                }
                const athleteData = await athleteResponse.json();
                const latestTechsData = await latestTechsResponse.json();
                console.log(JSON.stringify(athleteData, null, 2));
                console.log(JSON.stringify(latestTechsData, null, 2));
                setAthlete(athleteData.athlete);
                setLatestTechs(latestTechsData.latestTechs);
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
        {/* <AthleteNavbar athleteId={athleteId as string} profileId={athlete?.profileId ?? ''} /> */}
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

        {/* Forceplates insights */}
        {!loading && !error && athlete && (
            <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 shadow-sm"
            onClick={() => router.push(`/admin/athlete/${athleteId}/vald/${athlete?.profileId}`)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-gray-400">Forceplates Insights</div>
                        <div className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">{formatCompositeScore(athlete.recentCompositeScore)}</div>
                        <div className="mt-1 text-xs sm:text-sm text-gray-400">
                            Latest VALD test: <span className="text-gray-300">{formatDateLabel(latestTechs?.vald)}</span>
                        </div>
                        {/* History line chart */}
                        <div className="mt-3">
                            <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Composite score trend</div>
                            {(() => {
                                const raw = (athlete as unknown as { compositeScoreHistory?: unknown })?.compositeScoreHistory
                                let history: Array<{ score: number; date: string | Date }> = []
                                if (Array.isArray(raw)) {
                                    history = raw
                                } else if (raw && typeof raw === 'object') {
                                    // prisma Json can come as object or array; accept array only
                                    const maybeArr = (raw as unknown)
                                    if (Array.isArray(maybeArr)) history = maybeArr
                                }
                                return <CompositeScoreLineChart history={history} />
                            })()}
                        </div>
                    </div>
                    <div className="flex-none h-10 w-10 sm:h-12 sm:w-12 items-center justify-center">
                        {(() => {
                            const percent = getCompositePercent(athlete.recentCompositeScore)
                            const size = 48 // px
                            const strokeWidth = 5
                            const radius = (size - strokeWidth) / 2
                            const circumference = 2 * Math.PI * radius
                            const dashOffset = circumference * (1 - percent)
                            const strokeColor = getCompositeColor(percent)
                            return (
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox={`0 0 ${size} ${size}`}
                                    aria-hidden="true"
                                >
                                    <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                                        <circle
                                            cx={size / 2}
                                            cy={size / 2}
                                            r={radius}
                                            fill="none"
                                            stroke="rgba(255,255,255,0.12)"
                                            strokeWidth={strokeWidth}
                                        />
                                        <circle
                                            cx={size / 2}
                                            cy={size / 2}
                                            r={radius}
                                            fill="none"
                                            stroke={strokeColor}
                                            strokeLinecap="round"
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={circumference}
                                            strokeDashoffset={dashOffset}
                                        />
                                    </g>
                                </svg>
                            )
                        })()}
                    </div>
                </div>
            </div>
        )}

        


    </div>
  )
}

export default AthleteProfile