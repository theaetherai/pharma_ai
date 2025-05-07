import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { db } from "@/lib/db";

// GET endpoint to retrieve user's medical history
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Find existing medical history or create a new one
    const medicalHistory = await db.medicalHistory.findFirst({
      where: {
        userId: user.id
      }
    });
    
    if (!medicalHistory) {
      // Return empty medical history if none exists
      return NextResponse.json({
        userId: user.id,
        diagnosedWith: [],
        medications: [],
        allergies: []
      });
    }
    
    return NextResponse.json(medicalHistory);
  } catch (error) {
    console.error("Medical history GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST endpoint to update user's medical history
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { diagnosedWith, medications, allergies } = body;
    
    // Find existing medical history or create a new one
    const existingHistory = await db.medicalHistory.findFirst({
      where: {
        userId: user.id
      }
    });
    
    let medicalHistory;
    
    if (existingHistory) {
      // Update existing medical history
      medicalHistory = await db.medicalHistory.update({
        where: {
          id: existingHistory.id
        },
        data: {
          diagnosedWith,
          medications,
          allergies,
        }
      });
    } else {
      // Create new medical history
      medicalHistory = await db.medicalHistory.create({
        data: {
          userId: user.id,
          diagnosedWith,
          medications,
          allergies,
        }
      });
    }
    
    return NextResponse.json(medicalHistory);
  } catch (error) {
    console.error("Medical history POST error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 