import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get authentication info
    const { userId } = auth();
    
    // Get the user ID from the query parameters or use the authenticated user ID
    const searchParams = request.nextUrl.searchParams;
    const chatUserId = searchParams.get('userId') || userId || 'anonymous-user';
    
    // For demo/anonymous users, return empty result
    const isAnonymousUser = chatUserId.startsWith('user-') || chatUserId === 'anonymous-user';
    if (isAnonymousUser) {
      return NextResponse.json({
        success: true,
        diagnosis: null,
        message: 'No diagnosis found for anonymous user'
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
    
    // If user not found, return empty result
    if (!user) {
      return NextResponse.json({
        success: true,
        diagnosis: null,
        message: 'User not found in database'
      });
    }
    
    // Fetch the user's latest conversation with diagnosis from the database
    const latestConversation = await db.conversation.findFirst({
      where: { 
        userId: user.id, // Use the actual user ID from the database
        diagnosis: {
          not: Prisma.DbNull
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!latestConversation || !latestConversation.diagnosis) {
      return NextResponse.json({
        success: true,
        diagnosis: null,
        message: 'No diagnosis found for this user'
      });
    }
    
    return NextResponse.json({
      success: true,
      diagnosis: latestConversation.diagnosis,
      diagnosisId: latestConversation.id,
      createdAt: latestConversation.createdAt
    });
  } catch (error) {
    console.error('Error fetching latest diagnosis:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Error fetching latest diagnosis: ${error}` 
      },
      { status: 500 }
    );
  }
} 