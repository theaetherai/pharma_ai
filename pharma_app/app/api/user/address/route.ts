import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST endpoint to create a new address for the authenticated user
export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const userSession = await getCurrentUser();
    
    // Check if the user is authenticated
    if (!userSession) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault = false
    } = body;
    
    // Validate required fields
    if (!addressLine1 || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { error: "Address line 1, city, state, postal code, and country are required" },
        { status: 400 }
      );
    }
    
    // Create the address
    const address = await prisma.address.create({
      data: {
        userId: userSession.id,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode,
        country,
        isDefault,
      },
    });
    
    // If this is set as the default address, update other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: userSession.id,
          id: { not: address.id },
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    return NextResponse.json(address);
    
  } catch (error) {
    console.error("Error creating address:", error);
    
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve all addresses for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Get the current user
    const userSession = await getCurrentUser();
    
    // Check if the user is authenticated
    if (!userSession) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get all addresses for the user
    const addresses = await prisma.address.findMany({
      where: {
        userId: userSession.id,
      },
      orderBy: {
        isDefault: 'desc', // Default address first
      },
    });
    
    return NextResponse.json(addresses);
    
  } catch (error) {
    console.error("Error fetching addresses:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
} 