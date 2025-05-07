/**
 * Test script for the drug matching API
 * Run this script after setting up the database with:
 * 1. npx prisma migrate dev --name add-drug-table
 * 2. npm run seed
 * 
 * To run this test:
 * ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-drug-matching-api.ts
 */

import fetch from 'node-fetch';

interface MatchResponse {
  success: boolean;
  matches: Array<{
    prescription: string;
    match: {
      id: string;
      name: string;
      dosage: string;
      form: string;
      price: number;
      stock_quantity: number;
      match_quality: 'exact' | 'partial' | 'name_only';
    } | null;
  }>;
}

async function testDrugMatchingAPI() {
  console.log('🔍 Testing Drug Matching API...');
  
  const testPrescriptions = [
    'Acetaminophen 500mg',
    'Amoxicillin 250mg',
    'Ibuprofen 200mg',
    'NonExistentDrug 100mg',
    'Acetaminophen', // No dosage specified
    'Lisinopril 10mg tablet',
  ];
  
  try {
    console.log(`Testing with ${testPrescriptions.length} prescriptions`);
    console.log('Prescriptions:', testPrescriptions);
    
    const response = await fetch('http://localhost:3000/api/match-drugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prescriptions: testPrescriptions,
      }),
    });
    
    if (!response.ok) {
      console.error(`❌ API error: ${response.status}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const data = await response.json() as MatchResponse;
    
    console.log('\n✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Print a summary of the results
    console.log('\n📊 Match Summary:');
    data.matches.forEach((result, index) => {
      const prescription = result.prescription;
      const match = result.match;
      
      if (match) {
        console.log(`${index + 1}. "${prescription}" → ${match.name} ${match.dosage} (${match.match_quality})`);
      } else {
        console.log(`${index + 1}. "${prescription}" → No match found`);
      }
    });
    
    // Statistics
    const exactMatches = data.matches.filter(m => m.match?.match_quality === 'exact').length;
    const partialMatches = data.matches.filter(m => m.match?.match_quality === 'partial').length;
    const nameMatches = data.matches.filter(m => m.match?.match_quality === 'name_only').length;
    const noMatches = data.matches.filter(m => !m.match).length;
    
    console.log('\n📈 Statistics:');
    console.log(`- Exact matches: ${exactMatches}`);
    console.log(`- Partial matches: ${partialMatches}`);
    console.log(`- Name-only matches: ${nameMatches}`);
    console.log(`- No matches: ${noMatches}`);
    console.log(`- Total match rate: ${((exactMatches + partialMatches + nameMatches) / testPrescriptions.length * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testDrugMatchingAPI(); 