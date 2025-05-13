import { NextRequest, NextResponse } from 'next/server';
import { chatWithAgent, generateDiagnosis, clearConversation, healthCheck, ChatMessage } from '@/lib/pharma_api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, message, conversation, onDemand = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'chat':
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required for chat action' },
            { status: 400 }
          );
        }
        
        const chatResponse = await chatWithAgent(userId, message, onDemand);
        return NextResponse.json(chatResponse);

      case 'diagnose':
        // Convert conversation if provided
        let conversationHistory: ChatMessage[] | undefined = undefined;
        if (conversation) {
          conversationHistory = conversation.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
        }
        
        const diagnosisResponse = await generateDiagnosis(userId, conversationHistory, onDemand);
        return NextResponse.json(diagnosisResponse);

      case 'clear':
        const clearResponse = await clearConversation(userId);
        return NextResponse.json(clearResponse);

      case 'health':
        const healthResponse = healthCheck();
        return NextResponse.json(healthResponse);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: chat, diagnose, clear, health' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Agent error:', error);
    return NextResponse.json(
      { error: `Error processing request: ${error}` },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json(healthCheck());
} 