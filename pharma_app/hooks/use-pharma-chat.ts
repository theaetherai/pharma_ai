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
  // Add a flag to track if messages were just loaded from storage
  const [initialLoad, setInitialLoad] = useState(true);
  // Add a flag to track the message timestamp when messages were first loaded
  const [initialMessagesTimestamp, setInitialMessagesTimestamp] = useState<number>(0);

  // Effect to sync readyForCheckout with diagnosis state
  useEffect(() => {
    setReadyForCheckout(!!diagnosis);
  }, [diagnosis]);

  // Override the standard setMessages to track when new messages are added
  const setMessagesWithTracking = useCallback((newMessagesOrFunction: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessages((prevMessages) => {
      const newMessages = typeof newMessagesOrFunction === 'function' 
        ? newMessagesOrFunction(prevMessages) 
        : newMessagesOrFunction;
        
      // If this is the initial load of messages, save a timestamp
      if (initialLoad && newMessages.length > 0 && initialMessagesTimestamp === 0) {
        console.log('Setting initial messages timestamp');
        setInitialMessagesTimestamp(Date.now());
      }
      
      return newMessages;
    });
  }, [initialLoad, initialMessagesTimestamp]);
  
  // Replace standard setMessages with our tracked version
  useEffect(() => {
    if (initialLoad && messages.length > 0 && initialMessagesTimestamp === 0) {
      console.log('Messages loaded, setting initial timestamp');
      setInitialMessagesTimestamp(Date.now());
    }
  }, [messages, initialLoad, initialMessagesTimestamp]);

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
          
          // Instead, just try to restore previous diagnosis without generating a new one
          await restoreDiagnosis();
              
              setIsLoadingHistory(false);
              // Set initialLoad flag to prevent auto-diagnosis
              setInitialLoad(true);
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
              
              // Instead, just try to restore previous diagnosis without generating a new one
            await restoreDiagnosis();
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
        // Set initialLoad flag to prevent auto-diagnosis
        setInitialLoad(true);
      }
    }
    
    // Modified to only load existing diagnosis data without triggering a new diagnosis
    async function restoreDiagnosis() {
      try {
        console.log('Attempting to restore previously saved diagnosis only');
        let diagnosisRestored = false;
        
        // First try to get diagnosis from API (database)
        try {
          const response = await fetch('/api/diagnose/latest');
          if (response.ok) {
            const data = await response.json();
            if (data.diagnosis) {
              console.log('Restored existing diagnosis from API');
              setDiagnosis(data.diagnosis);
              // Save to localStorage as it came from API
              localStorage.setItem('pharmaai-diagnosis', JSON.stringify(data.diagnosis));
              diagnosisRestored = true;
            }
          }
        } catch (apiErr) {
          console.error('Error restoring diagnosis from API:', apiErr);
          // Continue to try localStorage as fallback
        }
        
        // Fallback to localStorage if not restored from API
        if (!diagnosisRestored) {
          const savedDiagnosis = localStorage.getItem('pharmaai-diagnosis');
          if (savedDiagnosis) {
            try {
              const parsedDiagnosis = JSON.parse(savedDiagnosis);
              if (parsedDiagnosis && parsedDiagnosis.diagnosis) {
                console.log('Restored existing diagnosis from localStorage');
                setDiagnosis(parsedDiagnosis);
                // No need to save to localStorage again, it was just read from there
                diagnosisRestored = true;
              }
            } catch (parseErr) {
              console.error('Error parsing saved diagnosis:', parseErr);
              localStorage.removeItem('pharmaai-diagnosis'); // Remove corrupted item
            }
          }
        }

        // If no diagnosis was restored from any source
        if (!diagnosisRestored) {
          console.log('No existing diagnosis found to restore.');
          setDiagnosis(null);
        }
      } catch (err) {
        console.error('Error during restoreDiagnosis:', err);
        setDiagnosis(null); // Ensure diagnosis is null on any overarching error
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

  // Reset initialLoad flag when a new message is sent/received (but not during loading history)
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0 && initialLoad) {
      // After the user sends a new message, we're no longer in initial load state
      const resetInitialLoad = () => {
        console.log('No longer in initial load state, enabling auto-diagnosis');
        setInitialLoad(false);
      };
      
      // Add a small delay to ensure this happens after message processing
      const timeoutId = setTimeout(resetInitialLoad, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoadingHistory, initialLoad]);

  // Effect to handle automatic diagnosis when ready - now with initialLoad check
  useEffect(() => {
    // Don't trigger while loading history or during initial load
    if (isLoadingHistory) {
      console.log('Not checking for diagnosis triggers - still loading history');
      return;
    }
    
    if (initialLoad) {
      console.log('Not checking for diagnosis triggers - in initial load state');
      return;
    }
    
    // If messages haven't changed since initial load, don't trigger diagnosis
    if (initialMessagesTimestamp > 0 && Date.now() - initialMessagesTimestamp < 5000) {
      console.log('Not checking for diagnosis triggers - messages too recently loaded', 
        Date.now() - initialMessagesTimestamp, 'ms ago');
      return;
    }
    
    // Only check for specific trigger phrases in assistant messages, not auto-diagnose
    console.log('Checking last message for diagnosis triggers...');
    
    // Only proceed with auto-diagnosis if we're not in the initial load state
    // and only when the assistant specifically mentions diagnosis preparation
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && 
        lastMessage?.content?.includes("I'll prepare your diagnosis and prescription")) {
      console.log('Auto-triggering diagnosis based on assistant message:', lastMessage.content);
      requestDiagnosis(false);
    }
  }, [messages, isLoadingHistory, initialLoad, initialMessagesTimestamp]);

  // Effect to handle on-demand diagnosis requests from user messages - with initialLoad check
  useEffect(() => {
    // Don't trigger while loading history or during initial load
    if (isLoadingHistory) {
      return;
    }
    
    if (initialLoad) {
      return;
    }
    
    // If messages haven't changed since initial load, don't trigger diagnosis
    if (initialMessagesTimestamp > 0 && Date.now() - initialMessagesTimestamp < 5000) {
      return;
    }
    
    // Check the last user message for explicit diagnosis request
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      const content = lastMessage.content.toLowerCase();
      
      // Only respond to direct "diagnose" commands, not auto-diagnose
      if (content === "diagnose") {  
        console.log('Explicit diagnosis request detected in user message');
        // Add an immediate response from the AI
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'll provide a diagnosis based on the information you've shared so far. Let me analyze your symptoms..."
        }]);
        
        // Request an on-demand diagnosis after a short delay for natural conversation flow
        setTimeout(() => {
          requestDiagnosis(true);
        }, 800);
      }
    }
  }, [messages, isLoadingHistory, initialLoad, initialMessagesTimestamp]);

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
      
      // Reset initialLoad flag when user sends a new message
      if (initialLoad) {
        console.log('User sent a new message, exiting initial load state');
        setInitialLoad(false);
      }
      
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
  }, [userId, initialLoad]);
  
  // Enhanced response flow for on-demand diagnosis
  const requestDiagnosis = async (on_demand: boolean = false) => {
    if (messages.length === 0 || isLoading) return;
    
    if (initialLoad) {
      console.log('Skipping diagnosis request during initial page load');
      return;
    }
    
    try {
      setIsLoading(true);
      // readyForCheckout will be handled by the useEffect listening to 'diagnosis' state
      console.log(`Requesting ${on_demand ? 'on-demand' : 'standard'} diagnosis`);
      
      if (on_demand) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I'll provide a preliminary diagnosis based on the information you've shared so far. Let me analyze your symptoms..."
          }
        ]);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      
      const messagesCopy = [...messages];
      const truncatedMessages = truncateConversation(messagesCopy);
      const validMessages = truncatedMessages.filter(msg => 
        msg && typeof msg === 'object' && 
        typeof msg.role === 'string' && 
        typeof msg.content === 'string'
      );
      
      console.log(`Sending ${validMessages.length} messages for diagnosis (truncated from ${messagesCopy.length})`);
      
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversation: validMessages,
          on_demand: on_demand,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get diagnosis, server error.' }));
        throw new Error(errorData.message || `Diagnosis API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.diagnosis || !data.diagnosis.diagnosis) {
        throw new Error('Invalid diagnosis response format from server.');
      }

      // Set diagnosis state
      setDiagnosis(data.diagnosis);
      
      // Save diagnosis to localStorage as backup
      localStorage.setItem('pharmaai-diagnosis', JSON.stringify(data.diagnosis));

      // Add diagnosis result to chat (or handle as needed)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Based on your symptoms, here is a preliminary diagnosis: ${data.diagnosis.diagnosis}. Prescriptions: ${data.diagnosis.prescriptions.map((p: Prescription) => p.drug_name).join(', ') || 'None'}. Recommendations: ${data.diagnosis.follow_up_recommendations}`
        }
      ]);
      console.log('Diagnosis and prescription received:', data.diagnosis);
    } catch (error) {
      console.error('Error requesting diagnosis:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred during diagnosis');
      setDiagnosis(null); // Clear diagnosis on error
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
    // Reset initialLoad flag to false when clearing chat
    setInitialLoad(false);
    
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
      // Reset initialLoad flag to false when resetting chat
      setInitialLoad(false);
      
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
    setMessages: setMessagesWithTracking,
    initialLoad,
  };
} 