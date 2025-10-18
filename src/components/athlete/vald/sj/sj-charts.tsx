"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
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

type SjTest = {
  recordedUTC: string
  BODYMASS_RELATIVE_TAKEOFF_POWER_trial_value: number | null // W/kg
  PEAK_TAKEOFF_POWER_trial_value: number | null // W
}

function computeNiceAxisMax(value: number): number {
  const v = Math.max(1, value)
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const step = mag / 2
  return Math.ceil((v * 1.05) / step) * step
}

const SjCharts = () => {
  const { profileId } = useParams<{ profileId: string }>()

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tests, setTests] = useState<SjTest[]>([])
  const [percentileRel, setPercentileRel] = useState<number | null>(null)
  const [percentilePeak, setPercentilePeak] = useState<number | null>(null)

  const [relTierLines, setRelTierLines] = useState<{ developing: number | null; advanced: number | null; elite: number | null }>({ developing: null, advanced: null, elite: null })
  const [peakTierLines, setPeakTierLines] = useState<{ developing: number | null; advanced: number | null; elite: number | null }>({ developing: null, advanced: null, elite: null })

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
        const res = await fetch(`/api/vald/sj/chart/${profileId}`)
        if (!res.ok) throw new Error('Failed to fetch SJ charts')
        const json = await res.json()
        setTests(json?.sjTests ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    if (profileId) fetchData(); else setLoading(false)
  }, [profileId])

  // Load percentile reference and compute tier lines and percentiles for latest value
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
    const percentRank = (value: number, ref: Record<number, number>): number => {
      const points = Object.entries(ref)
        .map(([k, v]) => [Number(k), Number(v)] as [number, number])
        .filter(([p, v]) => Number.isFinite(p) && Number.isFinite(v))
        .sort((a, b) => a[1] - b[1])
      if (points.length === 0) return 0
      const first = points[0]
      const last = points[points.length - 1]
      if (value <= first[1]) return first[0]
      if (value >= last[1]) return last[0]
      for (let i = 0; i < points.length - 1; i++) {
        const [p1, v1] = points[i]
        const [p2, v2] = points[i + 1]
        if (value >= v1 && value <= v2) {
          if (v2 === v1) return p2
          const t = (value - v1) / (v2 - v1)
          return p1 + t * (p2 - p1)
        }
      }
      return 0
    }

    const run = async () => {
      try {
        const res = await fetch('/hp_obp_percentiles.json')
        if (!res.ok) return
        const json = await res.json() as Record<string, unknown>
        const relRefRaw = json['peak_power_/_bm_[w/kg]_mean_sj'] as Record<string, number> | undefined
        const peakRefRaw = json['peak_power_[w]_mean_sj'] as Record<string, number> | undefined
        if (relRefRaw) {
          const relRef: Record<number, number> = Object.fromEntries(Object.entries(relRefRaw).map(([k, v]) => [Number(k), Number(v)]))
          setRelTierLines({
            developing: valueAtPercentile(60, relRef),
            advanced: valueAtPercentile(75, relRef),
            elite: valueAtPercentile(90, relRef),
          })
          const latest = tests.length ? Number(tests[0].BODYMASS_RELATIVE_TAKEOFF_POWER_trial_value) || 0 : 0
          setPercentileRel(Math.round(Math.max(0, Math.min(100, percentRank(latest, relRef)))))
        }
        if (peakRefRaw) {
          const peakRef: Record<number, number> = Object.fromEntries(Object.entries(peakRefRaw).map(([k, v]) => [Number(k), Number(v)]))
          setPeakTierLines({
            developing: valueAtPercentile(60, peakRef),
            advanced: valueAtPercentile(75, peakRef),
            elite: valueAtPercentile(90, peakRef),
          })
          const latest = tests.length ? Number(tests[0].PEAK_TAKEOFF_POWER_trial_value) || 0 : 0
          setPercentilePeak(Math.round(Math.max(0, Math.min(100, percentRank(latest, peakRef)))))
        }
      } catch {}
    }
    run()
  }, [tests])

  const labels = useMemo(() => tests.map(s => new Date(s.recordedUTC).toLocaleDateString()).reverse(), [tests])
  const valuesRel = useMemo(() => tests.map(s => Number(s.BODYMASS_RELATIVE_TAKEOFF_POWER_trial_value) || 0).reverse(), [tests])
  const valuesPeak = useMemo(() => tests.map(s => Number(s.PEAK_TAKEOFF_POWER_trial_value) || 0).reverse(), [tests])
  const fmtRel = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }), [])
  const fmtPeak = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }), [])

  function tierColors(value: number, lines: { developing: number | null; advanced: number | null; elite: number | null }) {
    const eliteC = { bg: 'rgba(34, 211, 238, 0.45)', border: '#22d3ee' }
    const advC = { bg: 'rgba(251, 191, 36, 0.45)', border: '#fbbf24' }
    const devC = { bg: 'rgba(203, 213, 225, 0.45)', border: '#cbd5e1' }
    const fndC = { bg: 'rgba(167, 139, 250, 0.35)', border: '#a78bfa' }
    const { developing, advanced, elite } = lines
    if (elite !== null && value >= elite) return eliteC
    if (advanced !== null && value >= advanced) return advC
    if (developing !== null && value >= developing) return devC
    return fndC
  }

  // Helpers to compute insights for a series
  function seriesInsights(values: number[], dates: string[]) {
    if (values.length === 0) {
      return {
        latestValue: 0,
        latestDate: null as string | null,
        personalBest: 0,
        personalBestIndex: -1,
        latestIndex: -1,
        avg30d: 0,
        sessions30d: 0,
        trendPct: 0,
      }
    }
    const latestIndex = values.length - 1
    const latestValue = values[latestIndex]
    const latestDate = dates[latestIndex]
    let pb = 0
    let pbIdx = -1
    values.forEach((v, i) => { if (v > pb) { pb = v; pbIdx = i } })
    const now = Date.now()
    const day30 = 30 * 24 * 60 * 60 * 1000
    const recentIdx: number[] = []
    dates.forEach((d, i) => { if (now - new Date(d).getTime() <= day30) recentIdx.push(i) })
    const vals30 = recentIdx.map(i => values[i]).filter(v => v > 0)
    const avg30d = vals30.length ? vals30.reduce((a, b) => a + b, 0) / vals30.length : 0
    const last3 = values.slice(-3).filter(v => v > 0)
    const prev3 = values.slice(-6, -3).filter(v => v > 0)
    const last3Avg = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : latestValue
    const prev3Avg = prev3.length ? prev3.reduce((a, b) => a + b, 0) / prev3.length : last3Avg
    const trendPct = prev3Avg > 0 ? ((last3Avg - prev3Avg) / prev3Avg) * 100 : 0
    return {
      latestValue,
      latestDate,
      personalBest: pb,
      personalBestIndex: pbIdx,
      latestIndex,
      avg30d,
      sessions30d: vals30.length,
      trendPct,
    }
  }

  const relInsights = useMemo(() => seriesInsights(valuesRel, labels), [valuesRel, labels])
  const peakInsights = useMemo(() => seriesInsights(valuesPeak, labels), [valuesPeak, labels])

  const relData = useMemo(() => {
    const count = Math.max(1, valuesRel.length)
    const barPct = count > 24 ? 0.4 : count > 12 ? 0.5 : 0.6
    const catPct = count > 24 ? 0.8 : count > 12 ? 0.85 : 0.9
    return {
      labels,
      datasets: [{
        label: 'Body‑mass relative takeoff power (W/kg)',
        data: valuesRel,
        backgroundColor: valuesRel.map(v => tierColors(v, relTierLines).bg),
        borderColor: valuesRel.map(v => tierColors(v, relTierLines).border),
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: barPct,
        categoryPercentage: catPct,
      }],
    }
  }, [labels, valuesRel])

  const peakData = useMemo(() => {
    const count = Math.max(1, valuesPeak.length)
    const barPct = count > 24 ? 0.4 : count > 12 ? 0.5 : 0.6
    const catPct = count > 24 ? 0.8 : count > 12 ? 0.85 : 0.9
    return {
      labels,
      datasets: [{
        label: 'Peak takeoff power (W)',
        data: valuesPeak,
        backgroundColor: valuesPeak.map(v => tierColors(v, peakTierLines).bg),
        borderColor: valuesPeak.map(v => tierColors(v, peakTierLines).border),
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: barPct,
        categoryPercentage: catPct,
      }],
    }
  }, [labels, valuesPeak])

  const relOptions = useMemo<ChartOptions<'bar'>>(() => {
    const tierMax = Math.max(0, relTierLines.developing ?? 0, relTierLines.advanced ?? 0, relTierLines.elite ?? 0)
    const dataMax = valuesRel.length ? Math.max(...valuesRel) : 0
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
              const base = `${fmtRel.format(Number(item.raw as number))} W/kg`
              const tags = [idx === relInsights.latestIndex ? 'Latest' : null, idx === relInsights.personalBestIndex ? 'PB' : null].filter(Boolean)
              return tags.length ? `${base} • ${tags.join(' • ')}` : base
            },
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
          ticks: { color: '#94a3b8', callback: (v) => `${fmtRel.format(Number(v))} W/kg` },
        },
      },
    })
  }, [fmtRel, valuesRel, relTierLines, relInsights.latestIndex, relInsights.personalBestIndex])

  const peakOptions = useMemo<ChartOptions<'bar'>>(() => {
    const tierMax = Math.max(0, peakTierLines.developing ?? 0, peakTierLines.advanced ?? 0, peakTierLines.elite ?? 0)
    const dataMax = valuesPeak.length ? Math.max(...valuesPeak) : 0
    const yMax = computeNiceAxisMax(Math.max(tierMax, dataMax))
    return ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
        y: {
          beginAtZero: true,
          min: 0,
          max: yMax,
          grid: { color: 'rgba(51,65,85,0.25)' },
          ticks: { color: '#94a3b8', callback: (v) => `${fmtPeak.format(Number(v))} W` },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: items => (items.length ? String(items[0].label) : ''),
            label: item => {
              const idx = item.dataIndex
              const base = `${fmtPeak.format(Number(item.raw as number))} W`
              const tags = [idx === peakInsights.latestIndex ? 'Latest' : null, idx === peakInsights.personalBestIndex ? 'PB' : null].filter(Boolean)
              return tags.length ? `${base} • ${tags.join(' • ')}` : base
            },
          },
          displayColors: false,
        },
        legend: { display: false },
      },
    })
  }, [fmtPeak, valuesPeak, peakTierLines, peakInsights.latestIndex, peakInsights.personalBestIndex])

  const relTierLinesPlugin = useMemo<Plugin<'bar'>>(() => ({
    id: 'sjRelTierLines',
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

  const peakTierLinesPlugin = useMemo<Plugin<'bar'>>(() => ({
    id: 'sjPeakTierLines',
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
      draw(peakTierLines.developing, '#94a3b8', 'Developing')
      draw(peakTierLines.advanced, '#fbbf24', 'Advanced')
      draw(peakTierLines.elite, '#22d3ee', 'Elite')
    },
  }), [peakTierLines])

  return (
    <div className="space-y-5">
      {/* Relative power card */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Forceplates • SJ</div>
            <h3 className="mt-1 text-lg sm:text-xl font-semibold text-white">SJ Body‑Mass Relative Power</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-prose">Strength-to-weight snapshot. Track relative output and momentum.</p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-gray-400">Tier</div>
              {/* Tier name from percentile */}
              <div className="mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                   style={{
                     borderColor: (percentileRel ?? 0) >= 90 ? '#22d3ee' : (percentileRel ?? 0) >= 75 ? '#fbbf24' : (percentileRel ?? 0) >= 60 ? '#cbd5e1' : '#a78bfa',
                     color: (percentileRel ?? 0) >= 90 ? '#67e8f9' : (percentileRel ?? 0) >= 75 ? '#fcd34d' : (percentileRel ?? 0) >= 60 ? '#e2e8f0' : '#c4b5fd',
                     background: 'rgba(255,255,255,0.03)'
                   }}>
                {(percentileRel ?? 0) >= 90 ? 'Elite' : (percentileRel ?? 0) >= 75 ? 'Advanced' : (percentileRel ?? 0) >= 60 ? 'Developing' : 'Foundational'}
              </div>
              <div className="mt-1 text-[11px] text-gray-400">Trend</div>
              <div className={`text-sm font-medium ${relInsights.trendPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {relInsights.trendPct >= 0 ? '▲' : '▼'} {Math.abs(relInsights.trendPct).toFixed(1)}%
              </div>
            </div>
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-sky-500/20 border border-indigo-400/30 grid place-items-center">
              <div className="text-white text-xl sm:text-2xl font-bold tabular-nums">{percentileRel ?? 0}</div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">Latest</div>
            <div className="text-white font-semibold">{fmtRel.format(relInsights.latestValue)} W/kg</div>
            <div className="text-[10px] text-gray-500">{relInsights.latestDate ?? '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">Personal Best</div>
            <div className="text-white font-semibold">{fmtRel.format(relInsights.personalBest)} W/kg</div>
            <div className="text-[10px] text-emerald-400">PB</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">30‑day Avg</div>
            <div className="text-white font-semibold">{fmtRel.format(relInsights.avg30d)} W/kg</div>
            <div className="text-[10px] text-gray-500">{relInsights.sessions30d} sessions</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">Consistency</div>
            <div className="text-white font-semibold">
              {(() => {
                const recent = valuesRel.slice(-8).filter(v => v > 0)
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
        <div ref={containerRef} className="w-full mt-4" style={{ height }}>
          {loading && (
            <div className="rounded-lg border border-gray-800 bg-black/40 p-6 text-center text-gray-400 text-sm">Loading SJ data...</div>
          )}
          {!loading && !!tests.length && (
            <Bar data={relData} options={relOptions} plugins={[relTierLinesPlugin]} />
          )}
          {!loading && !tests.length && (
            <div className="text-xs text-gray-400">No SJ tests yet.</div>
          )}
        </div>
      </div>

      {/* Peak power card */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-white/5 to-transparent p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Forceplates • SJ</div>
            <h3 className="mt-1 text-lg sm:text-xl font-semibold text-white">SJ Peak Takeoff Power</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-prose">Explosive takeoff power across SJ sessions.</p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-gray-400">Tier</div>
              <div className="mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                   style={{
                     borderColor: (percentilePeak ?? 0) >= 90 ? '#22d3ee' : (percentilePeak ?? 0) >= 75 ? '#fbbf24' : (percentilePeak ?? 0) >= 60 ? '#cbd5e1' : '#a78bfa',
                     color: (percentilePeak ?? 0) >= 90 ? '#67e8f9' : (percentilePeak ?? 0) >= 75 ? '#fcd34d' : (percentilePeak ?? 0) >= 60 ? '#e2e8f0' : '#c4b5fd',
                     background: 'rgba(255,255,255,0.03)'
                   }}>
                {(percentilePeak ?? 0) >= 90 ? 'Elite' : (percentilePeak ?? 0) >= 75 ? 'Advanced' : (percentilePeak ?? 0) >= 60 ? 'Developing' : 'Foundational'}
              </div>
              <div className="mt-1 text-[11px] text-gray-400">Trend</div>
              <div className={`text-sm font-medium ${peakInsights.trendPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {peakInsights.trendPct >= 0 ? '▲' : '▼'} {Math.abs(peakInsights.trendPct).toFixed(1)}%
              </div>
            </div>
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-sky-500/20 border border-indigo-400/30 grid place-items-center">
              <div className="text-white text-xl sm:text-2xl font-bold tabular-nums">{percentilePeak ?? 0}</div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">Latest</div>
            <div className="text-white font-semibold">{fmtPeak.format(peakInsights.latestValue)} W</div>
            <div className="text-[10px] text-gray-500">{peakInsights.latestDate ?? '—'}</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">Personal Best</div>
            <div className="text-white font-semibold">{fmtPeak.format(peakInsights.personalBest)} W</div>
            <div className="text-[10px] text-emerald-400">PB</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">30‑day Avg</div>
            <div className="text-white font-semibold">{fmtPeak.format(peakInsights.avg30d)} W</div>
            <div className="text-[10px] text-gray-500">{peakInsights.sessions30d} sessions</div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-black/40 p-3">
            <div className="text-[11px] text-gray-400">Consistency</div>
            <div className="text-white font-semibold">
              {(() => {
                const recent = valuesPeak.slice(-8).filter(v => v > 0)
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
        <div className="w-full mt-4" style={{ height }}>
          {loading && (
            <div className="rounded-lg border border-gray-800 bg-black/40 p-6 text-center text-gray-400 text-sm">Loading SJ data...</div>
          )}
          {!loading && !!tests.length && (
            <Bar data={peakData} options={peakOptions} plugins={[peakTierLinesPlugin]} />
          )}
          {!loading && !tests.length && (
            <div className="text-xs text-gray-400">No SJ tests yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SjCharts