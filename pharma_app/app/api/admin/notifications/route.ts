import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/clerk";
import { db } from "@/lib/db";
import { getUnreadNotifications, markNotificationsAsRead } from "@/lib/order-service";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    
    // Parse pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 20;
    const skip = (validPage - 1) * validLimit;
    
    // Get total count for pagination
    const totalNotifications = await db.notification.count();
    
    // Get paginated notifications, with unread first
    const notifications = await db.notification.findMany({
      orderBy: [
        { read: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: validLimit
    });
    
    // Get count of unread notifications
    const unreadCount = await db.notification.count({
      where: { read: false }
    });
    
    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        totalRecords: totalNotifications,
        currentPage: validPage,
        pageSize: validLimit,
        totalPages: Math.ceil(totalNotifications / validLimit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching notifications:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

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
    const { notificationIds } = body;
    
    // Validate required fields
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "Notification IDs array is required" },
        { status: 400 }
      );
    }
    
    // Mark notifications as read
    await markNotificationsAsRead(notificationIds);
    
    return NextResponse.json({
      success: true,
      message: `${notificationIds.length} notifications marked as read`
    });
    
  } catch (error) {
    console.error("Error updating notifications:", error);
    
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
} 