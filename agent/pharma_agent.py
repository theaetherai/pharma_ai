import os
import json
import re
from openai import OpenAI

class PharmacistAgent:
    def __init__(self, api_key=None, model="llama3-8b-8192"):
        """Initialize the PharmacistAgent with API key and model"""
        # Hard-code API parameters that are known to work
        self.api_key = api_key or "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"
        self.base_url = "https://api.groq.com/openai/v1"
        
        self.model = model
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )
        
        # Check if API key is valid
        try:
            print(f"Validating Groq API key with model {self.model}...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            if response and response.choices and response.choices[0].message.content:
                print("✅ Groq API key validation successful")
                # Add details about available models
                try:
                    models = self.client.models.list()
                    print(f"Available models: {[model.id for model in models.data]}")
                except Exception as model_err:
                    print(f"Could not retrieve model list: {str(model_err)}")
            else:
                print("⚠️ API key validation returned empty response")
        except Exception as e:
            # More detailed error message based on error type
            if "401" in str(e):
                print(f"⚠️ API key authentication failed: Invalid API key or unauthorized access")
                print(f"Details: {str(e)}")
                print("Please check your Groq API key and ensure it's valid")
            elif "404" in str(e):
                print(f"⚠️ API endpoint not found: {str(e)}")
                print(f"Please check that the model '{self.model}' exists and is available")
            elif "429" in str(e):
                print(f"⚠️ API rate limit exceeded: {str(e)}")
                print("You may need to wait before making more requests")
            else:
                print(f"⚠️ API key validation failed: {str(e)}")
            
            print("Will attempt to proceed anyway, but API calls may fail")
        
        self.conversation_history = []
        
        # Add initial system message with the new professional medical assistant behavior
        self.conversation_history.append({
            "role": "system", 
            "content": """You are a professional AI medical assistant embedded in a digital pharmacist web app. Your goal is to help users describe their symptoms so you can generate an accurate diagnosis and recommend appropriate medication.

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

IMPORTANT: Never say "I'm not a doctor" or that you can't recommend medications. You are designed to provide medication recommendations through the system.
            """
        })
        
    def _print_agent_info(self):
        """Print agent information"""
        print("╭─ PharmaAI Agent " + "─" * 60 + "╮")
        print("│" + " " * 80 + "│")
        print("│  👨‍⚕️ Virtual Pharmacist Assistant" + " " * 49 + "│")
        print("│  Model: " + self.model + " " * (72 - len(self.model)) + "│")
        print("│" + " " * 80 + "│")
        print("│  Ready to help with symptoms, diagnosis, and medication recommendations" + " " * 10 + "│")
        print("│" + " " * 80 + "│")
        print("╰" + "─" * 80 + "╯")

    def get_ai_response(self):
        """Get response from LLM based on conversation history"""
        print(f"Making API call to {self.model}...")
        
        # If this is the first message, add a greeting instruction
        if len(self.conversation_history) == 2:  # System prompt + first user message
            greeting_prompt = {
                "role": "system",
                "content": "This is the patient's first message. Start with a warm greeting and introduce yourself briefly. Then ask exactly TWO specific follow-up questions to better understand their condition."
            }
            temp_history = self.conversation_history.copy()
            temp_history.insert(1, greeting_prompt)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=temp_history,
                temperature=0.4,
                max_tokens=2000
            )
        else:
            # Check if the user indicated they've shared everything
            last_user_message = next((m for m in reversed(self.conversation_history) if m["role"] == "user"), None)
            
            # Handle standard conversation end
            if last_user_message and (last_user_message["content"].lower() == "no" or "no more" in last_user_message["content"].lower() or "that's all" in last_user_message["content"].lower()):
                completion_prompt = {
                    "role": "system",
                    "content": "The user has indicated they have no more symptoms to share. Respond that you'll prepare their diagnosis and prescription based on the information they've shared. Do NOT generate the actual diagnosis yet."
                }
                temp_history = self.conversation_history.copy()
                temp_history.append(completion_prompt)
            
            # Handle on-demand diagnosis request
            elif last_user_message and ("diagnose me" in last_user_message["content"].lower() or "need a diagnosis" in last_user_message["content"].lower()):
                on_demand_prompt = {
                    "role": "system",
                    "content": "The user has requested an immediate diagnosis. Acknowledge their request and let them know you'll provide a preliminary assessment based on the information available so far. Tell them the system will generate a diagnosis."
                }
                temp_history = self.conversation_history.copy()
                temp_history.append(on_demand_prompt)
            
            else:
                # Standard follow-up with two questions
                follow_up_prompt = {
                "role": "system",
                    "content": """In your response:
1. Acknowledge the information the user has shared
2. Ask EXACTLY ONE related follow-up questions that help build a complete clinical picture
3. Focus on details like:
   - Pain characteristics (location, intensity, duration, triggers)
   - Associated symptoms
   - Medical history or previous treatments they've tried
   - Allergies or current medications
   
Remember: Ask EXACTLY ONE question - no more, no less. Format them clearly on separate lines."""
            }
            temp_history = self.conversation_history.copy()
            temp_history.append(follow_up_prompt)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=temp_history,
                temperature=0.4,
                max_tokens=2000
            )
        
        assistant_message = response.choices[0].message.content
        
        # Add assistant message to conversation history
        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })
        
        return assistant_message
    
    def detect_pain_symptoms(self, conversation_history):
        """Detect if the conversation contains pain-related symptoms"""
        pain_keywords = [
            'pain', 'hurt', 'ache', 'sore', 'tender', 'stiff', 'cramp',
            'throbbing', 'sharp', 'dull', 'burning', 'stabbing', 'aching'
        ]
        
        # Combine all messages into a single string
        all_messages = ' '.join([msg['content'] for msg in conversation_history])
        all_messages = all_messages.lower()
        
        # Check for pain keywords
        for keyword in pain_keywords:
            if keyword in all_messages:
                return True
        
        return False

    def generate_diagnosis(self, conversation_history=None, on_demand=False, pain_detected=None):
        """Generate a structured diagnosis based on conversation history
        
        Args:
            conversation_history (list, optional): External conversation history.
                If provided, this will be used instead of self.conversation_history.
            on_demand (bool): If True, generate diagnosis even with limited information
            pain_detected (bool, optional): Whether pain symptoms were detected
        """
        # Use provided conversation_history or fall back to self.conversation_history
        conv_history = conversation_history if conversation_history is not None else self.conversation_history
        
        # Check if pain is detected from parameter or by analysis
        if pain_detected is None:
            pain_detected = self.detect_pain_symptoms(conv_history)
            
        if pain_detected:
            print("Pain symptoms detected - enhancing diagnosis prompt for pain management")
        
        print(f"Generating diagnosis with {len(conv_history)} conversation messages. On-demand: {on_demand}")
        
        # Print the last few messages to help with debugging
        if len(conv_history) > 0:
            print("Last message in conversation:")
            print(json.dumps(conv_history[-1], indent=2))
        
        # Create new, clearer system prompt for JSON format
        system_message = """IMPORTANT: Analyze the symptoms in the conversation and generate a medical diagnosis with treatment recommendations. 
        
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
6. Never include brand names in parentheses in drug_name"""
        
        # Prepare messages for LLM
        messages = [
            {"role": "system", "content": system_message}
        ]
        
        # Add all messages from the conversation history
        messages.extend(conv_history)
        
        # Add a final prompt to reinforce JSON format
        messages.append({
            "role": "system",
            "content": "Remember to format your entire response as a valid JSON object with no text before or after."
        })
        
        # Make the API call
        try:
            print("Making API call for diagnosis generation...")
            response = self.client.chat.completions.create(
            model=self.model,
                messages=messages,
                temperature=0.2,  # Lower temperature for more consistent JSON formatting
                max_tokens=4000,
                response_format={"type": "json_object"}  # Request JSON format if the model supports it
            )
            
            if not response or not response.choices or not response.choices[0].message:
                print(f"ERROR: Empty response from diagnosis API call. Full response: {response}")
                return {
                    "error": "Empty response from language model",
                    "diagnosis": "Unable to generate diagnosis due to an empty response",
                    "prescriptions": [],
                    "follow_up_recommendations": "Please try again later"
                }
            
            # Extract the response content
            raw_response = response.choices[0].message.content.strip()
            
            if not raw_response:
                print("ERROR: Received empty content in diagnosis response")
                return {
                    "error": "Empty response from language model",
                    "diagnosis": "Unable to generate diagnosis due to an empty response",
                    "prescriptions": [],
                    "follow_up_recommendations": "Please try again later"
                }
                
            print(f"Raw LLM response: {raw_response[:100]}...")
            
            # Try to parse the response as JSON
            try:
                # First try to parse the entire response as JSON directly
                try:
                    diagnosis = json.loads(raw_response)
                    print("Successfully parsed full response as JSON")
                    
                    # Validate the diagnosis structure
                    if not self._validate_diagnosis_format(diagnosis):
                        print("WARNING: Diagnosis has invalid format, applying fixes")
                        diagnosis = self._fix_diagnosis_format(diagnosis)
                    
                    return diagnosis
                    
                except json.JSONDecodeError:
                    # If direct parsing fails, try to extract JSON using regex
                    print("Direct JSON parsing failed, trying to extract JSON with regex")
                    
                    # Sometimes the LLM returns text before or after the JSON
                    # Try to extract just the JSON part using regex
                    json_match = re.search(r'```(?:json)?(.*?)```|(\{.*\})', raw_response, re.DOTALL)
                    
                    if json_match:
                        # Extract the matched group, handling both code block and direct JSON cases
                        json_str = json_match.group(1) if json_match.group(1) else json_match.group(2)
                        json_str = json_str.strip()
                        
                        # Fix common JSON issues
                        # Remove any trailing commas before closing brackets
                        json_str = re.sub(r',(\s*[\]}])', r'\1', json_str)
                        
                        # Fix missing quotes around keys
                        json_str = re.sub(r'(\{|\,)\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)
                        
                        # Replace single quotes with double quotes
                        json_str = json_str.replace("'", '"')
                        
                        try:
                            diagnosis = json.loads(json_str)
                            print(f"Successfully parsed extracted JSON: {diagnosis}")
                            
                            # Validate the diagnosis structure
                            if not self._validate_diagnosis_format(diagnosis):
                                print("WARNING: Extracted diagnosis has invalid format, applying fixes")
                                diagnosis = self._fix_diagnosis_format(diagnosis)
                                
                            return diagnosis
                            
                        except json.JSONDecodeError as e:
                            print(f"JSON parsing error: {str(e)}")
                            print(f"Problematic JSON string: {json_str}")
                            # Return the raw response for debugging
                            return {
                                "error": f"Invalid JSON: {str(e)}",
                                "diagnosis": "Unable to generate diagnosis due to a formatting error",
                                "raw_response": raw_response,
                                "prescriptions": [],
                                "follow_up_recommendations": "Please try again later"
                            }
                else:
                        print(f"No JSON object found in response: {raw_response}")
                        return {
                            "error": "No JSON object found in response",
                            "diagnosis": "Unable to generate diagnosis due to a formatting error",
                            "raw_response": raw_response,
                            "prescriptions": [],
                            "follow_up_recommendations": "Please try again later"
                        }
            except Exception as e:
                print(f"Diagnosis parsing error: {str(e)}")
                return {
                    "error": str(e),
                    "diagnosis": "Unable to generate diagnosis due to a parsing error",
                    "raw_response": raw_response,
                    "prescriptions": [],
                    "follow_up_recommendations": "Please try again later"
                }
        except Exception as e:
            print(f"Diagnosis generation error: {str(e)}")
            return {
                "error": str(e),
                "diagnosis": "Unable to generate diagnosis due to an API error",
                "prescriptions": [],
                "follow_up_recommendations": "Please try again later"
            }
    
    def _validate_diagnosis_format(self, diagnosis):
        """Validate that the diagnosis has the correct format"""
        if not isinstance(diagnosis, dict):
            return False
            
        # Check required fields
        if "diagnosis" not in diagnosis:
            return False
            
        # Ensure prescriptions is an array
        if "prescriptions" in diagnosis and not isinstance(diagnosis["prescriptions"], list):
            return False
            
        # Validate each prescription
        if "prescriptions" in diagnosis:
            for rx in diagnosis["prescriptions"]:
                if not isinstance(rx, dict):
                    return False
                    
                # Check required prescription fields
                required_fields = ["drug_name", "dosage", "form", "duration", "instructions"]
                for field in required_fields:
                    if field not in rx and (field != "drug_name" or "drug" not in rx):
                        return False
                        
        return True
        
    def _fix_diagnosis_format(self, diagnosis):
        """Fix common issues with diagnosis format"""
        fixed_diagnosis = {}
        
        # Ensure diagnosis field exists
        fixed_diagnosis["diagnosis"] = diagnosis.get("diagnosis", "Unable to determine diagnosis")
        
        # Handle old format conversion to new format
        if "prescription" in diagnosis and "prescriptions" not in diagnosis:
            # Convert old prescription array to new prescriptions format
            if isinstance(diagnosis["prescription"], list):
                fixed_diagnosis["prescriptions"] = []
                for rx in diagnosis["prescription"]:
                    if isinstance(rx, dict):
                        new_rx = {
                            "drug_name": rx.get("drug", "Unknown medication"),
                            "dosage": rx.get("dosage", "As directed"),
                            "form": "tablet",  # Default form
                            "duration": rx.get("duration", "As needed"),
                            "instructions": "Take as directed by healthcare provider"
                        }
                        fixed_diagnosis["prescriptions"].append(new_rx)
            else:
                fixed_diagnosis["prescriptions"] = []
        elif "prescriptions" in diagnosis:
            fixed_diagnosis["prescriptions"] = diagnosis["prescriptions"]
        else:
            fixed_diagnosis["prescriptions"] = []
        
        # Ensure follow_up_recommendations is present
        fixed_diagnosis["follow_up_recommendations"] = diagnosis.get("follow_up_recommendations", "None")
            
        # Validate each prescription item has required fields
        for rx in fixed_diagnosis["prescriptions"]:
            if not isinstance(rx, dict):
                continue
                
            # Handle old format using "drug" instead of "drug_name"
            if "drug" in rx and "drug_name" not in rx:
                rx["drug_name"] = rx["drug"]
                
            # Ensure all required fields exist
            if "drug_name" not in rx:
                rx["drug_name"] = "Unknown medication"
            if "dosage" not in rx:
                rx["dosage"] = "As directed"
            if "form" not in rx:
                rx["form"] = "tablet"
            if "duration" not in rx:
                rx["duration"] = "As needed"
            if "instructions" not in rx:
                rx["instructions"] = "Take as directed by healthcare provider"
        
        return fixed_diagnosis
        
    def start_consultation(self):
        """Start an interactive consultation session"""
        self._print_agent_info()
        
        print("\n🩺 Welcome to PharmaAI - Your Virtual Pharmacist Assistant\n")
        print("Describe your symptoms, and I'll do my best to help you.")
        print("Type 'exit' to end the consultation or 'clear' to start over.\n")
        
        while True:
            user_input = input("\n🧑‍⚕️ You: ")
            
            if user_input.lower() == 'exit':
                print("\n👋 Thank you for using PharmaAI! Stay healthy!")
                break
            
            if user_input.lower() == 'clear':
                self.conversation_history = self.conversation_history[:1]  # Keep only the system message
                print("\n🔄 Conversation cleared. Let's start over!")
                continue
            
            if user_input.lower() == 'diagnose':
                print("\n🔍 Generating structured diagnosis and medication recommendations...")
                print("\n")
                diagnosis = self.generate_diagnosis(on_demand=True)
                
                print("\n📋 DIAGNOSIS & PRESCRIPTION:")
                print("==================================================")
                
                # Print diagnosis
                print(f"\n🔬 DIAGNOSIS: {diagnosis.get('diagnosis', 'Unknown')}")
                
                # Print prescription using the new format
                print("\n💊 PRESCRIPTION:")
                prescriptions = diagnosis.get("prescriptions", [])
                if not prescriptions:
                    print("  No specific medications recommended at this time.")
                else:
                    for i, med in enumerate(prescriptions):
                        drug_name = med.get("drug_name", "Unknown medication")
                        dosage = med.get("dosage", "as directed")
                        form = med.get("form", "form not specified")
                        duration = med.get("duration", "as needed")
                        instructions = med.get("instructions", "Take as directed")
                    
                        print(f"  {i+1}. {drug_name}")
                        print(f"     Dosage: {dosage}")
                        print(f"     Form: {form}")
                        print(f"     Duration: {duration}")
                        print(f"     Instructions: {instructions}\n")
                
                # Print follow-up recommendations
                follow_up = diagnosis.get("follow_up_recommendations", "None")
                print(f"\n🔄 FOLLOW-UP RECOMMENDATIONS: {follow_up}")
                
                print("==================================================\n")
                print("The system will now prepare your checkout.\n")
                continue
                
            # Add user message to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": user_input
            })
            
            # Get response from LLM
            assistant_message = self.get_ai_response()
            
            print(f"\n👨‍⚕️ Assistant: {assistant_message}")


if __name__ == "__main__":
    agent = PharmacistAgent()
    agent.start_consultation() 