'use client'
import React from 'react'
import ValdProfile from '@/components/athlete/vald/vald-profile'
import CompositeScoreRadarPlot from '@/components/vald/visuals/CompositeScoreRadarPlot'

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <ValdProfile />
        <CompositeScoreRadarPlot />
      </div>
    </div>
  )
}