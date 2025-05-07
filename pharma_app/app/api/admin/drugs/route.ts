import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminApiMiddleware } from "../middleware";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin using the shared middleware
    const authResponse = await adminApiMiddleware(request);
    if (authResponse) return authResponse;
    
    // Parse pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const lowStock = searchParams.get('lowStock') === 'true';
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 20;
    const skip = (validPage - 1) * validLimit;
    
    // Build where clause for filters
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { dosage: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (lowStock) {
      where.stock_quantity = { lt: 10 };
    }
    
    // Get total count for pagination
    const totalDrugs = await db.drug.count({ where });
    
    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get drugs with pagination
    const drugs = await db.drug.findMany({
      where,
      orderBy,
      skip,
      take: validLimit
    });
    
    // Return drugs with pagination metadata
    return NextResponse.json({
      drugs,
      pagination: {
        totalRecords: totalDrugs,
        currentPage: validPage,
        pageSize: validLimit,
        totalPages: Math.ceil(totalDrugs / validLimit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching drugs:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch drugs" },
      { status: 500 }
    );
  }
}

// Update a drug record
export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin using the shared middleware
    const authResponse = await adminApiMiddleware(request);
    if (authResponse) return authResponse;
    
    // Parse request body
    const body = await request.json();
    const { id, ...data } = body;
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Drug ID is required" },
        { status: 400 }
      );
    }
    
    // Update the drug
    const updatedDrug = await db.drug.update({
      where: { id },
      data
    });
    
    return NextResponse.json({
      drug: updatedDrug,
      message: "Drug updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating drug:", error);
    
    return NextResponse.json(
      { error: "Failed to update drug" },
      { status: 500 }
    );
  }
}

// Create a new drug
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin using the shared middleware
    const authResponse = await adminApiMiddleware(request);
    if (authResponse) return authResponse;
    
    // Parse request body
    const data = await request.json();
    
    console.log('POST /api/admin/drugs request body:', data);
    
    // Validate required fields more comprehensively
    const requiredFields = ['name', 'dosage', 'form', 'price', 'stock_quantity'];
    const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === '');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `The following required fields are missing: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      );
    }
    
    // Validate numeric fields
    if (isNaN(parseFloat(data.price)) || data.price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid positive number" },
        { status: 400 }
      );
    }
    
    if (isNaN(parseInt(data.stock_quantity)) || data.stock_quantity < 0) {
      return NextResponse.json(
        { error: "Stock quantity must be a valid non-negative integer" },
        { status: 400 }
      );
    }
    
    // Create the drug
    try {
      const newDrug = await db.drug.create({
        data
      });
      
      return NextResponse.json({
        drug: newDrug,
        message: "Drug created successfully"
      });
    } catch (dbError: any) {
      console.error("Database error creating drug:", dbError);
      
      // Check for unique constraint violations
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: "A drug with this combination of name, dosage, and form already exists." },
          { status: 409 }
        );
      }
      
      throw dbError;
    }
    
  } catch (error) {
    console.error("Error creating drug:", error);
    
    return NextResponse.json(
      { error: "Failed to create drug", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Delete a drug
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin using the shared middleware
    const authResponse = await adminApiMiddleware(request);
    if (authResponse) return authResponse;
    
    // Parse drug ID from query string
    const id = request.nextUrl.searchParams.get('id');
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Drug ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the drug
    await db.drug.delete({
      where: { id }
    });
    
    return NextResponse.json({
      message: "Drug deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting drug:", error);
    
    return NextResponse.json(
      { error: "Failed to delete drug" },
      { status: 500 }
    );
  }
} 