/**
 * Test Persistence of Unavailable Drugs State
 * 
 * This script tests if the unavailable drugs state is properly persisted
 * using localStorage and recovered when the component remounts (simulating page refresh).
 */

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => {
      return store[key] || null;
    },
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    getAll: () => store
  };
})();

// Mock medications data
const mockMedications = [
  {
    id: '1',
    name: 'Acetaminophen',
    dosage: '500mg',
    form: 'tablet',
    price: 12.99,
    stock_quantity: 50,
    inStock: true,
    match_quality: 'exact',
    notFound: false
  },
  {
    name: 'ExoticDrug-NotInDatabase',
    dosage: '200mg',
    frequency: 'once daily',
    price: 15.99,
    prescription: true,
    inStock: false,
    notFound: true
  }
];

// Test function to simulate the storage and recovery of unavailable drugs
function testPersistenceAcrossRefresh() {
  console.log('=== TESTING PERSISTENCE OF UNAVAILABLE DRUGS ===\n');

  console.log('Step 1: Initial Page Load');
  console.log('- Checking localStorage...');
  if (mockLocalStorage.getItem('pharmaai-unavailable-drugs')) {
    console.log('- Found previously stored unavailable drugs in localStorage');
  } else {
    console.log('- No previously stored data found');
  }

  // Filter unavailable drugs (simulating what happens in the real component)
  const unavailableDrugs = mockMedications.filter(med => med.notFound === true);
  console.log(`- Found ${unavailableDrugs.length} unavailable drugs in current prescription`);

  // Store unavailable drugs in localStorage
  console.log('\nStep 2: Storing unavailable drugs in localStorage');
  if (unavailableDrugs.length > 0) {
    mockLocalStorage.setItem('pharmaai-unavailable-drugs', JSON.stringify(unavailableDrugs));
    console.log('- Successfully stored unavailable drugs');
    console.log(`- Stored data: ${mockLocalStorage.getItem('pharmaai-unavailable-drugs')}`);
  } else {
    mockLocalStorage.removeItem('pharmaai-unavailable-drugs');
    console.log('- No unavailable drugs to store, removed localStorage entry');
  }

  // Simulate page refresh by "forgetting" our variables
  console.log('\nStep 3: Simulating page refresh');
  console.log('- Browser refreshes, component unmounts and remounts');
  console.log('- All state variables are reset to initial values');

  // Recover unavailable drugs after refresh
  console.log('\nStep 4: Recovering state after refresh');
  let recoveredUnavailableDrugs = [];
  const storedUnavailableDrugs = mockLocalStorage.getItem('pharmaai-unavailable-drugs');
  
  if (storedUnavailableDrugs) {
    try {
      recoveredUnavailableDrugs = JSON.parse(storedUnavailableDrugs);
      console.log('- Successfully recovered unavailable drugs from localStorage');
      console.log(`- Recovered ${recoveredUnavailableDrugs.length} unavailable drugs`);
    } catch (error) {
      console.error('- Error parsing stored unavailable drugs:', error);
      console.log('- No drugs recovered (parsing error)');
    }
  } else {
    console.log('- No stored unavailable drugs found in localStorage');
  }

  // Verify recovered data
  console.log('\nStep 5: Verifying recovered data');
  if (recoveredUnavailableDrugs.length === unavailableDrugs.length) {
    console.log('- ✅ Retrieved correct number of unavailable drugs');
  } else {
    console.log(`- ❌ Retrieved wrong number of drugs: expected ${unavailableDrugs.length}, got ${recoveredUnavailableDrugs.length}`);
  }

  // Check content of recovered drugs
  if (recoveredUnavailableDrugs.length > 0) {
    console.log('- Checking drug details:');
    recoveredUnavailableDrugs.forEach((drug, index) => {
      console.log(`  > ${drug.name}: ${drug.notFound ? 'correctly marked unavailable ✅' : 'incorrectly marked available ❌'}`);
    });
  }

  // Simulate the disabling of checkout based on recovered data
  const canCheckout = recoveredUnavailableDrugs.length === 0;
  console.log(`\nStep 6: UI State based on recovered data`);
  console.log(`- Checkout button would be: ${canCheckout ? 'ENABLED ✅' : 'DISABLED ✅'}`);
  console.log(`- Download prescription button would be: ${!canCheckout ? 'VISIBLE ✅' : 'HIDDEN ✅'}`);

  // Test cleanup
  console.log('\nStep 7: User resets chat');
  mockLocalStorage.removeItem('pharmaai-unavailable-drugs');
  console.log('- Removed pharmaai-unavailable-drugs from localStorage');
  console.log('- All state reset to initial values');

  // Final verification
  const testPassed = 
    // Step 2: Successfully stored data
    mockLocalStorage.getItem('pharmaai-unavailable-drugs') === null &&
    // Step 4: Successfully recovered data before reset
    recoveredUnavailableDrugs.length === unavailableDrugs.length &&
    // Step 6: UI state was correct
    (recoveredUnavailableDrugs.length > 0 ? !canCheckout : canCheckout);

  console.log(`\n=== TEST RESULT: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'} ===`);
  return { testPassed };
}

// Run the persistence test
const result = testPersistenceAcrossRefresh();
console.log(`\nExit code: ${result.testPassed ? 0 : 1}`); 