import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = auth();
    
    // If no user ID, the request is unauthorized
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse pagination parameters from query string
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 20;
    const skip = (validPage - 1) * validLimit;

    // Find user in database by clerkId
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    // If user doesn't exist in our database
    if (!user) {
      console.log(`User with Clerk ID ${userId} not found in database`);
      return NextResponse.json({ conversations: [] });
    }

    // Get total count for pagination
    const totalConversations = await db.conversation.count({
      where: { userId: user.id }
    });
    
    // Get conversations for this user, ordered by createdAt with pagination
    const conversations = await db.conversation.findMany({
      where: { 
        userId: user.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      select: {
        id: true,
        message: true,
        response: true,
        createdAt: true
      },
      skip,
      take: validLimit
    });

    // Format conversations into chat messages
    const chatHistory = conversations.reduce((messages, conv) => {
      // Add user message first, then assistant response
      return [
        ...messages,
        { role: 'user' as const, content: conv.message },
        { role: 'assistant' as const, content: conv.response }
      ];
    }, [] as { role: 'user' | 'assistant'; content: string }[]);

    return NextResponse.json({ 
      success: true,
      chatHistory,
      pagination: {
        totalRecords: totalConversations,
        currentPage: validPage,
        pageSize: validLimit,
        totalPages: Math.ceil(totalConversations / validLimit)
      }
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ 
      error: "Failed to fetch conversations",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 