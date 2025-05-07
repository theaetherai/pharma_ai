import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export async function PUT(req: NextRequest) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated" 
      }, { status: 401 });
    }

    // Get and validate the request body
    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid data", 
        errors: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { name, email } = validation.data;

    // Check if email already exists (if it's different from current email)
    if (email !== user.email) {
      const existingUser = await (db as any).user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: "Email already in use"
        }, { status: 400 });
      }
    }

    // Update user
    const updatedUser = await (db as any).user.update({
      where: { id: user.id },
      data: {
        name,
        email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({
      success: false,
      message: "An error occurred while updating profile"
    }, { status: 500 });
  }
} 