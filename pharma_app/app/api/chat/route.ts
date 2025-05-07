import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { auth, currentUser } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

const API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user ID from Clerk
    const { userId } = auth();
    
    // If no user ID, the request is unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { message } = await req.json();
    
    // Call Python backend API
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        user_id: userId, // Use the actual Clerk user ID
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we received the expected response format
    if (!data.response) {
      console.error("Invalid API response format:", data);
      return NextResponse.json({ error: "Invalid response format from API" }, { status: 500 });
    }
    
    try {
      // First check if the user exists in the database
      let existingUser = await db.user.findUnique({
        where: {
          clerkId: userId // Look up user by clerk ID
        }
      });
      
      // If user doesn't exist in our database but is authenticated through Clerk
      if (!existingUser) {
        console.log(`User with Clerk ID ${userId} exists in Clerk but not in database. Creating user record.`);
        
        // Get user details from Clerk
        const clerkUser = await currentUser();
        
        if (clerkUser) {
          // Create user in the database
          existingUser = await db.user.create({
            data: {
              clerkId: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@example.com`,
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
              role: UserRole.USER,
              // Empty password for OAuth users
              password: '',
            }
          });
          
          console.log(`Created new user in database with ID ${existingUser.id} for Clerk ID ${userId}`);
        } else {
          console.error(`Could not retrieve Clerk user details for ID ${userId}`);
        }
      }
      
      // Save conversation to database if we have a valid user
      if (existingUser) {
        await db.conversation.create({
          data: {
            userId: existingUser.id, // Use the internal database ID
            message,
            response: data.response,
          },
        });
      } else {
        // Still log the chat activity even if we couldn't create the user
        console.log(`Chat message processed for uncreated user ${userId}: ${message.substring(0, 50)}...`);
      }
    } catch (dbError) {
      // Handle specific Prisma errors with appropriate responses
      if (dbError instanceof PrismaClientKnownRequestError) {
        // Foreign key constraint violation
        if (dbError.code === 'P2003') {
          console.error("Foreign key constraint violation:", dbError);
        } else if (dbError.code === 'P2002') {
          // Unique constraint violation (e.g., duplicate email)
          console.error("Unique constraint violation:", dbError);
        }
      }
      
      // Log database errors but don't fail the chat request
      console.error("Database error:", dbError);
    }
    
    // Return successful response to client
    return NextResponse.json({
      response: data.response,
      conversationId: data.conversation_id || userId
    });
  } catch (error) {
    console.error("Chat API error:", error);
    // Return proper JSON format even for errors
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 