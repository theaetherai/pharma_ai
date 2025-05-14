import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { OrderStatus } from "@prisma/client";

interface TrackingEvent {
  id: string;
  status: string;
  notes: string | null;
  date: Date | null;
  completed: boolean;
}

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
        statusLogs: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });
    
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        message: "Order not found" 
      }, { status: 404 });
    }
    
    // Calculate progress percentage based on status
    let progressPercentage = 0;
    switch (order.status) {
      case 'PENDING':
        progressPercentage = 10;
        break;
      case 'CONFIRMED':
        progressPercentage = 30;
        break;
      case 'PROCESSING':
        progressPercentage = 50;
        break;
      case 'SHIPPED':
        progressPercentage = 75;
        break;
      case 'DELIVERED':
        progressPercentage = 100;
        break;
      case 'CANCELLED':
        progressPercentage = 0;
        break;
    }
    
    // Generate tracking events
    const trackingEvents: TrackingEvent[] = order.statusLogs.map(log => ({
      id: log.id,
      status: log.status,
      notes: log.notes,
      date: log.createdAt,
      completed: true
    }));
    
    // Add future events based on current status
    const allStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentStatusIndex = allStatuses.indexOf(order.status);
    
    if (order.status !== 'CANCELLED') {
      for (let i = currentStatusIndex + 1; i < allStatuses.length; i++) {
        trackingEvents.push({
          id: `future-${allStatuses[i]}`,
          status: allStatuses[i],
          notes: null,
          date: null,
          completed: false
        });
      }
    }
    
    // Sort tracking events by status sequence
    trackingEvents.sort((a, b) => {
      const statusA = allStatuses.indexOf(a.status as OrderStatus);
      const statusB = allStatuses.indexOf(b.status as OrderStatus);
      return statusA - statusB;
    });
    
    // Calculate estimated delivery date (3 days from order date)
    const estimatedDelivery = order.status === 'DELIVERED' 
      ? null 
      : new Date(new Date(order.createdAt).getTime() + (3 * 24 * 60 * 60 * 1000));
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      currentStatus: order.status,
      progressPercentage,
      trackingEvents,
      estimatedDelivery
    });
    
  } catch (error) {
    console.error("Error tracking order:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to track order" 
    }, { status: 500 });
  }
} 