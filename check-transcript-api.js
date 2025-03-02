
import express from 'express';
import { initDatabase } from './database/index.js';
import { Transcript, User, Role, Scenario } from './database/schema.js';
import cors from 'cors';

// Initialize a small express app to test the endpoint
const app = express();
app.use(express.json());
app.use(cors());

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized successfully for API testing');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// Test endpoint to get transcripts for a specific user
app.get('/api/transcripts/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    console.log(`Fetching transcripts for user ID: ${userId}`);
    
    const transcripts = await Transcript.findAll({
      where: { userId },
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: Role, attributes: ['name', 'title'], required: false },
        { model: Scenario, attributes: ['name', 'description'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${transcripts.length} transcripts for user ${userId}`);
    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic endpoint to get all transcripts
app.get('/api/transcripts', async (req, res) => {
  try {
    const transcripts = await Transcript.findAll({
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: Role, attributes: ['name', 'title'], required: false },
        { model: Scenario, attributes: ['name', 'description'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${transcripts.length} transcripts in total`);
    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching all transcripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API test server running on port ${PORT}`);
});

console.log('API test script loaded. Run this to test your transcript endpoints.');
import fetch from 'node-fetch';
// All imports are already handled at the top of the file

async function testTranscriptAPI() {
  try {
    console.log("Initializing database connection...");
    await initDatabase();
    
    // Get a test user
    const testUser = await User.findOne({ where: { username: 'testuser' } });
    if (!testUser) {
      console.error("Test user not found!");
      return;
    }
    
    console.log(`Found test user: ${testUser.username} (ID: ${testUser.id})`);
    
    // Create a test transcript payload
    const testPayload = {
      content: "User: This is a test transcript\n\nAI: This is a test response",
      userId: testUser.id,
      roleId: 1,
      scenarioId: 1,
      title: "Test Transcript"
    };
    
    console.log("Test payload:", testPayload);
    
    // Make the API request
    console.log("Making request to /api/transcripts...");
    const response = await fetch('http://0.0.0.0:3000/api/transcripts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`Response status: ${response.status}`);
    const responseBody = await response.text();
    
    try {
      // Try to parse as JSON
      const jsonResponse = JSON.parse(responseBody);
      console.log("Response (JSON):", jsonResponse);
    } catch (e) {
      // If not JSON, show as text
      console.log("Response (text):", responseBody);
    }
    
    if (response.ok) {
      console.log("✅ Transcript API is working correctly!");
    } else {
      console.log("❌ Transcript API returned an error!");
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

testTranscriptAPI();
