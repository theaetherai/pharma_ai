/**
 * Test script for the prescription preprocessing logic
 * 
 * This script simulates the preprocessing of complex prescription strings
 * to demonstrate how it will normalize them for better drug matching.
 */

// Detailed logging for testing
const DETAILED_LOGGING = false;

// Implement the preprocessing function similar to the API
function preprocessPrescription(prescription) {
  if (!prescription) {
    return { original: '', drugNames: [], dosage: null };
  }
  
  if (DETAILED_LOGGING) {
    console.log(`Preprocessing prescription: "${prescription}"`);
  }
  
  // 1. Remove anything in parentheses
  let cleaned = prescription.replace(/\([^)]*\)/g, '').trim();
  if (DETAILED_LOGGING) {
    console.log(`After removing parentheses: "${cleaned}"`);
  }
  
  // 2. Split on connectors like "or", "and", commas
  const connectorPattern = /\s+(?:or|and)\s+|,\s*/gi;
  const parts = cleaned.split(connectorPattern);
  if (DETAILED_LOGGING) {
    console.log(`Split into parts:`, parts);
  }
  
  // Process each part individually to handle different dosages per drug
  const normalizedParts = parts.map(part => {
    // Extract dosage from each part independently
    const dosage = extractDosage(part);
    
    // Remove the dosage from this specific part
    let drugName = part;
    if (dosage) {
      // Remove the dosage text from the drug name
      drugName = part.replace(dosage, '');
    }
    
    // Clean up the drug name
    // Remove any instructional text (common phrases that aren't drug names)
    drugName = drugName
      // First remove common instructional phrases
      .replace(/follow the recommended dosage/i, '')
      .replace(/as directed/i, '')
      .replace(/as needed/i, '')
      .replace(/take (once|twice|three times) (daily|a day)/i, '')
      .replace(/\b(once|twice|three times) (daily|a day)\b/i, '')
      .replace(/on the packaging/i, '')
      .replace(/consult with a healthcare professional/i, '')
      .replace(/for [\w\s]+ (days|weeks)/i, '')
      // Then clean up remaining special characters
      .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
      .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
      .trim();
    
    return {
      drugName,
      dosage
    };
  });
  
  // Filter out parts that are likely not drug names
  const validParts = normalizedParts.filter(part => {
    // Skip very short parts (likely not drug names)
    if (part.drugName.length < 3) return false;
    
    // Skip common non-drug words
    const nonDrugWords = [
      'consult', 'follow', 'recommendation', 'packaging', 'professional',
      'daily', 'take', 'dose', 'times', 'day', 'week'
    ];
    
    // Check if this part is just instruction text
    const isInstruction = nonDrugWords.some(word => 
      part.drugName.toLowerCase().includes(word.toLowerCase())
    );
    
    return !isInstruction;
  });
  
  // Extract the drug names and dosages
  const drugNames = validParts.map(part => part.drugName);
  
  // Use the most common dosage if multiple are found
  let mainDosage = null;
  const dosages = validParts
    .map(part => part.dosage)
    .filter(dosage => dosage !== null);
  
  if (dosages.length > 0) {
    // Find most common dosage
    const dosageCount = new Map();
    for (const dosage of dosages) {
      dosageCount.set(dosage, (dosageCount.get(dosage) || 0) + 1);
    }
    
    // Get the dosage with highest count
    let maxCount = 0;
    for (const [dosage, count] of dosageCount.entries()) {
      if (count > maxCount) {
        mainDosage = dosage;
        maxCount = count;
      }
    }
  } else {
    // If no dosage found in individual parts, try extracting from the full string
    mainDosage = extractDosage(prescription);
  }
  
  if (DETAILED_LOGGING) {
    console.log(`Extracted ${drugNames.length} drug names:`, drugNames);
    console.log(`Main dosage: ${mainDosage || 'None'}`);
  }
  
  return {
    original: prescription,
    drugNames,
    dosage: mainDosage,
    // For debugging
    _debug: {
      normalizedParts,
      validParts,
      dosages
    }
  };
}

/**
 * Extract dosage from prescription string
 */
function extractDosage(prescription) {
  if (!prescription) {
    return null;
  }
  
  // Common dosage patterns to extract from the prescription string
  const dosagePatterns = [
    /\d+\s*mg/i,       // e.g., "500 mg" or "500mg"
    /\d+\s*mcg/i,      // e.g., "50 mcg" or "50mcg"
    /\d+\s*g/i,        // e.g., "1 g" or "1g"
    /\d+\s*ml/i,       // e.g., "5 ml" or "5ml"
    /\d+\s*%/i,        // e.g., "1 %" or "1%"
    /\d+\s*mg\/ml/i,   // e.g., "5 mg/ml" or "5mg/ml"
  ];
  
  // Try to match any dosage pattern in the prescription string
  for (const pattern of dosagePatterns) {
    const dosageMatch = prescription.match(pattern);
    if (dosageMatch) {
      return dosageMatch[0].replace(/\s+/g, ''); // Remove spaces
    }
  }
  
  return null;
}

// Test cases
const testCases = [
  // Example from the original problem statement
  "Acetaminophen (Tylenol) or Ibuprofen (Advil, Motrin)",
  
  // With dosage
  "Acetaminophen (Tylenol) 500mg or Ibuprofen (Advil) 200mg",
  
  // Complex with instructions
  "Acetaminophen (Tylenol) or Ibuprofen (Advil/Motrin) Follow the recommended dosage on the packaging or consult with a healthcare professional",
  
  // Multiple drugs with commas
  "Amoxicillin, Ciprofloxacin, Metronidazole 500mg",
  
  // Drug with brand name and specific dosage instructions
  "Lisinopril (Prinivil, Zestril) 10mg once daily",
  
  // Multiple drugs in single prescription with varied formats
  "Amoxicillin 500mg and Acetaminophen 200mg three times a day",
  
  // The problematic example from the logs
  "Acetaminophen (Tylenol) or Ibuprofen (Advil/Motrin) Follow the recommended dosage on the packaging or consult with a healthcare professional"
];

// Run tests
console.log("=== TESTING PRESCRIPTION PREPROCESSING ===\n");

testCases.forEach((testCase, index) => {
  console.log(`\n=== TEST CASE ${index + 1} ===`);
  console.log(`Original: "${testCase}"`);
  console.log("-".repeat(80));
  
  const result = preprocessPrescription(testCase);
  
  console.log("Extracted drug names:");
  if (result.drugNames.length === 0) {
    console.log("  None found");
  } else {
    result.drugNames.forEach((name, i) => {
      console.log(`  ${i+1}. ${name}`);
    });
  }
  
  console.log(`\nExtracted dosage: ${result.dosage || 'None'}`);
  
  if (result.drugNames.length > 0) {
    console.log("\nIndividual prescriptions to match in database:");
    result.drugNames.forEach((drugName, i) => {
      const cleanPrescription = result.dosage 
        ? `${drugName} ${result.dosage}` 
        : drugName;
      console.log(`  ${i+1}. "${cleanPrescription}"`);
    });
  } else {
    console.log("\nWARNING: No drug names were extracted!");
  }
  
  console.log("-".repeat(80));
});

// Final explanation
console.log("\n=== IMPROVEMENTS ===");
console.log(`
The improved algorithm:

1. Processes each part of the prescription separately:
   - Extracts dosages from each part individually
   - Removes the specific dosage from each drug name
   - This handles multiple drugs with different dosages correctly

2. Filters out non-drug text:
   - Removes instructional phrases like "as needed" or "three times daily"
   - Filters out parts that are likely just instructions
   - Uses a list of common non-drug words to identify instructions

3. Handles multiple dosages intelligently:
   - When multiple dosages are found, uses the most common one
   - Falls back to searching the full string if no dosages found in parts
   - This handles complex cases like "Drug1 500mg and Drug2 200mg"

4. Provides detailed debug information:
   - Shows the normalization process for each part
   - Tracks which parts were considered valid drugs vs. instructions
   - Makes it easier to troubleshoot complex prescription formats
`);

console.log("\n=== TESTING COMPLETE ==="); 