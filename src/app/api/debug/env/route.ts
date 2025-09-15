import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  // Only show environment variable names, not values for security
  const envVars = {
    VALD_CLIENT_ID: !!process.env.VALD_CLIENT_ID,
    VALD_CLIENT_SECRET: !!process.env.VALD_CLIENT_SECRET,
    VALD_TENANT_ID: !!process.env.VALD_TENANT_ID,
    VALD_AUTH_URL: !!process.env.VALD_AUTH_URL,
    VALD_DATA_URL: !!process.env.VALD_DATA_URL,
    VALD_API_BASE_URL: !!process.env.VALD_API_BASE_URL,
    VALD_PROFILE_URL: !!process.env.VALD_PROFILE_URL,
  }

  return NextResponse.json({
    message: 'Environment variables status (true = exists, false = missing)',
    environmentVariables: envVars,
    availableEnvVars: Object.keys(process.env).filter(key => 
      key.includes('FORCEDECKS') || 
      key.includes('API') || 
      key.includes('TOKEN') ||
      key.includes('KEY')
    ),
  })
}
