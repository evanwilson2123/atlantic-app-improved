import { NextRequest, NextResponse } from 'next/server'
import { SimpleVALDForceDecksAPI } from '@/lib/forcedecks-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const modifiedFromUtc = searchParams.get('modifiedFromUtc')
    const profileId = searchParams.get('profileId')

    if (!region || !modifiedFromUtc) {
      return NextResponse.json(
        { error: 'Missing required parameters: region, modifiedFromUtc' },
        { status: 400 }
      )
    }

    // Create VALD ForceDecks API instance
    const valdAPI = new SimpleVALDForceDecksAPI(region)

    // Get tests using the simplified API
    const testsResponse = await valdAPI.getTests(modifiedFromUtc, profileId || undefined)
    
    return NextResponse.json(testsResponse)

  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
