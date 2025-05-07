/**
 * Test the match-drugs API endpoint with complex prescription strings
 * 
 * To run this script:
 * node scripts/test-complex-prescriptions.js
 */

async function testComplexPrescriptions() {
  console.log('=== Testing match-drugs API with Complex Prescriptions ===');
  console.log('This script will test the preprocessor with complex prescription strings\n');

  try {
    // Dynamically import fetch
    const { default: fetch } = await import('node-fetch');
    
    // Sample complex prescriptions to test
    const testPrescriptions = [
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

    console.log('Test complex prescriptions:');
    testPrescriptions.forEach((p, i) => console.log(`${i+1}. ${p}`));

    // Send request to the match-drugs API
    console.log('\nSending request to API...');
    const requestPayload = { prescriptions: testPrescriptions };
    
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/match-drugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
    const endTime = Date.now();
    
    console.log(`Response status: ${response.status} (${response.statusText})`);
    console.log(`Response time: ${endTime - startTime}ms`);
    
    if (!response.ok) {
      console.error('Error response:', await response.text());
      return;
    }
    
    // Parse the response
    const data = await response.json();
    
    // Print results in a more readable format
    console.log('\n=== MATCH RESULTS ===');
    
    if (data.success && data.matches) {
      data.matches.forEach((result, i) => {
        const prescription = result.prescription;
        const match = result.match;
        
        console.log(`\n${i+1}. Original: "${prescription}"`);
        console.log('-'.repeat(80));
        
        // Show debug info if available
        if (result._debug) {
          const debug = result._debug;
          console.log(`Extracted drug names: ${debug.drugNames ? debug.drugNames.join(', ') : 'None'}`);
          console.log(`Extracted dosage: ${debug.dosage || 'None'}`);
          
          if (debug.matchedDrug) {
            console.log(`Matched drug: ${debug.matchedDrug}`);
          }
        }
        
        if (match) {
          console.log(`✅ MATCH FOUND:`);
          console.log(`   Name: ${match.name} ${match.dosage}`);
          console.log(`   Form: ${match.form}`);
          console.log(`   Match quality: ${match.match_quality}`);
          console.log(`   Price: $${match.price}, Stock: ${match.stock_quantity}`);
        } else {
          console.log(`❌ NO MATCH FOUND`);
        }
      });
      
      // Log statistics
      const matchCount = data.matches.filter(m => m.match).length;
      console.log(`\n=== SUMMARY: Found matches for ${matchCount} out of ${data.matches.length} prescriptions ===`);
      
      if (data._debug) {
        console.log(`Database has ${data._debug.drugCount} drugs available`);
        console.log(`Request processed at: ${data._debug.timestamp}`);
      }
    } else {
      console.error('API returned unsuccessful response:', data);
    }
  } catch (error) {
    console.error('Error testing API:', error);
    console.error('Error details:', error.stack);
  }
}

// Run the test function
testComplexPrescriptions().catch(console.error); 