import os
import json
import re

def update_pharma_agent_file():
    # Find pharma_agent.py in various possible locations
    possible_paths = [
        '../pharma_backend/pharmacists/pharma_agent.py',
        '../pharma_backend/pharma_agent.py',
        '../pharma_backend/api/pharma_agent.py',
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
    with open(f"{pharma_agent_path}.bak", 'w') as f:
        f.write(content)
    print(f"Created backup at {pharma_agent_path}.bak")
    
    # Modify the content to handle token limit errors better
    updated_content = content
    
    # Add token estimation function
    if "def estimate_tokens(" not in content:
        token_estimation_code = """
    def estimate_tokens(self, messages):
        \"\"\"Estimate the number of tokens in the messages
        
        A simple estimation: 1 token ≈ 4 chars for English text
        \"\"\"
        total_chars = sum(len(msg.get('content', '')) for msg in messages)
        return total_chars // 4
    
    def truncate_messages_if_needed(self, messages, max_tokens=5000):
        \"\"\"Truncate messages if they exceed token limit\"\"\"
        # First check if we need to truncate
        estimated_tokens = self.estimate_tokens(messages)
        
        if estimated_tokens <= max_tokens:
            return messages  # No truncation needed
        
        # Always keep system messages
        system_messages = [msg for msg in messages if msg.get('role') == 'system']
        
        # Get the remaining messages
        non_system_messages = [msg for msg in messages if msg.get('role') != 'system']
        
        # Calculate how many tokens to reduce
        to_reduce = estimated_tokens - max_tokens
        
        # If very few messages, truncate their content instead
        if len(non_system_messages) <= 4:
            # Truncate the content of each message
            for msg in non_system_messages:
                if 'content' in msg and isinstance(msg['content'], str) and len(msg['content']) > 200:
                    # Truncate proportionally to message length
                    chars_to_remove = min(len(msg['content']) - 100, (to_reduce * 4) // len(non_system_messages))
                    if chars_to_remove > 0:
                        half = chars_to_remove // 2
                        msg['content'] = msg['content'][:len(msg['content'])//2 - half] + " [...] " + msg['content'][len(msg['content'])//2 + half:]
            return system_messages + non_system_messages
        
        # Keep the first user message for context
        first_user_idx = next((i for i, msg in enumerate(non_system_messages) if msg.get('role') == 'user'), -1)
        first_user_message = [non_system_messages[first_user_idx]] if first_user_idx >= 0 else []
        
        # Keep most recent messages, which are more relevant
        recent_messages = non_system_messages[-5:]
        
        # Combine and return truncated conversation
        return system_messages + first_user_message + recent_messages
"""
        # Find a good insertion point - after the class methods but before diagnosis generation
        insertion_point = content.find("def generate_diagnosis(")
        if insertion_point > 0:
            # Find the last class method before generate_diagnosis
            last_method_end = content.rfind("\n\n", 0, insertion_point)
            if last_method_end > 0:
                updated_content = content[:last_method_end] + token_estimation_code + content[last_method_end:]
    
    # Update the generate_diagnosis method to use token limiting
    if "self.truncate_messages_if_needed" not in content:
        # Find the generate_diagnosis method
        diagnosis_method_start = updated_content.find("def generate_diagnosis(")
        if diagnosis_method_start > 0:
            # Find where we create temp_conversation
            temp_conv_create = updated_content.find("temp_conversation = conv_history.copy()", diagnosis_method_start)
            if temp_conv_create > 0:
                line_end = updated_content.find('\n', temp_conv_create)
                # Add truncation
                truncation_code = """
        # Truncate messages if they exceed token limit
        if len(conv_history) > 6:  # Only worth truncating if conversation is substantial
            conv_history = self.truncate_messages_if_needed(conv_history, max_tokens=5000)
            print(f"Truncated conversation from {len(temp_conversation)} to {len(conv_history)} messages to prevent token limit errors")
        
"""
                updated_content = updated_content[:temp_conv_create] + truncation_code + updated_content[temp_conv_create:]
    
    # Add error handling for token limit errors
    if "token_limit_exceeded" not in content:
        # Find the try-except block in generate_diagnosis
        try_block_start = updated_content.find("try:", updated_content.find("def generate_diagnosis("))
        if try_block_start > 0:
            catch_block = updated_content.find("except Exception as e:", try_block_start)
            if catch_block > 0:
                # Update the catch block to handle token limit errors specifically
                token_limit_handler = """
        except Exception as e:
            error_str = str(e)
            print(f"Error generating diagnosis: {error_str}")
            
            # Check if this is a token limit error
            if "token" in error_str.lower() and ("limit" in error_str.lower() or "exceed" in error_str.lower()):
                # This is a token limit error, try with a more aggressively truncated conversation
                try:
                    # Create an even more truncated conversation
                    minimal_conversation = self.truncate_messages_if_needed(conv_history, max_tokens=2000)
                    if len(minimal_conversation) > 3:  # Further reduce if still too many messages
                        minimal_conversation = minimal_conversation[0:1] + minimal_conversation[-2:]
                    
                    # Add the system prompt
                    minimal_conversation.append({
                        "role": "system",
                        "content": "Generate a very brief diagnosis and simple medication recommendation in JSON format: {'diagnosis': 'brief diagnosis', 'prescription': [{'drug': 'medication name', 'dosage': 'dosage info', 'duration': 'duration info'}]}"
                    })
                    
                    print(f"Retrying with minimal conversation ({len(minimal_conversation)} messages)")
                    
                    # Try again with minimal conversation
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=minimal_conversation,
                        temperature=0.1,
                        max_tokens=1000
                    )
                    
                    assistant_message = response.choices[0].message.content
                    
                    # Parse and return the result
                    try:
                        diagnosis = json.loads(assistant_message)
                        return diagnosis
                    except:
                        pass  # Fall through to default error case
                except Exception as retry_error:
                    print(f"Error in retry attempt: {retry_error}")
                """
                # Replace the original catch block
                updated_content = updated_content[:catch_block] + token_limit_handler + updated_content[updated_content.find("return {", catch_block):]
    
    # Write the updated content
    if updated_content != content:
        with open(pharma_agent_path, 'w') as f:
            f.write(updated_content)
        print(f"Updated {pharma_agent_path} with token handling improvements")
    else:
        print("No changes needed")

if __name__ == "__main__":
    update_pharma_agent_file() 