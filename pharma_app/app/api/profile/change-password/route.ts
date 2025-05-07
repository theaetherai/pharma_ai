import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, comparePassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated" 
      }, { status: 401 });
    }

    // Get and validate the request body
    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid data", 
        errors: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user with password
    const user = await (db as any).user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        password: true,
      }
    });

    if (!user || !user.password) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: "Current password is incorrect"
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await (db as any).user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({
      success: false,
      message: "An error occurred while changing password"
    }, { status: 500 });
  }
} 