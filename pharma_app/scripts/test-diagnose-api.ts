/**
 * Test script for the /api/diagnose API endpoint
 * 
 * To run this script:
 * 1. Make sure the Next.js dev server is running
 * 2. Run with: npx ts-node scripts/test-diagnose-api.ts
 */

async function testDiagnoseAPI() {
  console.log('Testing /api/diagnose endpoint...');

  // Sample conversation history
  const dummyMessages = [
    { role: 'user', content: 'Hi, I have been experiencing a headache for 3 days.' },
    { role: 'assistant', content: 'I understand you\'ve been experiencing a headache for 3 days. Can you describe the pain? For example, is it dull, sharp, throbbing, or something else?' },
    { role: 'user', content: 'It\'s a throbbing pain, mostly on one side of my head.' },
    { role: 'assistant', content: 'Thank you for that description. A throbbing pain on one side of the head could potentially be a migraine. Have you experienced any other symptoms alongside the headache, such as sensitivity to light or sound, nausea, or visual disturbances?' },
    { role: 'user', content: 'Yes, I\'m sensitive to light and feel a bit nauseous too.' },
  ];

  try {
    // Test regular diagnosis with direct endpoint
    console.log('Testing direct FastAPI endpoint...');
    console.log('Request payload:', JSON.stringify({
      user_id: 'test-user-direct',
      conversation: dummyMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      on_demand: false
    }, null, 2));
    
    // Try to call the FastAPI endpoint directly
    const directResponse = await fetch('http://localhost:8000/api/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: 'test-user-direct',
        conversation: dummyMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        on_demand: false
      }),
    });

    const directText = await directResponse.text();
    console.log('Raw response from FastAPI:', directText);
    
    try {
      const directData = JSON.parse(directText);
      console.log('Direct FastAPI Response:', JSON.stringify(directData, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON response from FastAPI:', e);
    }

    // Test via Next.js API route
    console.log('\nTesting via Next.js API...');
    console.log('Request payload:', JSON.stringify({
      userId: 'test-user-nextjs',
      messages: dummyMessages,
      on_demand: true
    }, null, 2));
    
    const nextjsResponse = await fetch('http://localhost:3000/api/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: 'test-user-nextjs',
        messages: dummyMessages,
        on_demand: true
      }),
    });

    const nextjsText = await nextjsResponse.text();
    console.log('Raw response from Next.js API:', nextjsText);
    
    try {
      const nextjsData = JSON.parse(nextjsText);
      console.log('Next.js API Response:', JSON.stringify(nextjsData, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON response from Next.js API:', e);
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testDiagnoseAPI(); 