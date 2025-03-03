
import 'dotenv/config';

async function testOpenAIConnection() {
  console.log('Testing OpenAI API connection...');
  
  // Check if API key is present
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in environment');
    return;
  }
  
  console.log('✅ OPENAI_API_KEY is present in environment');
  console.log('API Key length:', process.env.OPENAI_API_KEY.length);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Using a cheaper model for testing
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Hello, this is a test message."
          }
        ],
        max_tokens: 50
      })
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API connection successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ OpenAI API connection failed');
      try {
        const errorData = await response.json();
        console.error('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    }
  } catch (error) {
    console.error('❌ Error connecting to OpenAI API:', error.message);
  }
}

testOpenAIConnection();
