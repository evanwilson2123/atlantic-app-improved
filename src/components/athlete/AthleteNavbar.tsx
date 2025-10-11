"use client";

import Link from 'next/link'
import React from 'react'

// add props
interface AthleteNavbarProps {
  athleteId: string;
  profileId: string;
}

const AthleteNavbar = ({ athleteId, profileId }: AthleteNavbarProps) => {
  return (
    <nav className="rounded-xl border border-gray-800 bg-black p-2 sm:p-3 shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto">
        <Link
          href={`/admin/athlete/${athleteId}/profile`}
          className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-gray-800"
        >
          Overview
        </Link>
        <Link
          href={`/admin/athlete/${athleteId}/vald/${profileId}`}
          className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-gray-800"
        >
          Vald
        </Link>
      </div>
    </nav>
  )
}

export default AthleteNavbar