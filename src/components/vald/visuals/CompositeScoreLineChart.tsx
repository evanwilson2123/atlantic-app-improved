"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartDataset,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

type HistoryPoint = { score: number; date: string | Date }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Chart.js is registered above

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`
}

function colorForScore(score: number) {
  const p = clamp(score, 0, 100)
  const hue = 0 + (130 * (p / 100))
  return hsl(hue, 80, 50)
}

function colorForScoreAlpha(score: number, alpha: number) {
  const p = clamp(score, 0, 100)
  const hue = 0 + (130 * (p / 100))
  return `hsl(${Math.round(hue)} 80% 50% / ${alpha})`
}

export default function CompositeScoreLineChart({ history }: { history: HistoryPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerW, setContainerW] = useState<number>(360)
  const [containerH, setContainerH] = useState<number>(160)

  // Observe container width to make chart responsive
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => {
      const rect = el.getBoundingClientRect()
      const cw = Math.max(240, Math.round(rect.width))
      const ch = Math.round(clamp(cw * 0.45, 140, 360))
      setContainerW(cw)
      setContainerH(ch)
    }
    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const data = useMemo(() => {
    if (!Array.isArray(history)) return [] as { d: number; s: number }[]
    const parsed = history
      .map(p => {
        const d = p?.date instanceof Date ? p.date.getTime() : new Date(String(p?.date)).getTime()
        const s = Number(p?.score)
        return { d, s }
      })
      .filter(p => Number.isFinite(p.d) && Number.isFinite(p.s))
      .sort((a, b) => a.d - b.d)
    return parsed
  }, [history])

  const height = containerH

  function formatDateShort(ms: number) {
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const domainY = useMemo(() => {
    if (data.length === 0) return [0, 100]
    const min = Math.min(...data.map(p => p.s))
    const max = Math.max(...data.map(p => p.s))
    // pad a bit and clamp to [0,100]
    const lo = clamp(Math.floor(Math.min(100, Math.max(0, min - 5))), 0, 100)
    const hi = clamp(Math.ceil(Math.max(0, Math.min(100, max + 5))), 0, 100)
    return [lo, Math.max(hi, lo + 1)] as const
  }, [data])
  const labels = useMemo(() => data.map(p => p.d), [data])

  const chartOptions = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: items => {
            if (!items.length) return ''
            const idx = items[0].dataIndex
            return formatDateShort(labels[idx])
          },
          label: item => `score ${Number(item.parsed.y).toFixed(1)}`,
        },
        displayColors: false,
      },
    },
    elements: {
      line: {
        tension: 0.22,
        borderWidth: ctx => Math.max(1.5, Math.min(3, Math.round((ctx.chart.width || 320) * 0.0035))),
        fill: true,
      },
      point: {
        radius: ctx => Math.max(2, Math.min(4, Math.round((ctx.chart.width || 320) * 0.006))),
        hitRadius: 8,
        hoverRadius: ctx => Math.max(3, Math.min(5, Math.round((ctx.chart.width || 320) * 0.008))),
        borderWidth: 0.75,
        borderColor: '#0B0F19',
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: { color: '#334155', drawBorder: true, borderColor: '#475569', borderWidth: 1, tickLength: 4 },
        ticks: {
          maxTicksLimit: Math.min(4, labels.length || 4),
          color: '#64748b',
          callback: (val) => {
            const idx = typeof val === 'string' ? Number(val) : (val as number)
            return formatDateShort(labels[idx])
          },
          font: ctx => ({ size: Math.max(9, Math.min(12, Math.round((ctx.chart.width || 320) * 0.028))) }),
        },
      },
      y: {
        min: domainY[0],
        max: domainY[1],
        grid: { color: 'rgba(51,65,85,0.25)', drawBorder: true, borderColor: '#475569' },
        ticks: {
          color: '#64748b',
          stepSize: 25,
          font: ctx => ({ size: Math.max(9, Math.min(12, Math.round((ctx.chart.width || 320) * 0.026))) }),
        },
      },
    },
  }), [domainY, labels])

  const chartData = useMemo(() => {
    const scores = data.map(p => clamp(p.s, 0, 100))
    const dataset: ChartDataset<'line', number[]> = {
      data: scores,
      segment: {
        borderColor: ctx => colorForScore(Number(ctx.p1.parsed.y ?? 0)),
        backgroundColor: ctx => colorForScoreAlpha(Number(ctx.p1.parsed.y ?? 0), 0.12),
      },
      pointBackgroundColor: ctx => colorForScore((ctx.raw as number) ?? 0),
      pointHoverBackgroundColor: ctx => colorForScore((ctx.raw as number) ?? 0),
    }
    return { labels: labels.map(ms => new Date(ms).toISOString()), datasets: [dataset] }
  }, [data, labels])

  if (data.length === 0) {
    return (
      <div className="text-xs text-gray-400">No history yet.</div>
    )
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      <Line options={chartOptions} data={chartData} />
    </div>
  )
}


