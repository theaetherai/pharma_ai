import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserRole } from "@prisma/client";
import { processConversation, detectPainRelatedSymptoms } from "../../../api/process-diagnosis";
import { generateDiagnosis } from '@/lib/pharma_api';

// Change the API URL to use the new simplified server on port 8001
const API_URL = process.env.PYTHON_API_URL || "http://localhost:8001";

// Add a type definition for ChatMessage
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Updated Prescription interface to match new format
interface Prescription {
  drug_name: string;
  dosage: string;
  form: string;
  duration: string;
  instructions: string;
}

// Add a validation function for the chat messages
function validateMessages(messages: any[]): boolean {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0) return false;
  
  return messages.every(msg => 
    msg && 
    typeof msg === 'object' && 
    (msg.role === 'user' || msg.role === 'assistant') && 
    typeof msg.content === 'string'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication info
    const { userId } = auth();
    
    // Parse the request body
    const body = await request.json();
    const { conversation, onDemand = false } = body;
    
    // Ensure we have a user ID (either from auth or from the request)
    const diagnosisUserId = userId || body.userId || 'anonymous-user';
    
    // Call our TypeScript implementation
    const response = await generateDiagnosis(diagnosisUserId, conversation, onDemand);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Diagnosis API error:', error);
    return NextResponse.json(
      { 
        error: `Error processing diagnosis request: ${error}`,
        response: "I encountered an error preparing your diagnosis.",
        diagnosis: {
          diagnosis: "Error generating diagnosis. Please try again or provide more information.",
          prescriptions: [],
          follow_up_recommendations: "Please consult with a healthcare professional"
        },
        checkout_ready: false
      },
      { status: 500 }
    );
  }
} 