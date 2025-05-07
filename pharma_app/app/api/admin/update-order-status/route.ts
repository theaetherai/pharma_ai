import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/clerk";
import { updateOrderStatus } from "@/lib/order-service";
import { OrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { orderId, status, notes } = body;
    
    // Validate required fields
    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }
    
    // Validate status is a valid enum value
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }
    
    // Update order status
    const updatedOrder = await updateOrderStatus({
      orderId,
      status: status as OrderStatus,
      notes
    });
    
    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
    
  } catch (error) {
    console.error("Error updating order status:", error);
    
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
} 