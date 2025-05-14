import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      metadata: any;
      customer_code: string;
    };
  };
}

// Interface for the cart data from the client
interface CartItem {
  drugId: string;
  quantity: number;
  price: number;
  name?: string;
  dosage?: string;
  form?: string;
  orderId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 401 });
    }

    // Get user ID from Clerk auth
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });
            
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
              }
    
    // Get request body
    const { 
      reference, 
      amount, 
      cart = [], 
      deliveryAddress,
      deliveryAddressId,
      userEmail,
      orderId: existingOrderId
    } = await req.json();
    
    if (!reference || !amount) {
      return NextResponse.json({ 
        success: false, 
        message: "Reference and amount are required" 
      }, { status: 400 });
        }
    
    // Check if payment already exists
    const existingPayment = await db.payment.findFirst({
      where: { reference }
    });
    
    if (existingPayment) {
      // If payment exists, return the associated order
      const existingOrder = await db.order.findUnique({
        where: { id: existingPayment.orderId || '' }
      });
      
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        payment: existingPayment,
        order: existingOrder
      });
    }

    // Determine if we need to create a new order or use existing one
    let orderId = existingOrderId || '';
    let order;
    
    if (!orderId) {
      // Check if we have any address for this user
      let addressId;

      // If deliveryAddressId is provided, use it
      if (deliveryAddressId) {
        addressId = deliveryAddressId;
      } else {
        // Otherwise, try to find a default address
        const defaultAddress = await db.address.findFirst({
          where: {
            userId: user.id,
            isDefault: true
          }
        });
        
        if (defaultAddress) {
          addressId = defaultAddress.id;
        } else {
          // Create a new address if needed
          // For now, we assume deliveryAddress is a single string. 
          // Ideally, this would be a structured address object.
          const newAddress = await db.address.create({
            data: {
              userId: user.id,
              addressLine1: deliveryAddress || 'No address provided',
              addressLine2: '', // Explicitly set to empty or handle if part of deliveryAddress string
              city: '',       // Explicitly set to empty or parse from deliveryAddress
              state: '',      // Explicitly set to empty or parse from deliveryAddress
              postalCode: '',// Explicitly set to empty or parse from deliveryAddress
              country: 'Ghana', // Default or determine from deliveryAddress
              isDefault: true // Make it default if no other default exists
            }
          });
              
          addressId = newAddress.id;
        }
      }
      
      // Create a new order if one wasn't specified
      order = await db.order.create({
        data: {
          userId: user.id,
          status: 'PENDING',
          total: parseFloat(amount.toString()),
          addressId: addressId
        }
      });
      
      orderId = order.id;
      
      // Create order items
      for (const item of cart) {
        await db.orderItem.create({
          data: {
            orderId: order.id,
            drugId: item.drugId,
            quantity: item.quantity,
            price: item.price
          }
        });
            }
            
      // Add initial status log
      await db.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          notes: 'Order created'
        }
      });
            } else {
      // Use existing order
      order = await db.order.findUnique({
        where: { id: orderId }
      });
                  
      if (!order) {
        return NextResponse.json({ 
          success: false, 
          message: "Order not found" 
        }, { status: 404 });
      }
      
      // Validate order belongs to user
      if (order.userId !== user.id) {
        return NextResponse.json({ 
          success: false, 
          message: "Unauthorized access to order" 
        }, { status: 403 });
      }
    }
    
    // Create payment
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        orderId,
        reference,
        amount: parseFloat(amount.toString()),
        status: 'SUCCESS',
        transactionDate: new Date(),
        paymentMethod: 'card',
        currency: 'GHS',
        metadata: { 
          source: 'web_checkout',
          userEmail
        }
      }
    });
    
    // Update order status to CONFIRMED
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { 
        status: 'CONFIRMED'
      }
    });
    
    // Add status log
    await db.orderStatusLog.create({
      data: {
        orderId,
        status: 'CONFIRMED',
        notes: `Payment confirmed with reference: ${reference}`
                }
    });
    
    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Payment Successful',
        message: `Your payment of GHS ${parseFloat(amount.toString()).toFixed(2)} for order ${orderId} was successful.`,
        type: 'PAYMENT_SUCCESS',
        read: false,
        metadata: { orderId, paymentReference: reference }
      }
    });
    
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      payment,
      order: updatedOrder
    });
    
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to verify payment" 
    }, { status: 500 });
  }
} 