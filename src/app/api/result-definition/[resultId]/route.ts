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
    const resultId = searchParams.get('resultId')

    if (!region) {
      return NextResponse.json(
        { error: 'Missing required parameter: region' },
        { status: 400 }
      )
    }

    if (!resultId) {
      return NextResponse.json(
        { error: 'Missing required parameter: resultId' },
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

    // Make request to VALD ForceDecks API
    const apiUrl = `${baseUrl}/resultdefinition/${resultId}`
    
    // Build headers with VALD authentication
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Use VALD authentication
    if (process.env.VALD_CLIENT_SECRET) {
      headers['Authorization'] = `Bearer ${process.env.VALD_CLIENT_SECRET}`
    } else if (process.env.VALD_CLIENT_ID) {
      headers['Authorization'] = `Bearer ${process.env.VALD_CLIENT_ID}`
    }

    console.log('Making request to:', apiUrl)
    console.log('Headers:', headers)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    })

    if (response.status === 204) {
      return NextResponse.json([])
    }

    if (!response.ok) {
      let errorData
      try {
        const responseClone = response.clone()
        errorData = await responseClone.json()
      } catch {
        try {
          const responseClone = response.clone()
          errorData = { error: await responseClone.text() }
        } catch {
          errorData = { error: 'Unable to read error response' }
        }
      }
      
      console.error('VALD API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      
      return NextResponse.json(
        { 
          error: `VALD API Error: ${response.status} ${response.statusText}`,
          details: errorData,
          url: apiUrl
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('VALD API Success:', { url: apiUrl, resultId })
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching result definition:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
