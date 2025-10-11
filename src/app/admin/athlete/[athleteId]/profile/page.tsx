import AthleteProfile from '@/components/athlete/AthleteProfile'
import React from 'react'

const page = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <AthleteProfile />
      </div>
    </div>
  )
}

export default page