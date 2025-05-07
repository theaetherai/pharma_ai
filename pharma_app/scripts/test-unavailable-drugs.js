/**
 * Test Unavailable Drugs Handling
 * 
 * This script tests the behavior when a prescription includes drugs that are not in the database.
 * It simulates two scenarios:
 * 1. All drugs are available - checkout should be allowed
 * 2. Some drugs are not available - checkout should be disabled, download option shown
 */

// Mock data - sample prescription arrays
const availablePrescription = [
  {
    drug: "Acetaminophen",
    dosage: "500mg",
    duration: "as needed for pain"
  },
  {
    drug: "Ibuprofen",
    dosage: "400mg",
    duration: "every 6-8 hours"
  }
];

const unavailablePrescription = [
  {
    drug: "Acetaminophen",
    dosage: "500mg",
    duration: "as needed for pain"
  },
  {
    drug: "ExoticDrug-NotInDatabase",
    dosage: "200mg",
    duration: "once daily"
  }
];

// Main test function
async function testUnavailableDrugs() {
  console.log("=== TESTING UNAVAILABLE DRUGS HANDLING ===");
  
  // Test Case 1: All drugs available
  console.log("\n🧪 TEST CASE 1: All drugs available in database");
  const availableResult = await testPrescription(availablePrescription);
  
  // Test Case 2: Some drugs unavailable
  console.log("\n🧪 TEST CASE 2: Some drugs NOT available in database");
  const unavailableResult = await testPrescription(unavailablePrescription);
  
  // Print summary
  console.log("\n=== TEST RESULTS SUMMARY ===");
  console.log(`Case 1 (All Available): Checkout ${availableResult.canCheckout ? 'ENABLED ✅' : 'DISABLED ❌'}`);
  console.log(`Case 2 (Some Unavailable): Checkout ${unavailableResult.canCheckout ? 'ENABLED ❌' : 'DISABLED ✅'}`);
  
  const case1Passed = availableResult.canCheckout;
  const case2Passed = !unavailableResult.canCheckout;
  
  console.log(`\nOverall Test Result: ${case1Passed && case2Passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  if (!case1Passed) {
    console.log(`- Case 1 Failed: Checkout should be ENABLED when all drugs are available`);
  }
  
  if (!case2Passed) {
    console.log(`- Case 2 Failed: Checkout should be DISABLED when some drugs are unavailable`);
  }
}

// Test a single prescription array
async function testPrescription(prescription) {
  console.log(`Testing prescription with ${prescription.length} drugs`);
  console.log("Prescription:", JSON.stringify(prescription, null, 2));
  
  try {
    // Call the drug-matching API
    console.log("Calling match-drugs API...");
    
    const response = await fetch('http://localhost:3000/api/match-drugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prescriptions: prescription.map(med => `${med.drug} ${med.dosage}`) 
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have any unavailable drugs
    const matches = data.matches || [];
    const unavailableDrugs = matches.filter(m => !m.match);
    const canCheckout = unavailableDrugs.length === 0;
    
    console.log(`API returned ${matches.length} matches`);
    console.log(`Found ${unavailableDrugs.length} unavailable drugs`);
    console.log(`Checkout should be: ${canCheckout ? 'ENABLED' : 'DISABLED'}`);
    
    // Detailed matching results
    matches.forEach((match, index) => {
      console.log(`- Drug ${index + 1}: ${prescription[index].drug} - ${match.match ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
    });
    
    return {
      canCheckout,
      matches,
      unavailableDrugs
    };
    
  } catch (error) {
    console.error("Error testing prescription:", error);
    return {
      error: error.message,
      canCheckout: false // Default to false on error
    };
  }
}

// Run the test
testUnavailableDrugs().catch(console.error); 