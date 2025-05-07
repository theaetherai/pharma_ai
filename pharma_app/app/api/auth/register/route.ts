import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth";

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const result = registerSchema.safeParse(body);

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

    // Register the user
    const { name, email, password } = result.data;
    const authResult = await registerUser(email, password, name);

    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: authResult.user?.id,
        name: authResult.user?.name,
        email: authResult.user?.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
} 