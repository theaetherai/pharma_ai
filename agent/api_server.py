from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import uvicorn
from pharma_agent import PharmacistAgent

app = FastAPI(title="PharmaAI API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SymptomRequest(BaseModel):
    message: Optional[str] = "diagnose"
    user_id: str
    on_demand: Optional[bool] = False
    conversation: Optional[List[Dict[str, str]]] = None

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ConversationRequest(BaseModel):
    user_id: str
    conversation: List[ChatMessage]
    on_demand: Optional[bool] = False

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    readyForDiagnosis: Optional[bool] = False

class PrescriptionItem(BaseModel):
    drug_name: str
    dosage: str
    form: str
    duration: str
    instructions: str

class DiagnosisData(BaseModel):
    diagnosis: str
    prescriptions: List[PrescriptionItem]
    follow_up_recommendations: str = "None"

class DiagnosisResponse(BaseModel):
    response: str
    diagnosis: Optional[DiagnosisData] = None
    checkout_ready: Optional[bool] = False
    error: Optional[str] = None

# Dictionary to store user-specific conversation histories
user_conversations: Dict[str, List[Dict[str, str]]] = {}

# Create a shared PharmacistAgent instance for generating responses
# (No longer storing conversation history in this instance)
shared_agent = PharmacistAgent()

# Function to get or initialize a user's conversation history
def get_user_conversation(user_id: str) -> List[Dict[str, str]]:
    """Get or initialize a conversation history for a specific user."""
    if user_id not in user_conversations:
        # Initialize with the system message from the agent
        user_conversations[user_id] = [shared_agent.conversation_history[0].copy()]
    
    return user_conversations[user_id]

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: SymptomRequest):
    try:
        print(f"Received message from user {request.user_id}: {request.message}")
        
        # Get the user's conversation history
        conversation = get_user_conversation(request.user_id)
        
        # Add user message to conversation history
        conversation.append({
            "role": "user",
            "content": request.message
        })
        
        # Create a temporary copy of the PharmacistAgent with the user's conversation
        temp_agent = PharmacistAgent()
        temp_agent.conversation_history = conversation.copy()
        
        # Get response from agent
        response = temp_agent.get_ai_response()
        print(f"Generated response: {response[:100]}...")
        
        # Update the user's conversation with the assistant's response
        # (The get_ai_response method already added the response to temp_agent.conversation_history)
        conversation.clear()
        conversation.extend(temp_agent.conversation_history)
        
        # Check if we should trigger diagnosis
        readyForDiagnosis = False
        
        # Standard conversation end triggers
        if request.message.lower() == 'no' or "no more" in request.message.lower() or "that's all" in request.message.lower():
            if "prepare your diagnosis" in response.lower() or "prepare your prescription" in response.lower():
                readyForDiagnosis = True
        
        # Add explicit on-demand diagnosis triggers
        if "diagnose me" in request.message.lower() or "need a diagnosis" in request.message.lower():
            readyForDiagnosis = True
            # Add a special response for on-demand diagnosis
            response += "\n\nI'll prepare a preliminary diagnosis based on the information you've shared so far."
        
        return {
            "response": response,
            "conversation_id": request.user_id,
            "readyForDiagnosis": readyForDiagnosis
        }
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/diagnose", response_model=DiagnosisResponse)
async def diagnose(request: ConversationRequest):
    try:
        print(f"Generating diagnosis for user {request.user_id}")
        
        # If on_demand is True, we'll provide a diagnosis even with limited information
        if request.on_demand:
            print("Generating on-demand diagnosis with available information")
        else:
            print("Generating standard end-of-conversation diagnosis")
        
        # Convert the conversation history from the request to the format expected by PharmacistAgent
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation
        ]
        
        # If no conversation history in the request, try to use the stored history
        if not conversation_history and request.user_id in user_conversations:
            conversation_history = user_conversations[request.user_id]
            
        # Process the user's conversation history and generate a diagnosis
        # Use a fresh agent to avoid any state conflicts
        diagnosis_agent = PharmacistAgent()
        
        # Add enhanced error handling
        try:
            diagnosis = diagnosis_agent.generate_diagnosis(
                conversation_history=conversation_history, 
                on_demand=bool(request.on_demand)
            )
            
            # Log the diagnosis format for debugging
            print(f"Generated diagnosis: {diagnosis}")
            
            # If we get a raw_response, try to parse it
            if "raw_response" in diagnosis:
                try:
                    import re
                    import json
                    
                    raw_response = diagnosis["raw_response"]
                    print(f"Attempting to parse raw response: {raw_response[:200]}...")
                    
                    # Try to extract JSON using regex
                    json_match = re.search(r'```(?:json)?(.*?)```|(\{.*\})', raw_response, re.DOTALL)
                    
                    if json_match:
                        # Get the matched content
                        json_str = json_match.group(1) if json_match.group(1) else json_match.group(2)
                        json_str = json_str.strip()
                        
                        # Clean up JSON
                        json_str = re.sub(r',(\s*[\]}])', r'\1', json_str)  # Fix trailing commas
                        json_str = re.sub(r'(\{|\,)\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)  # Fix unquoted keys
                        
                        # Parse JSON
                        parsed_diagnosis = json.loads(json_str)
                        
                        print(f"Successfully parsed raw JSON response: {parsed_diagnosis}")
                        diagnosis = parsed_diagnosis
                        
                except Exception as json_err:
                    print(f"Failed to parse raw response: {str(json_err)}")
            
        except Exception as diag_err:
            print(f"Error in diagnosis generation: {str(diag_err)}")
            diagnosis = {
                "error": f"Error generating diagnosis: {str(diag_err)}",
                "diagnosis": "Unable to generate diagnosis due to a system error",
                "prescriptions": [],
                "follow_up_recommendations": "Please try again later"
            }
        
        # If the diagnosis generation failed for any reason, provide a fallback
        if "error" in diagnosis:
            print(f"Diagnosis generation error: {diagnosis.get('error')}")
            return {
                "response": "I've prepared a preliminary assessment based on the limited information available.",
                "diagnosis": {
                    "diagnosis": "Unable to provide a comprehensive diagnosis with the information provided. Please share more details about your symptoms for a more accurate assessment.",
                    "prescriptions": [],
                    "follow_up_recommendations": "Please provide more symptom information for a more accurate assessment."
                },
                "checkout_ready": False,
                "error": diagnosis.get('error')
            }
        
        # Prepare the response - ensure it uses the new format
        # Convert old format to new format if needed
        prescriptions = []
        if "prescriptions" in diagnosis:
            prescriptions = diagnosis.get("prescriptions", [])
        elif "prescription" in diagnosis:
            # Convert old format to new format
            old_prescriptions = diagnosis.get("prescription", [])
            if isinstance(old_prescriptions, list):
                for rx in old_prescriptions:
                    if isinstance(rx, dict):
                        new_rx = {
                            "drug_name": rx.get("drug", "Unknown medication"),
                            "dosage": rx.get("dosage", "As directed"),
                            "form": "tablet",  # Default form
                            "duration": rx.get("duration", "As needed"),
                            "instructions": "Take as directed by healthcare provider"
                        }
                        prescriptions.append(new_rx)
        
        # Ensure each prescription has all required fields
        for rx in prescriptions:
            if not isinstance(rx, dict):
                continue
                
            # Ensure all required fields exist
            if "drug_name" not in rx and "drug" in rx:
                rx["drug_name"] = rx["drug"]
                del rx["drug"]
            elif "drug_name" not in rx:
                rx["drug_name"] = "Unknown medication"
                
            if "dosage" not in rx:
                rx["dosage"] = "As directed"
            if "form" not in rx:
                rx["form"] = "tablet"
            if "duration" not in rx:
                rx["duration"] = "As needed"
            if "instructions" not in rx:
                rx["instructions"] = "Take as directed by healthcare provider"
                
        # Ensure follow_up_recommendations field exists
        follow_up = diagnosis.get("follow_up_recommendations", "None")
        
        final_diagnosis = {
            "diagnosis": diagnosis.get("diagnosis", "Unable to determine diagnosis"),
            "prescriptions": prescriptions,
            "follow_up_recommendations": follow_up
        }
        
        return {
            "response": "Here's your diagnosis and prescription. I'm passing this to the system to prepare your checkout.",
            "diagnosis": final_diagnosis,
            "checkout_ready": True
        }
    except Exception as e:
        print(f"Error in diagnose endpoint: {str(e)}")
        return {
            "response": "I encountered an error preparing your diagnosis.",
            "diagnosis": {
                "diagnosis": "Error generating diagnosis. Please try again or provide more information.",
                "prescriptions": [],
                "follow_up_recommendations": "Please consult with a healthcare professional"
            },
            "checkout_ready": False,
            "error": str(e)
        }

# Add a utility endpoint to clear a user's conversation history (useful for testing)
@app.delete("/api/conversation/{user_id}")
async def clear_conversation(user_id: str):
    if user_id in user_conversations:
        # Reset to just the system message
        user_conversations[user_id] = [shared_agent.conversation_history[0].copy()]
        return {"message": f"Conversation history cleared for user {user_id}"}
    return {"message": f"No conversation history found for user {user_id}"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "agent": "PharmaAI Assistant", "model": shared_agent.model}

if __name__ == "__main__":
    print(f"Starting PharmaAI Assistant API with model: {shared_agent.model}")
    uvicorn.run(app, host="0.0.0.0", port=8000) 