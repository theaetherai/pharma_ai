/**
 * Run All Drug Availability Tests
 * 
 * This script runs all the test scripts we've created to verify the feature:
 * - API test for drug matching
 * - UI simulation test
 * - Persistence test
 * - End-to-end flow test
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// List of test scripts to run
const testScripts = [
  { name: 'Drug Matching API Test', file: 'test-unavailable-drugs.js' },
  { name: 'UI Simulation Test', file: 'test-ui-unavailable-drugs.js' },
  { name: 'State Persistence Test', file: 'test-persistence.js' },
  { name: 'End-to-End Flow Test', file: 'test-end-to-end-flow.js' }
];

// Function to run a test script
function runTest(scriptName, scriptFile) {
  console.log(`\n${colors.cyan}======== Running Test: ${scriptName} ========${colors.reset}`);
  console.log(`${colors.yellow}Executing: node ${scriptFile}${colors.reset}\n`);
  
  try {
    // Run the script and capture its output
    const output = execSync(`node ${scriptFile}`, { encoding: 'utf8' });
    
    // Check if the test passed by looking for "PASSED" or "FAILED" in the output
    const passed = output.includes('PASSED') && !output.includes('FAILED');
    
    // Print a summary of the result
    if (passed) {
      console.log(`\n${colors.green}✅ Test "${scriptName}" PASSED${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ Test "${scriptName}" FAILED${colors.reset}`);
    }
    
    return { name: scriptName, passed, output };
  } catch (error) {
    console.error(`\n${colors.red}❌ Error running test "${scriptName}":${colors.reset}`, error.message);
    return { name: scriptName, passed: false, error: error.message };
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log(`${colors.magenta}=== RUNNING ALL DRUG AVAILABILITY TESTS ===${colors.reset}\n`);
  
  // Store results for each test
  const results = [];
  
  // Run each test script
  for (const test of testScripts) {
    const result = runTest(test.name, test.file);
    results.push(result);
  }
  
  // Print summary of all test results
  console.log(`\n${colors.magenta}=== TEST RESULTS SUMMARY ===${colors.reset}`);
  
  const passedTests = results.filter(r => r.passed);
  const failedTests = results.filter(r => !r.passed);
  
  console.log(`${colors.cyan}Total Tests:${colors.reset} ${results.length}`);
  console.log(`${colors.green}Passed:${colors.reset} ${passedTests.length}`);
  console.log(`${colors.red}Failed:${colors.reset} ${failedTests.length}`);
  
  if (failedTests.length > 0) {
    console.log(`\n${colors.red}The following tests failed:${colors.reset}`);
    failedTests.forEach(test => {
      console.log(`- ${test.name}`);
    });
  }
  
  // Return the overall test result
  const allPassed = failedTests.length === 0;
  console.log(`\n${colors.magenta}=== OVERALL RESULT: ${allPassed ? colors.green + 'PASSED ✅' : colors.red + 'FAILED ❌'} ===${colors.reset}`);
  
  return { allPassed, results };
}

// Run all tests
runAllTests()
  .then(result => {
    // Exit with appropriate code: 0 for success, 1 for failure
    process.exit(result.allPassed ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Error running tests:${colors.reset}`, error);
    process.exit(1);
  });
