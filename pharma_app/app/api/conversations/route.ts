import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    // Get authentication info
    const { userId } = auth();
    
    // Get the user ID from the query parameters or use the authenticated user ID
    const searchParams = request.nextUrl.searchParams;
    const chatUserId = searchParams.get('userId') || userId || 'anonymous-user';
    
    // For demo/anonymous users, return empty array
    const isAnonymousUser = chatUserId.startsWith('user-') || chatUserId === 'anonymous-user';
    if (isAnonymousUser) {
      return NextResponse.json({
        success: true,
        chatHistory: [],
        userId: chatUserId,
        message: 'No stored history for anonymous user'
      });
    }
    
    // Find the user in the database
    const user = await db.user.findFirst({
      where: {
        OR: [
          { id: chatUserId },
          { clerkId: chatUserId }
        ]
      }
    });
    
    // If user not found, return empty array
    if (!user) {
      return NextResponse.json({
        success: true,
        chatHistory: [],
        userId: chatUserId,
        message: 'User not found in database'
      });
    }
    
    // Fetch the conversations from the database directly
    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });
    
    // Format the conversations into chat messages
    const chatHistory = [];
    
    // Process each conversation into user and assistant message pairs
    for (const conversation of conversations) {
      chatHistory.push({ 
        role: 'user', 
        content: conversation.message 
      });
      
      chatHistory.push({ 
        role: 'assistant', 
        content: conversation.response 
      });
    }
    
    return NextResponse.json({
      success: true,
      chatHistory,
      userId: chatUserId
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Error fetching conversation history: ${error}` 
      },
      { status: 500 }
    );
  }
} 