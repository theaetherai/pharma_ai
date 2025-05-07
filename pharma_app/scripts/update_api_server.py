import os
import re

def update_api_server():
    # Find the API server file in various possible locations
    possible_paths = [
        '../pharma_backend/api/app.py',
        '../pharma_backend/api_server.py',
        '../pharma_backend/simple_api.py',
        '../PharmaAI_Agent/api_server.py',
        '../simple_api.py',
        'api_server.py'
    ]
    
    server_path = None
    for path in possible_paths:
        if os.path.exists(path):
            server_path = path
            break
    
    if not server_path:
        print("Could not find API server file")
        return
    
    print(f"Found API server at {server_path}")
    
    # Read the file
    with open(server_path, 'r') as f:
        content = f.read()
    
    # Create a backup
    with open(f"{server_path}.pain_bak", 'w') as f:
        f.write(content)
    print(f"Created backup at {server_path}.pain_bak")
    
    # Modify the content to handle pain_detected flag
    updated_content = content
    
    # Update the diagnose route request model
    # Find the diagnose endpoint
    diagnose_route_start = re.search(r'(@app\.(post|route)\([\'"]\/api\/diagnose[\'"])', content)
    
    if diagnose_route_start:
        # Look for ConversationRequest or DiagnoseRequest class
        request_class_match = re.search(r'class\s+(Conversation|Diagnose)Request\(', content)
        
        if request_class_match:
            request_class_name = request_class_match.group(1) + "Request"
            request_class_start = content.find(f"class {request_class_name}")
            request_class_end = content.find("class", request_class_start + 10)
            if request_class_end == -1:  # If it's the last class
                request_class_end = len(content)
            
            # If the pain_detected field doesn't exist, add it
            if "pain_detected" not in content[request_class_start:request_class_end]:
                # Find the last field in the request class
                last_field_match = re.search(r'(\w+):\s*(\w+)(?:\s*=\s*[\w"\']+)?\s*$', content[request_class_start:request_class_end])
                
                if last_field_match:
                    last_field_end = request_class_start + last_field_match.end()
                    # Add the pain_detected field
                    pain_detected_field = "\n    pain_detected: Optional[bool] = False"
                    updated_content = updated_content[:last_field_end] + pain_detected_field + updated_content[last_field_end:]
        
        # Update the diagnose function to pass pain_detected to the agent
        diagnose_func_start = content.find("def diagnose(", diagnose_route_start.start())
        if diagnose_func_start > 0:
            # Find where the agent.generate_diagnosis function is called
            diagnosis_call = re.search(r'(diagnosis|result)\s*=\s*agent\.generate_diagnosis\(', content[diagnose_func_start:])
            
            if diagnosis_call:
                # Find the end of the function call parameters
                call_start = diagnose_func_start + diagnosis_call.start()
                params_start = call_start + diagnosis_call.end()
                params_end = content.find(')', params_start)
                
                # Check if pain_detected is already in the parameters
                if "pain_detected" not in content[params_start:params_end]:
                    # Check if there are existing parameters
                    if '=' in content[params_start:params_end]:
                        # Add the pain_detected parameter
                        params = content[params_start:params_end].strip()
                        updated_params = params + ",\n            pain_detected=request.pain_detected"
                        updated_content = updated_content[:params_start] + updated_params + updated_content[params_end:]
                    else:
                        # No parameters, add pain_detected
                        updated_content = updated_content[:params_start] + "pain_detected=request.pain_detected" + updated_content[params_start:params_end]
            
            # Also make sure we're extracting the pain_detected field from the request
            request_extract = re.search(r'pain_detected\s*=\s*(?:data|request)\.(?:get\([\'"]pain_detected[\'"]\)|pain_detected)', content[diagnose_func_start:])
            
            if not request_extract:
                # Find where we extract other fields from the request
                extract_section = re.search(r'(user_id|on_demand)\s*=\s*(?:data|request)\.(?:get\([\'"](?:user_id|on_demand)[\'"]\)|(?:user_id|on_demand))', content[diagnose_func_start:])
                
                if extract_section:
                    extract_line_end = diagnose_func_start + extract_section.end()
                    # Find the end of the line
                    line_end = content.find('\n', extract_line_end)
                    
                    # Add the pain_detected extraction
                    pain_detect_extract = "\n        pain_detected = request.pain_detected if hasattr(request, 'pain_detected') else None"
                    if "request" in extract_section.group(0):
                        pain_detect_extract = "\n        pain_detected = request.pain_detected if hasattr(request, 'pain_detected') else None"
                    else:
                        pain_detect_extract = "\n        pain_detected = data.get('pain_detected', False)"
                        
                    updated_content = updated_content[:line_end] + pain_detect_extract + updated_content[line_end:]
    
    # Write the updated content
    if updated_content != content:
        with open(server_path, 'w') as f:
            f.write(updated_content)
        print(f"Updated {server_path} to handle pain detection flag")
    else:
        print("No changes needed to API server")

if __name__ == "__main__":
    update_api_server() 