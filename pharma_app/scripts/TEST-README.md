# Unavailable Drugs Test Suite

This folder contains tests to verify the feature where checkout is disabled when prescribed drugs are not found in the database.

## Test Description

The test suite verifies that:
1. When all prescribed drugs are available in the database, the checkout process is enabled.
2. When any prescribed drug is not found in the database, the checkout is disabled and only a download prescription option is shown.

## Test Files

The test suite consists of the following files:

- **test-unavailable-drugs.js**: Tests the drug matching API to verify it correctly identifies available and unavailable drugs.
- **test-ui-unavailable-drugs.js**: Simulates the UI logic to verify it shows/hides the appropriate buttons based on drug availability.
- **test-persistence.js**: Tests the persistence of unavailable drugs state across page refreshes using localStorage.
- **test-end-to-end-flow.js**: Simulates the complete flow from user symptoms to prescription and checkout.
- **run-all-tests.js**: Runs all the above tests and provides a summary of results.

## How to Run the Tests

### Prerequisites

- Node.js installed on your machine
- The PharmaAI app running locally on port 3000 (for API tests)

### Running Individual Tests

Navigate to the scripts directory and run a specific test:

```
cd scripts
node test-unavailable-drugs.js
```

### Running All Tests

To run all tests at once:

```
cd scripts
node run-all-tests.js
```

## Expected Output

When all tests pass, you should see output similar to:

```
=== TEST RESULTS SUMMARY ===
Total Tests: 4
Passed: 4
Failed: 0

=== OVERALL RESULT: PASSED ✅ ===
```

If any test fails, the script will indicate which test failed and provide more details.

## Troubleshooting

If tests are failing, check the following:

1. Ensure the app is running locally on port 3000
2. Verify the database has the expected drugs in the test data
3. Check that the chat-interface.tsx component is properly handling the unavailableDrugs state
4. Ensure localStorage is enabled in your browser for web tests 