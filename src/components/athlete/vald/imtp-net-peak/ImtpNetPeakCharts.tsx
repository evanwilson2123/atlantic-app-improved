"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation';
import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    ChartOptions,
    Plugin,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// Round up to a visually "nice" axis maximum so reference lines are visible
function computeNiceAxisMax(value: number): number {
    const v = Math.max(1, value)
    const mag = Math.pow(10, Math.floor(Math.log10(v)))
    const step = mag / 2 // 0.5 * magnitude
    return Math.ceil((v * 1.05) / step) * step
}

type ImtpNetPeakStat = {
    recordedUTC: string
    NET_PEAK_VERTICAL_FORCE_trial_value: number | null
    RELATIVE_STRENGTH_trial_value: number | null
}

const ImtpNetPeakCharts = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [netPeakStats, setNetPeakStats] = useState<ImtpNetPeakStat[]>([]);
    const [overallPercentile, setOverallPercentile] = useState<number | null>(null);
    const [relOverallPercentile, setRelOverallPercentile] = useState<number | null>(null);
    const [imtpTierLines, setImtpTierLines] = useState<{ developing: number | null; advanced: number | null; elite: number | null }>({ developing: null, advanced: null, elite: null })
    const [relTierLines, setRelTierLines] = useState<{ developing: number | null; advanced: number | null; elite: number | null }>({ developing: null, advanced: null, elite: null })
    const { profileId } = useParams();

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [height, setHeight] = useState<number>(300)

    useEffect(() => {
        if (!containerRef.current) return
        const el = containerRef.current
        const update = () => {
            const rect = el.getBoundingClientRect()
            const cw = Math.max(240, Math.round(rect.width))
            const ratio = cw < 480 ? 0.56 : cw < 1024 ? 0.5 : 0.4
            const ch = Math.round(Math.max(220, Math.min(520, cw * ratio)))
            setHeight(ch)
        }
        update()
        const ro = new ResizeObserver(() => update())
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/vald/imtp-net-peak/chart/${profileId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch imtp net peak chart");
                }
                const data = await response.json();
                setNetPeakStats(data.netPeakStats);
            } catch (error) {
                setError(error instanceof Error ? error.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        }
        if (profileId) {
            fetchData();
        } else {
            // No param present, stop loading to avoid spinner hang
            setLoading(false);
        }
    }, [profileId]);

    // Fetch IMTP percentiles (overall) from composite-score endpoint
    useEffect(() => {
        const fetchPercentile = async () => {
            try {
                if (!profileId) return;
                const res = await fetch(`/api/vald/composite-score/chart/${profileId}`)
                if (!res.ok) return;
                const json = await res.json();
                const pNet = Number(json?.impt_net_peak_vertical_force ?? 0);
                const pRel = Number(json?.relative_strength_imtp ?? 0);
                if (Number.isFinite(pNet)) setOverallPercentile(Math.round(Math.max(0, Math.min(100, pNet))));
                if (Number.isFinite(pRel)) setRelOverallPercentile(Math.round(Math.max(0, Math.min(100, pRel))));
            } catch {}
        }
        fetchPercentile()
    }, [profileId])

    // Fetch percentile reference JSON to compute raw values for tier boundaries
    useEffect(() => {
        const valueAtPercentile = (target: number, ref: Record<number, number>): number | null => {
            const points = Object.entries(ref)
                .map(([k, v]) => [Number(k), Number(v)] as [number, number])
                .filter(([p, v]) => Number.isFinite(p) && Number.isFinite(v))
                .sort((a, b) => a[0] - b[0])
            if (points.length === 0) return null
            if (target <= points[0][0]) return points[0][1]
            if (target >= points[points.length - 1][0]) return points[points.length - 1][1]
            for (let i = 0; i < points.length - 1; i++) {
                const [p1, v1] = points[i]
                const [p2, v2] = points[i + 1]
                if (target >= p1 && target <= p2) {
                    const t = p2 === p1 ? 0 : (target - p1) / (p2 - p1)
                    return v1 + t * (v2 - v1)
                }
            }
            return null
        }

        const fetchRefs = async () => {
            try {
                const res = await fetch('/hp_obp_percentiles.json')
                if (!res.ok) return
                const json = await res.json() as Record<string, unknown>
                const imtpRefRaw = json['net_peak_vertical_force_[n]_max_imtp'] as Record<string, number> | undefined
                const relRefRaw = json['relative_strength'] as Record<string, number> | undefined
                if (imtpRefRaw) {
                    const imtpRef: Record<number, number> = Object.fromEntries(Object.entries(imtpRefRaw).map(([k, v]) => [Number(k), Number(v)]))
                    setImtpTierLines({
                        developing: valueAtPercentile(60, imtpRef),
                        advanced: valueAtPercentile(75, imtpRef),
                        elite: valueAtPercentile(90, imtpRef),
                    })
                }
                if (relRefRaw) {
                    const relRef: Record<number, number> = Object.fromEntries(Object.entries(relRefRaw).map(([k, v]) => [Number(k), Number(v)]))
                    setRelTierLines({
                        developing: valueAtPercentile(60, relRef),
                        advanced: valueAtPercentile(75, relRef),
                        elite: valueAtPercentile(90, relRef),
                    })
                }
            } catch {}
        }
        fetchRefs()
    }, [])

    const labels = useMemo(() => netPeakStats.map(s => new Date(s.recordedUTC).toLocaleDateString()), [netPeakStats])
    const values = useMemo(() => netPeakStats.map(s => Number(s.NET_PEAK_VERTICAL_FORCE_trial_value) || 0), [netPeakStats])
    const numberFmt = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }), [])
    const relValues = useMemo(() => netPeakStats.map(s => Number(s.RELATIVE_STRENGTH_trial_value) || 0), [netPeakStats])
    const numberFmtRel = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }), [])

    // Derived insights for Relative Strength (mirror of net peak)
    const {
        latestRelValue,
        latestRelDate,
        personalBestRel,
        personalBestIndexRel,
        latestIndexRel,
        avg30dRel,
        sessions30dRel,
        shortTermTrendPctRel,
        ratingRel,
        tierRel,
        nextTierLabelRel,
        progressToNextTierPctRel,
    } = useMemo(() => {
        if (relValues.length === 0) {
            return {
                latestRelValue: 0,
                latestRelDate: null as string | null,
                personalBestRel: 0,
                personalBestIndexRel: -1,
                latestIndexRel: -1,
                avg30dRel: 0,
                sessions30dRel: 0,
                shortTermTrendPctRel: 0,
                ratingRel: 0,
                tierRel: 'Foundational',
                nextTierLabelRel: 'Developing',
                progressToNextTierPctRel: 0,
            }
        }

        const parsed = netPeakStats.map(s => ({
            date: new Date(s.recordedUTC),
            value: Number(s.RELATIVE_STRENGTH_trial_value) || 0,
        }))
        const lastNonZeroIndex = (() => {
            for (let i = parsed.length - 1; i >= 0; i--) {
                if (parsed[i].value > 0) return i
            }
            return parsed.length - 1
        })()
        const latest = parsed[lastNonZeroIndex]

        let pb = 0
        let pbIdx = -1
        parsed.forEach((p, idx) => {
            if (p.value > pb) {
                pb = p.value
                pbIdx = idx
            }
        })

        const now = Date.now()
        const day30 = 30 * 24 * 60 * 60 * 1000
        const in30 = parsed.filter(p => now - p.date.getTime() <= day30 && p.value > 0)
        const avg30 = in30.length ? in30.reduce((a, b) => a + b.value, 0) / in30.length : 0

        const last3 = parsed.slice(-3).map(p => p.value).filter(v => v > 0)
        const prev3 = parsed.slice(-6, -3).map(p => p.value).filter(v => v > 0)
        const last3Avg = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : latest.value
        const prev3Avg = prev3.length ? prev3.reduce((a, b) => a + b, 0) / prev3.length : last3Avg
        const trendPct = prev3Avg > 0 ? ((last3Avg - prev3Avg) / prev3Avg) * 100 : 0

        const form = pb > 0 ? 0.5 * (latest.value / pb) + 0.5 * (last3Avg / pb) : 0
        let r = 40 + Math.max(0, Math.min(1, form)) * 59
        r += Math.max(-5, Math.min(5, trendPct / 4))
        r = Math.max(40, Math.min(99, r))

        const scoreBasis = relOverallPercentile ?? r
        const getTier = (score: number) => {
            if (score >= 90) return 'Elite'
            if (score >= 75) return 'Advanced'
            if (score >= 60) return 'Developing'
            return 'Foundational'
        }
        const tier = getTier(scoreBasis)
        const tierBoundsPercentile: Record<string, { min: number; max: number; next: string | null }> = {
            Foundational: { min: 0, max: 60, next: 'Developing' },
            Developing: { min: 60, max: 75, next: 'Advanced' },
            Advanced: { min: 75, max: 90, next: 'Elite' },
            Elite: { min: 90, max: 100, next: null },
        }
        const tierBoundsRating: Record<string, { min: number; max: number; next: string | null }> = {
            Foundational: { min: 40, max: 60, next: 'Developing' },
            Developing: { min: 60, max: 75, next: 'Advanced' },
            Advanced: { min: 75, max: 90, next: 'Elite' },
            Elite: { min: 90, max: 99, next: null },
        }
        const bounds = (relOverallPercentile !== null ? tierBoundsPercentile : tierBoundsRating)[tier]
        const progress = bounds.next ? ((scoreBasis - bounds.min) / (bounds.max - bounds.min)) * 100 : 100

        return {
            latestRelValue: latest.value,
            latestRelDate: latest.date.toLocaleDateString(),
            personalBestRel: pb,
            personalBestIndexRel: pbIdx,
            latestIndexRel: lastNonZeroIndex,
            avg30dRel: avg30,
            sessions30dRel: in30.length,
            shortTermTrendPctRel: trendPct,
            ratingRel: Math.round(r),
            tierRel: tier,
            nextTierLabelRel: bounds.next ?? 'Max',
            progressToNextTierPctRel: Math.round(progress),
        }
    }, [netPeakStats, relValues, relOverallPercentile])

    // Derived insights for a gamified presentation
    const {
        latestValue,
        latestDate,
        personalBest,
        personalBestIndex,
        latestIndex,
        avg30d,
        sessions30d,
        shortTermTrendPct,
        rating,
        tier,
        nextTierLabel,
        progressToNextTierPct,
    } = useMemo(() => {
        if (netPeakStats.length === 0) {
            return {
                latestValue: 0,
                latestDate: null as string | null,
                personalBest: 0,
                personalBestIndex: -1,
                latestIndex: -1,
                avg30d: 0,
                sessions30d: 0,
                shortTermTrendPct: 0,
                rating: 0,
                tier: 'Foundational',
                nextTierLabel: 'Developing',
                progressToNextTierPct: 0,
            }
        }

        const parsed = netPeakStats.map(s => ({
            date: new Date(s.recordedUTC),
            value: Number(s.NET_PEAK_VERTICAL_FORCE_trial_value) || 0,
        }))
        const lastNonZeroIndex = (() => {
            for (let i = parsed.length - 1; i >= 0; i--) {
                if (parsed[i].value > 0) return i
            }
            return parsed.length - 1
        })()
        const latest = parsed[lastNonZeroIndex]

        // Personal best across available values
        let pb = 0
        let pbIdx = -1
        parsed.forEach((p, idx) => {
            if (p.value > pb) {
                pb = p.value
                pbIdx = idx
            }
        })

        // 30d rolling window average
        const now = Date.now()
        const day30 = 30 * 24 * 60 * 60 * 1000
        const in30 = parsed.filter(p => now - p.date.getTime() <= day30 && p.value > 0)
        const avg30 = in30.length ? in30.reduce((a, b) => a + b.value, 0) / in30.length : 0

        // Trend: compare last 3 vs previous 3 averages
        const last3 = parsed.slice(-3).map(p => p.value).filter(v => v > 0)
        const prev3 = parsed.slice(-6, -3).map(p => p.value).filter(v => v > 0)
        const last3Avg = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : latest.value
        const prev3Avg = prev3.length ? prev3.reduce((a, b) => a + b, 0) / prev3.length : last3Avg
        const trendPct = prev3Avg > 0 ? ((last3Avg - prev3Avg) / prev3Avg) * 100 : 0

        // Rating 40–99, blending current form vs PB with trend nudge
        const form = pb > 0 ? 0.5 * (latest.value / pb) + 0.5 * (last3Avg / pb) : 0
        let r = 40 + Math.max(0, Math.min(1, form)) * 59
        r += Math.max(-5, Math.min(5, trendPct / 4)) // small boost/penalty for trend
        r = Math.max(40, Math.min(99, r))

        // Choose score basis: prefer percentile if available
        const scoreBasis = overallPercentile ?? r

        // Tiers and progress within tier
        const getTier = (score: number) => {
            if (score >= 90) return 'Elite'
            if (score >= 75) return 'Advanced'
            if (score >= 60) return 'Developing'
            return 'Foundational'
        }
        const tier = getTier(scoreBasis)
        // Bounds depend on scale: percentile (0–100) vs fallback rating (40–99)
        const tierBoundsPercentile: Record<string, { min: number; max: number; next: string | null }> = {
            Foundational: { min: 0, max: 60, next: 'Developing' },
            Developing: { min: 60, max: 75, next: 'Advanced' },
            Advanced: { min: 75, max: 90, next: 'Elite' },
            Elite: { min: 90, max: 100, next: null },
        }
        const tierBoundsRating: Record<string, { min: number; max: number; next: string | null }> = {
            Foundational: { min: 40, max: 60, next: 'Developing' },
            Developing: { min: 60, max: 75, next: 'Advanced' },
            Advanced: { min: 75, max: 90, next: 'Elite' },
            Elite: { min: 90, max: 99, next: null },
        }
        const bounds = (overallPercentile !== null ? tierBoundsPercentile : tierBoundsRating)[tier]
        const progress = bounds.next ? ((scoreBasis - bounds.min) / (bounds.max - bounds.min)) * 100 : 100

        return {
            latestValue: latest.value,
            latestDate: latest.date.toLocaleDateString(),
            personalBest: pb,
            personalBestIndex: pbIdx,
            latestIndex: lastNonZeroIndex,
            avg30d: avg30,
            sessions30d: in30.length,
            shortTermTrendPct: trendPct,
            rating: Math.round(r),
            tier,
            nextTierLabel: bounds.next ?? 'Max',
            progressToNextTierPct: Math.round(progress),
        }
    }, [netPeakStats, overallPercentile])

    const data = useMemo(() => {
        const count = Math.max(1, values.length)
        const barPct = count > 24 ? 0.4 : count > 12 ? 0.5 : 0.6
        const catPct = count > 24 ? 0.8 : count > 12 ? 0.85 : 0.9

        const bgs = values.map((_, i) => {
            if (i === personalBestIndex) return 'rgba(99, 102, 241, 0.75)' // PB • indigo
            if (i === latestIndex) return 'rgba(34, 197, 94, 0.75)' // Latest • green
            return 'rgba(245, 158, 11, 0.35)' // Rest • amber
        })
        const borders = values.map((_, i) => {
            if (i === personalBestIndex) return '#6366f1'
            if (i === latestIndex) return '#22c55e'
            return '#f59e0b'
        })

        return {
            labels,
            datasets: [
                {
                    label: 'Net peak vertical force (N)',
                    data: values,
                    backgroundColor: bgs,
                    borderColor: borders,
                    borderWidth: 1.5,
                    borderRadius: 6,
                    barPercentage: barPct,
                    categoryPercentage: catPct,
                },
            ],
        }
    }, [labels, values, personalBestIndex, latestIndex])

    const relData = useMemo(() => {
        const count = Math.max(1, relValues.length)
        const barPct = count > 24 ? 0.4 : count > 12 ? 0.5 : 0.6
        const catPct = count > 24 ? 0.8 : count > 12 ? 0.85 : 0.9
        const bgs = relValues.map((_, i) => {
            if (i === personalBestIndexRel) return 'rgba(99, 102, 241, 0.75)'
            if (i === latestIndexRel) return 'rgba(34, 197, 94, 0.75)'
            return 'rgba(99, 102, 241, 0.35)'
        })
        const borders = relValues.map((_, i) => {
            if (i === personalBestIndexRel) return '#6366f1'
            if (i === latestIndexRel) return '#22c55e'
            return '#6366f1'
        })
        return {
            labels,
            datasets: [
                {
                    label: 'Relative strength (N/kg)',
                    data: relValues,
                    backgroundColor: bgs,
                    borderColor: borders,
                    borderWidth: 1.5,
                    borderRadius: 6,
                    barPercentage: barPct,
                    categoryPercentage: catPct,
                },
            ],
        }
    }, [labels, relValues, personalBestIndexRel, latestIndexRel])

    const options = useMemo<ChartOptions<'bar'>>(() => {
        const tierMax = Math.max(
            0,
            imtpTierLines.developing ?? 0,
            imtpTierLines.advanced ?? 0,
            imtpTierLines.elite ?? 0,
        )
        const dataMax = values.length ? Math.max(...values) : 0
        const yMax = computeNiceAxisMax(Math.max(tierMax, dataMax))
        return ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: items => (items.length ? String(items[0].label) : ''),
                    label: item => {
                        const idx = item.dataIndex
                        const base = `${numberFmt.format(Number(item.raw as number))} N`
                        const tags = [
                            idx === latestIndex ? 'Latest' : null,
                            idx === personalBestIndex ? 'PB' : null,
                        ].filter(Boolean)
                        return tags.length ? `${base} • ${tags.join(' • ')}` : base
                    },
                },
                displayColors: false,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' },
            },
            y: {
                beginAtZero: true,
                min: 0,
                max: yMax,
                grid: { color: 'rgba(51,65,85,0.25)' },
                ticks: {
                    color: '#94a3b8',
                    callback: (value) => `${numberFmt.format(Number(value))} N`,
                },
            },
        },
    })
    }, [numberFmt, latestIndex, personalBestIndex, values, imtpTierLines])

    const relOptions = useMemo<ChartOptions<'bar'>>(() => {
        const tierMax = Math.max(
            0,
            relTierLines.developing ?? 0,
            relTierLines.advanced ?? 0,
            relTierLines.elite ?? 0,
        )
        const dataMax = relValues.length ? Math.max(...relValues) : 0
        const yMax = computeNiceAxisMax(Math.max(tierMax, dataMax))
        return ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: items => (items.length ? String(items[0].label) : ''),
                    label: item => `${numberFmtRel.format(Number(item.raw as number))} N/kg` + (() => {
                        const idx = item.dataIndex
                        const tags = [
                            idx === latestIndexRel ? 'Latest' : null,
                            idx === personalBestIndexRel ? 'PB' : null,
                        ].filter(Boolean)
                        return tags.length ? ` • ${tags.join(' • ')}` : ''
                    })(),
                },
                displayColors: false,
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: {
                beginAtZero: true,
                min: 0,
                max: yMax,
                grid: { color: 'rgba(51,65,85,0.25)' },
                ticks: {
                    color: '#94a3b8',
                    callback: (value) => `${numberFmtRel.format(Number(value))} N/kg`,
                },
            },
        },
    })
    }, [numberFmtRel, latestIndexRel, personalBestIndexRel, relValues, relTierLines])

    // Chart.js plugins to draw dotted tier lines
    const netTierLinesPlugin = useMemo<Plugin<'bar'>>(() => ({
        id: 'netTierLines',
        afterDraw(chart) {
            const y = chart.scales.y
            const area = chart.chartArea
            const ctx = chart.ctx
            const draw = (val: number | null, color: string, label: string) => {
                if (val === null || !Number.isFinite(val)) return
                const py = y.getPixelForValue(val)
                if (py < area.top || py > area.bottom) return
                ctx.save()
                ctx.setLineDash([4, 4])
                ctx.strokeStyle = color
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(area.left, py)
                ctx.lineTo(area.right, py)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = color
                ctx.font = '10px sans-serif'
                ctx.textAlign = 'right'
                ctx.fillText(label, area.right - 4, py - 2)
                ctx.restore()
            }
            draw(imtpTierLines.developing, '#94a3b8', 'Developing')
            draw(imtpTierLines.advanced, '#fbbf24', 'Advanced')
            draw(imtpTierLines.elite, '#22d3ee', 'Elite')
        },
    }), [imtpTierLines])

    const relTierLinesPlugin = useMemo<Plugin<'bar'>>(() => ({
        id: 'relTierLines',
        afterDraw(chart) {
            const y = chart.scales.y
            const area = chart.chartArea
            const ctx = chart.ctx
            const draw = (val: number | null, color: string, label: string) => {
                if (val === null || !Number.isFinite(val)) return
                const py = y.getPixelForValue(val)
                if (py < area.top || py > area.bottom) return
                ctx.save()
                ctx.setLineDash([4, 4])
                ctx.strokeStyle = color
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(area.left, py)
                ctx.lineTo(area.right, py)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = color
                ctx.font = '10px sans-serif'
                ctx.textAlign = 'right'
                ctx.fillText(label, area.right - 4, py - 2)
                ctx.restore()
            }
            draw(relTierLines.developing, '#94a3b8', 'Developing')
            draw(relTierLines.advanced, '#fbbf24', 'Advanced')
            draw(relTierLines.elite, '#22d3ee', 'Elite')
        },
    }), [relTierLines])

    return (
        <>
        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Forceplates • IMTP</div>
                    <h3 className="mt-1 text-lg sm:text-xl font-semibold text-white">IMTP Net Peak Force</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-prose">
                        Explosive strength snapshot. Track your peak force, consistency, and momentum over time.
                    </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[11px] text-gray-400">Tier</div>
                        <div className="mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                             style={{
                                 borderColor: tier === 'Elite' ? '#22d3ee' : tier === 'Advanced' ? '#fbbf24' : tier === 'Developing' ? '#cbd5e1' : '#a78bfa',
                                 color: tier === 'Elite' ? '#67e8f9' : tier === 'Advanced' ? '#fcd34d' : tier === 'Developing' ? '#e2e8f0' : '#c4b5fd',
                                 background: 'rgba(255,255,255,0.03)'
                             }}>
                            {tier}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-400">Trend</div>
                        <div className={`text-sm font-medium ${shortTermTrendPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {shortTermTrendPct >= 0 ? '▲' : '▼'} {Math.abs(shortTermTrendPct).toFixed(1)}%
                        </div>
                    </div>
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-sky-500/20 border border-indigo-400/30 grid place-items-center">
                        <div className="text-white text-xl sm:text-2xl font-bold tabular-nums">{overallPercentile ?? rating}</div>
                    </div>
                </div>
            </div>

            {/* Key stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">Latest</div>
                    <div className="text-white font-semibold">{numberFmt.format(latestValue)} N</div>
                    <div className="text-[10px] text-gray-500">{latestDate ?? '—'}</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">Personal Best</div>
                    <div className="text-white font-semibold">{numberFmt.format(personalBest)} N</div>
                    <div className="text-[10px] text-emerald-400">PB</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">30‑day Avg</div>
                    <div className="text-white font-semibold">{numberFmt.format(avg30d)} N</div>
                    <div className="text-[10px] text-gray-500">{sessions30d} sessions</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">Consistency</div>
                    <div className="text-white font-semibold">
                        {(() => {
                            const recent = values.slice(-8).filter(v => v > 0)
                            if (!recent.length) return '—'
                            const mean = recent.reduce((a, b) => a + b, 0) / recent.length
                            const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length
                            const sd = Math.sqrt(variance)
                            const cv = mean > 0 ? (sd / mean) * 100 : 0
                            return `${cv.toFixed(1)}% CV`
                        })()}
                    </div>
                    <div className="text-[10px] text-gray-500">last 8</div>
                </div>
            </div>

            {/* Progress to next tier */}
            <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <div>Progress to {nextTierLabel}</div>
                    <div className="text-white">{progressToNextTierPct}%</div>
                </div>
                <div className="mt-2 h-2 rounded bg-white/5 overflow-hidden border border-gray-800">
                    <div className="h-full bg-gradient-to-r from-indigo-400/70 via-sky-400/70 to-emerald-400/70"
                         style={{ width: `${progressToNextTierPct}%` }} />
                </div>
            </div>

            <div ref={containerRef} className="w-full mt-4">
                {loading && (
                    <div className="rounded-lg border border-gray-800 bg-black/40 p-6 text-center text-gray-400 text-sm">
                        Loading IMTP data...
                    </div>
                )}
                {error && (
                    <div className="rounded-lg border border-red-900 bg-red-900/20 p-4 text-sm text-red-200">
                        {error}
                    </div>
                )}
                {!loading && !error && netPeakStats.length === 0 && (
                    <div className="text-xs text-gray-400">No IMTP tests yet.</div>
                )}
                {!loading && !error && netPeakStats.length > 0 && (
                    <div style={{ height }}>
                        <Bar data={data} options={options} plugins={[netTierLinesPlugin]} />
                    </div>
                )}
            </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 shadow-sm mt-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Forceplates • IMTP</div>
                    <h3 className="mt-1 text-lg sm:text-xl font-semibold text-white">IMTP Relative Strength</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-prose">
                        Strength-to-weight snapshot. Track your relative output, consistency, and momentum.
                    </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[11px] text-gray-400">Tier</div>
                        <div className="mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                             style={{
                                 borderColor: tierRel === 'Elite' ? '#22d3ee' : tierRel === 'Advanced' ? '#fbbf24' : tierRel === 'Developing' ? '#cbd5e1' : '#a78bfa',
                                 color: tierRel === 'Elite' ? '#67e8f9' : tierRel === 'Advanced' ? '#fcd34d' : tierRel === 'Developing' ? '#e2e8f0' : '#c4b5fd',
                                 background: 'rgba(255,255,255,0.03)'
                             }}>
                            {tierRel}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-400">Trend</div>
                        <div className={`text-sm font-medium ${shortTermTrendPctRel >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {shortTermTrendPctRel >= 0 ? '▲' : '▼'} {Math.abs(shortTermTrendPctRel).toFixed(1)}%
                        </div>
                    </div>
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-sky-500/20 border border-indigo-400/30 grid place-items-center">
                        <div className="text-white text-xl sm:text-2xl font-bold tabular-nums">{relOverallPercentile ?? ratingRel}</div>
                    </div>
                </div>
            </div>

            {/* Key stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">Latest</div>
                    <div className="text-white font-semibold">{numberFmtRel.format(latestRelValue)} N/kg</div>
                    <div className="text-[10px] text-gray-500">{latestRelDate ?? '—'}</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">Personal Best</div>
                    <div className="text-white font-semibold">{numberFmtRel.format(personalBestRel)} N/kg</div>
                    <div className="text-[10px] text-emerald-400">PB</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">30‑day Avg</div>
                    <div className="text-white font-semibold">{numberFmtRel.format(avg30dRel)} N/kg</div>
                    <div className="text-[10px] text-gray-500">{sessions30dRel} sessions</div>
                </div>
                <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
                    <div className="text-[11px] text-gray-400">Consistency</div>
                    <div className="text-white font-semibold">
                        {(() => {
                            const recent = relValues.slice(-8).filter(v => v > 0)
                            if (!recent.length) return '—'
                            const mean = recent.reduce((a, b) => a + b, 0) / recent.length
                            const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length
                            const sd = Math.sqrt(variance)
                            const cv = mean > 0 ? (sd / mean) * 100 : 0
                            return `${cv.toFixed(1)}% CV`
                        })()}
                    </div>
                    <div className="text-[10px] text-gray-500">last 8</div>
                </div>
            </div>

            {/* Progress to next tier */}
            <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <div>Progress to {nextTierLabelRel}</div>
                    <div className="text-white">{progressToNextTierPctRel}%</div>
                </div>
                <div className="mt-2 h-2 rounded bg-white/5 overflow-hidden border border-gray-800">
                    <div className="h-full bg-gradient-to-r from-indigo-400/70 via-sky-400/70 to-emerald-400/70"
                         style={{ width: `${progressToNextTierPctRel}%` }} />
                </div>
            </div>

            <div className="w-full mt-4" style={{ height }}>
                {loading && (
                    <div className="rounded-lg border border-gray-800 bg-black/40 p-6 text-center text-gray-400 text-sm">
                        Loading IMTP data...
                    </div>
                )}
                {!loading && netPeakStats.length === 0 && (
                    <div className="text-xs text-gray-400">No IMTP tests yet.</div>
                )}
                {!loading && netPeakStats.length > 0 && (
                    <Bar data={relData} options={relOptions} plugins={[relTierLinesPlugin]} />
                )}
            </div>
        </div>
        </>
    )
}

export default ImtpNetPeakCharts