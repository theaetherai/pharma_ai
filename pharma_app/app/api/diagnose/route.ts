import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserRole } from "@prisma/client";
import { processConversation, detectPainRelatedSymptoms } from "../../../api/process-diagnosis";

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

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user ID from Clerk
    const { userId: clerkUserId } = auth();
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({ 
        error: "Invalid request body - could not parse JSON" 
      }, { status: 400 });
    }
    
    // Check if we're using the new format (conversation) or old format (messages)
    let messages = body.conversation || body.messages || [];
    const on_demand = body.on_demand || false;
    
    // Validate message structure
    if (!validateMessages(messages)) {
      console.error("Invalid messages format:", messages);
      return NextResponse.json({ 
        error: "Invalid message format. Each message must have 'role' (user/assistant) and 'content' properties." 
      }, { status: 400 });
    }
    
    // If no user ID from Clerk, use the one from the request or default
    const userId = clerkUserId || body.userId || "default-user-id";
    
    console.log(`Generating diagnosis for user ${userId}, with ${messages.length} messages. On-demand: ${on_demand}`);
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No conversation history provided" }, { status: 400 });
    }
    
    // Check if conversation has pain-related symptoms
    const hasPainSymptoms = detectPainRelatedSymptoms(messages);
    if (hasPainSymptoms) {
      console.log("Pain-related symptoms detected - will enhance diagnosis model with pain treatment options");
    }
    
    // Prepare payload for the Python API
    // Process conversation to manage token limits
    const processedMessages = processConversation(messages);
    console.log(`Processed conversation from ${messages.length} to ${processedMessages.length} messages`);
    
    const conversation = processedMessages.map((msg: ChatMessage) => ({
      role: msg.role,
      // Truncate very long messages to reduce token count
      content: truncateMessageContent(msg.content, 700)
    }));
    
    // Helper function to truncate long message content
    function truncateMessageContent(content: string, maxLength: number): string {
      if (!content || content.length <= maxLength) return content;
      
      // Keep first part and last part, middle is replaced with a note
      const firstPart = content.substring(0, maxLength / 2);
      const lastPart = content.substring(content.length - maxLength / 2);
      return `${firstPart}... [content truncated to reduce token count] ...${lastPart}`;
    }
    
    // Log the payload for debugging
    console.log("Sending payload to Python API:", {
      user_id: userId,
      conversation_length: conversation.length,
      on_demand: on_demand,
      pain_detected: hasPainSymptoms
    });
    
    // Call Python backend API with retry logic
    let response;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        console.log(`Attempt ${attempt + 1} to call Python API`);
        response = await fetch(`${API_URL}/api/diagnose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
            user_id: userId,
            conversation,
            on_demand,
            pain_detected: hasPainSymptoms // Send this flag to the Python backend
          }),
          // Add a longer timeout to prevent the request from being cut off
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        // If the response is successful, break the retry loop
        if (response.ok) {
          break;
        }
        
        // If the response is not successful, try again
        const errorText = await response.text();
        console.error(`API error on attempt ${attempt + 1} (${response.status}):`, errorText);
        
      } catch (fetchError) {
        console.error(`Fetch error on attempt ${attempt + 1}:`, fetchError);
      }
      
      // Increment attempt counter and wait before retrying
      attempt++;
      if (attempt < maxAttempts) {
        // Wait for 2 seconds before trying again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // If we've exhausted all attempts and still don't have a valid response
    if (!response || !response.ok) {
      console.error(`Failed to get diagnosis after ${maxAttempts} attempts`);
      return NextResponse.json({
        response: "I encountered a technical issue while analyzing your symptoms. Please try again later.",
        diagnosis: {
          diagnosis: "Unable to generate diagnosis due to a server error",
          prescriptions: [],
          follow_up_recommendations: "Please try again later"
        },
        checkout_ready: false,
        error: `Failed to get diagnosis after ${maxAttempts} attempts`
      }, { status: 500 });
    }
    
    // Get the response as text first
    const responseText = await response.text();
    
    // Check for empty response
    if (!responseText || responseText.trim() === '') {
      console.error("Empty response received from Python API");
      return NextResponse.json({
        response: "I encountered a technical issue while analyzing your symptoms.",
        diagnosis: {
          diagnosis: "Unable to generate diagnosis due to an empty API response",
          prescriptions: [],
          follow_up_recommendations: "Please try again later"
        },
        checkout_ready: false,
        error: "Empty response from diagnosis API"
      }, { status: 500 });
    }
    
    // Parse the JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Failed to parse API response as JSON:", jsonError);
      console.error("Raw response:", responseText);
      return NextResponse.json({
        response: "I encountered a technical issue while analyzing your symptoms.",
        diagnosis: {
          diagnosis: "Unable to generate diagnosis due to invalid API response format",
          prescriptions: [],
          follow_up_recommendations: "Please consult with a healthcare professional"
        },
        checkout_ready: false,
        error: "Invalid JSON response from diagnosis API"
      }, { status: 500 });
    }
    
    // Log the diagnosis for debugging
    console.log(`Received diagnosis response. Status: ${data.status || 'unknown'}`);
    console.log(`Diagnosis data structure: ${JSON.stringify(data, null, 2)}`);
    
    // Handle potential errors in the API response
    let finalDiagnosis: { 
      diagnosis: string;
      prescriptions: Prescription[];
      follow_up_recommendations: string;
    } = {
      diagnosis: "Based on the information provided, a diagnosis could not be determined.",
      prescriptions: [],
      follow_up_recommendations: "None"
    };
    
    if (data.diagnosis) {
      // Check if diagnosis object is properly structured
      if (typeof data.diagnosis === 'object') {
        // Handle old format - if diagnosis has prescription instead of prescriptions
        if (data.diagnosis?.prescription && !data.diagnosis?.prescriptions) {
          console.log("Converting old prescription format to new prescriptions format");
          const oldPrescriptions = Array.isArray(data.diagnosis.prescription) ? 
            data.diagnosis.prescription : [];
          
          // Convert old format prescriptions to new format
          const newPrescriptions = oldPrescriptions.map((rx: any) => ({
            drug_name: rx.drug || "Unknown medication",
            dosage: rx.dosage || "As directed",
            form: "tablet", // Default form
            duration: rx.duration || "As needed",
            instructions: "Take as directed by healthcare provider"
          }));
          
          finalDiagnosis = {
            diagnosis: data.diagnosis?.diagnosis || "Unable to determine diagnosis",
            prescriptions: newPrescriptions,
            follow_up_recommendations: data.diagnosis?.follow_up_recommendations || "None"
          };
        } else {
          // Use new format directly
          finalDiagnosis = {
            diagnosis: data.diagnosis?.diagnosis || "Unable to determine diagnosis",
            prescriptions: Array.isArray(data.diagnosis?.prescriptions) ? 
              data.diagnosis?.prescriptions : [],
            follow_up_recommendations: data.diagnosis?.follow_up_recommendations || "None"
          };
        }
      } else {
        console.error("Unexpected diagnosis format:", data.diagnosis);
        finalDiagnosis = {
          diagnosis: "Unable to process diagnosis data due to format issues",
          prescriptions: [],
          follow_up_recommendations: "Please consult with a healthcare professional"
        };
      }
    } else if (data.error) {
      // If there's an error, create a fallback diagnosis
      console.error("Error from diagnosis API:", data.error);
      finalDiagnosis = {
        diagnosis: "We encountered a technical issue while analyzing your symptoms.",
        prescriptions: [],
        follow_up_recommendations: "Please consult with a healthcare professional"
      };
    }
    
    try {
      // First check if the user exists in the database by Clerk ID
      let dbUser = null;
      
      if (clerkUserId) {
        dbUser = await db.user.findUnique({
          where: {
            clerkId: clerkUserId
          }
        });
        
        // If user doesn't exist in our database but is authenticated through Clerk
        if (!dbUser) {
          console.log(`User with Clerk ID ${clerkUserId} exists in Clerk but not in database. Creating user record.`);
          
          // Get user details from Clerk
          const clerkUser = await currentUser();
          
          if (clerkUser) {
            // Create user in the database
            dbUser = await db.user.create({
              data: {
                clerkId: clerkUserId,
                email: clerkUser.emailAddresses[0]?.emailAddress || `${clerkUserId}@example.com`,
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
                role: UserRole.USER,
                // Empty password for OAuth users
                password: '',
              }
            });
            
            console.log(`Created new user in database with ID ${dbUser.id} for Clerk ID ${clerkUserId}`);
          } else {
            console.error(`Could not retrieve Clerk user details for ID ${clerkUserId}`);
          }
        }
      }
      
      // Only save to database if we have a valid user
      if (dbUser) {
        // Save conversation with diagnosis to database using the internal database ID
    await db.conversation.create({
      data: {
            userId: dbUser.id,
        message: "diagnose",
        response: "Diagnosis generated",
            diagnosis: data,
          },
        });
        console.log("Saved diagnosis to database");
      } else {
        console.log("No valid user found, skipping database save");
      }
    } catch (dbError) {
      // Handle specific Prisma errors
      if (dbError instanceof PrismaClientKnownRequestError) {
        if (dbError.code === 'P2003') {
          console.error("Foreign key constraint violation:", dbError);
        }
      }
      // Log database error but don't fail the request
      console.error("Database error saving diagnosis:", dbError);
    }
    
    // Return the correct response format expected by the frontend
    return NextResponse.json({
      response: "Here's your diagnosis and prescription. I'm passing this to the system to prepare your checkout.",
      diagnosis: finalDiagnosis,
      checkout_ready: true
    });
    
  } catch (error) {
    console.error("Diagnose API error:", error);
    return NextResponse.json({ 
      response: "I encountered a technical issue while generating your diagnosis.",
      diagnosis: {
        diagnosis: error instanceof Error ? error.message : "Unknown error occurred",
        prescriptions: [],
        follow_up_recommendations: "Please consult with a healthcare professional"
      },
      checkout_ready: false,
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 