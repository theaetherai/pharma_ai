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
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        message: "Order ID is required" 
      }, { status: 400 });
    }
    
    // Get previous order
    const previousOrder = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id
      },
      include: {
        items: {
          include: {
            drug: true
          }
        }
      }
    });
    
    if (!previousOrder) {
      return NextResponse.json({ 
        success: false, 
        message: "Previous order not found" 
      }, { status: 404 });
    }
    
    // For now, we'll return success without actually adding to cart since we don't have CartItem yet
    // In the final implementation, we would:
    // 1. Clear existing cart items
    // 2. Add previous order items to cart if they're still available
    
    // Just return the items from the previous order
    const reorderItems = previousOrder.items.map(item => ({
      drugId: item.drugId,
      quantity: item.quantity,
      name: item.drug.name,
      dosage: item.drug.dosage,
      form: item.drug.form,
      price: item.drug.price
    }));
    
    return NextResponse.json({
      success: true,
      message: "Items from previous order retrieved successfully",
      items: reorderItems
    });
    
  } catch (error) {
    console.error("Error reordering:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to reorder" 
    }, { status: 500 });
  }
} 