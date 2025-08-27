import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const data = await request.json()

    const { email, firstName, lastName, phone, password } = data

    // Validate required fields
    if (!email || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required customer information' },
        { status: 400 }
      )
    }

    // Check if customer already exists
    const existingCustomers = await payload.find({
      collection: 'customers',
      where: {
        email: {
          equals: email
        }
      }
    })

    if (existingCustomers.docs.length > 0) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    // Create new customer
    const customer = await payload.create({
      collection: 'customers',
      data: {
        email,
        password: password || Math.random().toString(36).slice(-8),
        firstName,
        lastName,
        phone,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone
      }
    })

  } catch (error) {
    console.error('Customer creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    const customers = await payload.find({
      collection: 'customers',
      where: {
        email: {
          equals: email
        }
      }
    })

    if (customers.docs.length === 0) {
      return NextResponse.json(
        { exists: false }
      )
    }

    const customer = customers.docs[0]
    return NextResponse.json({
      exists: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        defaultAddress: customer.defaultAddress
      }
    })

  } catch (error) {
    console.error('Customer lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup customer' },
      { status: 500 }
    )
  }
}
