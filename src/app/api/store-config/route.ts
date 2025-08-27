import { NextRequest, NextResponse } from 'next/server'
import { getStoreConfig } from '@/lib/store-config'

export async function GET(request: NextRequest) {
  try {
    const config = await getStoreConfig()
    
    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Error fetching store config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be used to refresh the cache
    const { getPayload } = await import('payload')
    const configPromise = await import('@payload-config')
    
    const payload = await getPayload({ config: configPromise.default })
    
    const config = await payload.findGlobal({
      slug: 'store-config',
    })

    // Clear cache to force refresh on next request
    const { clearConfigCache } = await import('@/lib/store-config')
    clearConfigCache()

    return NextResponse.json({
      success: true,
      config,
      message: 'Store config cache refreshed',
    })
  } catch (error) {
    console.error('Error refreshing store config:', error)
    return NextResponse.json(
      { error: 'Failed to refresh store configuration' },
      { status: 500 }
    )
  }
}
