import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = auth();
    
    // If no user ID, the request is unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user in database by clerkId
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    // If user doesn't exist in our database
    if (!user) {
      console.log(`User with Clerk ID ${userId} not found in database`);
      return NextResponse.json({ success: true, message: "No conversations to reset" });
    }

    // Delete all conversations for this user
    await db.conversation.deleteMany({
      where: { 
        userId: user.id 
      }
    });

    console.log(`Reset conversations for user ${user.id}`);

    return NextResponse.json({ 
      success: true,
      message: "Conversation history cleared successfully"
    });
  } catch (error) {
    console.error("Error resetting conversations:", error);
    return NextResponse.json({ 
      error: "Failed to reset conversations",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 