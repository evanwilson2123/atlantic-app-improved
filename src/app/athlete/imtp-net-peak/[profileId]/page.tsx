import React from 'react'
import ImtpNetPeakCharts from '@/components/athlete/vald/imtp-net-peak/ImtpNetPeakCharts'

const page = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="rounded-2xl border border-gray-800 bg-black p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Isometric Mid‑Thigh Pull</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-400">Net peak vertical force across tests</p>
          </div>
        </div>
      </div>
      <ImtpNetPeakCharts />
    </div>
  )
}

export default page