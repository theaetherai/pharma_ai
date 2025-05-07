import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/auth";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }));
      
      return NextResponse.json({ 
        success: false, 
        message: "Validation failed", 
        errors 
      }, { status: 400 });
    }

    // Authenticate the user
    const { email, password } = result.data;
    const authResult = await loginUser(email, password);

    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: authResult.user?.id,
        name: authResult.user?.name,
        email: authResult.user?.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
} 