import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const customerData = await request.json()

    const { email, password, firstName, lastName, phone } = customerData

    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if customer already exists
    const existingCustomers = await payload.find({
      collection: 'customers',
      where: {
        email: { equals: email.toLowerCase().trim() }
      },
      limit: 1
    })

    if (existingCustomers.docs.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create new customer
    const newCustomer = await payload.create({
      collection: 'customers',
      data: {
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        ...(customerData.defaultAddress && { defaultAddress: customerData.defaultAddress }),
        dietaryPreferences: [],
        preferredSpiceLevel: 'mild',
        isActive: true,
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
      }
    })

    // Login the newly created customer
    const loginResult = await payload.login({
      collection: 'customers',
      data: { email, password },
    })

    if (loginResult.token && loginResult.user) {
      // Format user data for frontend
      const customer = {
        id: loginResult.user.id,
        email: loginResult.user.email,
        firstName: loginResult.user.firstName,
        lastName: loginResult.user.lastName,
        phone: loginResult.user.phone,
        defaultAddress: loginResult.user.defaultAddress || null,
      }

      return NextResponse.json({
        success: true,
        token: loginResult.token,
        user: customer,
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Account created but login failed. Please try logging in.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)

    // Handle duplicate email error
    if ((error instanceof Error && error.message?.includes('E11000')) || (error instanceof Error && error.message?.includes('duplicate'))) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
