import OpenAI from 'openai';

// Define typescript interfaces
interface ChatMessage {
  role: string;
  content: string;
}

interface PrescriptionItem {
  drug_name: string;
  dosage: string;
  form: string;
  duration: string;
  instructions: string;
  drug?: string; // Added for backward compatibility
}

interface DiagnosisData {
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  follow_up_recommendations: string;
  error?: string;
  raw_response?: string;
}

export class PharmacistAgent {
  private api_key: string;
  private base_url: string;
  private model: string;
  private client: OpenAI;
  public conversation_history: ChatMessage[];

  constructor(api_key?: string, model: string = "llama3-8b-8192") {
    // Hard-code API parameters that are known to work
    this.api_key = api_key || "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";
    this.base_url = "https://api.groq.com/openai/v1";
    this.model = model;
    
    this.client = new OpenAI({
      apiKey: this.api_key,
      baseURL: this.base_url
    });

    this.conversation_history = [];
    
    // Add initial system message
    this.conversation_history.push({
      role: "system", 
      content: `You are a professional AI medical assistant embedded in a digital pharmacist web app. Your goal is to help users describe their symptoms so you can generate an accurate diagnosis and recommend appropriate medication.

PAIN DETECTION & MANAGEMENT:
- Actively look for pain-related symptoms in user descriptions
- For pain symptoms, ask about:
  * Location (where exactly does it hurt?)
  * Intensity (on a scale of 1-10)
  * Duration (how long has it been hurting?)
  * Type (sharp, dull, throbbing, etc.)
  * Triggers (what makes it better/worse?)
- Consider pain medications like:
  * Ibuprofen (400mg, every 6-8 hours)
  * Acetaminophen (500mg, every 4-6 hours)
  * Naproxen Sodium (220mg, every 8-12 hours)
  * Muscle relaxants for muscle pain
  * Topical creams/gels for localized pain

ASK QUESTIONS TWO AT A TIME:
- Always ask exactly two related questions at a time. This keeps the user engaged and avoids overwhelming them.
- Do not ask more than two questions per message. Wait for the user's full response before proceeding.

BUILD A FULL CLINICAL PICTURE:
Use follow-up questions to clarify:
- Pain (type, location, onset, duration, triggers)
- Associated symptoms (nausea, vomiting, fever, appetite changes, bowel issues, etc.)
- Medical history, medications taken, allergies

EMPATHY AND PROFESSIONAL TONE:
- Be warm, respectful, and use simple language. Express concern where appropriate.

COMPLETION & TRANSITION TO DIAGNOSIS:
- When the user says "no" or indicates that they've shared everything, stop asking questions.
- Respond with: "I'll prepare your diagnosis and prescription based on the information you've shared."
- Do not generate the diagnosis in the chat - the system will handle this separately.

ON-DEMAND DIAGNOSIS REQUESTS:
- If a user asks for a diagnosis at any point (e.g., "diagnose me now" or "I need a diagnosis"), acknowledge their request.
- Inform them you'll provide a preliminary assessment with the information available.
- The system will generate a diagnosis based on the conversation so far.

IMPORTANT: Never say "I'm not a doctor" or that you can't recommend medications. You are designed to provide medication recommendations through the system.`
    });
  }

  async getAIResponse(): Promise<string> {
    console.log(`Making API call to ${this.model}...`);
    
    let response;
    let temp_history: ChatMessage[] = [];
    
    // If this is the first message, add a greeting instruction
    if (this.conversation_history.length === 2) {  // System prompt + first user message
      const greeting_prompt: ChatMessage = {
        role: "system",
        content: "This is the patient's first message. Start with a warm greeting and introduce yourself briefly. Then ask exactly TWO specific follow-up questions to better understand their condition."
      };
      
      temp_history = [...this.conversation_history];
      temp_history.splice(1, 0, greeting_prompt);
      
      response = await this.client.chat.completions.create({
        model: this.model,
        messages: temp_history.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: 0.4,
        max_tokens: 2000
      });
    } else {
      // Check if the user indicated they've shared everything
      const last_user_message = [...this.conversation_history]
        .reverse()
        .find(m => m.role === "user");
      
      if (last_user_message) {
        const content = last_user_message.content.toLowerCase();
        
        // Handle standard conversation end
        if (content === "no" || content.includes("no more") || content.includes("that's all")) {
          const completion_prompt: ChatMessage = {
            role: "system",
            content: "The user has indicated they have no more symptoms to share. Respond that you'll prepare their diagnosis and prescription based on the information they've shared. Do NOT generate the actual diagnosis yet."
          };
          
          temp_history = [...this.conversation_history, completion_prompt];
        }
        // Handle on-demand diagnosis request
        else if (content.includes("diagnose me") || content.includes("need a diagnosis")) {
          const on_demand_prompt: ChatMessage = {
            role: "system",
            content: "The user has requested an immediate diagnosis. Acknowledge their request and let them know you'll provide a preliminary assessment based on the information available so far. Tell them the system will generate a diagnosis."
          };
          
          temp_history = [...this.conversation_history, on_demand_prompt];
        }
        else {
          // Standard follow-up with two questions
          const follow_up_prompt: ChatMessage = {
            role: "system",
            content: `In your response:
1. Acknowledge the information the user has shared
2. Ask EXACTLY ONE related follow-up questions that help build a complete clinical picture
3. Focus on details like:
   - Pain characteristics (location, intensity, duration, triggers)
   - Associated symptoms
   - Medical history or previous treatments they've tried
   - Allergies or current medications
   
Remember: Ask EXACTLY ONE question - no more, no less. Format them clearly on separate lines.`
          };
          
          temp_history = [...this.conversation_history, follow_up_prompt];
        }
        
        response = await this.client.chat.completions.create({
          model: this.model,
          messages: temp_history.map(msg => ({
            role: msg.role as 'system' | 'user' | 'assistant',
            content: msg.content
          })),
          temperature: 0.4,
          max_tokens: 2000
        });
      } else {
        // Fallback if no user message is found
        temp_history = this.conversation_history;
        response = await this.client.chat.completions.create({
          model: this.model,
          messages: temp_history.map(msg => ({
            role: msg.role as 'system' | 'user' | 'assistant',
            content: msg.content
          })),
          temperature: 0.4,
          max_tokens: 2000
        });
      }
    }
    
    const assistant_message = response.choices[0].message.content || "";
    
    // Add assistant message to conversation history
    this.conversation_history.push({
      role: "assistant",
      content: assistant_message
    });
    
    return assistant_message;
  }
  
  detectPainSymptoms(conversation_history: ChatMessage[]): boolean {
    const pain_keywords = [
      'pain', 'hurt', 'ache', 'sore', 'tender', 'stiff', 'cramp',
      'throbbing', 'sharp', 'dull', 'burning', 'stabbing', 'aching'
    ];
    
    // Combine all messages into a single string
    const all_messages = conversation_history
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();
    
    // Check for pain keywords
    return pain_keywords.some(keyword => all_messages.includes(keyword));
  }

  async generateDiagnosis(
    conversation_history?: ChatMessage[],
    on_demand: boolean = false,
    pain_detected?: boolean
  ): Promise<DiagnosisData> {
    // Use provided conversation_history or fall back to this.conversation_history
    const conv_history = conversation_history || this.conversation_history;
    
    // Check if pain is detected from parameter or by analysis
    if (pain_detected === undefined) {
      pain_detected = this.detectPainSymptoms(conv_history);
    }
    
    console.log(`Generating diagnosis with ${conv_history.length} conversation messages. On-demand: ${on_demand}`);
    
    // Print the last message for debugging
    if (conv_history.length > 0) {
      console.log("Last message in conversation:");
      console.log(JSON.stringify(conv_history[conv_history.length - 1], null, 2));
    }
    
    // Create system prompt for JSON format
    const system_message = `IMPORTANT: Analyze the symptoms in the conversation and generate a medical diagnosis with treatment recommendations. 
        
Your ENTIRE response must be ONLY a valid JSON object in the EXACT format below:

{
  "diagnosis": "Brief diagnosis based on symptoms",
  "prescriptions": [
    {
      "drug_name": "Medication name (generic only, NO brand names)",
      "dosage": "Dosage amount (e.g., 500mg)",
      "form": "tablet",
      "duration": "7 days",
      "instructions": "How to take it"
    }
  ],
  "follow_up_recommendations": "Follow-up advice"
}

RULES:
1. Return ONLY the JSON object - no other text before or after
2. Ensure valid JSON syntax with double quotes around all keys and string values
3. For no prescriptions, use empty array: "prescriptions": []
4. For no follow-up, use "follow_up_recommendations": "None"
5. For multiple medications, add separate prescription objects in the array
6. Never include brand names in parentheses in drug_name`;
    
    // Prepare messages for LLM
    const messages: ChatMessage[] = [
      { role: "system", content: system_message }
    ];
    
    // Add all messages from the conversation history
    messages.push(...conv_history);
    
    // Add a final prompt to reinforce JSON format
    messages.push({
      role: "system",
      content: "Remember to format your entire response as a valid JSON object with no text before or after."
    });
    
    try {
      console.log("Making API call for diagnosis generation...");
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: 0.2,  // Lower temperature for more consistent JSON formatting
        max_tokens: 4000,
        response_format: { type: "json_object" }  // Request JSON format if the model supports it
      });
      
      if (!response || !response.choices || !response.choices[0].message) {
        console.log("ERROR: Empty response from diagnosis API call");
        return {
          diagnosis: "Unable to generate diagnosis due to an empty response",
          prescriptions: [],
          follow_up_recommendations: "Please try again later",
          error: "Empty response from language model"
        };
      }
      
      // Extract the response content
      const raw_response = response.choices[0].message.content?.trim() || "";
      
      if (!raw_response) {
        console.log("ERROR: Received empty content in diagnosis response");
        return {
          diagnosis: "Unable to generate diagnosis due to an empty response",
          prescriptions: [],
          follow_up_recommendations: "Please try again later",
          error: "Empty response from language model"
        };
      }
      
      console.log(`Raw LLM response: ${raw_response.substring(0, 100)}...`);
      
      try {
        // Parse the response as JSON
        const diagnosis: DiagnosisData = JSON.parse(raw_response);
        console.log("Successfully parsed full response as JSON");
        
        // Validate the diagnosis structure
        if (!this.validateDiagnosisFormat(diagnosis)) {
          console.log("WARNING: Diagnosis has invalid format, applying fixes");
          return this.fixDiagnosisFormat(diagnosis);
        }
        
        return diagnosis;
      } catch (error) {
        console.error("JSON parsing error:", error);
        
        // Try to extract JSON using regex
        console.log("Direct JSON parsing failed, trying to extract JSON with regex");
        
        // Using a regex that doesn't require the 's' flag
        const jsonMatch = raw_response.match(/```(?:json)?([^]*?)```|(\{[^]*\})/);
        
        if (jsonMatch) {
          // Extract the matched group, handling both code block and direct JSON cases
          const json_str = (jsonMatch[1] || jsonMatch[2])?.trim() || "";
          
          // Fix common JSON issues
          // Remove any trailing commas before closing brackets
          const fixed_json = json_str
            .replace(/,(\s*[\]}])/g, '$1')
            // Fix missing quotes around keys
            .replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
            // Replace single quotes with double quotes
            .replace(/'/g, '"');
          
          try {
            const diagnosis: DiagnosisData = JSON.parse(fixed_json);
            console.log("Successfully parsed extracted JSON");
            
            // Validate the diagnosis structure
            if (!this.validateDiagnosisFormat(diagnosis)) {
              console.log("WARNING: Extracted diagnosis has invalid format, applying fixes");
              return this.fixDiagnosisFormat(diagnosis);
            }
            
            return diagnosis;
          } catch (jsonError) {
            console.error("JSON parsing error after extraction:", jsonError);
            return {
              diagnosis: "Unable to generate diagnosis due to a formatting error",
              prescriptions: [],
              follow_up_recommendations: "Please try again later",
              error: `Invalid JSON: ${jsonError}`,
              raw_response: raw_response
            };
          }
        } else {
          console.log("No JSON object found in response");
          return {
            diagnosis: "Unable to generate diagnosis due to a formatting error",
            prescriptions: [],
            follow_up_recommendations: "Please try again later",
            error: "No JSON object found in response",
            raw_response: raw_response
          };
        }
      }
    } catch (error) {
      console.error("Diagnosis generation error:", error);
      return {
        diagnosis: "Unable to generate diagnosis due to an API error",
        prescriptions: [],
        follow_up_recommendations: "Please try again later",
        error: String(error)
      };
    }
  }
  
  private validateDiagnosisFormat(diagnosis: any): boolean {
    // Check if diagnosis is an object
    if (typeof diagnosis !== 'object' || diagnosis === null) {
      return false;
    }
    
    // Check required fields
    if (!diagnosis.diagnosis) {
      return false;
    }
    
    // Ensure prescriptions is an array
    if (diagnosis.prescriptions && !Array.isArray(diagnosis.prescriptions)) {
      return false;
    }
    
    // Validate each prescription
    if (diagnosis.prescriptions) {
      for (const rx of diagnosis.prescriptions) {
        if (typeof rx !== 'object' || rx === null) {
          return false;
        }
        
        // Check required prescription fields
        const required_fields = ["drug_name", "dosage", "form", "duration", "instructions"];
        for (const field of required_fields) {
          if (!(field in rx) && !(field === "drug_name" && "drug" in rx)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  private fixDiagnosisFormat(diagnosis: any): DiagnosisData {
    const fixed_diagnosis: DiagnosisData = {
      diagnosis: diagnosis.diagnosis || "Unable to determine diagnosis",
      prescriptions: [],
      follow_up_recommendations: diagnosis.follow_up_recommendations || "None"
    };
    
    // Handle old format conversion to new format
    if (diagnosis.prescription && !diagnosis.prescriptions) {
      // Convert old prescription array to new prescriptions format
      if (Array.isArray(diagnosis.prescription)) {
        for (const rx of diagnosis.prescription) {
          if (typeof rx === 'object' && rx !== null) {
            const new_rx: PrescriptionItem = {
              drug_name: rx.drug || "Unknown medication",
              dosage: rx.dosage || "As directed",
              form: "tablet", // Default form
              duration: rx.duration || "As needed",
              instructions: "Take as directed by healthcare provider"
            };
            fixed_diagnosis.prescriptions.push(new_rx);
          }
        }
      }
    } else if (diagnosis.prescriptions) {
      fixed_diagnosis.prescriptions = diagnosis.prescriptions;
    }
    
    // Validate each prescription item has required fields
    fixed_diagnosis.prescriptions = fixed_diagnosis.prescriptions.map(rx => {
      if (typeof rx !== 'object' || rx === null) {
        return {
          drug_name: "Unknown medication",
          dosage: "As directed",
          form: "tablet",
          duration: "As needed",
          instructions: "Take as directed by healthcare provider"
        };
      }
      
      // Handle old format using "drug" instead of "drug_name"
      if (rx.drug && !rx.drug_name) {
        rx.drug_name = rx.drug;
      }
      
      // Ensure all required fields exist
      return {
        drug_name: rx.drug_name || "Unknown medication",
        dosage: rx.dosage || "As directed",
        form: rx.form || "tablet",
        duration: rx.duration || "As needed",
        instructions: rx.instructions || "Take as directed by healthcare provider"
      };
    });
    
    return fixed_diagnosis;
  }
} 
