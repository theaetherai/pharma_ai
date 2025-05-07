/**
 * Test the match-drugs API endpoint with sample prescriptions
 * 
 * To run this script:
 * node scripts/test-match-drugs-api.js
 */

// Use dynamic import for node-fetch
async function testMatchDrugsAPI() {
  console.log('=== Testing match-drugs API ===');
  console.log('This script will send test prescriptions to the API and log the results\n');

  try {
    // Dynamically import fetch
    const { default: fetch } = await import('node-fetch');
    
    // Sample prescriptions to test (similar to what might come from the AI diagnosis)
    const testPrescriptions = [
      'Acetaminophen (Tylenol) 500mg',
      'Ibuprofen 200mg',
      'Amoxicillin 250mg',
      'Loratadine 10mg',
      'Cetirizine Hydrochloride'
    ];

    console.log('Test prescriptions:');
    testPrescriptions.forEach((p, i) => console.log(`${i+1}. ${p}`));

    // Send request to the match-drugs API
    console.log('\nSending request to API...');
    const requestPayload = { prescriptions: testPrescriptions };
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));
    
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
    const responseText = await response.text();
    console.log('Raw API response:', responseText);
    
    const data = JSON.parse(responseText);
    
    // Print results in a more readable format
    console.log('\nMatch results:');
    
    if (data.success && data.matches) {
      data.matches.forEach((result, i) => {
        const prescription = result.prescription;
        const match = result.match;
        
        console.log(`\n${i+1}. Prescription: "${prescription}"`);
        if (match) {
          console.log(`   ✅ Match found: ${match.name} ${match.dosage} (${match.form})`);
          console.log(`   Match quality: ${match.match_quality}`);
          console.log(`   Price: $${match.price}, Stock: ${match.stock_quantity}`);
        } else {
          console.log(`   ❌ No match found`);
        }
        
        // If debug info is available, show it
        if (result._debug) {
          console.log(`   Debug info: ${JSON.stringify(result._debug)}`);
        }
      });
      
      // Log statistics
      const matchCount = data.matches.filter(m => m.match).length;
      console.log(`\nSummary: Found matches for ${matchCount} out of ${data.matches.length} prescriptions`);
      
      if (data._debug) {
        console.log(`Database has ${data._debug.drugCount} drugs available`);
        console.log(`Request processed at: ${data._debug.timestamp}`);
      }
    } else {
      console.error('API returned unsuccessful response:', data);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test function
testMatchDrugsAPI().catch(console.error); 