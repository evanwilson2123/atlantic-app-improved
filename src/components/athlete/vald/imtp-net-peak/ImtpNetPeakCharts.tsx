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
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type ImtpNetPeakStat = {
    recordedUTC: string
    NET_PEAK_VERTICAL_FORCE_trial_value: number | null
}

const ImtpNetPeakCharts = () => {

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [netPeakStats, setNetPeakStats] = useState<ImtpNetPeakStat[]>([]);
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

    const labels = useMemo(() => netPeakStats.map(s => new Date(s.recordedUTC).toLocaleDateString()), [netPeakStats])
    const values = useMemo(() => netPeakStats.map(s => Number(s.NET_PEAK_VERTICAL_FORCE_trial_value) || 0), [netPeakStats])
    const numberFmt = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }), [])

    const data = useMemo(() => {
        const count = Math.max(1, values.length)
        // Adjust bar/category percentage based on number of bars so it stays readable
        const barPct = count > 24 ? 0.4 : count > 12 ? 0.5 : 0.6
        const catPct = count > 24 ? 0.8 : count > 12 ? 0.85 : 0.9
        return {
            labels,
            datasets: [
                {
                    label: 'Net peak vertical force (N)',
                    data: values,
                    backgroundColor: 'rgba(245, 158, 11, 0.55)',
                    borderColor: '#f59e0b',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: barPct,
                    categoryPercentage: catPct,
                },
            ],
        }
    }, [labels, values])

    const options = useMemo<ChartOptions<'bar'>>(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: items => (items.length ? String(items[0].label) : ''),
                    label: item => `${numberFmt.format(Number(item.raw as number))} N`,
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
                grid: { color: 'rgba(51,65,85,0.25)' },
                ticks: {
                    color: '#94a3b8',
                    callback: (value) => `${numberFmt.format(Number(value))} N`,
                },
            },
        },
    }), [numberFmt])

    return (
        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Forceplates • IMTP</div>
                    <h3 className="mt-1 text-lg sm:text-xl font-semibold text-white">IMTP Net Peak Force</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-prose">
                        The highest vertical force produced during the isometric mid‑thigh pull test. It reflects
                        maximal strength capacity; higher values typically indicate greater force‑producing ability.
                    </p>
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
                        <Bar data={data} options={options} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default ImtpNetPeakCharts