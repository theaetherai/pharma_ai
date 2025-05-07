import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/clerk";
import { db } from "@/lib/db";

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
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 20;
    const skip = (validPage - 1) * validLimit;
    
    // Build where clause for filters
    const where: any = {};
    if (status) {
      where.status = status;
    }
    
    // Get total count for pagination
    const totalOrders = await db.order.count({ where });
    
    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get orders with pagination
    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        items: {
          include: {
            drug: true
          }
        },
        address: true
      },
      orderBy,
      skip,
      take: validLimit
    });
    
    return NextResponse.json({
      orders,
      pagination: {
        totalRecords: totalOrders,
        currentPage: validPage,
        pageSize: validLimit,
        totalPages: Math.ceil(totalOrders / validLimit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
} 