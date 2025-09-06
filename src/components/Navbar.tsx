"use client"

import { useState } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isSignedIn, user } = useUser();

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/60 bg-white/90 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-sm" />
          <span className="font-semibold tracking-tight text-gray-900 dark:text-white">Atlantic Improved</span>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
          <a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a>
          <a href="#showcase" className="hover:text-gray-900 dark:hover:text-white">Showcase</a>
          <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</a>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
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
          <a href="/sign-up" className="px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-black">Get started</a>
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
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between px-3 pt-2">
              <SignedOut>
                <a href="#features" className="px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Features</a>
                <a href="#showcase" className="px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Showcase</a>
                <a href="#pricing" className="px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Pricing</a>
                <SignInButton mode="modal">
                  <button className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Sign in</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <a href="/create-athlete" className="px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Create athlete</a>
                <span className="text-gray-600 dark:text-gray-300">Account</span>
              </SignedIn>
              <a href="/sign-up" className="px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-black">Get started</a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

