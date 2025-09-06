"use client"

import { useState } from 'react'

type FormState = {
  firstName: string
  lastName: string
  email: string
  dob: string
  sex: string
  activeStatus: boolean
  playLevel: string
  password: string
}

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  dob: '',
  sex: 'Male',
  activeStatus: true,
  playLevel: '',
  password: '',
}

export default function AdminDash() {
  const [form, setForm] = useState<FormState>(initialState)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement
    const name = target.name
    let nextValue: string | boolean
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      nextValue = target.checked
    } else {
      nextValue = target.value
    }
    setForm((prev) => ({ ...prev, [name]: nextValue as any }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create athlete')
      setMessage('Athlete created successfully')
      setForm(initialState)
    } catch (err: any) {
      setMessage(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Create Athlete</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Provide basic details. You can edit later.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">First name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Last name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Date of birth</label>
            <input type="date" name="dob" value={form.dob} onChange={handleChange} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Sex</label>
            <select name="sex" value={form.sex} onChange={handleChange} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Play level</label>
            <input name="playLevel" value={form.playLevel} onChange={handleChange} placeholder="e.g., High School, College, Pro" className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" required />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="text-sm text-gray-700 dark:text-gray-300">Active</div>
            <label className="inline-flex items-center gap-2">
              <input id="activeStatus" type="checkbox" name="activeStatus" checked={form.activeStatus} onChange={handleChange} className="h-4 w-4" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enable</span>
            </label>
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <button disabled={loading} className="rounded-md bg-gradient-to-tr from-sky-600 to-indigo-600 text-white px-5 py-2.5 disabled:opacity-50">{loading ? 'Creating…' : 'Create athlete'}</button>
            <button type="button" onClick={() => setForm(initialState)} className="rounded-md border border-gray-300 dark:border-gray-700 px-5 py-2.5">Reset</button>
          </div>
          {message && (
            <div className="sm:col-span-2 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>
          )}
        </form>
      </div>
    </div>
  )
}
