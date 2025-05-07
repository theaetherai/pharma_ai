// Helper function to truncate conversation for token limit management
export function processConversation(conversation) {
  if (!Array.isArray(conversation) || conversation.length === 0) {
    return conversation;
  }
  
  // Preprocess conversation to detect pain-related symptoms
  const painDetected = detectPainRelatedSymptoms(conversation);
  if (painDetected) {
    console.log("Pain-related symptoms detected in conversation");
  }

  // If conversation is small enough, don't truncate
  if (conversation.length <= 5) {
    return conversation;
  }

  // Process large conversations to reduce token count
  // Keep initial system message if present
  const systemMessages = conversation.filter(msg => msg.role === 'system');
  
  // Always keep the first user message for context
  const firstUserIndex = conversation.findIndex(msg => msg.role === 'user');
  const firstUserMessage = firstUserIndex >= 0 ? [conversation[firstUserIndex]] : [];
  
  // Keep the most recent messages, which are more likely to contain relevant info
  const recentMessages = conversation.slice(-5);
  
  // Combine messages, but ensure no duplicates
  const combinedMessages = [...systemMessages, ...firstUserMessage, ...recentMessages];
  const uniqueMessages = Array.from(new Set(combinedMessages.map(msg => JSON.stringify(msg))))
    .map(str => JSON.parse(str));
  
  console.log(`Truncated conversation from ${conversation.length} to ${uniqueMessages.length} messages`);
  
  // Further truncate message content if needed
  return uniqueMessages.map(msg => ({
    role: msg.role,
    content: truncateMessageContent(msg.content)
  }));
}

// Helper function to detect pain-related symptoms in conversation
export function detectPainRelatedSymptoms(conversation) {
  // Define pain-related keywords to check for
  const painKeywords = [
    "back pain", "leg pain", "muscle pain", "joint pain", "shoulder pain", "neck stiffness", 
    "chronic pain", "swelling pain", "pain", "ache", "throbbing", "headache", "migraine",
    "sore", "stiff", "stiffness", "hurt", "hurts", "hurting", "painful"
  ];
  
  // Check each user message for pain-related keywords
  return conversation.some(msg => {
    if (msg.role !== 'user') return false;
    
    const content = msg.content.toLowerCase();
    return painKeywords.some(keyword => content.includes(keyword));
  });
}

// Helper function to truncate very long message content
function truncateMessageContent(content) {
  if (!content || typeof content !== 'string' || content.length <= 800) {
    return content;
  }
  
  // Keep beginning and end, truncate middle for very long messages
  const firstPart = content.substring(0, 400);
  const lastPart = content.substring(content.length - 400);
  return `${firstPart}... [content truncated] ...${lastPart}`;
}

// Export functions for API use
export default {
  processConversation,
  truncateMessageContent,
  detectPainRelatedSymptoms
};