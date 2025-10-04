'use client'
import React from 'react'
import ValdProfile from '@/components/athlete/vald/vald-profile'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <ValdProfile />
      </div>
    </div>
  )
}