import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Logout the user (clear the cookie)
    logout();

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
} 