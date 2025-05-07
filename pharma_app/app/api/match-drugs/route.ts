import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { Prisma } from "@prisma/client";

// Enable detailed logging for debugging
const DETAILED_LOGGING = true;

// Interface for the request payload
interface MatchDrugsRequest {
  prescriptions: string[]; // Array of prescriptions like "Paracetamol 500mg"
}

// Interface for matched drug response
interface MatchedDrug {
  id: string;
  name: string;
  dosage: string;
  form: string;
  price: number;
  stock_quantity: number;
  match_quality: 'exact' | 'partial' | 'name_only'; // Indicate match quality
}

// Interface for raw drug data from database
interface RawDrug {
  id: string;
  name: string;
  dosage: string;
  form: string;
  price: number | string | bigint; // Could be returned as string or bigint from raw query
  stock_quantity: number | string | bigint;
}

// Interface for normalized prescription data
interface NormalizedPrescription {
  original: string;       // Original full prescription text
  drugNames: string[];    // Array of clean drug names extracted
  dosage: string | null;  // Dosage if found
}

// Custom replacer function for JSON.stringify to handle BigInt values
const jsonReplacer = (key: string, value: any) => {
  // Convert BigInt to Number (if it's small enough) or String
  return typeof value === 'bigint' ? Number(value) : value;
};

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = auth();
    
    // Parse the request body
    const body = await req.json() as MatchDrugsRequest;
    const { prescriptions } = body;
    
    if (!prescriptions || !Array.isArray(prescriptions) || prescriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Valid prescriptions array is required" 
      }, { status: 400 });
    }
    
    console.log(`Matching ${prescriptions.length} prescriptions`);
    if (DETAILED_LOGGING) {
      console.log('Prescription strings received:', JSON.stringify(prescriptions));
    }
    
    // First check if the database has drugs
    const drugCount = await getDrugCount();
    if (DETAILED_LOGGING) {
      console.log(`Database has ${drugCount} drugs available for matching`);
    }
    
    // Process each prescription and find matches
    const results = await Promise.all(
      prescriptions.map(async (prescription) => {
        if (DETAILED_LOGGING) {
          console.log(`\n====== Processing prescription: "${prescription}" ======`);
        }
        
        // Preprocess the prescription to extract clean drug names
        const normalized = preprocessPrescription(prescription);
        
        if (DETAILED_LOGGING) {
          console.log(`Normalized prescription into:`, JSON.stringify(normalized));
        }
        
        // If no drug names were extracted, return null match
        if (normalized.drugNames.length === 0) {
          return {
            prescription,
            match: null,
            _debug: DETAILED_LOGGING ? {
              drugNames: [],
              dosage: normalized.dosage,
              matchType: 'none'
            } : undefined
          };
        }
        
        // Try to match each drug name until we find a match
        for (const drugName of normalized.drugNames) {
          if (DETAILED_LOGGING) {
            console.log(`Trying to match extracted drug name: "${drugName}"`);
          }
          
          // Create a cleaner prescription string for this specific drug
          const cleanPrescription = normalized.dosage 
            ? `${drugName} ${normalized.dosage}` 
            : drugName;
          
          // Attempt to match this specific drug
          const match = await matchPrescriptionToDrug(cleanPrescription);
          
          // If we found a match, return it
          if (match) {
            return {
              prescription,
              match,
              _debug: DETAILED_LOGGING ? {
                drugNames: normalized.drugNames,
                matchedDrug: drugName,
                dosage: normalized.dosage,
                matchType: match.match_quality
              } : undefined
            };
          }
        }
        
        // If we couldn't match any of the drug names, return null
        return {
          prescription,
          match: null,
          _debug: DETAILED_LOGGING ? {
            drugNames: normalized.drugNames,
            dosage: normalized.dosage,
            matchType: 'none'
          } : undefined
        };
      })
    );
    
    // Use the custom replacer function to handle BigInt values
    return new NextResponse(JSON.stringify({
      success: true,
      matches: results,
      _debug: DETAILED_LOGGING ? {
        drugCount,
        timestamp: new Date().toISOString()
      } : undefined
    }, jsonReplacer), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error("Drug matching error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

/**
 * Preprocess and normalize a complex prescription string
 */
function preprocessPrescription(prescription: string): NormalizedPrescription {
  if (!prescription) {
    return { original: '', drugNames: [], dosage: null };
  }
  
  if (DETAILED_LOGGING) {
    console.log(`[PREPROCESS] Prescription: "${prescription}"`);
  }
  
  // 1. Remove anything in parentheses (like brand names)
  let cleaned = prescription.replace(/\([^)]*\)/g, '').trim();
  if (DETAILED_LOGGING) {
    console.log(`[PREPROCESS] After removing parentheses: "${cleaned}"`);
  }
  
  // Special handling for "of" as connector - replace "of" with "or" to standardize
  cleaned = cleaned.replace(/\s+of\s+/gi, ' or ');
  
  // Handle "combination of" pattern often seen in compound drugs
  cleaned = cleaned.replace(/combination of/gi, '');
  
  if (DETAILED_LOGGING) {
    console.log(`[PREPROCESS] After normalizing connectors: "${cleaned}"`);
  }
  
  // 2. Split on connectors like "or", "and", commas
  const connectorPattern = /\s+(?:or|and)\s+|,\s*/gi;
  const parts = cleaned.split(connectorPattern);
  if (DETAILED_LOGGING) {
    console.log(`[PREPROCESS] Split into parts:`, parts);
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
    console.log(`[PREPROCESS] Extracted ${drugNames.length} drug names:`, drugNames);
    console.log(`[PREPROCESS] Main dosage: ${mainDosage || 'None'}`);
  }
  
  return {
    original: prescription,
    drugNames,
    dosage: mainDosage
  };
}

/**
 * Extract dosage from prescription string
 */
function extractDosage(prescription: string): string | null {
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

// Get the total count of drugs in the database
async function getDrugCount(): Promise<number> {
  try {
    const result = await db.$queryRaw<{count: number}[]>`SELECT COUNT(*) as count FROM "Drug"`;
    return result[0].count as number;
  } catch (error) {
    console.error("Error counting drugs:", error);
    return 0;
  }
}

/**
 * Match a prescription string to drugs in the database
 * @param prescription Prescription string like "Amoxicillin 500mg" or "Paracetamol"
 */
async function matchPrescriptionToDrug(prescription: string): Promise<MatchedDrug | null> {
  try {
    // Parse the prescription string to extract drug name and dosage
    const { drugName, dosage } = parsePrescription(prescription);
    
    if (DETAILED_LOGGING) {
      console.log(`Parsed prescription "${prescription}" into:`, { drugName, dosage });
    }
    
    if (!drugName) {
      if (DETAILED_LOGGING) console.log(`No drug name could be extracted from "${prescription}"`);
      return null;
    }
    
    // First try exact match (name + dosage)
    if (dosage) {
      if (DETAILED_LOGGING) {
        console.log(`Attempting exact match for name: "${drugName}" with dosage: "${dosage}"`);
      }
      
      // Try exact match first with raw SQL
      const exactMatches = await db.$queryRaw<RawDrug[]>`
        SELECT id, name, dosage, form, price, stock_quantity 
        FROM "Drug" 
        WHERE LOWER(name) LIKE ${`%${drugName.toLowerCase()}%`} 
        AND LOWER(dosage) LIKE ${`%${dosage.toLowerCase()}%`}
        ORDER BY stock_quantity DESC
        LIMIT 1
      `;
      
      if (DETAILED_LOGGING) {
        console.log(`Exact match query results:`, JSON.stringify(exactMatches, jsonReplacer));
      }
      
      if (exactMatches && exactMatches.length > 0) {
        const match = exactMatches[0];
        const matchResult = {
          id: match.id,
          name: match.name,
          dosage: match.dosage,
          form: match.form,
          price: typeof match.price === 'string' ? parseFloat(match.price) : 
                 typeof match.price === 'bigint' ? Number(match.price) : match.price,
          stock_quantity: typeof match.stock_quantity === 'string' ? parseInt(match.stock_quantity) : 
                          typeof match.stock_quantity === 'bigint' ? Number(match.stock_quantity) : match.stock_quantity,
          match_quality: 'exact' as const
        };
        
        if (DETAILED_LOGGING) {
          console.log(`✅ Found exact match:`, JSON.stringify(matchResult, jsonReplacer));
        }
        
        return matchResult;
      }
      
      // Try partial match with different dosage
      if (DETAILED_LOGGING) {
        console.log(`No exact match found. Trying partial match for name: "${drugName}" (any dosage)`);
      }
      
      const partialMatches = await db.$queryRaw<RawDrug[]>`
        SELECT id, name, dosage, form, price, stock_quantity 
        FROM "Drug" 
        WHERE LOWER(name) LIKE ${`%${drugName.toLowerCase()}%`}
        ORDER BY stock_quantity DESC, price ASC
        LIMIT 1
      `;
      
      if (DETAILED_LOGGING) {
        console.log(`Partial match query results:`, JSON.stringify(partialMatches, jsonReplacer));
      }
      
      if (partialMatches && partialMatches.length > 0) {
        const match = partialMatches[0];
        const matchResult = {
          id: match.id,
          name: match.name,
          dosage: match.dosage,
          form: match.form,
          price: typeof match.price === 'string' ? parseFloat(match.price) : 
                 typeof match.price === 'bigint' ? Number(match.price) : match.price,
          stock_quantity: typeof match.stock_quantity === 'string' ? parseInt(match.stock_quantity) : 
                          typeof match.stock_quantity === 'bigint' ? Number(match.stock_quantity) : match.stock_quantity,
          match_quality: 'partial' as const
        };
        
        if (DETAILED_LOGGING) {
          console.log(`✅ Found partial match (different dosage):`, JSON.stringify(matchResult, jsonReplacer));
        }
        
        return matchResult;
      }
    } else {
      // If no dosage provided, just search by name
      if (DETAILED_LOGGING) {
        console.log(`No dosage in prescription. Trying name-only match for: "${drugName}"`);
      }
      
      const nameMatches = await db.$queryRaw<RawDrug[]>`
        SELECT id, name, dosage, form, price, stock_quantity 
        FROM "Drug" 
        WHERE LOWER(name) LIKE ${`%${drugName.toLowerCase()}%`}
        ORDER BY stock_quantity DESC, price ASC
        LIMIT 1
      `;
      
      if (DETAILED_LOGGING) {
        console.log(`Name-only match query results:`, JSON.stringify(nameMatches, jsonReplacer));
      }
      
      if (nameMatches && nameMatches.length > 0) {
        const match = nameMatches[0];
        const matchResult = {
          id: match.id,
          name: match.name,
          dosage: match.dosage,
          form: match.form,
          price: typeof match.price === 'string' ? parseFloat(match.price) : 
                 typeof match.price === 'bigint' ? Number(match.price) : match.price,
          stock_quantity: typeof match.stock_quantity === 'string' ? parseInt(match.stock_quantity) : 
                          typeof match.stock_quantity === 'bigint' ? Number(match.stock_quantity) : match.stock_quantity,
          match_quality: 'name_only' as const
        };
        
        if (DETAILED_LOGGING) {
          console.log(`✅ Found name-only match:`, JSON.stringify(matchResult, jsonReplacer));
        }
        
        return matchResult;
      }
    }
    
    // No match found
    if (DETAILED_LOGGING) {
      console.log(`❌ No match found for "${prescription}"`);
    }
    
    return null;
    
  } catch (error) {
    console.error(`Error matching prescription "${prescription}":`, error);
    return null;
  }
}

/**
 * Parse a prescription string to extract drug name and dosage
 */
function parsePrescription(prescription: string): { drugName: string; dosage: string | null } {
  if (!prescription) {
    return { drugName: '', dosage: null };
  }
  
  // For already processed drug names (from preprocessPrescription),
  // we don't need to do complex parsing again
  
  // Common dosage patterns to extract from the prescription string
  const dosagePatterns = [
    /\d+\s*mg/i,      // e.g., "500 mg" or "500mg"
    /\d+\s*mcg/i,      // e.g., "50 mcg" or "50mcg"
    /\d+\s*g/i,        // e.g., "1 g" or "1g"
    /\d+\s*ml/i,       // e.g., "5 ml" or "5ml"
    /\d+\s*%/i,        // e.g., "1 %" or "1%"
    /\d+\s*mg\/ml/i,   // e.g., "5 mg/ml" or "5mg/ml"
  ];
  
  // Try to match any dosage pattern in the prescription string
  let dosage: string | null = null;
  let dosageMatch: RegExpMatchArray | null = null;
  
  for (const pattern of dosagePatterns) {
    dosageMatch = prescription.match(pattern);
    if (dosageMatch) {
      dosage = dosageMatch[0].replace(/\s+/g, ''); // Remove spaces
      break;
    }
  }
  
  // Extract drug name by removing the dosage part if found
  let drugName = prescription;
  if (dosageMatch) {
    drugName = prescription.replace(dosageMatch[0], '').trim();
  }
  
  // Clean up any remaining special characters and extra whitespace
  drugName = drugName
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ')     // Replace multiple spaces with a single space
    .trim();
  
  return { drugName, dosage };
} 