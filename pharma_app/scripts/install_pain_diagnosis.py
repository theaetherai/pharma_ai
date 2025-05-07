import os
import sys

# Make sure we can import the update scripts
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    # Import our update scripts
    from enhance_pain_diagnosis import enhance_pain_diagnosis
    from update_api_server import update_api_server
except ImportError as e:
    print(f"Error importing update scripts: {e}")
    print("Make sure the scripts are in the same directory.")
    sys.exit(1)

def main():
    print("=== PharmaAI Pain Diagnosis Enhancement ===")
    print("This script will enhance PharmaAI's ability to diagnose and prescribe for pain-related symptoms.")
    
    # Run the enhancement scripts
    print("\n1. Enhancing PharmacistAgent for pain diagnosis...")
    enhance_pain_diagnosis()
    
    print("\n2. Updating API server to handle pain detection...")
    update_api_server()
    
    print("\n=== Installation Complete ===")
    print("The PharmaAI system has been updated to better handle pain-related symptoms.")
    print("When a patient mentions back pain, joint pain, muscle pain, or any other pain-related symptoms,")
    print("the system will now provide appropriate diagnosis and medication recommendations.")
    
    print("\nChanges made:")
    print("1. Added pain symptom detection")
    print("2. Enhanced AI prompting for pain medication")
    print("3. Added support for common OTC pain relievers and muscle relaxants")
    print("4. Improved follow-up recommendations for pain management")
    
    print("\nTo test the feature, try a conversation with pain-related keywords like:")
    print("- 'I've been having back pain for a few days'")
    print("- 'My shoulder hurts when I move it'")
    print("- 'I have a throbbing headache and feel nauseous'")
    
    print("\nThe system should now recommend appropriate pain medications and provide relevant advice.")

if __name__ == "__main__":
    main() 