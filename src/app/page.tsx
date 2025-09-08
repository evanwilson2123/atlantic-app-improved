'use client'

import { useEffect } from 'react'
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isSignedIn) return
    const role = user?.publicMetadata?.role;
    if (role === 'ADMIN') {
      router.replace('/admin')
    } else if (role === 'ATHLETE') {
      router.replace('/athlete')
    }
  }, [isSignedIn, user, router])
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-1/2 h-64 w-64 rounded-full bg-gradient-to-tr from-sky-400/20 to-indigo-400/20 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 blur-3xl" />
      </div>

      {/* Navbar is rendered globally in the root layout */}

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 px-3 py-1 text-xs text-blue-800 dark:text-blue-200">
              Athlete performance platform
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              Mobile-first
            </div>
            <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Athlete insights, made clear.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-prose">
              Visualize trends, monitor readiness, and turn raw metrics into decisions. Built for coaches and athletes, on the go.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/sign-up" className="px-5 py-3 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm sm:text-base shadow-lg shadow-sky-600/20 text-center">Get started free</Link>
              <Link href="#features" className="px-5 py-3 rounded-lg bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900 text-gray-900 dark:text-white text-sm sm:text-base text-center">See features</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Privacy-first</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-500"/>Responsive</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-500"/>Fast</span>
            </div>
          </div>
          <div className="order-first md:order-none">
            <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900" />
              <div className="relative grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs text-gray-500">Load</div>
                  <div className="mt-2 text-2xl font-semibold">1,240</div>
                  <div className="mt-1 text-xs text-emerald-600">+12% this week</div>
                </div>
                <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs text-gray-500">Jump height</div>
                  <div className="mt-2 text-2xl font-semibold">41.3 cm</div>
                  <div className="mt-1 text-xs text-emerald-600">+3.1%</div>
                </div>
                <div className="col-span-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
                  <img src="/globe.svg" alt="dashboard" className="h-10 w-10 opacity-70"/>
                  <div>
                    <div className="text-sm font-medium">Weekly readiness</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Balanced load and recovery indicators</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature iconBg="bg-sky-100 dark:bg-sky-900/40" iconColor="text-sky-600" title="Mobile-first design" desc="Every screen scales beautifully from phones to desktops." />
          <Feature iconBg="bg-indigo-100 dark:bg-indigo-900/40" iconColor="text-indigo-600" title="Actionable insights" desc="Turn complex metrics into simple, coachable moments." />
          <Feature iconBg="bg-emerald-100 dark:bg-emerald-900/40" iconColor="text-emerald-600" title="Fast and secure" desc="Snappy navigation with privacy-focused practices." />
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Beautiful on mobile</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Clean typography, balanced spacing, and touch-friendly targets make it effortless to use on the go.</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Stat label="Avg. session" value="4m 12s" />
                <Stat label="Bounce rate" value="12%" />
                <Stat label="Satisfaction" value="98%" />
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-4">
              <img src="/window.svg" alt="app preview" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <Testimonial quote="Finally, a clean view of what matters." name="Head Coach" role="Division I" />
            <Testimonial quote="Our athletes actually use this on their phones." name="Performance Lead" role="Pro Club" />
            <Testimonial quote="Clear, fast, and trustworthy." name="Sports Scientist" role="Institute" />
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-tr from-sky-600 to-indigo-600 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold">Start free. Upgrade when you’re ready.</h3>
              <p className="mt-1 text-white/90 text-sm">No credit card required. Cancel anytime.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/sign-up" className="px-5 py-3 rounded-lg bg-white text-gray-900 hover:bg-white/90">Create account</Link>
              <Link href="#features" className="px-5 py-3 rounded-lg ring-1 ring-inset ring-white/70 hover:bg-white/10">Compare features</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600" />
            <span className="font-medium text-gray-900 dark:text-white">Atlantic Improved</span>
          </div>
          <div className="flex gap-6">
            <Link href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</Link>
            <Link href="#showcase" className="hover:text-gray-900 dark:hover:text-white">Showcase</Link>
            <Link href="#pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link>
            <Link href="/sign-in" className="hover:text-gray-900 dark:hover:text-white">Sign in</Link>
          </div>
        </div>
        <div className="mt-6 text-xs">© {new Date().getFullYear()} Atlantic Improved. All rights reserved.</div>
      </footer>
    </div>
  )
}

function Feature({ iconBg, iconColor, title, desc }: { iconBg: string; iconColor: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <div className={`h-9 w-9 rounded-full ${iconBg} flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-5 w-5 ${iconColor}`}>
          <path d="M12 3v18M3 12h18" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="mt-3 text-base font-semibold text-gray-900 dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{desc}</div>
    </div>
  )
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-800">
      <div className="text-gray-900 dark:text-white">“{quote}”</div>
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{name} — {role}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}