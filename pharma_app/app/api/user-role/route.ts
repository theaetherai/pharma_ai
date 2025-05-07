import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getUserRoleFromJWT } from "@/lib/jwt-utils";

/**
 * API endpoint to get the user's role from JWT cache
 * This avoids expensive DB lookups for role checks
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user's ID from auth
    const { userId } = auth();
    
    // If user is not authenticated, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user's role from JWT or database (with JWT caching)
    const role = await getUserRoleFromJWT(userId);
    
    // Return the role
    return NextResponse.json({ role: role || "USER" }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role" }, 
      { status: 500 }
    );
  }
} 