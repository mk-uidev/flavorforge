import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Attempt to login using Payload's auth
    const result = await payload.login({
      collection: 'customers',
      data: { email, password },
    })

    if (result.token && result.user) {
      // Format user data for frontend
      const customer = {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        phone: result.user.phone,
        defaultAddress: result.user.defaultAddress || null,
      }

      return NextResponse.json({
        success: true,
        token: result.token,
        user: customer,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    
    // Handle specific Payload auth errors
    if (error instanceof Error && error.message?.includes('Invalid login credentials')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
