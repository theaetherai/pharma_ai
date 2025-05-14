import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { chatWithAgent } from '@/lib/pharma_api';

export async function POST(request: NextRequest) {
  try {
    // Get authentication info
    const { userId } = auth();
    
    // Parse the request body
    const body = await request.json();
    const { message } = body;
    
    // Ensure we have a user ID (either from auth or from the request)
    const chatUserId = userId || body.userId || 'anonymous-user';
    
    // Ensure we have a message
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
      }
    
    // Call our TypeScript implementation
    const response = await chatWithAgent(chatUserId, message);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: `Error processing chat request: ${error}` },
      { status: 500 }
    );
  }
} 