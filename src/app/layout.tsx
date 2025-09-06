import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Atlantic Improved - VALD ForceDecks API',
  description: 'A modern interface for interacting with the VALD ForceDecks API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}