# PharmaAI Pain Diagnosis Enhancement

This enhancement adds specialized pain detection and treatment capabilities to the PharmaAI system. When users mention pain-related symptoms (back pain, joint pain, muscle pain, etc.), the AI will now provide more accurate diagnoses and appropriate pain medication recommendations.

## Features Added

1. **Pain Symptom Detection**: Automatically detects pain-related keywords in user conversations
2. **Enhanced AI Prompting**: Tailored system prompts to guide the AI in handling pain symptoms
3. **Pain Medication Logic**: Specialized treatment recommendations for various types of pain
4. **Appropriate Dosage Guidance**: Safe and accurate dosage information for common pain relievers
5. **Advanced Follow-Up Recommendations**: Improved guidance on when to see a healthcare professional

## Installation

1. Ensure you have Python 3.8+ installed
2. Navigate to the `scripts` directory:
   ```
   cd pharma_app/scripts
   ```
3. Run the installation script:
   ```
   python install_pain_diagnosis.py
   ```
4. Restart your PharmaAI API server

## How It Works

### Pain Detection

The system now automatically detects pain-related keywords in user messages, including:
- "back pain"
- "leg pain"
- "muscle pain"
- "joint pain"
- "shoulder pain"
- "neck stiffness"
- "chronic pain"
- "swelling pain"
- "headache", "migraine"
- And other related terms

### Enhanced Diagnosis for Pain Symptoms

When pain symptoms are detected, the AI now uses specialized prompt enhancements to:
1. Accurately identify the type of pain
2. Suggest appropriate over-the-counter pain relievers
3. Provide safe dosage recommendations
4. Offer additional lifestyle advice when applicable
5. Include appropriate follow-up recommendations based on severity

### Common Pain Medications Now Handled

The system can now recommend appropriate:
- NSAIDs like Ibuprofen and Naproxen
- Acetaminophen/Paracetamol
- Muscle relaxants when appropriate
- Topical analgesics (creams/gels)

## Testing the Enhancement

Try the following test cases to verify the enhancement is working:

1. **Back Pain Test**:
   ```
   I've been having lower back pain for the past three days. It hurts when I bend over.
   ```

2. **Headache Test**:
   ```
   I've had a throbbing headache since yesterday and over-the-counter medicine isn't helping.
   ```

3. **Joint Pain Test**:
   ```
   My knee is swollen and painful, especially when I walk up stairs or after sitting for a long time.
   ```

4. **Muscle Pain Test**:
   ```
   My muscles are sore and stiff after intense exercise two days ago.
   ```

## Technical Implementation

This enhancement makes changes to:
1. The frontend diagnostic detection system
2. The Python-based PharmacistAgent class
3. The API server that handles diagnosis requests

The changes are non-intrusive and preserve all existing functionality while adding specialized pain handling capabilities.

## Troubleshooting

If you encounter any issues after installation:
1. Check that the API server restarted properly
2. Verify that the scripts ran without errors
3. Look for any error messages in the console
4. If needed, restore from the backup files created during installation (*.pain_bak)

## Support

For any issues or questions, please contact the development team. 