import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Simple security check - you might want to add proper admin authentication
    const { confirm } = await request.json()
    
    if (confirm !== 'FLUSH_ALL_DATA') {
      return NextResponse.json(
        { success: false, error: 'Invalid confirmation code' },
        { status: 400 }
      )
    }

    let customersDeleted = 0
    let ordersDeleted = 0
    let statusHistoryDeleted = 0

    // Flush Customers
    const customers = await payload.find({
      collection: 'customers',
      limit: 1000
    })
    
    if (customers.docs.length > 0) {
      for (const customer of customers.docs) {
        await payload.delete({
          collection: 'customers',
          id: customer.id
        })
      }
      customersDeleted = customers.docs.length
    }

    // Flush Orders
    const orders = await payload.find({
      collection: 'orders',
      limit: 1000
    })
    
    if (orders.docs.length > 0) {
      for (const order of orders.docs) {
        await payload.delete({
          collection: 'orders',
          id: order.id
        })
      }
      ordersDeleted = orders.docs.length
    }

    // Flush Order Status History (if exists)
    try {
      const statusHistory = await payload.find({
        collection: 'order-status-history',
        limit: 1000
      })
      
      if (statusHistory.docs.length > 0) {
        for (const history of statusHistory.docs) {
          await payload.delete({
            collection: 'order-status-history',
            id: history.id
          })
        }
        statusHistoryDeleted = statusHistory.docs.length
      }
    } catch (error) {
      // Order status history collection doesn't exist - that's fine
    }

    return NextResponse.json({
      success: true,
      message: 'Data flushed successfully',
      summary: {
        customersDeleted,
        ordersDeleted,
        statusHistoryDeleted
      }
    })

  } catch (error) {
    console.error('Data flush error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to flush data' },
      { status: 500 }
    )
  }
}

// GET endpoint to show current data counts
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    const customersCount = await payload.count({
      collection: 'customers'
    })
    
    const ordersCount = await payload.count({
      collection: 'orders'
    })

    let statusHistoryCount = 0
    try {
      const statusHistory = await payload.count({
        collection: 'order-status-history'
      })
      statusHistoryCount = statusHistory.totalDocs
    } catch (error) {
      // Collection doesn't exist
    }

    return NextResponse.json({
      success: true,
      currentData: {
        customers: customersCount.totalDocs,
        orders: ordersCount.totalDocs,
        statusHistory: statusHistoryCount
      }
    })

  } catch (error) {
    console.error('Data count error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get data counts' },
      { status: 500 }
    )
  }
}
