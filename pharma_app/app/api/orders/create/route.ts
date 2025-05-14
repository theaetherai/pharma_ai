import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

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
    const { addressId } = await req.json();
    
    if (!addressId) {
      return NextResponse.json({ 
        success: false, 
        message: "Address ID is required" 
      }, { status: 400 });
    }
    
    // Validate address belongs to user
    const address = await db.address.findFirst({
      where: {
        id: addressId,
        userId: user.id
      }
    });
    
    if (!address) {
      return NextResponse.json({ 
        success: false, 
        message: "Address not found" 
      }, { status: 404 });
    }
    
    // For now, we'll create a placeholder order since we don't have the CartItem model fully set up
    // In a real implementation, we would:
    // 1. Get cart items for the user
    // 2. Create order and order items
    // 3. Update drug stock quantities
    // 4. Clear the cart
    
    const order = await db.order.create({
      data: {
        userId: user.id,
        addressId,
        status: "PENDING",
        total: 0, // This would normally be calculated from cart items
        statusLogs: {
          create: {
            status: "PENDING",
            notes: "Order created"
          }
        }
      },
      include: {
        address: true,
        statusLogs: true
      }
    });
    
    // For response, include the currency even if not in DB yet
    const orderWithCurrency = {
      ...order,
      currency: "GHS" // Add currency for the response
    };
    
    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      order: orderWithCurrency
    });
    
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create order" 
    }, { status: 500 });
  }
} 