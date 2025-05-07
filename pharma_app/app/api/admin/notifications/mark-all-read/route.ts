import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/clerk";
import { db } from "@/lib/db";

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
    
    // Mark all notifications as read
    const result = await db.notification.updateMany({
      where: { read: false },
      data: { read: true }
    });
    
    return NextResponse.json({
      success: true,
      message: `${result.count} notifications marked as read`
    });
    
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
} 