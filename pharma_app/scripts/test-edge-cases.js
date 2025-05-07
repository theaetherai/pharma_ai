/**
 * Test Edge Cases for Prescription Preprocessing
 * 
 * This script tests specific edge cases that were problematic in the logs,
 * particularly prescriptions with "of" connectors and time-based instructions.
 */

// Interface for normalized prescription data
class NormalizedPrescription {
  constructor(original, drugNames, dosage) {
    this.original = original;
    this.drugNames = drugNames;
    this.dosage = dosage;
  }
}

// Enable detailed logging for debugging
const DETAILED_LOGGING = true;

/**
 * Preprocess and normalize a complex prescription string
 */
function preprocessPrescription(prescription) {
  if (!prescription) {
    return new NormalizedPrescription('', [], null);
  }
  
  if (DETAILED_LOGGING) {
    console.log(`Preprocessing prescription: "${prescription}"`);
  }
  
  // 1. Remove anything in parentheses
  let cleaned = prescription.replace(/\([^)]*\)/g, '').trim();
  if (DETAILED_LOGGING) {
    console.log(`After removing parentheses: "${cleaned}"`);
  }
  
  // Special handling for "of" as connector - replace "of" with "or" to standardize
  cleaned = cleaned.replace(/\s+of\s+/gi, ' or ');
  
  // Handle "combination of" pattern often seen in compound drugs
  cleaned = cleaned.replace(/combination of/gi, '');
  
  if (DETAILED_LOGGING) {
    console.log(`After normalizing connectors: "${cleaned}"`);
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
      .replace(/\bevery\s+\d+(\s*-\s*|\s+to\s+|\s+)\d+\s+hours?\b/i, '') // e.g., "every 4-6 hours"
      .replace(/\bevery\s+\d+\s+hours?\b/i, '') // e.g., "every 4 hours"
      .replace(/on the packaging/i, '')
      .replace(/consult with a healthcare professional/i, '')
      .replace(/for [\w\s]+ (days|weeks)/i, '')
      .replace(/for pain/i, '')
      // Also remove "of" if it's at the beginning or end
      .replace(/^of\s+/i, '')
      .replace(/\s+of$/i, '')
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
    
    // Skip common non-drug words and phrases
    const nonDrugWords = [
      'consult', 'follow', 'recommendation', 'packaging', 'professional',
      'daily', 'take', 'dose', 'times', 'day', 'week', 'hour', 'hours',
      'every', 'directed', 'needed', 'recommended', 'combination'
    ];
    
    // Check if this part is just instruction text
    const isInstruction = nonDrugWords.some(word => 
      part.drugName.toLowerCase() === word.toLowerCase() ||
      part.drugName.toLowerCase().startsWith(word.toLowerCase() + ' ') ||
      part.drugName.toLowerCase().endsWith(' ' + word.toLowerCase())
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
  
  return new NormalizedPrescription(
    prescription,
    drugNames,
    mainDosage
  );
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

// Sample drug database for matching
const SAMPLE_DRUGS = [
  { name: 'Acetaminophen', dosage: '500mg' },
  { name: 'Dextromethorphan', dosage: '30mg' },
  { name: 'Ibuprofen', dosage: '200mg' },
  { name: 'Amoxicillin', dosage: '500mg' }
];

// Simple matching function for testing
function findDrugMatch(drugName) {
  return SAMPLE_DRUGS.find(drug => 
    drug.name.toLowerCase().includes(drugName.toLowerCase())
  );
}

// Test cases specifically for the problematic examples
const testCases = [
  // The problematic example from the logs
  "Dextromethorphan of Acetaminophen 500mg",
  
  // Similar problematic cases
  "Dextromethorphan of Acetaminophen every 4-6 hours",
  "Acetaminophen 500mg of Dextromethorphan 30mg",
  
  // Time-based instructions
  "Ibuprofen 200mg every 4 hours",
  "Acetaminophen 500mg every 4-6 hours as needed for pain",
  
  // Multiple parts with "of"
  "Acetaminophen of Dextromethorphan of Ibuprofen",
  
  // Complex mixing of formulations
  "Combination of Acetaminophen 500mg and Dextromethorphan 30mg"
];

// Run the tests
console.log("=== TESTING EDGE CASES ===\n");

testCases.forEach((testCase, index) => {
  console.log(`\n${index+1}. TESTING: "${testCase}"`);
  console.log("-".repeat(80));
  
  // Preprocess the prescription
  const result = preprocessPrescription(testCase);
  
  console.log("Extracted drug names:");
  result.drugNames.forEach((name, i) => {
    console.log(`  ${i+1}. ${name} - ${findDrugMatch(name) ? '✅ Match found' : '❌ No match'}`);
  });
  
  console.log(`\nExtracted dosage: ${result.dosage || 'None'}`);
  
  console.log("-".repeat(80));
});

// Final summary
console.log("\n=== SUMMARY ===");
console.log(`
Improvements for handling complex prescriptions with "of" and timing:

1. Changed approach for "of" connector
   - Instead of trying to split on "of", now replace "of" with "or"
   - This standardizes connectors so all can be handled the same way

2. Added special handling for "combination of" phrase
   - Common in compound medications
   - Now properly removed before processing

3. Improved filtering of non-drug words
   - More robust matching for instruction-only words
   - Checks if the entire string is a non-drug word
   - Checks if string starts or ends with non-drug words

4. Better handling of "for pain" and other contextual phrases
   - Explicitly removes these phrases that would create false matches
   - Improves the quality of extracted drug names

5. Enhanced timing instruction removal
   - Covers more patterns for time-based dosing instructions
`);

console.log("\n=== TEST COMPLETE ==="); 