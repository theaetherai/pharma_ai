import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

// This is a temporary approach until we can properly migrate the database
export async function GET(req: NextRequest) {
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
    
    // For now, return an empty cart since we haven't migrated the database yet
    return NextResponse.json({
      success: true,
      cartItems: [],
      cartTotal: 0,
      currency: "GHS"
    });
    
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch cart items" 
    }, { status: 500 });
  }
} 