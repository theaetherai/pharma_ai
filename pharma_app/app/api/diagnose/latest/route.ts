import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId: clerkUserId } = auth();
    
    // If no user ID, the request is unauthorized
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user in database by clerkId
    const user = await db.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    // If user doesn't exist in our database
    if (!user) {
      console.log(`User with Clerk ID ${clerkUserId} not found in database`);
      return NextResponse.json({ success: false, message: "User not found" });
    }

    // Get the latest diagnosis
    const latestDiagnosis = await db.conversation.findFirst({
      where: { 
        userId: user.id,
        message: "diagnose"
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      select: {
        diagnosis: true,
        createdAt: true
      }
    });

    if (!latestDiagnosis || !latestDiagnosis.diagnosis) {
      return NextResponse.json({ 
        success: false,
        message: "No diagnosis found"
      });
    }

    // Extract the diagnosis from the diagnosis field (which contains the full API response)
    const diagnosisData = latestDiagnosis.diagnosis;
    
    // Handle different response formats
    let extractedDiagnosis;
    if (diagnosisData && typeof diagnosisData === 'object') {
      if ('diagnosis' in diagnosisData) {
        // If it's the API response containing diagnosis field
        extractedDiagnosis = diagnosisData.diagnosis;
      } else {
        // If it's already the diagnosis object directly
        extractedDiagnosis = diagnosisData;
      }
    } else {
      return NextResponse.json({ 
        success: false,
        message: "Invalid diagnosis format in database"
      });
    }

    return NextResponse.json({ 
      success: true,
      diagnosis: extractedDiagnosis,
      timestamp: latestDiagnosis.createdAt
    });
  } catch (error) {
    console.error("Error fetching latest diagnosis:", error);
    return NextResponse.json({ 
      error: "Failed to fetch latest diagnosis",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 