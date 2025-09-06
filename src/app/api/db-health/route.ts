import { NextResponse } from 'next/server'
import { dbHealthCheck } from '@/lib/db'

export async function GET() {
  try {
    const ok = await dbHealthCheck()
    return NextResponse.json({ status: 'ok', check: ok })
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message || 'Unknown error' }, { status: 500 })
  }
}


