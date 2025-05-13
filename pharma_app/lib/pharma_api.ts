import { PharmacistAgent } from '@/lib/pharma_agent';
import { db } from '@/lib/db';

// Define typescript interfaces
export interface ChatMessage {
  role: string;
  content: string;
}

export interface PrescriptionItem {
  drug_name: string;
  dosage: string;
  form: string;
  duration: string;
  instructions: string;
}

export interface DiagnosisData {
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  follow_up_recommendations: string;
  error?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  readyForDiagnosis: boolean;
}

export interface DiagnosisResponse {
  response: string;
  diagnosis: DiagnosisData | null;
  checkout_ready: boolean;
  error?: string;
}

// Store user-specific conversation histories
const userConversations: Record<string, ChatMessage[]> = {};

// Create a shared PharmacistAgent instance for generating responses
// (No longer storing conversation history in this instance)
let sharedAgent: PharmacistAgent | null = null;

// Function to get or initialize the shared agent
const getSharedAgent = (): PharmacistAgent => {
  if (!sharedAgent) {
    sharedAgent = new PharmacistAgent();
  }
  return sharedAgent;
};

// Function to get or initialize a user's conversation history
export const getUserConversation = async (userId: string): Promise<ChatMessage[]> => {
  // For demo/anonymous users, don't try to access the database
  const isAnonymousUser = userId.startsWith('user-') || userId === 'anonymous-user';
  
  if (!isAnonymousUser) {
    try {
      // Try to find the user in the database first
      const user = await db.user.findFirst({
        where: {
          OR: [
            { id: userId },
            { clerkId: userId }
          ]
        }
      });
      
      if (user) {
        // We found a real user, so try to load their conversations
        const dbConversations = await db.conversation.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' }
        });

        if (dbConversations.length > 0) {
          console.log(`Loaded ${dbConversations.length} messages from database for user ${userId}`);
          
          // Convert database conversations to ChatMessage format
          const messages: ChatMessage[] = [];
          
          // First, add the system message
          const agent = getSharedAgent();
          messages.push({ ...agent.conversation_history[0] });
          
          // Then add all user/assistant messages from the database
          for (const conv of dbConversations) {
            messages.push({ role: 'user', content: conv.message });
            messages.push({ role: 'assistant', content: conv.response });
          }
          
          // Store in memory cache
          userConversations[userId] = messages;
          return messages;
        }
      } else {
        console.log(`User ${userId} not found in database, falling back to in-memory conversation`);
      }
    } catch (error) {
      console.error(`Error loading conversation history from database: ${error}`);
    }
  } else {
    console.log(`Using in-memory conversation for anonymous user ${userId}`);
  }
  
  // If no database history or on error, initialize with the system message
  if (!userConversations[userId]) {
    const agent = getSharedAgent();
    // Initialize with the system message from the agent
    userConversations[userId] = [{ ...agent.conversation_history[0] }];
  }
  
  return userConversations[userId];
};

export async function chatWithAgent(userId: string, message: string, onDemand: boolean = false): Promise<ChatResponse> {
  try {
    console.log(`Received message from user ${userId}: ${message}`);
    
    // Get the user's conversation history
    const conversation = await getUserConversation(userId);
    
    // Add user message to conversation history
    conversation.push({
      role: "user",
      content: message
    });
    
    // Create a temporary copy of the PharmacistAgent with the user's conversation
    const tempAgent = new PharmacistAgent();
    tempAgent.conversation_history = [...conversation];
    
    // Get response from agent
    const response = await tempAgent.getAIResponse();
    console.log(`Generated response: ${response.substring(0, 100)}...`);
    
    // Update the user's conversation with the assistant's response
    // (The getAIResponse method already added the response to tempAgent.conversation_history)
    conversation.length = 0;
    conversation.push(...tempAgent.conversation_history);
    
    // Store the user message and AI response in the database if not an anonymous user
    const isAnonymousUser = userId.startsWith('user-') || userId === 'anonymous-user';
    
    if (!isAnonymousUser) {
      try {
        // Find the user in the database
        const user = await db.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { clerkId: userId }
            ]
          }
        });
        
        if (user) {
          // Only store in database if we found a real user
          await db.conversation.create({
            data: {
              userId: user.id, // Use the actual user ID from the database
              message,
              response
            }
          });
          console.log(`Stored conversation in database for user ${userId}`);
        } else {
          console.log(`User ${userId} not found in database, skipping database storage`);
        }
      } catch (dbError) {
        console.error(`Error storing conversation in database: ${dbError}`);
        // Continue anyway since we have the response in memory
      }
    }
    
    // Check if we should trigger diagnosis
    let readyForDiagnosis = false;
    
    // Standard conversation end triggers
    if (message.toLowerCase() === 'no' || 
        message.toLowerCase().includes("no more") || 
        message.toLowerCase().includes("that's all")) {
      if (response.toLowerCase().includes("prepare your diagnosis") || 
          response.toLowerCase().includes("prepare your prescription")) {
        readyForDiagnosis = true;
      }
    }
    
    // Add explicit on-demand diagnosis triggers
    if (message.toLowerCase().includes("diagnose me") || 
        message.toLowerCase().includes("need a diagnosis")) {
      readyForDiagnosis = true;
    }
    
    return {
      response: response,
      conversation_id: userId,
      readyForDiagnosis: readyForDiagnosis
    };
  } catch (error) {
    console.error(`Error in chat endpoint: ${error}`);
    throw new Error(`Failed to generate response: ${error}`);
  }
}

export async function generateDiagnosis(userId: string, conversation?: ChatMessage[], onDemand: boolean = false): Promise<DiagnosisResponse> {
  try {
    console.log(`Generating diagnosis for user ${userId}`);
    
    // If on_demand is True, we'll provide a diagnosis even with limited information
    if (onDemand) {
      console.log("Generating on-demand diagnosis with available information");
    } else {
      console.log("Generating standard end-of-conversation diagnosis");
    }
    
    // If no conversation history provided, try to use the stored history
    let conversationHistory = conversation;
    if (!conversationHistory) {
      conversationHistory = await getUserConversation(userId);
    }
    
    if (conversationHistory.length === 0) {
      throw new Error("No conversation history available for diagnosis");
    }
    
    // Process the user's conversation history and generate a diagnosis
    // Use a fresh agent to avoid any state conflicts
    const diagnosisAgent = new PharmacistAgent();
    
    try {
      const diagnosis = await diagnosisAgent.generateDiagnosis(
        conversationHistory,
        onDemand
      );
      
      // Log the diagnosis format for debugging
      console.log(`Generated diagnosis: ${JSON.stringify(diagnosis)}`);
      
      // Store diagnosis in the database if not an anonymous user
      const isAnonymousUser = userId.startsWith('user-') || userId === 'anonymous-user';
      
      if (!isAnonymousUser) {
        try {
          // Find the user in the database
          const user = await db.user.findFirst({
            where: {
              OR: [
                { id: userId },
                { clerkId: userId }
              ]
            }
          });
          
          if (user) {
            // Find the latest conversation entry for this user
            const latestConversation = await db.conversation.findFirst({
              where: { userId: user.id },
              orderBy: { createdAt: 'desc' }
            });
            
            if (latestConversation) {
              // Update the latest conversation with the diagnosis information
              await db.conversation.update({
                where: { id: latestConversation.id },
                data: {
                  diagnosis: diagnosis as any // Store the full diagnosis JSON
                }
              });
              console.log(`Stored diagnosis in database for user ${userId}`);
            }
          } else {
            console.log(`User ${userId} not found in database, skipping database storage of diagnosis`);
          }
        } catch (dbError) {
          console.error(`Error storing diagnosis in database: ${dbError}`);
          // Continue anyway since we have the diagnosis in memory
        }
      }
      
      return {
        response: "Here's your diagnosis and prescription. I'm passing this to the system to prepare your checkout.",
        diagnosis: diagnosis,
        checkout_ready: true
      };
    } catch (diagErr) {
      console.error(`Error in diagnosis generation: ${diagErr}`);
      return {
        response: "I encountered an error preparing your diagnosis.",
        diagnosis: {
          diagnosis: "Error generating diagnosis. Please try again or provide more information.",
          prescriptions: [],
          follow_up_recommendations: "Please consult with a healthcare professional"
        },
        checkout_ready: false,
        error: String(diagErr)
      };
    }
  } catch (error) {
    console.error(`Error in diagnose endpoint: ${error}`);
    return {
      response: "I encountered an error preparing your diagnosis.",
      diagnosis: {
        diagnosis: "Error generating diagnosis. Please try again or provide more information.",
        prescriptions: [],
        follow_up_recommendations: "Please consult with a healthcare professional"
      },
      checkout_ready: false,
      error: String(error)
    };
  }
}

// Utility function to clear conversation history
export async function clearConversation(userId: string): Promise<{ message: string }> {
  try {
    // Only clear from database if it's not an anonymous user
    const isAnonymousUser = userId.startsWith('user-') || userId === 'anonymous-user';
    
    if (!isAnonymousUser) {
      try {
        // Find the user in the database
        const user = await db.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { clerkId: userId }
            ]
          }
        });
        
        if (user) {
          // Clear conversations from database
          await db.conversation.deleteMany({
            where: { userId: user.id }
          });
          console.log(`Deleted all conversations from database for user ${userId}`);
        } else {
          console.log(`User ${userId} not found in database, skipping database clearing`);
        }
      } catch (dbError) {
        console.error(`Error clearing conversations from database: ${dbError}`);
      }
    }
    
    // Always clear from in-memory cache
    if (userId in userConversations) {
      const agent = getSharedAgent();
      // Reset to just the system message
      userConversations[userId] = [{ ...agent.conversation_history[0] }];
    }
    
    return { message: `Conversation history cleared for user ${userId}` };
  } catch (error) {
    console.error(`Error clearing conversations from database: ${error}`);
    return { message: `Error clearing conversation history for user ${userId}: ${error}` };
  }
}

// Health check function
export function healthCheck(): { status: string; agent: string; model: string } {
  const agent = getSharedAgent();
  return { 
    status: "ok", 
    agent: "PharmaAI Assistant", 
    model: "llama3-8b-8192"
  };
} 