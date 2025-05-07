// Simple test script for the /api/diagnose endpoint
const fetch = require('node-fetch');

async function testDiagnoseAPI() {
  const userId = `test-user-${Math.random().toString(36).substring(2, 11)}`;
  
  try {
    console.log('Testing /api/diagnose endpoint...');
    console.log(`Using test user ID: ${userId}`);
    
    // Send request to diagnose endpoint
    const response = await fetch('http://localhost:3000/api/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        message: 'I need a diagnosis now'
      }),
    });
    
    const text = await response.text();
    console.log('Response status:', response.status);
    
    try {
      // Try to parse as JSON
      const data = JSON.parse(text);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      // Check if the diagnosis contains the expected format
      if (data.diagnosis) {
        console.log('\nDiagnosis structure test:');
        console.log('- Has diagnosis text:', !!data.diagnosis.diagnosis);
        console.log('- Has prescription array:', Array.isArray(data.diagnosis.prescription));
        console.log('- Number of medications:', data.diagnosis.prescription.length);
        
        if (data.diagnosis.prescription.length > 0) {
          const firstMed = data.diagnosis.prescription[0];
          console.log('\nFirst medication:');
          console.log('- Has drug name:', !!firstMed.drug);
          console.log('- Has dosage:', !!firstMed.dosage);
          console.log('- Has duration:', !!firstMed.duration);
        }
      } else {
        console.log('No diagnosis data in response');
      }
    } catch (err) {
      console.error('Failed to parse response as JSON:', err);
      console.log('Raw response:', text);
    }
    
  } catch (error) {
    console.error('Error testing diagnose API:', error);
  }
}

testDiagnoseAPI(); 