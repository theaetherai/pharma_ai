import { useState, useCallback, useEffect } from 'react';
import { auth } from "@clerk/nextjs";

// Define interface for chat message
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Define interface for prescription
export interface Prescription {
  drug_name: string;
  dosage: string;
  form: string;
  duration: string;
  instructions: string;
}

// Define interface for diagnosis result
export interface Diagnosis {
  diagnosis: string;
  prescriptions: Prescription[];
  follow_up_recommendations: string;
}

// Hook for handling chat with the pharma AI
export function usePharmaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState<string>(`user-${Math.random().toString(36).substring(2, 11)}`);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [readyForCheckout, setReadyForCheckout] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Effect to load conversation history on page load
  useEffect(() => {
    async function loadConversationHistory() {
      try {
        setIsLoadingHistory(true);
        
        // Try to load from API first since it's now database-backed
        try {
          const response = await fetch('/api/conversations');
          
          if (response.ok) {
            const data = await response.json();
            
            // If we have chat history, set it in the state
            if (data.success && data.chatHistory && data.chatHistory.length > 0) {
              console.log('Loaded conversation history from API:', data.chatHistory.length, 'messages');
              setMessages(data.chatHistory);
              
              // Also save to localStorage as backup
              localStorage.setItem('pharmaai-chat-history', JSON.stringify(data.chatHistory));
              
              // Check if the last message indicates we were in the middle of a diagnosis
              const lastMessage = data.chatHistory[data.chatHistory.length - 1];
              if (lastMessage && lastMessage.role === 'assistant' && 
                  lastMessage.content.includes("passing this to the system")) {
                // If we were at the diagnosis stage, try to restore diagnosis data
                await restoreDiagnosis();
              }
              
              setIsLoadingHistory(false);
              return; // Skip localStorage loading if API succeeded
            }
          }
        } catch (apiErr) {
          console.error('Error loading conversation history from API:', apiErr);
          // Continue to try localStorage as fallback
        }
        
        // Fallback to localStorage if API failed
        const savedChats = localStorage.getItem('pharmaai-chat-history');
        const savedUserId = localStorage.getItem('pharmaai-user-id');
        
        if (savedChats) {
          try {
            const parsedChats = JSON.parse(savedChats);
            if (Array.isArray(parsedChats) && parsedChats.length > 0) {
              console.log('Loaded conversation history from localStorage:', parsedChats.length, 'messages');
              setMessages(parsedChats);
              
              // Check if the last message indicates we were in the middle of a diagnosis
              const lastMessage = parsedChats[parsedChats.length - 1];
              if (lastMessage && lastMessage.role === 'assistant' && 
                  lastMessage.content.includes("passing this to the system")) {
                // If we were at the diagnosis stage, try to restore diagnosis data
                await restoreDiagnosis();
              }
            }
          } catch (error) {
            console.error('Error parsing saved chat history:', error);
            localStorage.removeItem('pharmaai-chat-history');
          }
        }
      } catch (err) {
        console.error('Error loading conversation history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    
    // Restore diagnosis data if needed
    async function restoreDiagnosis() {
      try {
        // First try to get diagnosis from API (database)
        try {
          const response = await fetch('/api/diagnose/latest');
          
          if (response.ok) {
            const data = await response.json();
            if (data.diagnosis) {
              console.log('Restored diagnosis from API');
              setDiagnosis(data.diagnosis);
              setReadyForCheckout(true);
              
              // Save to localStorage for future use
              localStorage.setItem('pharmaai-diagnosis', JSON.stringify(data.diagnosis));
              return; // Skip localStorage if API succeeded
            }
          }
        } catch (apiErr) {
          console.error('Error restoring diagnosis from API:', apiErr);
          // Continue to try localStorage as fallback
        }
        
        // Fallback to localStorage
        const savedDiagnosis = localStorage.getItem('pharmaai-diagnosis');
        if (savedDiagnosis) {
          try {
            const parsedDiagnosis = JSON.parse(savedDiagnosis);
            if (parsedDiagnosis && parsedDiagnosis.diagnosis) {
              console.log('Restored diagnosis from localStorage');
              setDiagnosis(parsedDiagnosis);
              setReadyForCheckout(true);
            }
          } catch (parseErr) {
            console.error('Error parsing saved diagnosis:', parseErr);
            localStorage.removeItem('pharmaai-diagnosis');
          }
        }
      } catch (err) {
        console.error('Error restoring diagnosis:', err);
      }
    }
    
    loadConversationHistory();
  }, []);

  // Effect to save conversation history to localStorage when it changes
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      try {
        localStorage.setItem('pharmaai-chat-history', JSON.stringify(messages));
        localStorage.setItem('pharmaai-user-id', userId);
      } catch (error) {
        console.error('Error saving chat history to localStorage:', error);
      }
    }
  }, [messages, userId, isLoadingHistory]);

  // Effect to handle automatic diagnosis when ready
  useEffect(() => {
    // Don't trigger while loading history
    if (isLoadingHistory) return;
    
    // When marked as ready for diagnosis from a "no" response, automatically request diagnosis
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && 
        (lastMessage?.content?.includes("I'll prepare your diagnosis and prescription") ||
         lastMessage?.content?.includes("I'll provide a preliminary assessment") ||
         lastMessage?.content?.includes("I'll prepare a preliminary diagnosis"))) {
      requestDiagnosis(
        lastMessage?.content?.includes("preliminary") // Pass true for on-demand if it's a preliminary diagnosis
      );
    }
  }, [messages, isLoadingHistory]);

  // Effect to handle on-demand diagnosis requests from user messages
  useEffect(() => {
    // Don't trigger while loading history
    if (isLoadingHistory) return;
    
    // Check the last user message for diagnosis request
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      const content = lastMessage.content.toLowerCase();
      
      // Expanded patterns to detect diagnosis requests in natural language
      if (content.includes("diagnose me") || 
          content.includes("need a diagnosis") ||
          content.includes("get a diagnosis") ||
          content.includes("give me a diagnosis") ||
          content.includes("can you diagnose") ||
          content.includes("provide a diagnosis") ||
          content.includes("diagnosis please") ||
          content.includes("my diagnosis") ||
          content.includes("what's wrong with me") ||
          content.includes("what is wrong with me") ||
          content.includes("do i have") ||
          content.includes("am i sick") ||
          content.includes("medical opinion") ||
          content.includes("assess my symptoms") ||
          content.includes("assess my condition") ||
          content.includes("what condition") ||
          content.includes("health assessment") ||
          content.includes("analyze my symptoms") ||
          content.includes("tell me what i have") ||
          content === "diagnose") {
            
        // Add an immediate response from the AI
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'll provide a preliminary diagnosis based on the information you've shared so far. Let me analyze your symptoms..."
        }]);
        
        // Request an on-demand diagnosis after a short delay for natural conversation flow
        setTimeout(() => {
          requestDiagnosis(true);
        }, 800);
      }
    }
  }, [messages, isLoadingHistory]);

  // Updated to include more natural language patterns for diagnosis requests
  function isDiagnosisRequest(message: string): boolean {
    const diagnosisPatterns = [
      /diagnose/i, 
      /check my symptoms/i,
      /what('s| is) wrong with me/i,
      /need a diagnosis/i,
      /analyze my (symptoms|condition)/i,
      /health (check|assessment)/i,
      /medical (opinion|advice)/i,
      /evaluate my (health|symptoms|condition)/i,
      /check what('s| is) wrong/i,
      /do I have/i,
      /am I (sick|ill)/i,
      /check my health/i
    ];
    
    return diagnosisPatterns.some(pattern => pattern.test(message));
  }

  // Send message to the AI
  const sendMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Handle special case for checkout completion
      if (message === "checkout_complete") {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Your order has been processed successfully. Thank you for using our service!' 
        }]);
        setIsLoading(false);
        return { success: true };
      }
      
      // Handle special case for prescription download
      if (message === "prescription_downloaded") {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Your prescription has been downloaded. You can take it to your local pharmacy to fill your medications.' 
        }]);
        setIsLoading(false);
        return { success: true };
      }
      
      // Add user message to the chat UI immediately for better user experience
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, userId }),
      });
      
      // Parse the response text first to handle potential non-JSON responses
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        console.log('Raw response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send message');
      }
      
      // Validate the response format
      if (!data.response) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }
      
      // Add AI response to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // Check if we should automatically trigger diagnosis
      if (data.readyForDiagnosis) {
        // This will be caught by the useEffect and trigger diagnosis
      }
      
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again or refresh the page.' 
      }]);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  // Enhanced response flow for on-demand diagnosis
  const requestDiagnosis = async (on_demand: boolean = false) => {
    // If messages are empty or already loading, do nothing
    if (messages.length === 0 || isLoading) return;
    
    try {
      setIsLoading(true);
      // Log the type of diagnosis for debugging
      console.log(`Requesting ${on_demand ? 'on-demand' : 'standard'} diagnosis`);
      
      // Generate a handover message from the AI if this is an on-demand diagnosis
      if (on_demand) {
        // Add a message from the assistant acknowledging the diagnosis request
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I'll provide a preliminary diagnosis based on the information you've shared so far. Let me analyze your symptoms..."
          }
        ]);
        
        // Add a small delay to make the conversation flow feel more natural
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      
      // Make a safe copy of messages to prevent any state issues
      const messagesCopy = [...messages];
      
      // Truncate the conversation to prevent token limit errors
      const truncatedMessages = truncateConversation(messagesCopy);
      
      // Ensure the messages array is properly structured and contains valid objects
      const validMessages = truncatedMessages.filter(msg => 
        msg && typeof msg === 'object' && 
        typeof msg.role === 'string' && 
        typeof msg.content === 'string'
      );
      
      console.log(`Sending ${validMessages.length} messages for diagnosis (truncated from ${messagesCopy.length})`);
      
      // Make the API call to get diagnosis
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId, // Include the userId for backward compatibility
          conversation: validMessages,
          on_demand: on_demand,
        }),
        // Add credentials to ensure Clerk auth cookies are sent
        credentials: 'include'
      });
      
      // For debugging
      if (!response.ok) {
        console.error(`Diagnosis API error: ${response.status}`);
        try {
          const errorText = await response.text();
          console.error(`Response body: ${errorText}`);
        } catch (e) {
          console.error("Could not read error response body");
        }
        throw new Error(`Diagnosis request failed with status: ${response.status}`);
      }
      
      // Get response as text first to debug any JSON parsing issues
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Full diagnosis response data:', data);
      } catch (err) {
        console.error('Failed to parse diagnosis response as JSON:', err);
        console.error('Raw response:', responseText);
        throw new Error('Invalid JSON response from diagnosis API');
      }
      
      // Set diagnosis data from the response
      if (data && data.diagnosis) {
        console.log('Setting diagnosis state with data:', data.diagnosis);
        
        // Clone the diagnosis data to ensure we don't have any reference issues
        const diagnosisData = JSON.parse(JSON.stringify(data.diagnosis));
        
        // Set diagnosis state
        setDiagnosis(diagnosisData);
        
        // Set checkout readiness based on response or default to true
        setReadyForCheckout(data.checkout_ready !== false);
        
        // Save diagnosis to localStorage as backup
        localStorage.setItem('pharmaai-diagnosis', JSON.stringify(diagnosisData));
        
        console.log('Diagnosis state has been set:', diagnosisData);
        console.log('Ready for checkout:', data.checkout_ready !== false);
      } else {
        console.error("Unexpected diagnosis response format:", data);
        throw new Error("Diagnosis data not found in response");
      }
      
      // Add a handover message for smoother transition
      let handoverMessage = on_demand 
        ? "Based on the symptoms you've described, here's my diagnosis and recommended treatment plan. Would you like me to explain anything in more detail?"
        : "I've completed my analysis of your health situation. Here's my diagnosis and recommended treatment plan. Let me know if you have any questions.";
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: handoverMessage
        }
      ]);
    } catch (error) {
      console.error("Error requesting diagnosis:", error);
      setError("Failed to generate diagnosis. Please try again.");
      
      // Add error message to the chat for better user experience
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error while generating your diagnosis. Please try again or contact support if the problem persists."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to truncate conversation to stay within LLM token limits
  const truncateConversation = (messages: ChatMessage[]): ChatMessage[] => {
    if (messages.length <= 4) return messages;
    
    // Always keep the system message if it exists (it would be the first message)
    // Use type assertion since ChatMessage doesn't include system role by default
    const hasSystemMessage = messages[0] && (messages[0] as any).role === 'system';
    const systemMessage = hasSystemMessage ? [messages[0]] : [];
    
    // Keep first user message for context
    const firstUserMessageIndex = messages.findIndex(msg => msg.role === 'user');
    const firstUserMessage = firstUserMessageIndex >= 0 ? [messages[firstUserMessageIndex]] : [];
    
    // Keep the most recent ~10 messages which contain the most relevant information
    const recentMessages = messages.slice(-10);
    
    // Combine messages, removing duplicates
    const combinedMessages = [...systemMessage, ...firstUserMessage, ...recentMessages];
    const uniqueMessages = Array.from(new Map(
      combinedMessages.map(msg => [JSON.stringify(msg), msg])
    ).values());
    
    console.log(`Truncated conversation from ${messages.length} to ${uniqueMessages.length} messages`);
    return uniqueMessages;
  };
  
  // Clear the chat - local only, doesn't affect database
  const clearChat = useCallback(() => {
    setMessages([]);
    setDiagnosis(null);
    setError(null);
    setReadyForCheckout(false);
    
    // Also clear localStorage chat data
    localStorage.removeItem('pharmaai-chat-history');
    localStorage.removeItem('pharmaai-diagnosis');
  }, []);
  
  // Reset chat - creates a new conversation in the backend and clears local state
  const resetChat = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear frontend state first
      setMessages([]);
      setDiagnosis(null);
      setError(null);
      setReadyForCheckout(false);
      
      // Clear localStorage data
      localStorage.removeItem('pharmaai-chat-history');
      localStorage.removeItem('pharmaai-diagnosis');
      
      // Call backend API to clear conversation history from the database
      await fetch('/api/conversations/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId }), // Make sure to include userId
        credentials: 'include'
      });
      
      console.log('Chat reset successful');
    } catch (err) {
      console.error('Error resetting chat:', err);
      setError('Failed to reset conversation. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  // Effect to save prescriptions automatically when diagnosis is generated
  useEffect(() => {
    const savePrescriptions = async () => {
      if (!diagnosis || !diagnosis.prescriptions || diagnosis.prescriptions.length === 0 || !readyForCheckout) {
        return;
      }
      
      try {
        const response = await fetch('/api/save-prescription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prescriptions: diagnosis.prescriptions 
          }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          console.error('Error auto-saving prescriptions:', data.message);
        } else {
          console.log('Prescriptions auto-saved successfully:', data.message);
        }
      } catch (error) {
        console.error('Error auto-saving prescriptions:', error);
      }
    };
    
    // Save prescriptions when diagnosis is ready
    if (diagnosis && readyForCheckout) {
      savePrescriptions();
    }
  }, [diagnosis, readyForCheckout]);
  
  return {
    messages,
    isLoading,
    error,
    diagnosis,
    readyForCheckout,
    sendMessage,
    requestDiagnosis,
    clearChat,
    isLoadingHistory,
    resetChat,
    setMessages,
  };
} 