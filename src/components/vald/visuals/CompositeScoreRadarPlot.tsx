"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type PercentilesResponse = {
  impt_net_peak_vertical_force: number
  relative_strength_imtp: number
  sj_peak_power_w_bw: number
  peak_power_ppu: number
  sj_peak_power_w: number
  reactive_strength_index_hj: number
}

const METRICS: Array<{ key: keyof PercentilesResponse; label: string }> = [
  { key: 'impt_net_peak_vertical_force', label: 'IMTP Net Peak' },
  { key: 'relative_strength_imtp', label: 'IMTP Rel Strength' },
  { key: 'sj_peak_power_w_bw', label: 'Peak Power / BW' },
  { key: 'peak_power_ppu', label: 'PPU Peak Force' },
  { key: 'sj_peak_power_w', label: 'SJ Peak Power' },
  { key: 'reactive_strength_index_hj', label: 'HJ RSI' },
]

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const
}

function pathFromPoints(points: Array<readonly [number, number]>) {
  if (!points.length) return ''
  const [firstX, firstY] = points[0]
  const rest = points.slice(1).map(([x, y]) => `L ${x} ${y}`).join(' ')
  return `M ${firstX} ${firstY} ${rest} Z`
}

function cardGradient(percent: number) {
  const p = Math.max(0, Math.min(100, percent))
  if (p >= 85) return 'from-emerald-500/25 via-emerald-400/15 to-emerald-300/5'
  if (p >= 70) return 'from-lime-500/25 via-lime-400/15 to-lime-300/5'
  if (p >= 55) return 'from-sky-500/25 via-sky-400/15 to-sky-300/5'
  if (p >= 40) return 'from-amber-500/25 via-amber-400/15 to-amber-300/5'
  if (p >= 25) return 'from-orange-500/25 via-orange-400/15 to-orange-300/5'
  return 'from-rose-500/25 via-rose-400/15 to-rose-300/5'
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`
}

// Continuous red→green with darkness tied to percentile (higher = greener and darker)
function radarColors(percent: number) {
  const p = Math.max(0, Math.min(100, percent))
  // Hue 0 (red) to ~130 (green)
  const hue = 0 + (130 * (p / 100))
  // Lightness fades from 78% (low) to 48% (high) at center, and 68%→38% at edge
  const centerL = 78 - 30 * (p / 100)
  const edgeL = 68 - 30 * (p / 100)
  const saturation = 80
  return {
    primary: hsl(hue, saturation, edgeL),
    light: hsl(hue, saturation, centerL),
  }
}

const CompositeScoreRadarPlot = () => {
  const [data, setData] = useState<PercentilesResponse | null>(null)
  const { athleteId, profileId } = useParams<{ athleteId: string, profileId: string }>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/vald/composite-score/chart/${profileId}`)
        if (!response.ok) throw new Error('Failed to fetch composite radar data')
        console.log('response', response)
        const json = await response.json()
        console.log('json', json)
        setData(json)
      } catch (err) {
        console.error('Error fetching composite radar data', err)
      }
    }
    if (athleteId) fetchData()
  }, [athleteId])

  const size = 360
  const padding = 28
  const cx = size / 2
  const cy = size / 2
  const maxR = cx - padding
  const levels = [20, 40, 60, 80, 100]

  const points = useMemo(() => {
    if (!data) return [] as Array<readonly [number, number]>
    const n = METRICS.length
    return METRICS.map((m, i) => {
      const value = Math.max(0, Math.min(100, Number(data[m.key] ?? 0)))
      const angle = (2 * Math.PI * i) / n - Math.PI / 2 // start at top
      const r = (value / 100) * maxR
      return polarToCartesian(cx, cy, r, angle)
    })
  }, [data, cx, cy, maxR])

  const axisLines = useMemo(() => {
    const n = METRICS.length
    return METRICS.map((_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2
      const [x, y] = polarToCartesian(cx, cy, maxR, angle)
      return { x1: cx, y1: cy, x2: x, y2: y, angle }
    })
  }, [cx, cy, maxR])

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl border border-gray-800 bg-black p-5 sm:p-7 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Composite Performance (Percentile)</h3>
            <p className="text-xs text-gray-400">Percent ranks (0–100); higher is better.</p>
          </div>
          {data && (
            <div className="shrink-0 inline-flex items-center rounded-full bg-white/10 text-white px-3 py-1 text-lg">
              Composite Score {(Object.values(data).reduce((acc, curr) => acc + curr, 0) / METRICS.length).toFixed(1)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
          {/* Grid levels */}
          {levels.map((p, idx) => {
            const n = METRICS.length
            const r = (p / 100) * maxR
            const ring = Array.from({ length: n }, (_, i) => {
              const angle = (2 * Math.PI * i) / n - Math.PI / 2
              return polarToCartesian(cx, cy, r, angle)
            })
            const d = pathFromPoints(ring)
            return (
              <g key={p}>
                <path d={d} fill="none" stroke={idx === levels.length - 1 ? '#CBD5E1' : '#E5E7EB'} strokeOpacity={idx === levels.length - 1 ? 0.6 : 0.35} />
                {/* ring label at top */}
                {(() => {
                  const [tx, ty] = polarToCartesian(cx, cy, r, -Math.PI / 2)
                  return <text x={tx} y={ty - 3} textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 text-[9px]">{p}</text>
                })()}
              </g>
            )
          })}

          {/* Axes */}
          {axisLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#374151" strokeOpacity={0.8} />
          ))}

          {/* Labels */}
          {axisLines.map((l, i) => {
            const label = METRICS[i].label
            const [lx, ly] = polarToCartesian(cx, cy, maxR + 14, l.angle)
            const textAnchor = Math.cos(l.angle) > 0.1 ? 'start' : Math.cos(l.angle) < -0.1 ? 'end' : 'middle'
            const dy = Math.sin(l.angle) > 0.5 ? 12 : Math.sin(l.angle) < -0.5 ? -6 : 4
            return (
              <text key={label} x={lx} y={ly} textAnchor={textAnchor} className="fill-gray-300 text-[10px]">
                {label}
              </text>
            )
          })}

          {/* Data polygon with dynamic gradient */}
          {points.length > 0 && (
            <>
              {(() => {
                // Mean percentile across metrics for color choice
                const mean = METRICS.reduce((acc, m) => acc + Math.max(0, Math.min(100, Number(data?.[m.key] ?? 0))), 0) / METRICS.length
                const c = radarColors(mean)
                return (
                  <>
                    <defs>
                      <radialGradient id="radarFillDynamic" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={c.light} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={c.primary} stopOpacity="0.15" />
                      </radialGradient>
                    </defs>
                    <path d={pathFromPoints(points)} fill="url(#radarFillDynamic)" stroke={c.primary} strokeWidth={2} />
                  </>
                )
              })()}
            </>
          )}

          {/* Node dots */}
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3} fill="#2563EB" stroke="#ffffff" strokeWidth={1} />
          ))}

          {/* Static fallback gradient (unused when dynamic present) */}
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.15" />
            </radialGradient>
          </defs>
          </svg>

          {/* Metric cards */}
          <div className="space-y-3">
            {METRICS.map((m) => {
              const val = Math.max(0, Math.min(100, Number(data?.[m.key] ?? 0)))
              const grad = cardGradient(val)
              return (
                <div key={m.key as string} className={`relative rounded-xl border border-gray-800 bg-gradient-to-br ${grad} p-3 sm:p-4`}> 
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{m.label}</div>
                      <div className="mt-1 text-[11px] text-gray-300">Top {Math.max(1, (100 - val)).toFixed(0)}%</div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">{val.toFixed(0)}</div>
                  </div>
                  <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
                    <div className="h-full bg-white/80" style={{ width: `${val}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompositeScoreRadarPlot