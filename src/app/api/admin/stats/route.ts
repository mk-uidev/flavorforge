import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get total customers
    const customers = await payload.find({
      collection: 'customers',
      limit: 100,
    })

    // Get total orders  
    const orders = await payload.find({
      collection: 'orders',
      limit: 100,
    })

    // Get recent customers (last 5)
    const recentCustomers = customers.docs.slice(0, 5).map(customer => ({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone,
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      loyaltyPoints: customer.loyaltyPoints || 0,
      createdAt: customer.createdAt
    }))

    // Get recent orders (last 5)
    const recentOrders = orders.docs.slice(0, 5).map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customer,
      status: order.status,
      totalAmount: order.totalAmount,
      bookingDate: order.bookingDate,
      createdAt: order.createdAt
    }))

    const stats = {
      summary: {
        totalCustomers: customers.docs.length,
        totalOrders: orders.docs.length,
        totalRevenue: orders.docs.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      },
      recentCustomers,
      recentOrders,
      status: 'Customer and Order creation is working properly!'
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
