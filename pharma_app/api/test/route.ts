import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Test the Python API directly
    const apiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    const url = `${apiUrl}/api/health`;
    
    console.log(`Testing health endpoint at: ${url}`);
    
    // Test health endpoint first
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // If health check succeeds, test the chat endpoint
    let chatTest = { status: 'not_tested' };
    if (response.ok) {
      try {
        const chatResponse = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Hello, testing connection',
            user_id: 'test-user',
          }),
        });
        
        const chatResponseText = await chatResponse.text();
        let parsedData;
        
        try {
          parsedData = JSON.parse(chatResponseText);
          chatTest = { 
            status: String(chatResponse.status), // Convert status to string to match type
            ok: chatResponse.ok,
            data: parsedData,
            has_response: Boolean(parsedData?.response), // Added optional chaining for safety
          };
        } catch (parseError) {
          chatTest = { 
            status: String(chatResponse.status), // Convert to string to match type
            ok: chatResponse.ok,
            error: 'Failed to parse JSON response',
            raw: chatResponseText
          };
        }
      } catch (chatError) {
        chatTest = { 
          status: 'error',
          error: chatError instanceof Error ? chatError.message : 'Unknown chat error'
        };
      }
    }
    
    // Results
    const result = {
      health: {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : null,
      },
      chat: chatTest,
      environment: {
        PYTHON_API_URL: apiUrl,
        NODE_ENV: process.env.NODE_ENV
      }
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 