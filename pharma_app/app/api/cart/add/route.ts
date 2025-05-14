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
    const { drugId, quantity = 1 } = await req.json();
    
    if (!drugId) {
      return NextResponse.json({ 
        success: false, 
        message: "Drug ID is required" 
      }, { status: 400 });
    }
    
    // Check if drug exists and is in stock
    const drug = await db.drug.findUnique({
      where: { id: drugId }
    });
    
    if (!drug) {
      return NextResponse.json({ 
        success: false, 
        message: "Drug not found" 
      }, { status: 404 });
    }
    
    if (drug.stock_quantity < quantity) {
      return NextResponse.json({ 
        success: false, 
        message: "Insufficient stock" 
      }, { status: 400 });
    }
    
    // Since we don't have the CartItem model fully set up yet,
    // we'll simulate success for now
    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      cartItem: {
        id: "simulated-id",
        userId: user.id,
        drugId: drug.id,
        quantity,
        drug
      }
    });
    
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to add item to cart" 
    }, { status: 500 });
  }
} 