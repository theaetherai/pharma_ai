import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
      firstName: name.split(" ")[0],
      lastName: name.split(" ")[1] || "",
    });

    // Set admin role in Clerk metadata
    await clerkClient.users.updateUser(clerkUser.id, {
      publicMetadata: {
        role: "ADMIN",
      },
    });

    // Create user in database
    const user = await db.user.create({
      data: {
        email,
        name,
        password: "clerk-managed", // We don't store the actual password
        role: "ADMIN",
        clerkId: clerkUser.id,
      },
    });

    return NextResponse.json({ 
      message: "Admin user created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
} 