import { auth } from "@clerk/nextjs";
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

// Define PrescriptionStatus if not exported by Prisma client
enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

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
    
    // Get prescription data from request body
    const data = await request.json();
    const { prescriptions } = data;
    
    if (!prescriptions || !Array.isArray(prescriptions) || prescriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No prescriptions provided"
      }, { status: 400 });
    }
    
    // Save each prescription to the database
    const savedPrescriptions = [];
    
    for (const prescription of prescriptions) {
      const { drug_name, dosage, instructions, duration } = prescription;
      
      // Some default values if not provided
      const doctorName = "PharmaAI Virtual Doctor";
      const frequency = prescription.instructions 
        ? prescription.instructions.split(" ")[0] 
        : "As directed";
      
      // Calculate end date based on duration (e.g. "7 days")
      const durationDays = parseInt(duration?.match(/\d+/)?.[0] || "30");
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      
      // Create the prescription
      const newPrescription = await (db as any).prescription.create({
        data: {
          userId: user.id,
          medication: drug_name,
          dosage: dosage || "As directed",
          frequency: frequency,
          doctorName: doctorName,
          endDate: endDate,
          status: PrescriptionStatus.ACTIVE,
          refills: 3,
          instructions: instructions || "Take as directed",
        }
      });
      
      savedPrescriptions.push(newPrescription);
    }
    
    return NextResponse.json({
      success: true,
      message: `${savedPrescriptions.length} prescription(s) saved successfully`,
      prescriptions: savedPrescriptions
    });
    
  } catch (error) {
    console.error("Error saving prescriptions:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to save prescriptions",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 