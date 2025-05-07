/**
 * Local Drug Matcher - Tests the improved prescription preprocessing
 * 
 * This script simulates the drug matching logic locally without needing 
 * to start the full Next.js server. It uses the same preprocessing logic
 * as the API but with simulated database results.
 */

// Sample drug database for testing
const SAMPLE_DRUGS = [
  { id: '1', name: 'Acetaminophen', dosage: '500mg', form: 'tablet', price: 12.99, stock_quantity: 50 },
  { id: '2', name: 'Ibuprofen', dosage: '200mg', form: 'capsule', price: 9.99, stock_quantity: 100 },
  { id: '3', name: 'Amoxicillin', dosage: '500mg', form: 'capsule', price: 15.99, stock_quantity: 30 },
  { id: '4', name: 'Lisinopril', dosage: '10mg', form: 'tablet', price: 20.99, stock_quantity: 25 },
  { id: '5', name: 'Metformin', dosage: '500mg', form: 'tablet', price: 8.99, stock_quantity: 75 },
  { id: '6', name: 'Ciprofloxacin', dosage: '500mg', form: 'tablet', price: 22.99, stock_quantity: 15 },
  { id: '7', name: 'Metronidazole', dosage: '500mg', form: 'tablet', price: 14.99, stock_quantity: 40 },
  { id: '8', name: 'Loratadine', dosage: '10mg', form: 'tablet', price: 7.99, stock_quantity: 85 },
  { id: '9', name: 'Cetirizine', dosage: '10mg', form: 'tablet', price: 8.49, stock_quantity: 60 }
];

// Enable detailed logging for debugging
const DETAILED_LOGGING = true;

// Interface for normalized prescription data
class NormalizedPrescription {
  constructor(original, drugNames, dosage) {
    this.original = original;
    this.drugNames = drugNames;
    this.dosage = dosage;
  }
}

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

/**
 * Match drug name against sample database
 */
function matchDrug(drugName, dosage) {
  // Simulate database query logic
  
  // First try exact match with name and dosage
  if (dosage) {
    const exactMatches = SAMPLE_DRUGS.filter(drug => 
      drug.name.toLowerCase().includes(drugName.toLowerCase()) &&
      drug.dosage.toLowerCase().includes(dosage.toLowerCase())
    );
    
    if (exactMatches.length > 0) {
      const match = exactMatches[0];
      return {
        ...match,
        match_quality: 'exact'
      };
    }
  }
  
  // Then try partial match with just the name
  const partialMatches = SAMPLE_DRUGS.filter(drug => 
    drug.name.toLowerCase().includes(drugName.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    const match = partialMatches[0];
    return {
      ...match,
      match_quality: dosage ? 'partial' : 'name_only'
    };
  }
  
  return null;
}

/**
 * Process a complex prescription and find all possible matches
 */
function processComplexPrescription(prescription) {
  // Preprocess the prescription to extract clean drug names
  const normalized = preprocessPrescription(prescription);
  
  console.log(`\n====== Processing: "${prescription}" ======`);
  console.log(`Extracted drug names: ${normalized.drugNames.join(', ')}`);
  console.log(`Extracted dosage: ${normalized.dosage || 'None'}`);
  
  // Try to match each drug name
  for (const drugName of normalized.drugNames) {
    console.log(`\n>> Trying to match: "${drugName}"`);
    
    // Create a cleaner prescription string for this drug
    const cleanPrescription = normalized.dosage 
      ? `${drugName} ${normalized.dosage}` 
      : drugName;
    
    console.log(`Clean prescription: "${cleanPrescription}"`);
    
    // Attempt to match this drug
    const match = matchDrug(drugName, normalized.dosage);
    
    if (match) {
      console.log(`✅ MATCH FOUND:`);
      console.log(`   Name: ${match.name} ${match.dosage}`);
      console.log(`   Form: ${match.form}`);
      console.log(`   Match quality: ${match.match_quality}`);
      console.log(`   Price: $${match.price}, Stock: ${match.stock_quantity}`);
      
      // We consider the prescription matched if we find at least one match
      return {
        prescription,
        match,
        normalized
      };
    } else {
      console.log(`❌ No match found for "${drugName}"`);
    }
  }
  
  console.log(`\n❌ NO MATCHES FOUND for any drug in the prescription`);
  return {
    prescription,
    match: null,
    normalized
  };
}

// Test cases
const testCases = [
  // The problematic example from the logs
  "Acetaminophen (Tylenol) or Ibuprofen (Advil/Motrin) Follow the recommended dosage on the packaging or consult with a healthcare professional",
  
  // Multiple drugs with different dosages
  "Acetaminophen (Tylenol) 500mg or Ibuprofen (Advil) 200mg",
  
  // Complex with instructions
  "Amoxicillin 500mg and Acetaminophen 200mg three times a day",
  
  // Multiple drugs with commas
  "Amoxicillin, Ciprofloxacin, Metronidazole 500mg",
  
  // Drug with brand name and specific dosage instructions
  "Lisinopril (Prinivil, Zestril) 10mg once daily"
];

// Run the tests
console.log("=== LOCAL DRUG MATCHER ===");
console.log("Testing improved prescription preprocessing and matching\n");

const results = testCases.map(processComplexPrescription);

// Summary
console.log("\n=== SUMMARY ===");
console.log(`Successfully tested ${testCases.length} complex prescriptions`);

const matchCount = results.filter(r => r.match).length;
console.log(`Found matches for ${matchCount} out of ${testCases.length} prescriptions`);

// Success rate
const successRate = (matchCount / testCases.length) * 100;
console.log(`Success rate: ${successRate.toFixed(1)}%`);

console.log("\n=== TEST COMPLETE ==="); 