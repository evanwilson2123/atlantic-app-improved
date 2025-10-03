import AthleteProfile from '@/components/athlete/AthleteProfile'
import React from 'react'

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <AthleteProfile />
      </div>
    </div>
  )
}

export default page