import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { OrderStatus } from "@prisma/client";

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
    
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const statusParam = url.searchParams.get("status");
    
    // Build query
    const whereClause: { userId: string; status?: OrderStatus } = { 
      userId: user.id 
    };
    
    // Add status filter if provided and valid
    if (statusParam) {
      const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (validStatuses.includes(statusParam as OrderStatus)) {
        whereClause.status = statusParam as OrderStatus;
      }
    }
    
    // Get orders
    const orders = await db.order.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        addressId: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true, quantity: true, price: true, // Fields from OrderItem
            drug: { select: { id: true, name: true, dosage: true, form: true, price: true } } // Fields from Drug
          }
        },
        address: { // Select all fields from Address, or specify if needed
          select: { id:true, addressLine1:true, addressLine2:true, city:true, state:true, postalCode:true, country:true, isDefault:true }
        },
        statusLogs: {
          select: { id:true, status:true, notes:true, createdAt:true }, // Fields from OrderStatusLog
          orderBy: { createdAt: "desc" }
        }
        // DO NOT INCLUDE 'payments' relation here if it's causing issues, unless explicitly needed by client
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: offset
    });
    
    // Get total count
    const total = await db.order.count({
      where: whereClause
    });
    
    // Add currency field to the order data in the response
    // The currency is being added here in the API response, not queried from the database
    const ordersWithCurrency = orders.map(order => {
      // Create a shallow copy of the order and add the currency
      return {
        ...order,
        currency: "GHS" // Ghana Cedis
      };
    });
    
    return NextResponse.json({
      success: true,
      orders: ordersWithCurrency,
      metadata: {
        total,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch orders" 
    }, { status: 500 });
  }
} 