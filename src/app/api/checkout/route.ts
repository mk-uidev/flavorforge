import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const data = await request.json()

    const {
      items,
      customerInfo,
      deliveryAddress,
      serviceType,
      bookingDate,
      customerNotes,
      totalAmount
    } = data

    // Validate required fields
    if (!items || !customerInfo || !bookingDate || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required checkout information' },
        { status: 400 }
      )
    }

    // Validate delivery address only if delivery service is selected
    if (serviceType === 'delivery' && (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.area)) {
      return NextResponse.json(
        { error: 'Missing required delivery address information' },
        { status: 400 }
      )
    }

    // Create or find customer
    let customer
    let isNewCustomer = false
    try {
      // Try to find existing customer by email
      const existingCustomers = await payload.find({
        collection: 'customers',
        where: {
          email: {
            equals: customerInfo.email
          }
        }
      })

      if (existingCustomers.docs.length > 0) {
        customer = existingCustomers.docs[0]
        
        // Update customer info if needed
        const updateData: { 
          firstName: string, 
          lastName: string, 
          phone: string, 
          defaultAddress?: { street: string, area: string, city: string, postalCode?: string, phone: string } 
        } = {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone
        }

        // Only update defaultAddress if delivery address is provided
        if (serviceType === 'delivery' && deliveryAddress) {
          updateData.defaultAddress = {
            street: deliveryAddress.street,
            area: deliveryAddress.area,
            city: deliveryAddress.city,
            postalCode: deliveryAddress.postalCode || '',
            phone: deliveryAddress.phone
          }
        }

        customer = await payload.update({
          collection: 'customers',
          id: customer.id,
          data: updateData
        })
      } else {
        // Create new customer
        if (!customerInfo.password) {
          return NextResponse.json(
            { error: 'Password is required for new customers' },
            { status: 400 }
          )
        }

        const customerData: {
          email: string,
          password: string,
          firstName: string,
          lastName: string,
          phone: string,
          isActive: boolean,
          defaultAddress?: { street: string, area: string, city: string, postalCode?: string, phone: string }
        } = {
          email: customerInfo.email,
          password: customerInfo.password,
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          isActive: true
        }

        // Only add defaultAddress if delivery address is provided
        if (serviceType === 'delivery' && deliveryAddress) {
          customerData.defaultAddress = {
            street: deliveryAddress.street,
            area: deliveryAddress.area,
            city: deliveryAddress.city,
            postalCode: deliveryAddress.postalCode || '',
            phone: deliveryAddress.phone
          }
        }

        customer = await payload.create({
          collection: 'customers',
          data: customerData
        })

        isNewCustomer = true
        console.log('✅ New customer account created:', customer.email)
      }
    } catch (customerError) {
      console.error('Customer creation/update error:', customerError)
      console.error('Customer error details:', JSON.stringify(customerError, null, 2))
      return NextResponse.json(
        { error: 'Failed to process customer information', details: customerError instanceof Error ? customerError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Prepare order items with food item relationships
    const orderItems = []
    let calculatedTotal = 0

    for (const item of items) {
      try {
        // Get food item details from database
        console.log('Looking for food item with ID:', item.id)
        
        if (!item.id) {
          return NextResponse.json(
            { error: `Item missing ID: ${item.name}` },
            { status: 400 }
          )
        }

        const foodItem = await payload.findByID({
          collection: 'products',
          id: item.id
        })
        console.log('Found food item:', foodItem)

        if (!foodItem) {
          return NextResponse.json(
            { error: `Food item with ID ${item.id} not found` },
            { status: 400 }
          )
        }

        const itemSubtotal = foodItem.price * item.quantity
        calculatedTotal += itemSubtotal

        orderItems.push({
          foodItem: foodItem.id,
          quantity: item.quantity,
          price: foodItem.price,
          subtotal: itemSubtotal
        })
      } catch (itemError) {
        console.error('Food item processing error:', itemError)
        console.error('Item data:', item)
        return NextResponse.json(
          { 
            error: `Failed to process item: ${item.name || 'Unknown'}`, 
            details: itemError instanceof Error ? itemError.message : 'Unknown error',
            itemId: item.id 
          },
          { status: 500 }
        )
      }
    }

    // Validate booking date (must be at least 24 hours in advance)
    const bookingDateTime = new Date(bookingDate)
    const now = new Date()
    const timeDiff = bookingDateTime.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 3600)

    if (hoursDiff < 24) {
      return NextResponse.json(
        { error: 'Booking must be at least 24 hours in advance' },
        { status: 400 }
      )
    }

    // Create the order
    try {
      const orderData: {
        customer: string,
        items: Array<{ foodItem: string, quantity: number, price: number, subtotal: number }>,
        totalAmount: number,
        status: "pending" | "confirmed" | "preparing" | "ready-for-pickup" | "out-for-delivery" | "completed" | "cancelled",
        bookingDate: string,
        customerNotes: string,
        serviceType: "delivery" | "pickup",
        paymentStatus: "pending" | "paid" | "failed" | "refunded",
        deliveryAddress?: { street: string, area: string, city: string, postalCode?: string, phone: string }
      } = {
        customer: customer.id,
        items: orderItems,
        totalAmount: calculatedTotal,
        status: 'pending',
        bookingDate: bookingDateTime.toISOString(),
        customerNotes: customerNotes || '',
        serviceType: serviceType,
        paymentStatus: 'pending'
      }

      // Only add deliveryAddress if it's a delivery order
      if (serviceType === 'delivery' && deliveryAddress) {
        orderData.deliveryAddress = {
          street: deliveryAddress.street,
          area: deliveryAddress.area,
          city: deliveryAddress.city,
          postalCode: deliveryAddress.postalCode || '',
          phone: deliveryAddress.phone || customerInfo.phone
        }
      }

      const order = await payload.create({
        collection: 'orders',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: orderData as any
      })

      // Update customer statistics
      await payload.update({
        collection: 'customers',
        id: customer.id,
        data: {
          totalOrders: (customer.totalOrders || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + calculatedTotal,
          lastOrderDate: new Date().toISOString(),
          loyaltyPoints: (customer.loyaltyPoints || 0) + Math.floor(calculatedTotal) // 1 point per OMR
        }
      })

      // Skip creating order status history for now since it requires a user
      // Order status history will be managed by admin users

      // Generate authentication token for the customer
      let authToken = null
      try {
        const loginResult = await payload.login({
          collection: 'customers',
          data: { email: customer.email, password: customerInfo.password }
        })
        authToken = loginResult.token
      } catch (tokenError) {
        console.warn('Could not generate auth token:', tokenError)
        // Don't fail the order if token generation fails
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          bookingDate: order.bookingDate
        },
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          defaultAddress: customer.defaultAddress || null,
          isNewCustomer
        },
        // Include auth token for automatic login
        authToken: authToken
      })

    } catch (orderError) {
      console.error('Order creation error:', orderError)
      console.error('Order error details:', JSON.stringify(orderError, null, 2))
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError instanceof Error ? orderError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error during checkout' },
      { status: 500 }
    )
  }
}
