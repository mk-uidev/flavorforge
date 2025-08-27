import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Order } from '@/payload-types'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { orderNumber, customerId, reason } = await request.json()

    if (!orderNumber || !customerId) {
      return NextResponse.json(
        { success: false, error: 'Order number and customer ID are required' },
        { status: 400 }
      )
    }

    // First, find the order and verify it belongs to the customer
    const orders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { orderNumber: { equals: orderNumber } },
          { customer: { equals: customerId } }
        ]
      },
      limit: 1
    })

    if (orders.docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found or does not belong to you' },
        { status: 404 }
      )
    }

    const order = orders.docs[0] as Order

    // Check if order can be cancelled (only pending or confirmed orders)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot cancel order with status: ${order.status}. Only pending or confirmed orders can be cancelled.` 
        },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const updatedOrder = await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        status: 'cancelled',
        customerNotes: reason 
          ? `${order.customerNotes ? order.customerNotes + ' | ' : ''}CANCELLED: ${reason}`
          : `${order.customerNotes ? order.customerNotes + ' | ' : ''}CANCELLED by customer`
      }
    })

    // Log the cancellation for admin tracking
    console.log(`Order ${orderNumber} cancelled by customer ${customerId}`, {
      orderId: order.id,
      originalStatus: order.status,
      reason: reason || 'No reason provided',
      cancelledAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount
      }
    })

  } catch (error) {
    console.error('Order cancellation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order. Please try again.' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if an order can be cancelled
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const customerId = searchParams.get('customerId')

    if (!orderNumber || !customerId) {
      return NextResponse.json(
        { success: false, error: 'Order number and customer ID are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: configPromise })
    
    const orders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { orderNumber: { equals: orderNumber } },
          { customer: { equals: customerId } }
        ]
      },
      limit: 1
    })

    if (orders.docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orders.docs[0] as Order
    const canCancel = ['pending', 'confirmed'].includes(order.status)

    return NextResponse.json({
      success: true,
      canCancel,
      currentStatus: order.status,
      message: canCancel 
        ? 'Order can be cancelled' 
        : `Order cannot be cancelled (status: ${order.status})`
    })

  } catch (error) {
    console.error('Order cancellation check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check order status' },
      { status: 500 }
    )
  }
}
