import os
import re

def enhance_pain_diagnosis():
    # Find pharma_agent.py in various possible locations
    possible_paths = [
        '../pharma_backend/pharmacists/pharma_agent.py',
        '../pharma_backend/pharma_agent.py',
        '../pharma_backend/api/pharma_agent.py',
        '../PharmaAI_Agent/pharma_agent.py',
        '../pharma_agent.py',
        'pharma_agent.py'
    ]
    
    pharma_agent_path = None
    for path in possible_paths:
        if os.path.exists(path):
            pharma_agent_path = path
            break
    
    if not pharma_agent_path:
        print("Could not find pharma_agent.py")
        return
    
    print(f"Found pharma_agent.py at {pharma_agent_path}")
    
    # Read the file
    with open(pharma_agent_path, 'r') as f:
        content = f.read()
    
    # Create a backup
    with open(f"{pharma_agent_path}.pain_bak", 'w') as f:
        f.write(content)
    print(f"Created backup at {pharma_agent_path}.pain_bak")
    
    # Modify the content to enhance pain diagnosis
    updated_content = content
    
    # Add pain detection function
    if "def detect_pain_symptoms(" not in content:
        pain_detection_code = """
    def detect_pain_symptoms(self, conversation_history):
        \"\"\"Detect pain-related symptoms in the conversation history\"\"\"
        # Pain-related keywords to check for
        pain_keywords = [
            "back pain", "leg pain", "muscle pain", "joint pain", "shoulder pain", "neck stiffness", 
            "chronic pain", "swelling pain", "pain", "ache", "throbbing", "headache", "migraine",
            "sore", "stiff", "stiffness", "hurt", "hurts", "hurting", "painful"
        ]
        
        # Check each user message for pain-related keywords
        for msg in conversation_history:
            if msg.get('role') != 'user':
                continue
                
            content = msg.get('content', '').lower()
            for keyword in pain_keywords:
                if keyword in content:
                    print(f"Detected pain symptom: '{keyword}'")
                    return True
        
        return False
"""
        # Find a good insertion point - after the class methods but before diagnosis generation
        insertion_point = content.find("def generate_diagnosis(")
        if insertion_point > 0:
            # Find the last class method before generate_diagnosis
            last_method_end = content.rfind("\n\n", 0, insertion_point)
            if last_method_end > 0:
                updated_content = content[:last_method_end] + pain_detection_code + content[last_method_end:]
    
    # Update the generate_diagnosis method to handle pain symptoms
    if "pain_detected = request.get('pain_detected')" not in updated_content:
        # Find the generate_diagnosis method
        diagnosis_method_start = updated_content.find("def generate_diagnosis(")
        diagnosis_signature_end = updated_content.find(":", diagnosis_method_start)
        # Update method signature to accept pain_detected parameter
        new_signature = f"def generate_diagnosis(self, conversation_history=None, on_demand=False, pain_detected=None)"
        updated_content = updated_content[:diagnosis_method_start] + new_signature + updated_content[diagnosis_signature_end:]
        
        # Find point after getting conversation history
        after_history = updated_content.find("conv_history = conversation_history", diagnosis_method_start)
        if after_history > 0:
            line_end = updated_content.find('\n', after_history)
            # Add pain detection from parameter or by analysis
            pain_detection_code = """
        # Check if pain is detected from request or analyze the conversation
        if pain_detected is None:
            pain_detected = self.detect_pain_symptoms(conv_history)
            
        if pain_detected:
            print("Pain symptoms detected - enhancing diagnosis prompt for pain management")
"""
            updated_content = updated_content[:line_end+1] + pain_detection_code + updated_content[line_end+1:]
    
    # Update the system prompt to include pain guidance
    system_prompt_start = updated_content.find("system_message = ", diagnosis_method_start)
    
    if system_prompt_start > 0:
        system_prompt_end = updated_content.find('"""', system_prompt_start + 20)
        if system_prompt_end > 0:
            system_prompt_end = updated_content.find('"""', system_prompt_end + 3)
            
            # Create updated system prompt with pain management guidance
            enhanced_system_prompt = """system_message = f\"\"\"IMPORTANT: Analyze the symptoms in the conversation and generate a medical diagnosis with treatment recommendations. 
        
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

{pain_guidance}

RULES:
1. Return ONLY the JSON object - no other text before or after
2. Ensure valid JSON syntax with double quotes around all keys and string values
3. For no prescriptions, use empty array: "prescriptions": []
4. For no follow-up, use "follow_up_recommendations": "None"
5. For multiple medications, add separate prescription objects in the array
6. Never include brand names in parentheses in drug_name
7. Be accurate and safe with dosage recommendations
\"\"\"

        # Set pain guidance based on whether pain symptoms were detected
        pain_guidance = ""
        if pain_detected:
            pain_guidance = \"\"\"PAIN MANAGEMENT GUIDANCE:
- For pain symptoms, consider recommending appropriate pain relievers like:
  * Ibuprofen (e.g., 400mg, tablet, every 6-8 hours as needed for 3-5 days)
  * Acetaminophen/Paracetamol (e.g., 500mg, tablet, every 4-6 hours as needed for 3-5 days)
  * Naproxen Sodium (e.g., 220mg, tablet, every 8-12 hours for 7-10 days)
  * For muscle pain, consider adding a muscle relaxant like Cyclobenzaprine (5-10mg)
  * For topical relief, consider recommending appropriate creams/gels
- Use different phrasing to sound natural in your recommendations:
  * "Consider taking..."
  * "You may benefit from..."
  * "It's recommended to try..."
  * "I suggest trying..."
- For severe, chronic, or worsening pain, always include follow-up recommendations with a healthcare professional
- If symptoms suggest nerve pain, joint inflammation, or other specialized conditions, note this in follow-up recommendations
\"\"\"
"""
            
            # Replace the old system prompt with the new one
            updated_content = updated_content[:system_prompt_start] + enhanced_system_prompt + updated_content[system_prompt_end+3:]
            
    # Write the updated content
    if updated_content != content:
        with open(pharma_agent_path, 'w') as f:
            f.write(updated_content)
        print(f"Updated {pharma_agent_path} with pain diagnosis enhancements")
    else:
        print("No changes needed")

if __name__ == "__main__":
    enhance_pain_diagnosis() 