import CreateAthlete from '@/components/admin/CreateAthlete'
import React from 'react'

const page = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-1/2 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-400/20 to-indigo-400/20 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 blur-3xl" />
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create athlete</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">Add a new athlete with basic details. Works great on mobile.</p>
        </div>
        <div className="mt-6">
          <CreateAthlete />
        </div>
      </main>
    </div>
  )
}

export default page