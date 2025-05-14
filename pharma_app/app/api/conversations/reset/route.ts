import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get authentication info
    const { userId } = auth();
    
    // Parse the request body for custom user ID if provided
    const body = await request.json().catch(() => ({}));
    
    // Ensure we have a user ID (either from auth or from the request)
    const chatUserId = userId || body.userId || 'anonymous-user';
    
    // For anonymous users, just return success without DB operations
    const isAnonymousUser = chatUserId.startsWith('user-') || chatUserId === 'anonymous-user';
    if (isAnonymousUser) {
      return NextResponse.json({ 
        success: true,
        message: `Conversation history for anonymous user ${chatUserId} has been reset (no database operation needed)` 
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

    // If user not found, return success but with a note
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        message: `User ${chatUserId} not found in database, no conversations to reset` 
      });
    }

    // Actually delete conversations from the database
    const result = await db.conversation.deleteMany({
      where: { userId: user.id }
    });

    console.log(`Deleted ${result.count} conversations for user ${chatUserId}`);

    return NextResponse.json({ 
      success: true,
      message: `Deleted ${result.count} conversations for user ${chatUserId}` 
    });
  } catch (error) {
    console.error('Reset conversation API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Error resetting conversation: ${error}` 
      },
      { status: 500 }
    );
  }
} 