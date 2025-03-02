
import fetch from 'node-fetch';
import { initDatabase } from './database/index.js';

async function testServerTranscriptApi() {
  try {
    console.log("Initializing database...");
    await initDatabase();
    
    console.log("Testing server-side transcript API...");
    
    const testPayload = {
      content: "Test transcript from server-side script",
      userId: 1, // testuser
      roleId: 1,
      scenarioId: 1,
      title: `Server Test on ${new Date().toLocaleDateString()}`
    };
    
    console.log("Test payload:", JSON.stringify(testPayload, null, 2));
    
    // Use direct localhost URL to ensure we're hitting the server API endpoint
    const response = await fetch('http://localhost:3000/api/transcripts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload),
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response content type: ${response.headers.get('content-type')}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const text = await response.text();
      console.error('Non-JSON response (first 200 chars):', text.substring(0, 200));
    }
  } catch (error) {
    console.error("Error in server-side API test:", error);
  }
}

testServerTranscriptApi();
