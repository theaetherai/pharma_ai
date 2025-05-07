import { auth } from "@clerk/nextjs";
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the current user using Clerk auth
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }
    
    // Get user from our database using clerkId
    const user = await (db as any).user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found in database" 
      }, { status: 404 });
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
    const totalPrescriptions = await (db as any).prescription.count({
      where: {
        userId: user.id
      }
    });
    
    // Get user's prescriptions from the database with pagination
    const prescriptions = await (db as any).prescription.findMany({
      where: {
        userId: user.id // Use our internal user ID, not the Clerk ID
      },
      orderBy: {
        prescribedAt: 'desc'
      },
      skip,
      take: validLimit
    });
    
    // Return prescriptions with pagination info
    return NextResponse.json({
      success: true,
      prescriptions,
      pagination: {
        totalRecords: totalPrescriptions,
        currentPage: validPage,
        pageSize: validLimit,
        totalPages: Math.ceil(totalPrescriptions / validLimit)
      }
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch prescriptions"
    }, { status: 500 });
  }
}

// API endpoint for requesting prescription refills
export async function POST(request: NextRequest) {
  try {
    // Get the current user using Clerk auth
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }
    
    // Get user from our database using clerkId
    const user = await (db as any).user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found in database" 
      }, { status: 404 });
    }
    
    const data = await request.json();
    
    // Validate the request
    if (!data.prescriptionId) {
      return NextResponse.json({
        success: false,
        message: "Prescription ID is required"
      }, { status: 400 });
    }
    
    // Find the prescription
    const prescription = await (db as any).prescription.findFirst({
      where: {
        id: data.prescriptionId,
        userId: user.id // Use our internal user ID, not the Clerk ID
      }
    });
    
    if (!prescription) {
      return NextResponse.json({
        success: false,
        message: "Prescription not found"
      }, { status: 404 });
    }
    
    // Check if the prescription has refills available
    if (prescription.refills <= 0) {
      return NextResponse.json({
        success: false,
        message: "No refills available for this prescription"
      }, { status: 400 });
    }
    
    // Process the refill request (in a real app, this would create a refill request)
    // Here we'll just update the refills count
    const updatedPrescription = await (db as any).prescription.update({
      where: {
        id: data.prescriptionId
      },
      data: {
        refills: {
          decrement: 1
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Refill request processed successfully",
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error("Error processing refill request:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to process refill request"
    }, { status: 500 });
  }
} 