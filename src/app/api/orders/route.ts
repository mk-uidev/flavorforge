import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)
    
    const orderNumber = searchParams.get('orderNumber')
    
    // If orderNumber is provided, fetch single order
    if (orderNumber) {
      const orders = await payload.find({
        collection: 'orders',
        where: {
          orderNumber: { equals: orderNumber }
        },
        limit: 1,
        depth: 3 // Deep populate to get customer and product details
      })

      if (orders.docs.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        order: orders.docs[0]
      })
    }

    // Otherwise, fetch multiple orders with pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    // Build where clause
    const where: { 
      status?: { equals: string }, 
      customer?: { equals: string } 
    } = {}
    
    if (status) {
      where.status = { equals: status }
    }
    
    if (customerId) {
      where.customer = { equals: customerId }
    }

    const orders = await payload.find({
      collection: 'orders',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 2
    })

    return NextResponse.json({
      success: true,
      orders: orders.docs,
      totalPages: orders.totalPages,
      page: orders.page,
      totalDocs: orders.totalDocs
    })

  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const data = await request.json()
    const { orderId, status, adminNotes } = data

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    // Update order status
    const updatedOrder = await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        status,
        adminNotes: adminNotes || undefined,
        ...(status === 'completed' && { actualDeliveryTime: new Date().toISOString() })
      }
    })

    // Create status history entry
    await payload.create({
      collection: 'order-status-history',
      data: {
        order: orderId,
        status,
        timestamp: new Date().toISOString(),
        notes: adminNotes || `Status updated to ${status}`
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
