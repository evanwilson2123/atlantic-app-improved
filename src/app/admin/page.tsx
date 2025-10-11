"use client";

import React from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard';

const page = () => {
  return (
    <div className="relative min-h-screen bg-black">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-1/2 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-400/20 to-indigo-400/20 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 blur-3xl" />
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <AdminDashboard />
      </main>
    </div>
  )
}

export default page