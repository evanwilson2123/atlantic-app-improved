import { NextRequest, NextResponse } from 'next/server'

const REGIONS = {
  'Australia (East)': 'https://prd-aue-api-extforcedecks.valdperformance.com',
  'United States (East)': 'https://prd-use-api-extforcedecks.valdperformance.com',
  'Europe (West)': 'https://prd-euw-api-extforcedecks.valdperformance.com',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const teamId = searchParams.get('teamId')
    const testId = searchParams.get('testId')

    if (!region || !teamId || !testId) {
      return NextResponse.json(
        { error: 'Missing required parameters: region, teamId, testId' },
        { status: 400 }
      )
    }

    const baseUrl = REGIONS[region as keyof typeof REGIONS]
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Invalid region specified' },
        { status: 400 }
      )
    }

    // Make request to ForceDecks API
    const apiUrl = `${baseUrl}/v2019q3/teams/${teamId}/tests/${testId}/trials`
    
    // Build headers with various VALD authentication methods
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Use VALD authentication
    if (process.env.VALD_CLIENT_SECRET) {
      headers['Authorization'] = `Bearer ${process.env.VALD_CLIENT_SECRET}`
    } else if (process.env.VALD_CLIENT_ID) {
      headers['Authorization'] = `Bearer ${process.env.VALD_CLIENT_ID}`
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    })

    if (response.status === 204) {
      return NextResponse.json([])
    }

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API Error: ${response.status} ${errorText || response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching trials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
