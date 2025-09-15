import { NextRequest, NextResponse } from 'next/server'
import { SimpleVALDForceDecksAPI } from '@/lib/forcedecks-api'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    
    const body = await request.json()
    const { daysBack = 7, profileId } = body

    if (!region) {
      return NextResponse.json(
        { error: 'Missing required parameter: region' },
        { status: 400 }
      )
    }

    // Create VALD ForceDecks API instance
    const valdAPI = new SimpleVALDForceDecksAPI()

    // Run the sync process
    const syncResult = await valdAPI.syncRecentTests(daysBack, profileId)
    
    return NextResponse.json({
      success: true,
      message: 'VALD ForceDecks sync completed',
      ...syncResult
    })

  } catch (error) {
    console.error('Error during VALD sync:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'VALD sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')

    if (!region) {
      return NextResponse.json(
        { error: 'Missing required parameter: region' },
        { status: 400 }
      )
    }

    // Create VALD ForceDecks API instance
    const valdAPI = new SimpleVALDForceDecksAPI()

    // Test the connection
    const testResult = await valdAPI.testConnection()
    
    return NextResponse.json(testResult)

  } catch (error) {
    console.error('Error testing VALD connection:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'VALD connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
