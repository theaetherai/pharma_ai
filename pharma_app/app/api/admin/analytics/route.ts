import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/clerk";
import { db } from "@/lib/db";
import { getAnalyticsData } from "@/lib/order-service";

export async function GET() {
  try {
    // Check if user is admin
    const isUserAdmin = await isAdmin();
    
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    
    // Get analytics data
    const analyticsData = await getAnalyticsData();
    
    // Get additional counts for dashboard cards
    const [totalDrugs, totalOrders, totalPrescriptions, lowStockDrugsCount] = await Promise.all([
      db.drug.count(),
      db.order.count(),
      db.prescription.count(),
      db.drug.count({
        where: {
          stock_quantity: {
            lt: 10
          }
        }
      })
    ]);
    
    // Get low stock drugs details
    const lowStockDrugs = await db.drug.findMany({
      where: {
        stock_quantity: {
          lt: 10
        }
      },
      orderBy: {
        stock_quantity: 'asc'
      },
      take: 5
    });
    
    // Get recent orders
    const recentOrders = await db.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          include: {
            drug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    return NextResponse.json({
      ...analyticsData,
      counts: {
        totalDrugs,
        totalOrders,
        totalPrescriptions,
        lowStockDrugsCount
      },
      lowStockDrugs,
      recentOrders
    });
    
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
} 