import { NextRequest, NextResponse } from "next/server";

// Helper function to transform the AI's response
function transformAIResponse(response: string, userMessage: string): string {
  // Check if this is a checkout completion message
  if (userMessage === "checkout_complete") {
    return "Your order has been completed successfully! Your medications will be delivered soon. If you have any questions about your prescription or need further assistance, please let me know.";
  }

  // Check if we need to trigger diagnosis flow
  if (userMessage.toLowerCase() === 'no' && response.includes('anything else')) {
    return "I'll prepare your diagnosis and prescription based on the symptoms you've shared. Please wait while I analyze your information...";
  }

  // Remove disclaimers and replace with more confident language
  let transformed = response
    .replace(/I'm not a doctor,? but I can try to help you with some general information\.?/g, '')
    .replace(/I am not a doctor,? but I can try to help you with some general information\.?/g, '')
    .replace(/As an AI assistant, I cannot provide medical advice\.?/g, '')
    .replace(/Please consult a healthcare professional for medical advice\.?/g, '')
    .replace(/DISCLAIMER: This is not medical advice\. For serious symptoms, please consult a medical professional immediately\./g, '');
  
  // Extract all questions from the response
  const questionRegex = /[^.!?]*\?/g;
  const questions = transformed.match(questionRegex) || [];
  
  // If many symptoms gathered, check if we should ask the confirmation question
  if (shouldAskConfirmation(userMessage, transformed)) {
    return "Based on what you've told me, I understand your symptoms. Is there anything else you would like to add about how you're feeling?";
  }
  
  // If there are multiple questions, keep only the most important one
  if (questions.length > 1) {
    // Choose the best question based on relevance and importance
    // For this implementation, we'll select the first question that's not about medications
    // or if all are about medications, select the first question
    let selectedQuestion = questions[0];
    for (const question of questions) {
      // Prioritize symptomatic questions over medication questions
      if (!question.toLowerCase().includes('medication') && 
          !question.toLowerCase().includes('medicine') &&
          !question.toLowerCase().includes('drug')) {
        selectedQuestion = question;
        break;
      }
    }
    
    // Remove all questions from the response
    questions.forEach(q => {
      if (q !== selectedQuestion) {
        transformed = transformed.replace(q, '');
      }
    });
    
    // Clean up any duplicate punctuation or spacing that may have resulted
    transformed = transformed
      .replace(/\.\./g, '.')
      .replace(/\s\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
  
  // Add a doctor-like opening if the response doesn't have one
  if (!transformed.includes("Dr. PharmaAI") && !transformed.startsWith("I understand")) {
    transformed = "As Dr. PharmaAI, I'll help you understand your symptoms. " + transformed;
  }
  
  // Ensure the response ends with the selected question clearly presented
  if (questions.length > 0) {
    // Get the selected question - either the first one or the one we selected above
    const selectedQuestion = questions.length > 1 
      ? questions.find(q => transformed.includes(q)) 
      : questions[0];
    
    // Only proceed if we have a valid question
    if (selectedQuestion) {
      // If the question isn't already at the end, add it
      if (!transformed.trim().endsWith(selectedQuestion.trim())) {
        // Remove the question from wherever it is in the text
        transformed = transformed.replace(selectedQuestion, '');
        
        // Add the question at the end with a clear line break
        transformed = transformed.trim() + "\n\nTo understand your situation better: " + selectedQuestion;
      }
    }
  }
  
  return transformed.trim();
}

// Determine if we should prompt for final confirmation before diagnosis
function shouldAskConfirmation(userMessage: string, aiResponse: string): boolean {
  // List of keywords that suggest we've collected substantial symptoms
  const significantSymptomKeywords = [
    'pain', 'ache', 'fever', 'headache', 'nausea', 'vomit', 'cough', 'rash',
    'swelling', 'sore', 'throat', 'stomach', 'chest', 'breathing', 'dizzy',
    'tired', 'fatigue', 'diarrhea', 'constipation'
  ];
  
  // Check if the message contains any meaningful medical information
  const hasSignificantContent = significantSymptomKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );
  
  // Check if AI was previously asking multiple questions (suggesting info gathering)
  const wasAskingQuestions = (aiResponse.match(/\?/g) || []).length >= 1;
  
  // Check if the user message is substantial (more than just yes/no)
  const isSubstantialMessage = userMessage.split(' ').length > 5;
  
  // Combine factors to decide if we should move to confirmation
  return hasSignificantContent && wasAskingQuestions && isSubstantialMessage;
}

// Track if the user has already confirmed they're ready for diagnosis
const confirmationState = new Map<string, boolean>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId } = body;
    const userIdentifier = userId || 'default-user';
    
    // Check if this is a special command that should be handled directly without sending to the AI
    if (message === "checkout_complete") {
      return NextResponse.json({ 
        response: "Your order has been completed successfully! Your medications will be delivered soon. If you have any questions about your prescription or need further assistance, please let me know.",
        conversationId: "system" 
      });
    }
    
    // Check if this is a confirmation "no" response that should trigger diagnosis
    const isConfirmationNo = message.toLowerCase() === 'no' && confirmationState.get(userIdentifier);
    
    // Check the environment variables
    const apiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    
    // Forward the request to the Python backend
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        user_id: userIdentifier,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.detail || "Failed to communicate with backend" }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Ensure we have a valid response
    if (!data.response) {
      return NextResponse.json({ error: "Invalid response from backend" }, { status: 500 });
    }
    
    // Transform the AI's response before sending it to the client
    const transformedResponse = transformAIResponse(data.response, message);
    
    // Check if this is a confirmation prompt
    if (transformedResponse.includes("Is there anything else you would like to add")) {
      confirmationState.set(userIdentifier, true);
    } else if (isConfirmationNo) {
      // Reset confirmation state
      confirmationState.set(userIdentifier, false);
      
      // If this is a "no" to the confirmation prompt, mark ready for diagnosis
      return NextResponse.json({ 
        response: transformedResponse,
        conversationId: data.conversation_id,
        readyForDiagnosis: true
      });
    }
    
    return NextResponse.json({ 
      response: transformedResponse,
      conversationId: data.conversation_id 
    });
    
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 