"use client"

import { useState } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/60 bg-white/90 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-sm" />
          <span className="font-semibold tracking-tight text-gray-900 dark:text-white">Atlantic Improved</span>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
          <SignedOut>
          <Link href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</Link>
          <Link href="#showcase" className="hover:text-gray-900 dark:hover:text-white">Showcase</Link>
          <Link href="#pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link>
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
          <Link href="/create-athlete" className="hover:text-gray-900 dark:hover:text-white">Create athlete</Link>
          <Link href="/admin" className="hover:text-gray-900 dark:hover:text-white">Admin</Link>
            <UserButton afterSignOutUrl="/">
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Dashboard"
                  href="/protected"
                  labelIcon={
                    (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" strokeLinejoin="round" />
                    </svg>)
                  }
                />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <Link href="/sign-up" className="px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-black">Get started</Link>
        </nav>

        <div className="sm:hidden flex items-center gap-2">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button aria-label="Toggle menu" onClick={() => setMobileMenuOpen((v) => !v)} className="p-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden mx-auto max-w-6xl px-4 pb-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-sm">
            {/* Signed out menu */}
            <SignedOut>
              <nav className="grid gap-1">
                <Link href="#features" className="px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">Features</Link>
                <Link href="#showcase" className="px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">Showcase</Link>
                <Link href="#pricing" className="px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">Pricing</Link>
              </nav>
              <div className="mt-2 grid gap-2">
                <SignInButton mode="modal">
                  <button className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Sign in</button>
                </SignInButton>
                <Link href="/sign-up" className="w-full text-center px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-black">Get started</Link>
              </div>
            </SignedOut>

            {/* Signed in menu */}
            <SignedIn>
              <nav className="grid gap-1">
                <Link href="/create-athlete" className="px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">Create athlete</Link>
                <Link href="/admin" className="px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">Admin</Link>
              </nav>
              <div className="mt-2 grid gap-2">
                <span className="px-3 py-2 text-gray-600 dark:text-gray-300">Account</span>
                <Link href="/sign-up" className="w-full text-center px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-black">Get started</Link>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  )
}

