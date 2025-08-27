import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Order } from '@/payload-types'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Fetch orders for the specific customer with deep population
    const orders = await payload.find({
      collection: 'orders',
      where: {
        customer: {
          equals: customerId
        }
      },
      depth: 3, // Deep populate customer, food items, categories, etc.
      sort: '-createdAt', // Most recent first
      limit: 100 // Reasonable limit for order history
    })

    // Transform the data to match frontend expectations
    const transformedOrders = orders.docs.map((order: Order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      serviceType: order.serviceType,
      totalAmount: order.totalAmount,
      bookingDate: order.bookingDate,
      createdAt: order.createdAt,
      items: order.items?.map((item) => ({
        id: typeof item.foodItem === 'object' ? item.foodItem?.id : item.foodItem || item.id,
        name: typeof item.foodItem === 'object' ? item.foodItem?.name : 'Unknown Item',
        price: item.price,
        quantity: item.quantity,
        category: typeof item.foodItem === 'object' && typeof item.foodItem?.category === 'object' 
          ? item.foodItem.category.name 
          : typeof item.foodItem === 'object' ? item.foodItem?.category || 'uncategorized' : 'uncategorized'
      })) || [],
      deliveryAddress: order.deliveryAddress ? {
        street: order.deliveryAddress.street,
        area: order.deliveryAddress.area,
        city: order.deliveryAddress.city,
        postalCode: order.deliveryAddress.postalCode
      } : null,
      customerNotes: order.customerNotes || null
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      totalOrders: orders.totalDocs
    })

  } catch (error) {
    console.error('Customer orders fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order history' },
      { status: 500 }
    )
  }
}

// Alternative endpoint to get a specific order by order number for a customer
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { customerId, orderNumber } = await request.json()

    if (!customerId || !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and Order Number are required' },
        { status: 400 }
      )
    }

    // Fetch specific order for the customer
    const orders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { customer: { equals: customerId } },
          { orderNumber: { equals: orderNumber } }
        ]
      },
      depth: 3,
      limit: 1
    })

    if (orders.docs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orders.docs[0] as Order

    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      serviceType: order.serviceType,
      totalAmount: order.totalAmount,
      bookingDate: order.bookingDate,
      createdAt: order.createdAt,
      items: order.items?.map((item) => ({
        id: typeof item.foodItem === 'object' ? item.foodItem?.id : item.foodItem || item.id,
        name: typeof item.foodItem === 'object' ? item.foodItem?.name : 'Unknown Item',
        price: item.price,
        quantity: item.quantity,
        category: typeof item.foodItem === 'object' && typeof item.foodItem?.category === 'object' 
          ? item.foodItem.category.name 
          : typeof item.foodItem === 'object' ? item.foodItem?.category || 'uncategorized' : 'uncategorized'
      })) || [],
      deliveryAddress: order.deliveryAddress ? {
        street: order.deliveryAddress.street,
        area: order.deliveryAddress.area,
        city: order.deliveryAddress.city,
        postalCode: order.deliveryAddress.postalCode
      } : null,
      customerNotes: order.customerNotes || null
    }

    return NextResponse.json({
      success: true,
      order: transformedOrder
    })

  } catch (error) {
    console.error('Customer order fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
