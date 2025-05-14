import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Get order
    const order = await db.order.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        items: {
          include: {
            drug: true
          }
        },
        address: true,
        statusLogs: {
          orderBy: {
            createdAt: "desc"
          }
        },
        payments: true
      }
    });
    
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        message: "Order not found" 
      }, { status: 404 });
    }
    
    // Add currency field for the response
    const orderWithCurrency = {
      ...order,
      currency: "GHS"
    };
    
    return NextResponse.json({
      success: true,
      order: orderWithCurrency
    });
    
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch order" 
    }, { status: 500 });
  }
} 